# 📦 v8 Update Package - Installation Guide

## Quick Install

### 1. Extract RAR
```bash
unrar x catalog-manager-v8.rar
cd catalog-manager-v8-package
```

### 2. Copy Files to Your Project
```bash
# Copy documentation
cp -r docs/* /path/to/your/catalog-manager/

# Copy source files
cp src/shared/constants.json /path/to/your/catalog-manager/src/shared/
cp src/main/db/schema.js /path/to/your/catalog-manager/src/main/db/
cp src/main/db/kasetStoresRepository.js /path/to/your/catalog-manager/src/main/db/
cp src/renderer/pages/FaqPage.jsx /path/to/your/catalog-manager/src/renderer/pages/
cp src/renderer/pages/KasetStoresPage.jsx /path/to/your/catalog-manager/src/renderer/pages/
cp src/renderer/styles/global.css /path/to/your/catalog-manager/src/renderer/styles/
```

### 3. Validate Installation
```bash
bash validate-v8.sh /path/to/your/catalog-manager
```

### 4. Build & Test
```bash
cd /path/to/your/catalog-manager
npm install
npx vite build
npm start
```

## Documentation Guide

- **START HERE:** docs/README.md
- **Integration:** docs/PANDUAN_INTEGRASI.md
- **Testing:** docs/TESTING_CHECKLIST.md
- **Deployment:** docs/DEPLOYMENT_CHECKLIST.md
- **Troubleshooting:** docs/FAQ_TROUBLESHOOTING.md

## File Structure

```
catalog-manager-v8-package/
├── docs/                     (13 documentation files)
├── src/
│   ├── shared/
│   │   └── constants.json
│   ├── main/db/
│   │   ├── schema.js
│   │   └── kasetStoresRepository.js
│   └── renderer/
│       ├── pages/
│       │   ├── FaqPage.jsx
│       │   └── KasetStoresPage.jsx
│       └── styles/
│           └── global.css
├── validate-v8.sh
└── INSTALL.md (this file)
```

## Support

Questions? Check: docs/FAQ_TROUBLESHOOTING.md

Status: ✅ Production Ready
