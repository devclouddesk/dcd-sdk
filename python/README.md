# devclouddesk-storage (Python SDK)

Official Python Client SDK for **DevCloudDesk Storage Engine**.

High-performance, Cloudinary-compatible dynamic image transformations, uploads, and media management backed by your DevCloudDesk storage clusters.

---

## 📦 Installation

```bash
pip install devclouddesk-storage
```

*(Zero required external dependencies — works out-of-the-box with standard Python 3.8+!)*

---

## 🚀 Quickstart

### 1. Initialize Client

```python
from devclouddesk_storage import StorageClient

storage = StorageClient(
    endpoint="http://YOUR_SERVER_IP:7100",  # Or custom domain: https://storage.yourdomain.com
    api_key="dcd_key_live_xxxxxxxxxxxx",    # API key from DevCloudDesk dashboard
)
```

### 2. Upload Files

Upload from a filepath or binary stream:

```python
# Upload local file
asset = storage.upload("profile.png", folder="avatars")

print("Public ID:", asset["publicId"])
print("Original CDN URL:", asset["url"])
```

Upload from memory or bytes:

```python
import io

image_bytes = b"..." # raw bytes
asset = storage.upload(
    file=image_bytes,
    folder="reports",
    filename="invoice.pdf"
)
```

### 3. Dynamic URL Transformations

Generate on-the-fly resized, cropped, and format-negotiated URLs:

```python
# Generate optimized avatar URL
avatar_url = (
    storage.url(asset["publicId"])
    .resize(width=400, height=400, crop="fill")
    .format("webp")
    .quality(85)
    .blur(5)
    .to_string()
)

print(avatar_url)
# => http://YOUR_SERVER_IP:7100/v1/image/w_400,h_400,c_fill,f_webp,q_85,e_blur_5/avatars/user-123.webp
```

### 4. Delete Assets

```python
storage.delete(asset["publicId"])
```

---

## 📜 License

MIT © [DevCloudDesk](https://devclouddesk.com)
