# @dcd-sdk/storage-client

Official Node.js & TypeScript Client SDK for **DevCloudDesk Storage Engine**.

[![npm version](https://img.shields.io/npm/v/@dcd-sdk/storage-client?color=blue)](https://www.npmjs.com/package/@dcd-sdk/storage-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

High-performance, Cloudinary-compatible on-the-fly media transformations and ultra-fast asset delivery backed by your self-hosted DevCloudDesk storage clusters.

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

Universal compatibility: **CommonJS (`require`)**, **ES Modules (`import`)**, **TypeScript**, **Next.js**, **Vite**, **Bun**, and **Deno**.

---

## 🚀 Quickstart

### 1. Initialize the Client

```typescript
import { StorageClient } from '@dcd-sdk/storage-client';

// Initializes with explicit config or auto-detects from DCD_STORAGE_ENDPOINT & DCD_STORAGE_API_KEY
const client = new StorageClient({
  endpoint: 'http://YOUR_SERVER_IP:7100', // or https://storage.yourdomain.com
  apiKey: process.env.STORAGE_API_KEY,    // API Key from DevCloudDesk Dashboard
});
```

*CommonJS is also fully supported:*
```javascript
const { StorageClient } = require('@dcd-sdk/storage-client');
const client = new StorageClient({ endpoint, apiKey });
```

---

### 2. Uploading Files (Node.js or Browser)

Supports file paths (Node.js), `Buffer`, `Blob`, `File`, or `ArrayBuffer`:

```typescript
// Upload from Buffer, File, or local file path
const asset = await client.upload(fileBuffer, {
  folder: 'avatars',
  filename: 'user-profile.png',
  overwrite: true,
  onProgress: (percent) => {
    console.log(`Upload progress: ${percent}%`);
  },
});

console.log('Public ID:', asset.publicId);
console.log('CDN URL:', asset.url);
console.log('Direct URL:', client.getPublicUrl(asset.publicId));

// Cloudinary-compatible namespace style also supported:
await client.uploader.upload(fileBuffer, { folder: 'avatars' });
await client.uploader.destroy(asset.publicId);
```

---

### 3. Dynamic On-The-Fly Transformations

Generate real-time optimized WebP/AVIF images with automatic resizing, blur, and sharpening:

```typescript
const avatarUrl = client
  .url(asset.publicId)
  .resize({ width: 400, height: 400, crop: 'cover' })
  .format('webp')
  .quality(80)
  .blur(4)
  .build();

// Output: http://YOUR_SERVER_IP:7100/v1/image/w_400,h_400,c_cover,f_webp,q_80,e_blur_4/avatars/user-profile.png
```

#### Transformation Options Reference

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `.resize({ width, height, crop })` | `number, number, CropMode` | Resizes image dimension with crop strategy |
| `.crop(mode)` | `'fill' \| 'fit' \| 'crop' \| 'scale'` | Crop strategy |
| `.format(fmt)` | `'auto' \| 'webp' \| 'avif' \| 'jpeg' \| 'png'` | Output image format |
| `.quality(q)` | `number (1-100) \| 'auto'` | Compression quality |
| `.blur(sigma)` | `number (1-100)` | Applies Gaussian blur filter |
| `.grayscale()` | `boolean` | Converts image to black and white |
| `.sharpen()` | `boolean` | Enhances edge sharpness |
| `.rotation(deg)` | `number \| 'auto'` | Rotates image by degrees (e.g. 90, 180, 270) |

---

### 4. Client-Side Uploads via Signed Tokens (Zero Secret Exposure)

Keep your master API keys safely on your backend server. Generate short-lived, tamper-proof signed upload tokens for your frontend React/Next.js/Mobile apps:

```typescript
// Backend endpoint (Node.js / Next.js / Express):
app.post('/api/get-upload-token', async (req, res) => {
  const tokenData = await client.createSignedUploadToken({
    folder: 'user-uploads',
    expiresInSeconds: 300,        // 5 minutes
    maxBytes: 10 * 1024 * 1024,   // 10 MB limit
  });
  res.json(tokenData);
});

// Frontend client (Browser / React / Vue):
const { token } = await res.json();
await client.uploadWithToken(file, token, {
  onProgress: (percent) => setProgress(percent),
});
```

---

### 5. Listing Files & Server Stats

```typescript
// List files in a folder
const result = await client.listFiles({
  folder: 'avatars',
  page: 1,
  limit: 20,
});
console.log('Files count:', result.data.files.length);

// Server metrics
const stats = await client.getStats();
console.log('Total files:', stats.filesCount, 'Storage used:', stats.totalStorageBytes);
```

---

### 6. Robust Error Handling

```typescript
import {
  StorageError,
  AuthenticationError,
  NotFoundError,
  PayloadTooLargeError,
  UploadError,
  NetworkTimeoutError,
} from '@dcd-sdk/storage-client';

try {
  await client.upload(file);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Check your API key:', error.message);
  } else if (error instanceof PayloadTooLargeError) {
    console.error('File size exceeds server limits:', error.message);
  } else if (error instanceof UploadError) {
    console.error('Upload failed:', error.message);
  }
}
```

---

## 📄 License

MIT © [DevCloudDesk](https://devclouddesk.com)
