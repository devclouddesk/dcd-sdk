export type CropMode = 'fill' | 'fit' | 'crop' | 'scale';
export type OutputFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';

export interface StorageClientConfig {
  /** The base URL of the storage engine cluster (e.g. 'https://storage.mycoolapp.com' or 'http://192.168.1.50:7100') */
  endpoint: string;
  /** Public API key (dcd_pk_...), Secret key (dcd_sk_...), or Live key */
  apiKey?: string;
}

// Backward compatibility and Bucket aliases
export type MediaClientConfig = StorageClientConfig;
export type BucketClientConfig = StorageClientConfig;

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: CropMode;
  format?: OutputFormat;
  quality?: number | 'auto';
  blur?: number;
  grayscale?: boolean;
  sharpen?: boolean;
  rotation?: number | 'auto';
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  filename?: string;
  overwrite?: boolean;
  uniqueFilename?: boolean;
  /** Optional client signed upload token (dcd_sig_...) to upload without API key */
  token?: string;
  tags?: string[];
  onProgress?: (percent: number) => void;
}

export interface SignUploadOptions {
  folder?: string;
  maxBytes?: number;
  expiresInSeconds?: number;
}

export interface SignedUploadResult {
  success: boolean;
  token: string;
  uploadUrl: string;
  expiresInSeconds: number;
  folder?: string | null;
  maxBytes?: number | null;
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
