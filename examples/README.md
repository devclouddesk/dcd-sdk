# 🧪 DevCloudDesk SDK - Test & Example Scripts

This directory contains standalone, zero-config scripts to test and verify the **DevCloudDesk Storage Client** across TypeScript and Python.

---

## 🏃 Running Tests

### 1. TypeScript SDK Test
Tests client initialization, URL generation (both fluent builder and options object), upload simulation, and error handling.

```bash
# Run from repository root or dcd-sdk directory:
npx tsx examples/quickstart.ts
```

### 2. Python SDK Test
Tests the Python client, fluent transformation URL generation, health checks, and upload simulations.

```bash
# Run with Python:
python examples/quickstart.py
```

---

## 🌐 Testing with a Live Local Storage Server

To test live uploads and file deletions against a running storage engine:

1. Start `storage-server` (in `storage-server/`):
   ```bash
   npm run dev
   ```
2. Set environment variables and run:
   ```bash
   # Windows PowerShell:
   $env:STORAGE_ENDPOINT="http://localhost:7100"
   $env:STORAGE_API_KEY="your_api_key_here"
   npx tsx examples/quickstart.ts
   
   # Linux / macOS:
   STORAGE_ENDPOINT="http://localhost:7100" STORAGE_API_KEY="your_api_key_here" npx tsx examples/quickstart.ts
   ```
