export type CropMode = 'fill' | 'fit' | 'crop' | 'scale' | 'thumb' | 'pad' | string;
export type OutputFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png' | string;

export interface StorageClientConfig {
  /** The base URL of the storage engine cluster (e.g. 'https://storage.mycoolapp.com' or 'http://192.168.1.50:7100'). Defaults to process.env.DCD_STORAGE_ENDPOINT */
  endpoint?: string;
  /** Public API key (dcd_pk_...), Secret key (dcd_sk_...), or Master key. Defaults to process.env.DCD_STORAGE_API_KEY */
  apiKey?: string;
  /** Snake_case alias for apiKey */
  api_key?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

// Backward compatibility aliases
export type MediaClientConfig = StorageClientConfig;
export type BucketClientConfig = StorageClientConfig;

export interface TransformationOptions {
  width?: number;
  height?: number;
  w?: number;
  h?: number;
  crop?: CropMode;
  c?: CropMode;
  format?: OutputFormat;
  f?: OutputFormat;
  quality?: number | 'auto';
  q?: number | 'auto';
  blur?: number;
  grayscale?: boolean;
  sharpen?: boolean;
  rotation?: number | 'auto';
}

/**
 * Universal file source supported by upload() across Node.js, browsers, edge, and mobile runtimes
 */
export type UploadableFile =
  | string // Local file path in Node.js
  | Blob // Browser Blob or File
  | ArrayBuffer
  | ArrayBufferView // Buffer, Uint8Array, etc.
  | any;

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  public_id?: string;
  filename?: string;
  overwrite?: boolean;
  uniqueFilename?: boolean;
  unique_filename?: boolean;
  /** Access level: 'public' (default, served via public CDN) or 'private' (requires signed download URL or API key) */
  access?: 'public' | 'private';
  /** Optional webhook callback URL notified upon successful upload */
  webhookUrl?: string;
  webhook_url?: string;
  /** Optional client signed upload token (dcd_sig_...) to upload without API key */
  token?: string;
  tags?: string[];
  /** Progress tracking callback (supported in browser environments) */
  onProgress?: (percent: number) => void;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

export interface SignUploadOptions {
  folder?: string;
  maxBytes?: number;
  expiresInSeconds?: number;
  webhookUrl?: string;
  access?: 'public' | 'private';
}

export interface SignedUploadResult {
  success: boolean;
  token: string;
  uploadUrl: string;
  expiresInSeconds: number;
  folder?: string | null;
  maxBytes?: number | null;
  access?: 'public' | 'private';
  webhookUrl?: string | null;
}

export interface SignedDownloadOptions {
  /** Lifetime of the signed URL in seconds (default: 300) */
  expiresInSeconds?: number;
  /** Type of resource ('image' or 'raw', default: 'image') */
  resourceType?: 'image' | 'raw';
  /** Optional on-the-fly transformation string (e.g. 'w_400,h_400,c_fill') */
  transform?: string;
}

export interface AssetResult {
  public_id: string;
  publicId: string;
  filename: string;
  format: string;
  resource_type?: string;
  resourceType?: string;
  width?: number;
  height?: number;
  bytes: number;
  storageDriver: string;
  etag: string;
  access?: 'public' | 'private';
  url: string;
  secure_url: string;
  secureUrl: string;
  rawUrl?: string;
  created_at: number;
  createdAt: number;
}

// Backward compatibility and Bucket aliases
export type StorageAssetResult = AssetResult;
export type BucketAssetResult = AssetResult;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FileListOptions {
  folder?: string;
  page?: number;
  limit?: number;
}

export interface FileListResult {
  success: boolean;
  data: {
    files: AssetResult[];
    pagination: Pagination;
  };
}

export interface ServerStats {
  filesCount: number;
  totalStorageBytes: number;
  cacheVariantsCount: number;
  cacheSizeBytes: number;
  uptimeSeconds: number;
  memoryUsageMb: number;
  storageDriver: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'error';
  uptime?: number;
  timestamp?: number;
  version?: string;
}
