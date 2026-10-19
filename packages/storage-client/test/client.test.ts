import { describe, it, expect } from 'vitest';
import { createBucketClient, TransformationBuilder } from '../src/index.js';

describe('TransformationBuilder & BucketClient', () => {
  it('generates accurate query URLs for image transformations', () => {
    const builder = new TransformationBuilder('http://localhost:7100', 'avatars/user.jpg');
    const url = builder
      .resize({ width: 400, height: 400, crop: 'cover' })
      .format('webp')
      .quality(80)
      .build();

    expect(url).toBe('http://localhost:7100/v1/image/w_400,h_400,c_cover,f_webp,q_80/avatars/user.jpg');
  });

  it('correctly handles trailing slashes in endpoint', () => {
    const client = createBucketClient({
      endpoint: 'http://localhost:7100///',
      apiKey: 'sk_live_test_123',
    });

    const url = client.url('banners/hero.png').format('avif').build();
    expect(url).toBe('http://localhost:7100/v1/image/f_avif/banners/hero.png');
  });

  it('throws error when endpoint is missing', () => {
    expect(() => createBucketClient({ endpoint: '' } as any)).toThrowError(
      'StorageClient: endpoint is required'
    );
  });
});
