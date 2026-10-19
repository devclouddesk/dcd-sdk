# @devclouddesk/storage

Official TypeScript & React Client SDK for DevCloudDesk Object Storage and Media Engine.

High-performance, Cloudinary-compatible media transformations and ultra-fast direct asset delivery backed by your DevCloudDesk VPS clusters.

---

## 📦 Installation

```bash
# npm
npm install @devclouddesk/storage

# yarn
yarn add @devclouddesk/storage

# pnpm
pnpm add @devclouddesk/storage
```

---

## 🚀 Quickstart

### 1. Initialize the Client

```typescript
import { createStorageClient } from '@devclouddesk/storage';

const storage = createStorageClient({
  endpoint: 'http://YOUR_SERVER_IP:7100', // or your custom domain https://storage.yourdomain.com
  apiKey: 'dcd_key_live_xxxxxxxxxxxx',    // API Key from DevCloudDesk Dashboard
});
```

### 2. Uploading Files

```typescript
// Browser file input:
const file = event.target.files[0];

const asset = await storage.upload(file, {
  folder: 'avatars',
  onProgress: (percent) => {
    console.log(`Upload progress: ${percent}%`);
  },
});

console.log('Public ID:', asset.publicId);
console.log('Original CDN URL:', asset.url);
```

### 3. Dynamic URL Transformation

```typescript
// Generate on-the-fly optimized and transformed image URLs
const avatarUrl = storage
  .url(asset.publicId)
  .resize(400, 400, 'fill')
  .format('webp')
  .quality(85)
  .blur(5)
  .toString();

console.log(avatarUrl);
// => http://YOUR_SERVER_IP:7100/v1/image/w_400,h_400,c_fill,f_webp,q_85,e_blur_5/avatars/xxxx.webp
```

---

## ⚛️ React Integration

Use the built-in `<DcdImage />` or `<Image />` component with automatic format negotiation and lazy loading:

```tsx
import { DcdImage } from '@devclouddesk/storage/react';

export function UserProfile({ avatarPublicId }) {
  return (
    <DcdImage
      endpoint="http://YOUR_SERVER_IP:7100"
      publicId={avatarPublicId}
      width={128}
      height={128}
      crop="fill"
      format="auto"
      className="rounded-full shadow-md object-cover"
      alt="User Profile"
    />
  );
}
```

---

## 🛠️ Node.js / Server Admin Usage

Delete assets using your cluster Secret Key (`dcd_sk_...`):

```typescript
const adminStorage = createStorageClient({
  endpoint: 'http://YOUR_SERVER_IP:7100',
  apiKey: process.env.DCD_STORAGE_SECRET_KEY, // dcd_sk_...
});

// Permanently delete asset from storage and metadata
await adminStorage.delete('avatars/user-123');
```

---

## 📜 License

MIT © [DevCloudDesk](https://devclouddesk.com)
