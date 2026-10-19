import { TransformationBuilder } from './builder.js';
import type {
  AssetResult,
  SignedUploadResult,
  SignUploadOptions,
  StorageClientConfig,
  UploadOptions,
} from './types.js';

export class StorageClient {
  private endpoint: string;
  private apiKey: string;

  constructor(config: StorageClientConfig) {
    if (!config.endpoint) {
      throw new Error('StorageClient: endpoint is required');
    }
    this.endpoint = config.endpoint.replace(/\/+$/, '');
    this.apiKey = (config.apiKey || '').trim();
  }

  /**
   * Initializes a fluent URL builder for the specified asset public ID
   */
  url(publicId: string): TransformationBuilder {
    return new TransformationBuilder(this.endpoint, publicId);
  }

  /**
   * Generates a short-lived cryptographically signed upload token for safe client-side browser/mobile uploads.
   * Keeps master API keys strictly on backend servers.
   */
  async createSignedUploadToken(options: SignUploadOptions = {}): Promise<SignedUploadResult> {
    if (!this.apiKey) {
      throw new Error('StorageClient: API key is required on backend to generate signed upload tokens.');
    }

    const signUrl = `${this.endpoint}/v1/upload/sign`;
    const response = await fetch(signUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Failed to generate signed upload token with status ${response.status}`);
    }

    return data;
  }

  /**
   * Directly uploads a file to the storage server.
   * Supports File/Blob in browser environments and Buffer/ReadStream in Node.js environments.
   * Supports both Master API Key and Client Signed Upload Tokens (dcd_sig_...).
   */
  async upload(file: any, options: UploadOptions = {}): Promise<AssetResult> {
    const uploadUrl = `${this.endpoint}/v1/upload`;
    const formData = new FormData();

    let fileToAppend = file;
    let filename = options.filename;

    if (typeof file === 'string') {
      if (typeof process !== 'undefined' && process.versions?.node) {
        try {
          const fs = await import('node:fs');
          const path = await import('node:path');
          if (fs.existsSync(file)) {
            const buf = fs.readFileSync(file);
            filename = filename || path.basename(file);
            fileToAppend = new Blob([new Uint8Array(buf)]);
          }
        } catch {
          // ignore
        }
      }
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file)) {
      fileToAppend = new Blob([new Uint8Array(file)]);
      filename = filename || 'upload.bin';
    }

    if (filename) {
      formData.append('file', fileToAppend, filename);
    } else {
      formData.append('file', fileToAppend);
    }

    if (options.folder) formData.append('folder', options.folder);
    if (options.publicId) formData.append('public_id', options.publicId);
    if (options.overwrite !== undefined) formData.append('overwrite', String(options.overwrite));
    if (options.uniqueFilename !== undefined) formData.append('unique_filename', String(options.uniqueFilename));

    // Determine auth header: Use options.token if provided, otherwise this.apiKey
    const headers: Record<string, string> = {};
    if (options.token) {
      headers['X-Upload-Token'] = options.token;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      throw new Error('StorageClient: Either apiKey or a signed upload token must be provided to upload.');
    }

    // Browser upload with progress tracking via XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined' && options.onProgress) {
      return new Promise<AssetResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        for (const [k, v] of Object.entries(headers)) {
          xhr.setRequestHeader(k, v);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && options.onProgress) {
            const percent = Math.round((e.loaded / e.total) * 100);
            options.onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res.asset);
            } catch {
              reject(new Error('Invalid response from storage server'));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error?.message || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
      });
    }

    // Standard fetch upload (Browser or Node.js)
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
    }

    return data.asset;
  }

  /**
   * Helper method for frontend clients to upload using only a signed upload token (zero API key)
   */
  async uploadWithToken(file: any, token: string, options: Omit<UploadOptions, 'token'> = {}): Promise<AssetResult> {
    return this.upload(file, { ...options, token });
  }

  /**
   * Permanently deletes a storage asset (requires API key with delete role)
   */
  async delete(publicId: string): Promise<boolean> {
    const cleanPublicId = publicId.replace(/^\/+/, '');
    const deleteUrl = `${this.endpoint}/v1/admin/files/${cleanPublicId}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    return response.ok;
  }
}

export function createStorageClient(config: StorageClientConfig): StorageClient {
  return new StorageClient(config);
}

// Bucket modern API aliases
export const BucketClient = StorageClient;
export type BucketClient = StorageClient;
export const createBucketClient = createStorageClient;

// Backward compatibility aliases
export const MediaClient = StorageClient;
export type MediaClient = StorageClient;
export const createMediaClient = createStorageClient;
