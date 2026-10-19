import os
import io
import json
import mimetypes
from typing import Optional, Union, Dict, Any, BinaryIO
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from .builder import TransformationBuilder
from .exceptions import (
    DCDStorageError,
    AuthenticationError,
    UploadError,
    NotFoundError,
)


class StorageClient:
    """
    Official Python Client for DevCloudDesk Storage Engine.

    Example:
        from devclouddesk_storage import StorageClient

        client = StorageClient(
            endpoint="http://192.168.32.129:7100",
            api_key="dcd_key_live_...",
        )

        # Upload an image or file:
        asset = client.upload("banner.png", folder="avatars")
        print("Uploaded asset:", asset["publicId"], asset["url"])

        # Generate on-the-fly transformed URL:
        thumb_url = client.url(asset["publicId"]).resize(300, 300, "fill").format("webp").to_string()
        print("Optimized WebP URL:", thumb_url)

        # Generate client-side signed upload token:
        token_info = client.create_signed_upload_token(folder="client-uploads", max_bytes=5 * 1024 * 1024)
        print("Signed Token:", token_info["token"])

        # Delete asset:
        client.delete(asset["publicId"])
    """

    def __init__(self, endpoint: str, api_key: Optional[str] = None):
        if not endpoint:
            raise ValueError("StorageClient: endpoint is required")

        self.endpoint = endpoint.rstrip("/")
        self.api_key = (api_key or "").strip()

    def url(self, public_id: str) -> TransformationBuilder:
        """Initialize a fluent URL transformation builder for an asset."""
        return TransformationBuilder(self.endpoint, public_id)

    def create_signed_upload_token(
        self,
        folder: Optional[str] = None,
        max_bytes: Optional[int] = None,
        expires_in_seconds: int = 300,
    ) -> Dict[str, Any]:
        """
        Generates a short-lived cryptographically signed upload token for safe client uploads.
        Keeps master API keys strictly on backend servers.
        """
        if not self.api_key:
            raise ValueError("StorageClient: api_key is required to generate signed upload tokens")

        sign_url = f"{self.endpoint}/v1/upload/sign"
        payload: Dict[str, Any] = {"expiresInSeconds": expires_in_seconds}
        if folder:
            payload["folder"] = folder
        if max_bytes:
            payload["maxBytes"] = max_bytes

        req = Request(
            sign_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "devclouddesk-storage-python/1.0.0",
            },
            method="POST",
        )

        try:
            with urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            raw_err = e.read().decode("utf-8", errors="replace")
            try:
                err_json = json.loads(raw_err)
                msg = err_json.get("error", {}).get("message") or str(e)
            except Exception:
                msg = raw_err or str(e)
            if e.code in (401, 403):
                raise AuthenticationError(f"Authentication failed ({e.code}): {msg}") from e
            raise DCDStorageError(f"Failed to generate signed token ({e.code}): {msg}") from e

    def upload(
        self,
        file: Union[str, bytes, BinaryIO, io.BytesIO],
        folder: str = "uploads",
        public_id: Optional[str] = None,
        filename: Optional[str] = None,
        overwrite: bool = True,
        unique_filename: bool = False,
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Uploads a media file or document to DevCloudDesk storage.
        Supports Master API Key OR Short-lived Signed Upload Token.
        """
        upload_url = f"{self.endpoint}/v1/upload"

        # Read file contents and determine filename
        if isinstance(file, str):
            if not os.path.isfile(file):
                raise FileNotFoundError(f"File not found: {file}")
            fname = filename or os.path.basename(file)
            with open(file, "rb") as f:
                content = f.read()
        elif isinstance(file, (bytes, bytearray)):
            fname = filename or "upload.bin"
            content = bytes(file)
        elif hasattr(file, "read"):
            fname = filename or getattr(file, "name", "upload.bin")
            content = file.read()
            if isinstance(content, str):
                content = content.encode("utf-8")
        else:
            raise TypeError("Unsupported file type. Provide a path, bytes, or file-like object.")

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(fname)
        mime_type = mime_type or "application/octet-stream"

        # Build multipart/form-data payload
        boundary = "----DCDStorageBoundary7MA4YWxkTrZu0gW"
        body = bytearray()

        # Add 'folder' field
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{folder}\r\n".encode("utf-8"))

        # Add 'public_id' field if provided
        if public_id:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="public_id"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{public_id}\r\n".encode("utf-8"))

        # Add 'overwrite' field
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="overwrite"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{str(overwrite).lower()}\r\n".encode("utf-8"))

        # Add 'unique_filename' field if requested
        if unique_filename:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="unique_filename"\r\n\r\n'.encode("utf-8"))
            body.extend("true\r\n".encode("utf-8"))

        # Add 'file' field
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            f'Content-Disposition: form-data; name="file"; filename="{os.path.basename(fname)}"\r\n'.encode("utf-8")
        )
        body.extend(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "devclouddesk-storage-python/1.0.0",
        }

        if token:
            headers["X-Upload-Token"] = token
        elif self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            raise ValueError("StorageClient: Either api_key or a signed upload token is required to upload")

        req = Request(upload_url, data=bytes(body), headers=headers, method="POST")

        try:
            with urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("asset", data)
        except HTTPError as e:
            raw_err = e.read().decode("utf-8", errors="replace")
            try:
                err_json = json.loads(raw_err)
                msg = err_json.get("error", {}).get("message") or err_json.get("message") or raw_err
            except Exception:
                msg = raw_err or str(e)

            if e.code in (401, 403):
                raise AuthenticationError(f"Authentication failed ({e.code}): {msg}") from e
            raise UploadError(f"Upload failed ({e.code}): {msg}") from e
        except URLError as e:
            raise UploadError(f"Connection failed to {upload_url}: {e}") from e

    def upload_with_token(
        self,
        file: Union[str, bytes, BinaryIO, io.BytesIO],
        token: str,
        folder: str = "uploads",
        public_id: Optional[str] = None,
        filename: Optional[str] = None,
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        """Helper to upload a file using a client signed upload token (no api_key required)."""
        return self.upload(
            file=file,
            folder=folder,
            public_id=public_id,
            filename=filename,
            overwrite=overwrite,
            token=token,
        )

    def delete(self, public_id: str) -> bool:
        """Permanently deletes an asset by its public_id."""
        clean_id = public_id.lstrip("/")
        delete_url = f"{self.endpoint}/v1/admin/files/{clean_id}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "devclouddesk-storage-python/1.0.0",
        }
        req = Request(delete_url, headers=headers, method="DELETE")

        try:
            with urlopen(req) as resp:
                return resp.status == 200
        except HTTPError as e:
            if e.code == 404:
                raise NotFoundError(f"Asset '{clean_id}' not found") from e
            if e.code in (401, 403):
                raise AuthenticationError(f"Delete permission denied ({e.code})") from e
            raise DCDStorageError(f"Delete failed ({e.code})") from e
        except URLError as e:
            raise DCDStorageError(f"Connection failed: {e}") from e


def create_storage_client(endpoint: str, api_key: Optional[str] = None) -> StorageClient:
    """Factory function to instantiate a StorageClient."""
    return StorageClient(endpoint=endpoint, api_key=api_key)


# Bucket modern API aliases
BucketClient = StorageClient
create_bucket_client = create_storage_client

# Backward compatibility alias
DCDStorage = StorageClient
