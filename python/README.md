# dcd-storage-client (Python SDK)

Official Python Client SDK for **DevCloudDesk Storage Engine**.

[![PyPI version](https://img.shields.io/pypi/v/dcd-storage-client?color=blue)](https://pypi.org/project/dcd-storage-client/)
[![Python versions](https://img.shields.io/pypi/pyversions/dcd-storage-client)](https://pypi.org/project/dcd-storage-client/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-performance, Cloudinary-compatible dynamic image transformations, uploads, and media management backed by your self-hosted DevCloudDesk storage clusters.

---

## 📦 Installation

```bash
pip install dcd-storage-client
```

> **Zero External Dependencies**: Works out-of-the-box with standard Python 3.8+ (`urllib` based). Instant installation without dependency conflicts!

---

## ⚡ Basic Use Case (In 30 Seconds)

Upload an image and generate an on-the-fly optimized WebP thumbnail:

```python
from dcd_storage_client import StorageClient

# 1. Initialize client
client = StorageClient(
    endpoint="http://YOUR_SERVER_IP:7100",  # or custom domain: https://cdn.yourdomain.com
    api_key="dcd_key_live_xxxxxxxxxxxx",    # API key from DevCloudDesk dashboard
)

# 2. Upload an image (supports filepath, bytes, or file stream)
asset = client.upload("avatar.png", folder="users")
print("Original URL:", asset["url"])

# 3. Generate instant on-the-fly WebP thumbnail
thumbnail_url = (
    client.url(asset["publicId"])
    .resize(width=300, height=300, crop="fill")
    .format("webp")
    .quality(80)
    .to_string()
)

print("Thumbnail URL:", thumbnail_url)
# => http://YOUR_SERVER_IP:7100/image/upload/w_300,h_300,c_fill,f_webp,q_80/users/avatar.webp
```

---

## 📖 Complete API Reference (All Functions)

The `StorageClient` instance provides the following core methods:

### 1. Upload & Delivery

| Function | Signature | Description |
| :--- | :--- | :--- |
| `upload(file, ...)` | `(file, folder="", filename=None, overwrite=True, access="public") -> dict` | Uploads file (path, bytes, or stream) to storage with auto format detection. |
| `url(public_id)` | `(public_id: str) -> TransformationBuilder` | Creates a chainable builder for on-the-fly image transformations. |
| `get_public_url(public_id)` | `(public_id: str) -> str` | Directly returns public CDN URL for an asset without transformation parameters. |
| `get_signed_url(public_id, ...)` | `(public_id: str, expires_in_seconds=300, resource_type="image") -> str` | Generates a cryptographically signed URL to access private assets securely. |

### 2. Client-Side Uploads (Zero Secret Exposure)

| Function | Signature | Description |
| :--- | :--- | :--- |
| `create_signed_upload_token(...)` | `(folder=None, max_bytes=None, expires_in_seconds=300, access="public") -> dict` | Generates a short-lived token for safe browser/mobile client uploads. |
| `upload_with_token(file, token, ...)` | `(file, token: str, filename=None) -> dict` | Uploads a file directly using only a signed upload token (no secret API key required). |

### 3. File & Folder Management

| Function | Signature | Description |
| :--- | :--- | :--- |
| `list_files(...)` | `(folder=None, page=1, limit=50) -> dict` | Lists stored files with pagination (`page`, `limit`) and folder filtering. |
| `get_file(public_id)` | `(public_id: str) -> dict` | Retrieves full metadata and details for a single asset by its `publicId`. |
| `update_access(public_id, access)` | `(public_id: str, access="public" \| "private") -> dict` | Toggles an asset's access mode between `"public"` and `"private"`. |
| `delete(public_id)` | `(public_id: str) -> bool` | Permanently deletes an asset and automatically purges its transformed variants. |

### 4. Server Maintenance & Stats

| Function | Signature | Description |
| :--- | :--- | :--- |
| `get_stats()` | `() -> dict` | Retrieves real-time storage metrics (files count, storage bytes, cache size, uptime). |
| `purge_cache()` | `() -> int` | Purges all cached image transformation variants from the server disk. |
| `health_check()` | `() -> dict` | Checks whether the storage cluster is online and healthy. |

### 5. Cloudinary Compatibility Namespaces

Drop-in migration for existing Cloudinary codebases:

```python
# Uploader namespace
client.uploader.upload("photo.jpg", folder="photos")
client.uploader.destroy("photos/sample")

# Admin API namespace
file_meta = client.api.resource("photos/sample")
files_list = client.api.resources(folder="photos", limit=50)
usage_stats = client.api.usage()
```

---

## 🎨 Image Transformation Methods

When using `client.url(public_id)`, chain any of these transformation methods:

| Method | Example | Description |
| :--- | :--- | :--- |
| `.resize(width, height, crop)` | `.resize(400, 400, "fill")` | Resizes dimension with crop mode (`fill`, `fit`, `crop`, `scale`). |
| `.crop(mode)` | `.crop("fill")` | Sets crop strategy (`fill`, `fit`, `crop`, `scale`). |
| `.format(fmt)` | `.format("webp")` | Output format: `"auto"`, `"webp"`, `"avif"`, `"jpeg"`, `"png"`. |
| `.quality(q)` | `.quality(80)` | Compression quality (`1` to `100`). |
| `.blur(sigma)` | `.blur(4)` | Applies Gaussian blur filter (`1` to `100`). |
| `.grayscale()` | `.grayscale()` | Converts image to black and white. |
| `.sharpen()` | `.sharpen()` | Enhances edge sharpness. |
| `.rotation(deg)` | `.rotation(90)` | Rotates image by degrees (`90`, `180`, `270`, `"auto"`). |
| `.to_string()` / `.build()` | `.to_string()` | Returns the final transformed CDN URL string. |

---

## 🛡️ Error Handling

```python
from dcd_storage_client import (
    StorageError,
    AuthenticationError,
    NotFoundError,
    PayloadTooLargeError,
    UploadError,
)

try:
    client.upload("large_file.zip")
except AuthenticationError as e:
    print("Invalid API Key:", e)
except PayloadTooLargeError as e:
    print("File exceeds size limit:", e)
except StorageError as e:
    print("Storage error:", e)
```

---

## 📜 License

MIT © [DevCloudDesk](https://devclouddesk.com)
