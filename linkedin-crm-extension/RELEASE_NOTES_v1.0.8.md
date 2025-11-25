# Rolodink Extension v1.0.8

## 🚀 Major Release: Cross-Browser Support & Stability

This release brings full cross-browser compatibility and resolves critical stability issues with the authentication flow.

### 🌐 Cross-Browser Support
- **Firefox Support**: Now fully compatible with Firefox (Manifest V2).
- **Edge Support**: Verified compatibility with Microsoft Edge.
- **Unified Build**: New build system generates optimized packages for Chrome, Firefox, and Edge.

### 🔐 Robust Authentication
- **Background Service Worker**: The authentication flow has been moved to a background service worker. This fixes the issue where the login process would fail if the extension popup was closed.
- **Seamless Session Sync**: The UI now automatically detects when the background worker completes authentication, providing a smooth login experience.

### 🐛 Bug Fixes
- **Infinite Reload Loop**: Fixed a critical bug in `ConnectionContext` that caused the extension to reload infinitely under certain conditions.
- **Build Output**: Resolved issues with background script compilation and output location.

## 📦 Artifacts
- `Rolodink-chrome-v1.0.8.zip`
- `Rolodink-edge-v1.0.8.zip`
- `Rolodink-firefox-v1.0.8.zip`
