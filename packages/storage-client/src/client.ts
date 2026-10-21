import { TransformationBuilder } from './builder.js';
import {
  AuthenticationError,
  StorageError,
  NetworkTimeoutError,
  NotFoundError,
  PayloadTooLargeError,
  UploadError,
} from './errors.js';
import type {
  AssetResult,
  FileListOptions,
  FileListResult,
  HealthCheckResult,
  ServerStats,
  SignedUploadResult,
  SignUploadOptions,
  StorageClientConfig,
  TransformationOptions,
  UploadableFile,
  UploadOptions,
} from './types.js';

export class StorageClient {
  private endpoint: string;
  private apiKey: string;
  private defaultTimeoutMs: number;

  /**
   * Cloudinary-compatible uploader namespace for write and delete operations
   */
  public uploader = {
    upload: (file: UploadableFile, options: UploadOptions = {}) => this.upload(file, options),
    destroy: (publicId: string) => this.delete(publicId),
    delete: (publicId: string) => this.delete(publicId),
  };

  /**
   * Cloudinary-compatible admin API namespace for listing, usage stats, and resources
   */
  public api = {
    resources: (options: FileListOptions = {}) => this.listFiles(options),
    delete_resources: (publicIds: string[]) => Promise.all(publicIds.map((id) => this.delete(id))),
    usage: () => this.getStats(),
  };

  constructor(config: StorageClientConfig = {}) {
    const envEndpoint = (typeof process !== 'undefined' && process.env?.DCD_STORAGE_ENDPOINT) || '';
    const envApiKey = (typeof process !== 'undefined' && (process.env?.DCD_STORAGE_API_KEY || process.env?.DCD_API_KEY)) || '';

    const endpoint = config?.endpoint || envEndpoint;
    if (!endpoint) {
      throw new Error('StorageClient: endpoint is required (pass in config or set DCD_STORAGE_ENDPOINT env variable)');
    }
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.apiKey = (config?.apiKey || config?.api_key || envApiKey || '').trim();
    this.defaultTimeoutMs = config?.timeoutMs || 30000;
  }

  /**
   * Directly returns the public CDN URL for an asset without transformation boilerplate.
   */
  getPublicUrl(publicId: string): string {
    const clean = publicId.replace(/^\/+/, '');
    return `${this.endpoint}/v1/image/${clean}`;
  }

  /**
   * Initializes a URL builder or immediately generates a transformed URL string
   *
   * Example (Fluent builder style):
   *   const url = client.url('avatars/user-1').width(300).height(300).format('webp').build();
   *
   * Example (Direct options style):
   *   const url = client.url('avatars/user-1', { width: 300, height: 300, crop: 'fill', format: 'webp' });
   */
  url(publicId: string): TransformationBuilder;
  url(publicId: string, options: TransformationOptions): string;
  url(publicId: string, options?: TransformationOptions): TransformationBuilder | string;
  url(publicId: string, options?: TransformationOptions): TransformationBuilder | string {
    const builder = new TransformationBuilder(this.endpoint, publicId, options);
    if (options && Object.keys(options).length > 0) {
      return builder.build();
    }
    return builder;
  }

  /**
   * Permanently deletes a storage asset (convenient alias for delete)
   */
  async destroy(publicId: string): Promise<boolean> {
    return this.delete(publicId);
  }

  /**
   * Checks the health and connectivity of the storage engine server
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const healthUrl = `${this.endpoint}/health`;
    try {
      const response = await this.fetchWithTimeout(healthUrl, { method: 'GET' });
      if (!response.ok) {
        return { status: 'error' };
      }
      return await response.json();
    } catch {
      return { status: 'error' };
    }
  }

  /**
   * Retrieves server performance, storage, and cache statistics (requires authorized API key)
   */
  async getStats(): Promise<ServerStats> {
    const statsUrl = `${this.endpoint}/v1/admin/stats`;
    const response = await this.fetchWithTimeout(statsUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseJsonResponse(response);
    return data.stats;
  }

  /**
   * Lists files in the storage cluster with pagination and optional folder filter
   */
  async listFiles(options: FileListOptions = {}): Promise<FileListResult> {
    const url = new URL(`${this.endpoint}/v1/admin/files`);
    if (options.page) url.searchParams.set('page', String(options.page));
    if (options.limit) url.searchParams.set('limit', String(options.limit));
    if (options.folder) url.searchParams.set('folder', options.folder);

    const response = await this.fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return await this.parseJsonResponse(response);
  }

  /**
   * Clean alias for listFiles (Industry standard convention)
   */
  async list(options: FileListOptions = {}): Promise<FileListResult> {
    return this.listFiles(options);
  }

  /**
   * Generates a short-lived cryptographically signed upload token for safe client-side browser/mobile uploads.
   * Keeps master API keys strictly on backend servers.
   */
  async createSignedUploadToken(options: SignUploadOptions = {}): Promise<SignedUploadResult> {
    if (!this.apiKey) {
      throw new AuthenticationError('API key is required on backend to generate signed upload tokens.');
    }

    const signUrl = `${this.endpoint}/v1/upload/sign`;
    const response = await this.fetchWithTimeout(signUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(options),
    });

    return await this.parseJsonResponse(response);
  }

