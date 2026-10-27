import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBucketClient,
  createStorageClient,
  BucketClient,
  StorageClient,
  Storage,
  createClient,
  TransformationBuilder,
  AuthenticationError,
  NotFoundError,
  PayloadTooLargeError,
  StorageError,
  NetworkTimeoutError,
} from '../src/index.js';

describe('TransformationBuilder', () => {
  it('generates accurate URLs for image transformations', () => {
    const builder = new TransformationBuilder('http://localhost:7100', 'avatars/user.jpg');
    const url = builder
      .resize({ width: 400, height: 400, crop: 'fill' })
      .format('webp')
      .quality(80)
      .blur(4)
      .grayscale()
      .sharpen()
      .build();

    expect(url).toBe(
      'http://localhost:7100/image/upload/w_400,h_400,c_fill,f_webp,q_80,e_blur_4,e_gray,e_sharp/avatars/user.webp'
    );
  });

  it('returns original endpoint URL when no transformations are applied', () => {
    const builder = new TransformationBuilder('http://localhost:7100', 'docs/invoice.pdf');
    expect(builder.toParamsString()).toBe('original');
    expect(builder.build()).toBe('http://localhost:7100/image/upload/docs/invoice.pdf');
    expect(builder.toString()).toBe('http://localhost:7100/image/upload/docs/invoice.pdf');
    expect(builder.toURL().pathname).toBe('/image/upload/docs/invoice.pdf');
  });

  it('handles leading and trailing slashes in endpoint and publicId', () => {
    const builder = new TransformationBuilder('http://localhost:7100///', '///photos/pic.jpg');
    const url = builder.format('avif').build();
    expect(url).toBe('http://localhost:7100/image/upload/f_avif/photos/pic.avif');
  });

  it('supports initialOptions directly in constructor', () => {
    const builder = new TransformationBuilder('http://localhost:7100', 'photos/pic.jpg', {
      width: 200,
      height: 200,
      format: 'webp',
    });
    expect(builder.build()).toBe('http://localhost:7100/image/upload/w_200,h_200,f_webp/photos/pic.webp');
  });
});

describe('StorageClient', () => {
  const origEndpoint = process.env.DCD_STORAGE_ENDPOINT;
  const origKey = process.env.DCD_STORAGE_API_KEY;

  beforeEach(() => {
    delete process.env.DCD_STORAGE_ENDPOINT;
    delete process.env.DCD_STORAGE_API_KEY;
  });

  afterEach(() => {
    if (origEndpoint) process.env.DCD_STORAGE_ENDPOINT = origEndpoint;
    if (origKey) process.env.DCD_STORAGE_API_KEY = origKey;
  });

  it('instantiates via factory and class constructor and aliases', () => {
    const client1 = createStorageClient({ endpoint: 'http://localhost:7100' });
    const client2 = new StorageClient({ endpoint: 'http://localhost:7100' });
    const client3 = new Storage({ endpoint: 'http://localhost:7100' });
    const client4 = createClient({ endpoint: 'http://localhost:7100' });
    const client5 = createBucketClient({ endpoint: 'http://localhost:7100' });

    expect(client1).toBeInstanceOf(StorageClient);
    expect(client2).toBeInstanceOf(StorageClient);
    expect(client3).toBeInstanceOf(StorageClient);
    expect(client4).toBeInstanceOf(StorageClient);
    expect(client5).toBeInstanceOf(StorageClient);
  });

  it('auto-detects endpoint and apiKey from process.env when not passed', () => {
    process.env.DCD_STORAGE_ENDPOINT = 'http://localhost:7100';
    process.env.DCD_STORAGE_API_KEY = 'dcd_env_test_key_123';

    const client = new StorageClient();
    expect(client).toBeInstanceOf(StorageClient);
    expect(client.getPublicUrl('avatars/me.jpg')).toBe('http://localhost:7100/image/upload/avatars/me.jpg');
  });

  it('throws error when endpoint is missing in config and env', () => {
    expect(() => new StorageClient({ endpoint: '' })).toThrowError(/endpoint is required/);
  });

  it('provides getPublicUrl for instant direct URLs', () => {
    const client = new StorageClient({ endpoint: 'http://localhost:7100' });
    expect(client.getPublicUrl('avatars/me.jpg')).toBe('http://localhost:7100/image/upload/avatars/me.jpg');
    expect(client.getPublicUrl('/docs/invoice.pdf')).toBe('http://localhost:7100/image/upload/docs/invoice.pdf');
  });

  it('supports direct options in url() method', () => {
    const client = new StorageClient({ endpoint: 'http://localhost:7100' });
    const url = client.url('avatars/me.jpg', { width: 300, height: 300, crop: 'cover', format: 'webp' });
    expect(url).toBe('http://localhost:7100/image/upload/w_300,h_300,c_cover,f_webp/avatars/me.webp');
  });

  it('exposes Cloudinary-compatible namespaces uploader and api', () => {
    const client = new StorageClient({ endpoint: 'http://localhost:7100' });
    expect(typeof client.uploader.upload).toBe('function');
    expect(typeof client.uploader.destroy).toBe('function');
    expect(typeof client.api.resource).toBe('function');
    expect(typeof client.api.resources).toBe('function');
    expect(typeof client.api.update).toBe('function');
    expect(typeof client.api.usage).toBe('function');
  });

  it('throws AuthenticationError when createSignedUploadToken is called without apiKey', async () => {
    const client = new StorageClient({ endpoint: 'http://localhost:7100' });
    await expect(client.createSignedUploadToken()).rejects.toThrow(AuthenticationError);
  });

  it('throws AuthenticationError when getSignedUrl is called without apiKey', async () => {
    const client = new StorageClient({ endpoint: 'http://localhost:7100' });
    await expect(client.getSignedUrl('invoices/inv-001.pdf')).rejects.toThrow(AuthenticationError);
  });

  it('exports structured error hierarchy properly', () => {
    const authErr = new AuthenticationError('Unauthorized access', 401);
    expect(authErr).toBeInstanceOf(StorageError);
    expect(authErr.name).toBe('AuthenticationError');
    expect(authErr.status).toBe(401);

    const notFound = new NotFoundError('Asset not found');
    expect(notFound).toBeInstanceOf(StorageError);
    expect(notFound.status).toBe(404);

    const tooLarge = new PayloadTooLargeError('File too large');
    expect(tooLarge).toBeInstanceOf(StorageError);
    expect(tooLarge.status).toBe(413);

    const timeout = new NetworkTimeoutError('Timeout');
    expect(timeout).toBeInstanceOf(StorageError);
    expect(timeout.status).toBe(408);
  });
});
