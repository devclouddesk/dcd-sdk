export class StorageError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'StorageError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends StorageError {
  constructor(message = 'Authentication failed: Invalid or missing API key', status = 401, details?: any) {
    super(message, status, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends StorageError {
  constructor(message = 'Resource not found', status = 404, details?: any) {
    super(message, status, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class PayloadTooLargeError extends StorageError {
  constructor(message = 'File payload exceeds maximum permitted size', status = 413, details?: any) {
    super(message, status, 'PAYLOAD_TOO_LARGE', details);
    this.name = 'PayloadTooLargeError';
  }
}

export class UploadError extends StorageError {
  constructor(message: string, status?: number, details?: any) {
    super(message, status, 'UPLOAD_ERROR', details);
    this.name = 'UploadError';
  }
}

export class NetworkTimeoutError extends StorageError {
  constructor(message = 'Storage request timed out', status = 408, details?: any) {
    super(message, status, 'REQUEST_TIMEOUT', details);
    this.name = 'NetworkTimeoutError';
  }
}

