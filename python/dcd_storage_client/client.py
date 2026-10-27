import os
import io
import json
import mimetypes
from typing import Optional, Union, Dict, Any, BinaryIO
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

from .builder import TransformationBuilder
from .exceptions import (
    StorageError,
    AuthenticationError,
    NotFoundError,
    PayloadTooLargeError,
    UploadError,
    NetworkTimeoutError,
)


class _UploaderNamespace:
    def __init__(self, client: "StorageClient"):
        self._client = client

    def upload(self, *args, **kwargs):
        return self._client.upload(*args, **kwargs)

    def destroy(self, public_id: str):
        return self._client.delete(public_id)

    def delete(self, public_id: str):
        return self._client.delete(public_id)


class _ApiNamespace:
    def __init__(self, client: "StorageClient"):
        self._client = client

    def resource(self, public_id: str):
        return self._client.get_resource(public_id)

    def resources(self, *args, **kwargs):
        return self._client.list_files(*args, **kwargs)

    def update(self, public_id: str, access: str = "public"):
        return self._client.update_access(public_id, access=access)

    def usage(self):
        return self._client.get_stats()


class StorageClient:
    """
    Official Python Client for DevCloudDesk Storage Engine.

    Example:
        from dcd_storage_client import BucketClient

        client = BucketClient(
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

        # List files:
        files = client.list_files(folder="avatars", limit=10)

        # Delete asset:
        client.delete(asset["publicId"])
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        delivery_prefix: str = "image/upload",
    ):
        env_endpoint = os.getenv("DCD_STORAGE_ENDPOINT", "")
        env_api_key = os.getenv("DCD_STORAGE_API_KEY", os.getenv("DCD_API_KEY", ""))

        resolved_endpoint = endpoint or env_endpoint
        if not resolved_endpoint:
            raise ValueError("StorageClient: endpoint is required (pass endpoint or set DCD_STORAGE_ENDPOINT env variable)")

        self.endpoint = resolved_endpoint.rstrip("/")
        self.api_key = (api_key or env_api_key or "").strip()
        self.timeout = float(timeout)
        self.delivery_prefix = (delivery_prefix or "image/upload").strip("/") or "image/upload"

        # Cloudinary-compatible namespaces
        self.uploader = _UploaderNamespace(self)
        self.api = _ApiNamespace(self)

    def get_public_url(self, public_id: str) -> str:
        """Directly returns the direct public CDN URL for an asset without transformation boilerplate."""
        clean = public_id.lstrip("/")
        return f"{self.endpoint}/{self.delivery_prefix}/{clean}"

    def url(self, public_id: str, **kwargs) -> Union[TransformationBuilder, str]:
        """
        Initialize a fluent URL transformation builder, or return a built URL string if options are passed.

        Example (fluent):
            client.url("avatars/user-1").width(300).height(300).format("webp").build()

        Example (direct options):
            client.url("avatars/user-1", width=300, height=300, crop="fill", format="webp")
        """
        builder = TransformationBuilder(self.endpoint, public_id, delivery_prefix=self.delivery_prefix)
        if not kwargs:
            return builder

        if "width" in kwargs and kwargs["width"] is not None:
            builder.width(kwargs["width"])
        if "height" in kwargs and kwargs["height"] is not None:
            builder.height(kwargs["height"])
        if "crop" in kwargs and kwargs["crop"]:
            builder.crop(kwargs["crop"])
        if "format" in kwargs and kwargs["format"]:
            builder.format(kwargs["format"])
        if "quality" in kwargs and kwargs["quality"] is not None:
            builder.quality(kwargs["quality"])
        if "blur" in kwargs and kwargs["blur"] is not None:
            builder.blur(kwargs["blur"])
        if kwargs.get("grayscale"):
            builder.grayscale(True)
        if kwargs.get("sharpen"):
            builder.sharpen(True)
        return builder.build()

    def health_check(self) -> Dict[str, Any]:
        """Check cluster connectivity and health status."""
        health_url = f"{self.endpoint}/health"
        req = Request(health_url, headers=self._get_headers(), method="GET")
        try:
            with urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return {"status": "error"}

    def get_stats(self) -> Dict[str, Any]:
        """Retrieve server performance, cache, and storage metrics (requires API key)."""
        stats_url = f"{self.endpoint}/v1/admin/stats"
        data = self._request_json(stats_url, method="GET")
        return data.get("stats", data)

    def list_files(
        self,
        folder: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Lists media files in the bucket with pagination and optional folder filtering.
        """
        params = {"page": max(1, page), "limit": min(100, max(1, limit))}
        if folder:
            params["folder"] = folder

        query_str = urlencode(params)
        url = f"{self.endpoint}/v1/admin/files?{query_str}"
        return self._request_json(url, method="GET")

    def get_signed_url(
        self,
        public_id: str,
        expires_in_seconds: int = 300,
        resource_type: str = "image",
        transform: Optional[str] = None,
    ) -> str:
        """
        Generates a time-limited cryptographically signed URL to access private assets
        (e.g. invoices, KYC documents, private backups).
        """
        if not self.api_key:
            raise AuthenticationError("StorageClient: api_key is required to generate signed download URLs", 401)

        clean = public_id.lstrip("/")
        sign_url = f"{self.endpoint}/v1/download/sign"
        payload: Dict[str, Any] = {
            "publicId": clean,
            "expiresInSeconds": int(expires_in_seconds),
            "resourceType": resource_type,
        }
        if transform:
            payload["transform"] = transform

        data = self._request_json(
            sign_url,
            method="POST",
            body=json.dumps(payload).encode("utf-8"),
            extra_headers={"Content-Type": "application/json"},
        )
        return data.get("signedUrl", "")

    def create_signed_upload_token(
        self,
        folder: Optional[str] = None,
        max_bytes: Optional[int] = None,
        expires_in_seconds: int = 300,
        webhook_url: Optional[str] = None,
        access: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates a short-lived cryptographically signed upload token for safe client uploads.
        Keeps master API keys strictly on backend servers.
        """
        if not self.api_key:
            raise AuthenticationError("StorageClient: api_key is required to generate signed upload tokens", 401)

        sign_url = f"{self.endpoint}/v1/upload/sign"
        payload: Dict[str, Any] = {"expiresInSeconds": expires_in_seconds}
        if folder:
            payload["folder"] = folder
        if max_bytes:
            payload["maxBytes"] = max_bytes
        if webhook_url:
            payload["webhookUrl"] = webhook_url
        if access:
            payload["access"] = access

        return self._request_json(
            sign_url,
            method="POST",
            body=json.dumps(payload).encode("utf-8"),
            extra_headers={"Content-Type": "application/json"},
        )

    def list(
        self,
        folder: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Clean alias for list_files (Industry standard convention)."""
        return self.list_files(folder=folder, page=page, limit=limit)

    def create_upload_token(
        self,
        folder: Optional[str] = None,
        max_bytes: Optional[int] = None,
        expires_in_seconds: int = 300,
        webhook_url: Optional[str] = None,
        access: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Clean alias for create_signed_upload_token (Industry standard convention)."""
        return self.create_signed_upload_token(
            folder=folder,
            max_bytes=max_bytes,
            expires_in_seconds=expires_in_seconds,
            webhook_url=webhook_url,
            access=access,
        )

    def upload(
        self,
        file: Union[str, bytes, BinaryIO, io.BytesIO],
        folder: str = "uploads",
        public_id: Optional[str] = None,
        filename: Optional[str] = None,
        overwrite: bool = True,
        unique_filename: bool = False,
        token: Optional[str] = None,
        access: Optional[str] = None,
        webhook_url: Optional[str] = None,
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
        boundary = "----StorageClientBoundary7MA4YWxkTrZu0gW"
        body = bytearray()

        # Add 'folder' field
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="folder"\r\n\r\n')
        body.extend(f"{folder}\r\n".encode("utf-8"))

        # Add 'public_id' field if provided
        if public_id:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="public_id"\r\n\r\n')
            body.extend(f"{public_id}\r\n".encode("utf-8"))

        # Add 'overwrite' field
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="overwrite"\r\n\r\n')
        body.extend(f"{str(overwrite).lower()}\r\n".encode("utf-8"))

        # Add 'unique_filename' field if requested
        if unique_filename:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="unique_filename"\r\n\r\n')
            body.extend(b"true\r\n")

        # Add 'access' field if requested ('public' | 'private')
        if access:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="access"\r\n\r\n')
            body.extend(f"{access}\r\n".encode("utf-8"))

        # Add 'webhook_url' field if provided
        if webhook_url:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="webhook_url"\r\n\r\n')
            body.extend(f"{webhook_url}\r\n".encode("utf-8"))

        # Add 'file' field
        safe_fname = os.path.basename(fname).replace('"', "")
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            f'Content-Disposition: form-data; name="file"; filename="{safe_fname}"\r\n'.encode("utf-8")
        )
        body.extend(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "dcd-storage-client-python/1.0.0",
        }

        if token:
            headers["X-Upload-Token"] = token
        elif self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            raise AuthenticationError(
                "StorageClient: Either api_key or a signed upload token is required to upload", 401
            )

        req = Request(upload_url, data=bytes(body), headers=headers, method="POST")

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("asset", data)
        except HTTPError as e:
            raw_err = e.read().decode("utf-8", errors="replace")
            err_json = {}
            try:
                err_json = json.loads(raw_err)
                msg = err_json.get("error", {}).get("message") or err_json.get("message") or str(e)
            except Exception:
                msg = raw_err or str(e)

            if e.code in (401, 403):
                raise AuthenticationError(f"Authentication failed ({e.code}): {msg}", e.code, err_json) from e
            if e.code == 413:
                raise PayloadTooLargeError(f"File too large ({e.code}): {msg}", e.code, err_json) from e
            raise UploadError(f"Upload failed ({e.code}): {msg}", e.code, err_json) from e
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

    def destroy(self, public_id: str) -> bool:
        """Permanently deletes an asset by its public_id (convenient alias for delete)."""
        return self.delete(public_id)

    def delete(self, public_id: str) -> bool:
        """Permanently deletes an asset by its public_id."""
        clean_id = public_id.lstrip("/")
        delete_url = f"{self.endpoint}/v1/admin/files/{clean_id}"

        headers = self._get_headers()
        req = Request(delete_url, headers=headers, method="DELETE")

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                return resp.status == 200
        except HTTPError as e:
            if e.code == 404:
                raise NotFoundError(f"Asset '{clean_id}' not found", 404) from e
            if e.code in (401, 403):
                raise AuthenticationError(f"Delete permission denied ({e.code})", e.code) from e
            raise StorageError(f"Delete failed ({e.code})", e.code) from e
        except URLError as e:
            raise StorageError(f"Connection failed: {e}") from e

    def get_resource(self, public_id: str) -> Dict[str, Any]:
        """Retrieves full metadata for an asset by publicId (requires API key)."""
        clean_id = public_id.lstrip("/")
        url = f"{self.endpoint}/v1/admin/files/{clean_id}"
        data = self._request_json(url, method="GET")
        return data.get("asset", data)

    def get_file(self, public_id: str) -> Dict[str, Any]:
        """Alias for get_resource."""
        return self.get_resource(public_id)

    def purge_cache(self) -> Dict[str, Any]:
        """Purges all cached image transformation variants from server disk."""
        url = f"{self.endpoint}/v1/admin/purge-cache"
        return self._request_json(url, method="POST")

    def update_access(self, public_id: str, access: str) -> Dict[str, Any]:
        """Updates asset access level ('public' or 'private')."""
        clean_id = public_id.lstrip("/")
        url = f"{self.endpoint}/v1/admin/files/{clean_id}"
        payload = {"access": access}
        return self._request_json(
            url,
            method="PATCH",
            body=json.dumps(payload).encode("utf-8"),
            extra_headers={"Content-Type": "application/json"},
        )

    # --- Internal Helpers ---

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": "dcd-storage-client-python/1.0.2",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request_json(
        self,
        url: str,
        method: str = "GET",
        body: Optional[bytes] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        headers = self._get_headers()
        if extra_headers:
            headers.update(extra_headers)

        req = Request(url, data=body, headers=headers, method=method)
        try:
            with urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            raw_err = e.read().decode("utf-8", errors="replace")
            err_json = {}
            try:
                err_json = json.loads(raw_err)
                msg = err_json.get("error", {}).get("message") or err_json.get("message") or str(e)
            except Exception:
                msg = raw_err or str(e)

            if e.code in (401, 403):
                raise AuthenticationError(f"Authentication failed ({e.code}): {msg}", e.code, err_json) from e
            if e.code == 404:
                raise NotFoundError(f"Resource not found ({e.code}): {msg}", e.code, err_json) from e
            if e.code == 413:
                raise PayloadTooLargeError(f"Payload too large ({e.code}): {msg}", e.code, err_json) from e
            raise StorageError(f"Request failed ({e.code}): {msg}", e.code, err_json) from e
        except URLError as e:
            raise StorageError(f"Connection failed to {url}: {e}") from e


def create_storage_client(endpoint: Optional[str] = None, api_key: Optional[str] = None, timeout: float = 30.0) -> StorageClient:
    """Factory function to instantiate a StorageClient."""
    return StorageClient(endpoint=endpoint, api_key=api_key, timeout=timeout)


# Canonical Industry Standard Aliases
create_client = create_storage_client
Storage = StorageClient

# Backward compatibility aliases
BucketClient = StorageClient
create_bucket_client = create_storage_client
