import { describe, it, expect } from 'vitest';
import {
  createBucketClient,
  createStorageClient,
  BucketClient,
  StorageClient,
  TransformationBuilder,
  AuthenticationError,
  NotFoundError,
  PayloadTooLargeError,
  DCDStorageError,
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
      'http://localhost:7100/v1/image/w_400,h_400,c_fill,f_webp,q_80,e_blur_4,e_gray,e_sharp/avatars/user.jpg'
    );
  });

  it('returns original endpoint URL when no transformations are applied', () => {
    const builder = new TransformationBuilder('http://localhost:7100', 'docs/invoice.pdf');
    expect(builder.toParamsString()).toBe('original');
    expect(builder.build()).toBe('http://localhost:7100/v1/image/docs/invoice.pdf');
    expect(builder.toString()).toBe('http://localhost:7100/v1/image/docs/invoice.pdf');
  });

  it('handles leading and trailing slashes in endpoint and publicId', () => {
    const builder = new TransformationBuilder('http://localhost:7100///', '///photos/pic.jpg');
    const url = builder.format('avif').build();
    expect(url).toBe('http://localhost:7100/v1/image/f_avif/photos/pic.jpg');
  });
});

describe('StorageClient / BucketClient', () => {
  it('instantiates via factory and class constructor', () => {
    const client1 = createBucketClient({ endpoint: 'http://localhost:7100' });
    const client2 = new BucketClient({ endpoint: 'http://localhost:7100' });
    const client3 = createStorageClient({ endpoint: 'http://localhost:7100' });
    const client4 = new StorageClient({ endpoint: 'http://localhost:7100' });

    expect(client1).toBeInstanceOf(StorageClient);
    expect(client2).toBeInstanceOf(StorageClient);
    expect(client3).toBeInstanceOf(StorageClient);
    expect(client4).toBeInstanceOf(StorageClient);
  });

  it('throws error when endpoint is missing', () => {
    expect(() => createBucketClient({ endpoint: '' } as any)).toThrowError(
      'StorageClient: endpoint is required'
    );
  });

  it('throws AuthenticationError when createSignedUploadToken is called without apiKey', async () => {
    const client = createBucketClient({ endpoint: 'http://localhost:7100' });
    await expect(client.createSignedUploadToken()).rejects.toThrow(AuthenticationError);
  });

  it('exports structured error hierarchy properly', () => {
    const authErr = new AuthenticationError('Unauthorized access', 401);
    expect(authErr).toBeInstanceOf(DCDStorageError);
    expect(authErr.name).toBe('AuthenticationError');
    expect(authErr.status).toBe(401);

    const notFound = new NotFoundError('Asset not found');
    expect(notFound).toBeInstanceOf(DCDStorageError);
    expect(notFound.status).toBe(404);

    const tooLarge = new PayloadTooLargeError('File too large');
    expect(tooLarge).toBeInstanceOf(DCDStorageError);
    expect(tooLarge.status).toBe(413);
  });
});
