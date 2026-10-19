# Contributing to DevCloudDesk SDK (`dcd-sdk`)

Thank you for your interest in contributing to the **DevCloudDesk SDK**! We welcome contributions to our multi-language client libraries, documentation, and bug fixes.

---

## 🛠️ Repository Layout

This monorepo manages SDKs across multiple languages:

```text
dcd-sdk/
├── packages/
│   └── storage-client/        # TypeScript & Node.js SDK (@dcd-sdk/storage-client)
├── python/                    # Python SDK (dcd-storage-client)
├── .github/workflows/         # CI/CD and publishing pipelines
└── package.json               # Root npm workspace
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.8 or higher (v3.11+ recommended)
- **Git**

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/devclouddesk/dcd-sdk.git
cd dcd-sdk
npm install
```

### 3. Build Packages

To compile all TypeScript packages (ESM + CommonJS + DTS definitions):

```bash
npm run build
```

### 4. Run Test Suites

Run TypeScript tests via Vitest:
```bash
npm run test
```

Run Python tests:
```bash
cd python
python -m unittest discover -s tests -p "test_*.py"
```

---

## 📝 Pull Request Guidelines

1. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feature/my-awesome-improvement
   ```
2. **Follow style guidelines**:
   - Write clean, self-documenting code with TypeScript type annotations / Python type hints.
   - Add unit tests for any new features or bug fixes.
3. **Verify tests pass locally**:
   - Ensure `npm run build` and `npm run test` pass with 0 errors.
   - Ensure Python tests pass: `python -m unittest discover -s tests -p "test_*.py"`.
4. **Submit PR**: Open a PR against `devclouddesk/dcd-sdk` with a clear explanation of what changed.

---

## 📄 License

By contributing to `dcd-sdk`, you agree that your contributions will be licensed under its **MIT License**.
