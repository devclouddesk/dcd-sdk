# 🛠️ DevCloudDesk SDK Monorepo (`dcd-sdk`)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@dcd-sdk/storage-client?color=blue&label=%40dcd-sdk%2Fstorage-client)](https://www.npmjs.com/package/@dcd-sdk/storage-client)

Official multi-language client libraries and developer tools for [DevCloudDesk](https://devclouddesk.com).

This repository is maintained as a monorepo containing official SDKs for Node.js, TypeScript, and Python.

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
import { createBucketClient } from '@dcd-sdk/storage-client';

const bucket = createBucketClient({
  endpoint: 'http://your-server-ip:7100',
  apiKey: process.env.DCD_STORAGE_API_KEY,
});

// Upload asset
const result = await bucket.upload(fileBuffer, {
  folder: 'avatars',
  filename: 'user.png',
});

// Generate dynamic transformation CDN URL
const avatarUrl = bucket
  .url(result.publicId)
  .resize({ width: 400, height: 400, crop: 'cover' })
  .format('webp')
  .quality(80)
  .build();
```

---

### 2. Python (`dcd-storage-client`)

```bash
pip install dcd-storage-client
```

```python
from dcd_storage_client import BucketClient
import os

bucket = BucketClient(
    endpoint="http://your-server-ip:7100",
    api_key=os.environ.get("DCD_STORAGE_API_KEY"),
)

# Upload asset
asset = bucket.upload("./banner.png", folder="marketing")

# Dynamic transformation URL
avatar_url = bucket.url(asset["publicId"]).resize(400, 400, "fill").format("webp").to_string()
```

---

## 📁 Repository Structure

```text
dcd-sdk/
├── packages/
│   └── storage-client/        # TypeScript & Node.js client (@dcd-sdk/storage-client)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── python/                    # Python package (dcd-storage-client)
│   ├── dcd_storage_client/
│   └── pyproject.toml
├── package.json               # Root monorepo workspace
└── README.md
```

---

## 📄 License

This repository is open-source software licensed under the **[MIT License](LICENSE)**.
