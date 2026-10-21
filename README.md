# 🛠️ DevCloudDesk SDK Monorepo (`dcd-sdk`)

[![CI & Test Suite](https://github.com/devclouddesk/dcd-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/devclouddesk/dcd-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@dcd-sdk/storage-client?color=blue&label=%40dcd-sdk%2Fstorage-client)](https://www.npmjs.com/package/@dcd-sdk/storage-client)
[![PyPI Version](https://img.shields.io/pypi/v/dcd-storage-client?color=blue&label=dcd-storage-client)](https://pypi.org/project/dcd-storage-client/)

Official multi-language client libraries and developer tools for [DevCloudDesk](https://devclouddesk.com).

This repository is maintained as a unified monorepo containing production-ready, enterprise-grade SDKs for Node.js, TypeScript, and Python.

---

## 📦 Available Packages

| Package | Language | Registry | Description |
| :--- | :--- | :--- | :--- |
| **[`@dcd-sdk/storage-client`](./packages/storage-client)** | TypeScript / Node.js | [npm](https://www.npmjs.com/package/@dcd-sdk/storage-client) | High-performance object storage, asset uploads & dynamic image CDN builder |
| **[`dcd-storage-client`](./python)** | Python (3.8+) | [PyPI](https://pypi.org/project/dcd-storage-client/) | Pythonic client for DevCloudDesk storage buckets & image transformations |
| *`@dcd-sdk/database-client`* | TypeScript | *Coming soon* | Serverless Postgres, Redis & MySQL connection client |

---

## ⚡ Quickstart

### 1. TypeScript / JavaScript (`@dcd-sdk/storage-client`)

```bash
npm install @dcd-sdk/storage-client
```

```typescript
import { StorageClient } from '@dcd-sdk/storage-client';

// Initializes with explicit config or auto-detects from DCD_STORAGE_ENDPOINT & DCD_STORAGE_API_KEY
const client = new StorageClient({
  endpoint: 'http://your-server-ip:7100',
  apiKey: process.env.DCD_STORAGE_API_KEY,
});

// Upload asset (Buffer, File, Blob, or file path)
const result = await client.upload('./avatar.png', {
  folder: 'avatars',
  filename: 'user.png',
  overwrite: true,
});

// Direct fast public URL
const directUrl = client.getPublicUrl(result.publicId);

// Dynamic on-the-fly transformation CDN URL
const avatarUrl = client
  .url(result.publicId)
  .resize({ width: 400, height: 400, crop: 'cover' })
  .format('webp')
  .quality(80)
  .build();

// Cloudinary-compatible namespaces also supported:
await client.uploader.upload(file, { folder: 'banners' });
await client.uploader.destroy(result.publicId);
```

---

### 2. Python (`dcd-storage-client`)

```bash
pip install dcd-storage-client
```

```python
from dcd_storage_client import StorageClient
import os

client = StorageClient(
    endpoint="http://your-server-ip:7100",
    api_key=os.environ.get("DCD_STORAGE_API_KEY"),
)

# Upload asset (bytes, file-like object, or filepath)
asset = client.upload("./banner.png", folder="marketing")

# Dynamic transformation URL
avatar_url = client.url(asset["publicId"]).resize(400, 400, "fill").format("webp").to_string()

# Delete
client.delete(asset["publicId"])
```

---

## 📁 Repository Structure

```text
dcd-sdk/
├── packages/
│   └── storage-client/        # TypeScript & Node.js client (@dcd-sdk/storage-client)
│       ├── src/
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
├── python/                    # Python package (dcd-storage-client)
│   ├── dcd_storage_client/
│   ├── tests/
│   └── pyproject.toml
├── .github/workflows/         # CI/CD test and release pipelines
├── package.json               # Root monorepo workspace
├── CONTRIBUTING.md            # Contributor guide
├── SECURITY.md                # Security policy
└── README.md
```

---

## 📄 License

This repository is open-source software licensed under the **[MIT License](LICENSE)**.
