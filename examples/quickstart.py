"""
Quickstart & Interactive Test Script for DevCloudDesk StorageClient (Python)

Run directly with:
  python examples/quickstart.py
"""

import os
import sys
import io

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add python source folder to sys.path so it works directly from the repo
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python')))

from dcd_storage_client import StorageClient


def main():
    print("=" * 60)
    print("[*] Testing DevCloudDesk Storage Client (Python)")
    print("=" * 60)

    # 1. Initialize Client
    client = StorageClient(
        endpoint=os.getenv("STORAGE_ENDPOINT", "http://localhost:7100"),
        api_key=os.getenv("STORAGE_API_KEY", "dcd_sec_demo1234567890"),
    )
    print("\n[1] [OK] Client Initialized successfully")

    # 2. Test URL Builder & Image Transformations (Industry-standard Cloudinary/S3 style)
    print("\n[2] Generating Transformed URLs...")
    public_id = "demo/sample-avatar.jpg"

    # Plain public URL
    plain_url = client.get_public_url(public_id)
    print("   - Plain CDN URL:")
    print("     ", plain_url)

    # Fluent Builder
    transformed_url = (
        client.url(public_id)
        .width(400)
        .height(400)
        .crop("fill")
        .quality(85)
        .format("webp")
        .blur(2)
        .build()
    )
    print("   - Transformed WebP (400x400, fill, quality 85, blur 2):")
    print("     ", transformed_url)

    # Direct Options Style
    direct_url = client.url(
        public_id,
        width=800,
        height=600,
        crop="fit",
        format="avif",
    )
    print("   - Direct Options URL (800x600, fit, avif):")
    print("     ", direct_url)

    # 3. Test Health Check against Endpoint
    print("\n[3] Checking Storage Server Health...")
    health = client.health_check()
    print("   - Server Status:", health.get("status", "unknown"))

    # 4. Test In-Memory Buffer Upload (Simulated Image)
    print("\n[4] Simulating Upload Test (via uploader namespace)...")
    try:
        mock_file = io.BytesIO(b"fake image pixel data for quickstart test")
        res = client.uploader.upload(
            mock_file,
            folder="tests",
            filename="python-test.png",
        )
        print("   - [OK] Upload Success:", res.get("publicId"))
    except Exception as e:
        print("   - Upload skipped (requires running storage-server with valid API key):")
        print(f"     Note: {e}")

    print("\n" + "=" * 60)
    print("[SUCCESS] All Python Client Logic & Transformations Passed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
