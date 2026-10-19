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

> **Zero External Dependencies**: Works out-of-the-box with standard Python 3.8+ (`urllib` based). Instant installation without dependency version conflicts!

---

## 🚀 Quickstart

### 1. Initialize Client

```python
from dcd_storage_client import BucketClient

bucket = BucketClient(
    endpoint="http://YOUR_SERVER_IP:7100",  # Or custom domain: https://storage.yourdomain.com
    api_key="dcd_key_live_xxxxxxxxxxxx",    # API key from DevCloudDesk dashboard
)
```

---

### 2. Upload Files

Upload from a local filepath, binary bytes, or file stream:

```python
# Upload local file
asset = bucket.upload("profile.png", folder="avatars")
print("Public ID:", asset["publicId"])
print("CDN URL:", asset["url"])

# Upload raw bytes or stream (e.g. in FastAPI or Flask)
asset = bucket.upload(
    file=image_bytes,
    folder="reports",
    filename="statement.pdf",
    overwrite=True
)
```

---

### 3. Dynamic On-The-Fly Transformations

Generate real-time optimized WebP/AVIF images with automatic resizing, blur, and sharpening:

```python
avatar_url = (
    bucket.url(asset["publicId"])
    .resize(width=400, height=400, crop="fill")
    .format("webp")
    .quality(85)
    .blur(4)
    .to_string()
)

print(avatar_url)
# => http://YOUR_SERVER_IP:7100/v1/image/w_400,h_400,c_fill,f_webp,q_85,e_blur_4/avatars/user-123.webp
```

#### Transformation Options Reference

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `.resize(width, height, crop)` | `int, int, str` | Resizes image dimension with crop strategy (`fill`, `fit`, `crop`, `scale`) |
| `.crop(mode)` | `'fill' \| 'fit' \| 'crop' \| 'scale'` | Crop strategy |
| `.format(fmt)` | `'auto' \| 'webp' \| 'avif' \| 'jpeg' \| 'png'` | Output image format |
| `.quality(q)` | `int (1-100)` | Compression quality |
| `.blur(sigma)` | `int (1-100)` | Applies Gaussian blur filter |
| `.grayscale()` | `bool` | Converts image to grayscale |
| `.sharpen()` | `bool` | Sharpens image edges |
| `.rotation(deg)` | `int \| 'auto'` | Rotates image by degrees (e.g. 90, 180, 270) |

---

### 4. Client-Side Uploads via Signed Tokens (Zero Secret Exposure)

Keep your master API keys safely on your backend server. Generate short-lived, tamper-proof signed upload tokens for your frontend React/Next.js/Mobile clients:

```python
# Generate short-lived upload token in your FastAPI / Django / Flask endpoint
token_data = bucket.create_signed_upload_token(
    folder="client-uploads",
    expires_in_seconds=300,        # 5 minutes
    max_bytes=10 * 1024 * 1024,   # 10 MB limit
)
print("Client Upload Token:", token_data["token"])

# Client or script can upload using ONLY the token (zero API key exposure)
bucket.upload_with_token(file_bytes, token=token_data["token"])
```

---

### 5. List Files & Server Stats

```python
# List files in a bucket / folder
files = bucket.list_files(folder="avatars", page=1, limit=20)
print(f"Total files: {files['data']['pagination']['total']}")

# Server metrics
stats = bucket.get_stats()
print(f"Total bytes: {stats['totalStorageBytes']}, Driver: {stats['storageDriver']}")
```

---

### 6. Robust Error Handling

```python
from dcd_storage_client import (
    AuthenticationError,
    NotFoundError,
    PayloadTooLargeError,
    UploadError,
)

try:
    bucket.upload("large_video.mp4")
except AuthenticationError as e:
    print("Authentication failed. Check API key:", e)
except PayloadTooLargeError as e:
    print("File size exceeds limit:", e)
except UploadError as e:
    print("Upload failed:", e)
```

---

## 📜 License

MIT © [DevCloudDesk](https://devclouddesk.com)
