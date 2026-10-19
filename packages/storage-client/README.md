# @dcd-sdk/storage-client

Official Node.js & TypeScript Client SDK for DevCloudDesk Storage Engine.

High-performance, Cloudinary-style on-the-fly media transformations and ultra-fast direct asset delivery backed by your DevCloudDesk storage clusters.

[![npm version](https://img.shields.io/npm/v/@dcd-sdk/storage-client?color=blue)](https://www.npmjs.com/package/@dcd-sdk/storage-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📦 Installation

```bash
# npm
npm install @dcd-sdk/storage-client

# pnpm
pnpm add @dcd-sdk/storage-client

# yarn
yarn add @dcd-sdk/storage-client
```

---

## 🚀 Quickstart

### 1. Initialize the Client

```typescript
import { createBucketClient } from '@dcd-sdk/storage-client';

const bucket = createBucketClient({
  endpoint: 'http://YOUR_SERVER_IP:7100', // or your custom domain https://storage.yourdomain.com
  apiKey: process.env.STORAGE_API_KEY,    // API Key from DevCloudDesk Dashboard
});
```

### 2. Uploading Files (Node.js or Browser)

```typescript
// Upload from Buffer, File, or local file path
const asset = await bucket.upload(fileBuffer, {
  folder: 'avatars',
  filename: 'user-profile.png',
  onProgress: (percent) => {
    console.log(`Upload progress: ${percent}%`);
  },
});

console.log('Public ID:', asset.publicId);
console.log('CDN URL:', asset.url);
```

### 3. Dynamic On-The-Fly Transformations

Generate real-time optimized WebP/AVIF images with automatic resizing:

```typescript
const avatarUrl = bucket
  .url(asset.publicId)
  .resize({ width: 400, height: 400, crop: 'cover' })
  .format('webp')
  .quality(80)
  .build();

// Output: http://YOUR_SERVER_IP:7100/v1/image/w_400,h_400,c_cover,f_webp,q_80/avatars/user-profile.png
```

### 4. Client-Side Uploads via Signed Tokens (Zero Secret Exposure)

Keep your master API keys safely on your backend server. Generate short-lived, tamper-proof signed upload tokens for your frontend React/Next.js/Mobile apps:

```typescript
// Backend endpoint:
app.post('/api/get-upload-token', async (req, res) => {
  const tokenData = await bucket.createSignedUploadToken({
    folder: 'user-uploads',
    expiresInSeconds: 300, // 5 minutes
    maxBytes: 10 * 1024 * 1024, // 10 MB limit
  });
  res.json(tokenData);
});

// Frontend client:
const { token } = await res.json();
await bucket.uploadWithToken(file, token);
```

### 5. Deleting Files

```typescript
await bucket.delete(asset.publicId);
```

---

## 📄 License

MIT © [DevCloudDesk](https://devclouddesk.com)
