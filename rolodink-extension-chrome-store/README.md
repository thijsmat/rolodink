# Rolodink - Chrome Web Store Package

**Version**: 1.0.0  
**Build Date**: $(date)  
**Package Size**: ~138 KB

## Contents

This package contains the production-ready Rolodink browser extension for Chrome Web Store submission.

### Files Included:
- `manifest.json` - Extension manifest (v3)
- `content.js` - Content script for LinkedIn integration
- `icon.png` - Extension icon (48x48px)
- `ui/dist/` - Built popup UI (React + Vite build)

## Features

- ✅ LinkedIn profile integration
- ✅ CRM functionality with notes
- ✅ Modern React UI
- ✅ Privacy-first design
- ✅ Manifest V3 compliant
- ✅ Production optimized

## Installation Instructions

1. **For Chrome Web Store**: Upload the `Rolodink-Chrome-Web-Store-v1.0.0.zip` file
2. **For Testing**: Load the `rolodink-extension-chrome-store/` folder as unpacked extension

## Build Process

1. UI built with `npm run build` in `/ui` directory
2. Production assets copied to clean directory
3. ZIP package created excluding development files

## Chrome Web Store Submission

- **Package**: `Rolodink-Chrome-Web-Store-v1.0.0.zip`
- **Category**: Productivity
- **Permissions**: activeTab, scripting, storage, tabs
- **Host Permissions**: linkedin.com, backend API
- **Privacy**: No data collection, local storage only

## Support

- **Website**: https://rolodink.app
- **GitHub**: https://github.com/thijsmat/rolodink
- **Contact**: hello@rolodink.app
