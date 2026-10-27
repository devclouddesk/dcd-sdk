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
npm install @dcd-sdk/storage-client
# or: pnpm add @dcd-sdk/storage-client / yarn add @dcd-sdk/storage-client
```

Universal compatibility: **CommonJS (`require`)**, **ES Modules (`import`)**, **TypeScript**, **Next.js**, **Vite**, **Bun**, and **Deno**.

---

## ⚡ Basic Use Case (In 30 Seconds)

Upload an image and generate an on-the-fly optimized WebP thumbnail:

```typescript
import { StorageClient } from '@dcd-sdk/storage-client';

// 1. Initialize client
const client = new StorageClient({
  endpoint: 'http://YOUR_SERVER_IP:7100', // or https://cdn.yourdomain.com
  apiKey: process.env.STORAGE_API_KEY,    // API key from DevCloudDesk dashboard
});

// 2. Upload an image (supports Buffer, File, Blob, or file path)
const asset = await client.upload('./avatar.png', { folder: 'users' });
console.log('Original URL:', asset.url);

// 3. Generate instant on-the-fly WebP thumbnail
const thumbnailUrl = client
  .url(asset.publicId)
  .resize({ width: 300, height: 300, crop: 'fill' })
  .format('webp')
  .quality(80)
  .build();

console.log('Thumbnail URL:', thumbnailUrl);
// => http://YOUR_SERVER_IP:7100/image/upload/w_300,h_300,c_fill,f_webp,q_80/users/avatar.webp
```

---

## 📖 Complete API Reference (All Functions)

The `StorageClient` instance provides the following core methods:

### 1. Upload & Delivery

| Function | Signature | Description |
| :--- | :--- | :--- |
| `upload(file, options?)` | `(file: UploadableFile, options?: UploadOptions) => Promise<AssetResult>` | Uploads file (Buffer, Blob, File, or path) to storage with auto format detection. |
| `url(publicId, options?)` | `(publicId: string, options?: TransformationOptions) => TransformationBuilder` | Creates a chainable builder for on-the-fly image transformations. |
| `getPublicUrl(publicId)` | `(publicId: string) => string` | Directly returns public CDN URL for an asset without transformation parameters. |
| `getSignedUrl(publicId, options?)` | `(publicId: string, options?: SignedDownloadOptions) => Promise<string>` | Generates a cryptographically signed URL to access private assets securely. |

### 2. Client-Side Uploads (Zero Secret Exposure)

| Function | Signature | Description |
| :--- | :--- | :--- |
| `createSignedUploadToken(options?)` | `(options?: SignUploadOptions) => Promise<SignedUploadResult>` | Generates a short-lived token for safe browser/mobile client uploads. |
| `uploadWithToken(file, token, options?)` | `(file: UploadableFile, token: string, options?: UploadOptions) => Promise<AssetResult>` | Uploads a file directly using only a signed upload token (no secret API key required). |

### 3. File & Folder Management

| Function | Signature | Description |
| :--- | :--- | :--- |
| `listFiles(options?)` | `(options?: FileListOptions) => Promise<FileListResult>` | Lists stored files with pagination (`page`, `limit`) and folder filtering. |
| `getFile(publicId)` | `(publicId: string) => Promise<AssetResult>` | Retrieves full metadata and details for a single asset by its `publicId`. |
| `updateAccess(publicId, access)` | `(publicId: string, access: 'public' \| 'private') => Promise<AssetResult>` | Toggles an asset's access mode between `'public'` and `'private'`. |
| `delete(publicId)` | `(publicId: string) => Promise<boolean>` | Permanently deletes an asset and automatically purges its transformed variants. |

### 4. Server Maintenance & Stats

| Function | Signature | Description |
| :--- | :--- | :--- |
| `getStats()` | `() => Promise<ServerStats>` | Retrieves real-time storage metrics (files count, storage bytes, cache size, uptime). |
| `purgeCache()` | `() => Promise<number>` | Purges all cached image transformation variants from the server disk. |
| `healthCheck()` | `() => Promise<HealthCheckResult>` | Checks whether the storage cluster is online and healthy. |

### 5. Cloudinary Compatibility Namespaces

Drop-in migration for existing Cloudinary codebases:

```typescript
// Uploader namespace
await client.uploader.upload(file, { folder: 'photos' });
await client.uploader.destroy('photos/sample');

// Admin API namespace
const file = await client.api.resource('photos/sample');
const list = await client.api.resources({ folder: 'photos', max_results: 50 });
const stats = await client.api.usage();
```

---

## 🎨 Image Transformation Methods

When using `client.url(publicId)`, chain any of these transformation methods:

| Method | Example | Description |
| :--- | :--- | :--- |
| `.resize({ width, height, crop })` | `.resize({ width: 400, height: 400, crop: 'fill' })` | Resizes dimension with crop mode (`fill`, `fit`, `crop`, `scale`). |
| `.crop(mode)` | `.crop('fill')` | Sets crop strategy (`fill`, `fit`, `crop`, `scale`). |
| `.format(fmt)` | `.format('webp')` | Output format: `'auto'`, `'webp'`, `'avif'`, `'jpeg'`, `'png'`. |
| `.quality(q)` | `.quality(80)` | Compression quality (`1` to `100` or `'auto'`). |
| `.blur(sigma)` | `.blur(4)` | Applies Gaussian blur filter (`1` to `100`). |
| `.grayscale()` | `.grayscale()` | Converts image to black and white. |
| `.sharpen()` | `.sharpen()` | Enhances edge sharpness. |
| `.rotation(deg)` | `.rotation(90)` | Rotates image by degrees (`90`, `180`, `270`, `'auto'`). |
| `.build()` / `.toString()` | `.build()` | Returns the final transformed CDN URL string. |

---

## 🛡️ Error Handling

```typescript
import {
  StorageError,
  AuthenticationError,
  NotFoundError,
  PayloadTooLargeError,
  UploadError,
} from '@dcd-sdk/storage-client';

try {
  await client.upload('./document.pdf');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API Key:', error.message);
  } else if (error instanceof PayloadTooLargeError) {
    console.error('File exceeds size limit:', error.message);
  } else if (error instanceof StorageError) {
    console.error('Storage error:', error.message);
  }
}
```

---

## 📄 License

MIT © [DevCloudDesk](https://devclouddesk.com)
