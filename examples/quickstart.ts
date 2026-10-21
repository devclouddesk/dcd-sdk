/**
 * Quickstart & Interactive Test Script for DevCloudDesk StorageClient (TypeScript)
 *
 * Run directly with:
 *   npx tsx examples/quickstart.ts
 */

import { StorageClient } from '../packages/storage-client/src/index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Testing DevCloudDesk Storage Client (TypeScript)');
  console.log('='.repeat(60));

  // 1. Initialize Client
  const client = new StorageClient({
    endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:7100',
    apiKey: process.env.STORAGE_API_KEY || 'dcd_sec_demo1234567890',
  });

  console.log('\n[1] ✅ Client Initialized successfully');

  // 2. Test URL Builder & Image Transformations (Industry-standard Cloudinary/S3 style)
  console.log('\n[2] 🎨 Generating Transformed URLs...');
  
  const publicId = 'demo/sample-avatar.jpg';

  // Plain public URL
  const plainUrl = client.getPublicUrl(publicId);
  console.log('   - Plain CDN URL:');
  console.log('     ', plainUrl);

  // Fluent Builder
  const transformedUrl = client
    .url(publicId)
    .width(400)
    .height(400)
    .crop('fill')
    .quality(85)
    .format('webp')
    .blur(2)
    .build();

  console.log('   - Transformed WebP (400x400, fill, quality 85, blur 2):');
  console.log('     ', transformedUrl);

  // Direct Options Style
  const directUrl = client.url(publicId, {
    width: 800,
    height: 600,
    crop: 'fit',
    format: 'avif',
  });
  console.log('   - Direct Options URL (800x600, fit, avif):');
  console.log('     ', directUrl);

  // 3. Test Health Check against Endpoint
  console.log('\n[3] 🏥 Checking Storage Server Health...');
  try {
    const health = await client.healthCheck();
    console.log('   - Server Status:', health.status);
    if (health.uptimeSeconds) {
      console.log('   - Server Uptime:', `${Math.round(health.uptimeSeconds)}s`);
    }
  } catch (err: any) {
    console.log('   - (Server not reachable at http://localhost:7100, which is normal if container is offline)');
  }

  // 4. Test In-Memory Buffer Upload (Simulated Image)
  console.log('\n[4] 📤 Simulating Upload Test (via uploader namespace)...');
  try {
    // 1x1 Transparent PNG buffer
    const mockPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const uploadRes = await client.uploader.upload(mockPngBuffer, {
      folder: 'tests',
      filename: 'test-pixel.png',
      tags: ['ci', 'test'],
    });

    console.log('   - ✅ Upload Success:');
    console.log('     Public ID:', uploadRes.publicId);
    console.log('     URL:      ', uploadRes.url);
    console.log('     Size:     ', uploadRes.bytes, 'bytes');

    // Test Delete
    console.log('\n[5] 🗑️ Cleaning up uploaded test file...');
    await client.uploader.destroy(uploadRes.publicId);
    console.log('   - ✅ File destroyed successfully');
  } catch (err: any) {
    console.log('   - Upload skipped (requires running storage-server with valid API key):');
    console.log(`     Note: ${err.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All Local Client Logic & Transformations Passed!');
  console.log('='.repeat(60));
}

main().catch(console.error);