  /**
   * Clean alias for createSignedUploadToken (Industry standard convention)
   */
  async createUploadToken(options: SignUploadOptions = {}): Promise<SignedUploadResult> {
    return this.createSignedUploadToken(options);
  }

  /**
   * Directly uploads a file to the storage server.
   * Supports:
   *  - String file path (Node.js)
   *  - Buffer / Uint8Array / ArrayBuffer
   *  - File / Blob (Browser and universal runtimes)
   * Auth:
   *  - Master API Key OR Client Signed Upload Token (dcd_sig_...)
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
          // If node:fs is not available or throws, proceed with raw string
        }
      }
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file)) {
      fileToAppend = new Blob([new Uint8Array(file)]);
      filename = filename || 'upload.bin';
    } else if (file instanceof ArrayBuffer) {
      fileToAppend = new Blob([new Uint8Array(file)]);
      filename = filename || 'upload.bin';
    } else if (ArrayBuffer.isView(file)) {
      fileToAppend = new Blob([new Uint8Array(file.buffer as ArrayBuffer, file.byteOffset, file.byteLength)]);
      filename = filename || 'upload.bin';
    }

    if (filename) {
      formData.append('file', fileToAppend as any, filename);
    } else {
      formData.append('file', fileToAppend as any);
    }

    if (options.folder) formData.append('folder', options.folder);
    if (options.publicId) formData.append('public_id', options.publicId);
    if (options.overwrite !== undefined) formData.append('overwrite', String(options.overwrite));
    if (options.uniqueFilename !== undefined) formData.append('unique_filename', String(options.uniqueFilename));

    // Determine auth headers
    const headers: Record<string, string> = {};
    if (options.token) {
      headers['X-Upload-Token'] = options.token;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      throw new AuthenticationError('Either apiKey or a signed upload token must be provided to upload.');
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
          let errData: any = null;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              return resolve(parsed.asset || parsed);
            }
            errData = parsed;
          } catch {
            // response was not JSON
          }

          const msg = errData?.error?.message || `Upload failed with HTTP status ${xhr.status}`;
          if (xhr.status === 401 || xhr.status === 403) {
            return reject(new AuthenticationError(msg, xhr.status, errData));
          }
          if (xhr.status === 413) {
            return reject(new PayloadTooLargeError(msg, xhr.status, errData));
          }
          reject(new UploadError(msg, xhr.status, errData));
        };

        xhr.onerror = () => reject(new UploadError('Network connection error during upload'));
        xhr.ontimeout = () => reject(new UploadError('Upload request timed out'));
        xhr.timeout = options.timeoutMs || this.defaultTimeoutMs;
        xhr.send(formData);
      });
    }

    // Standard fetch upload
    const response = await this.fetchWithTimeout(
      uploadUrl,
      {
        method: 'POST',
        headers,
        body: formData,
      },
      options.timeoutMs
    );

    const data = await this.parseJsonResponse(response);
    return data.asset || data;
  }

  /**
   * Helper method for frontend browser/mobile clients to upload using only a signed upload token (zero API key)
   */
  async uploadWithToken(
    file: any,
    token: string,
    options: Omit<UploadOptions, 'token'> = {}
  ): Promise<AssetResult> {
    return this.upload(file, { ...options, token });
  }

  /**
   * Permanently deletes a storage asset (requires API key with delete permissions)
   */
  async delete(publicId: string): Promise<boolean> {
    const cleanPublicId = publicId.replace(/^\/+/, '');
    const deleteUrl = `${this.endpoint}/v1/admin/files/${cleanPublicId}`;

    const response = await this.fetchWithTimeout(deleteUrl, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (response.status === 404) {
      throw new NotFoundError(`Asset '${cleanPublicId}' not found`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Unauthorized to delete asset', response.status);
    }
    return response.ok;
  }

  // --- Private Helpers ---

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, customTimeoutMs?: number): Promise<Response> {
    const timeout = customTimeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new NetworkTimeoutError(`Request timed out after ${timeout}ms`);
      }
      throw new StorageError(`Network error: ${err.message}`, undefined, 'NETWORK_ERROR');
    } finally {
      clearTimeout(id);
    }
  }

  private async parseJsonResponse(response: Response): Promise<any> {
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      throw new StorageError(
        `Failed to parse server response with HTTP status ${response.status}`,
        response.status
      );
    }

    if (!response.ok) {
      const msg = data?.error?.message || `Storage request failed with status ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(msg, response.status, data);
      }
      if (response.status === 404) {
        throw new NotFoundError(msg, response.status, data);
      }
      if (response.status === 413) {
        throw new PayloadTooLargeError(msg, response.status, data);
      }
      throw new StorageError(msg, response.status, data?.error?.code, data);
    }

    return data;
  }
}

export function createStorageClient(config: StorageClientConfig = {}): StorageClient {
  return new StorageClient(config);
}

// Canonical Industry Standard Aliases
export const Storage = StorageClient;
export type Storage = StorageClient;
export const createClient = createStorageClient;

// Backward compatibility aliases
export const BucketClient = StorageClient;
export type BucketClient = StorageClient;
export const createBucketClient = createStorageClient;
export const MediaClient = StorageClient;
export type MediaClient = StorageClient;
export const createMediaClient = createStorageClient;
