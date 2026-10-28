# Rolodink Release Notes

## [1.2.0] - 2026-02-26

## Highlights
- **E2E Encryption**: Extend AES-GCM end-to-end encryption to cover `email`, `phone`, `meetingPlace`, and `userCompanyAtTheTime` in addition to `notes`.
- **Client-side Migration**: Encrypt all existing plaintext data on-device without server involvement via Settings → Security.
- **Improved Onboarding**: New 5-step getting-started guide replacing the minimal placeholder, plus direct email/password and LinkedIn sign-in options.

## Changes
- **Security**:
  - Add `SENSITIVE_FIELDS` constant to centralise which fields are encrypted.
  - Added session-bound passphrase checks for improved security.
  - Passphrase-aware UI buttons with progress and result feedback.
- **Backend & Types**:
  - Add `email` and `phone` columns to `Connection` table in Supabase.
  - Updated Prisma schema, Zod validation schemas, and strict TypeScript checks across the codebase.
- **Authentication**:
  - Auth callback route (`/auth/callback`) fully rewritten to use `@supabase/ssr` (`createServerClient`).

## 📥 Installation

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" width="24" height="24" alt="Chrome" /> Google Chrome
1. Download `Rolodink-chrome-v1.2.0.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" width="24" height="24" alt="Edge" /> Microsoft Edge
1. Download `Rolodink-edge-v1.2.0.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode** (toggle in left sidebar or bottom).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" width="24" height="24" alt="Firefox" /> Mozilla Firefox
1. Download `Rolodink-firefox-v1.2.0.zip` from the Assets section below.
2. Open `about:debugging` in your browser.
3. Click **This Firefox** in the sidebar.
4. Click **Load Temporary Add-on...**
5. Navigate to the zip file (or unzip it and select `manifest.json`).
   *Note: This installation is temporary and will be removed when you restart Firefox.*

## 🏪 Store Links
- **Chrome Web Store**: [Download](https://chromewebstore.google.com/detail/rolodink/...) (Coming Soon)
- **Microsoft Edge Add-ons**: [Download](https://microsoftedge.microsoft.com/addons/...) (Coming Soon)
- **Firefox Add-ons**: [Download](https://addons.mozilla.org/...) (Coming Soon)

**Full Changelog**: https://github.com/thijsmat/rolodink/compare/ext-v1.1.9...ext-v1.2.0

## [1.1.9] - 2026-02-12
### Fixed
- Firefox Manifest validation error: Added mandatory `data_collection_permissions` field.
- Refined versioning for clean release cycle.

## [1.1.8] - 2026-02-12

## Highlights
- **Auth Hardening**: Implemented critical security improvements to strengthen user authentication and state management.
- **Improved Deployment**: Enhanced Vercel and Supabase environment variable integration for a more reliable onboarding flow.
- **Publishing Fix**: Corrected asset name casing and background script compatibility across all browser extension stores.

## Changes
- **Security**:
  - Increased minimum password length to 8 characters for OWASP compliance.
  - Implemented cleanup of access tokens from storage on sign-out to prevent stale session leakage.
  - Added warning logs for missing refresh tokens in OAuth redirects.
- **Quality Fixes**:
  - Removed redundant `syncConfig()` calls to improve extension stability and performance.
  - Fixed issues with Vercel-managed Supabase environment variables in the onboarding flow.
  - **Extension Store Fixes**: 
    - Fixed Firefox background script error (converted to IIFE).
    - Fixed Chrome/Edge/Firefox publishing failures caused by asset filename case mismatch.

## 📥 Installation

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" width="24" height="24" alt="Chrome" /> Google Chrome
1. Download `Rolodink-chrome-v1.1.7.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" width="24" height="24" alt="Edge" /> Microsoft Edge
1. Download `Rolodink-edge-v1.1.7.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode** (toggle in left sidebar or bottom).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" width="24" height="24" alt="Firefox" /> Mozilla Firefox
1. Download `Rolodink-firefox-v1.1.7.zip` from the Assets section below.
2. Open `about:debugging` in your browser.
3. Click **This Firefox** in the sidebar.
4. Click **Load Temporary Add-on...**
5. Navigate to the zip file (or unzip it and select `manifest.json`).
   *Note: This installation is temporary and will be removed when you restart Firefox.*

## 🏪 Store Links
- **Chrome Web Store**: [Download](https://chromewebstore.google.com/detail/rolodink/...) (Coming Soon)
- **Microsoft Edge Add-ons**: [Download](https://microsoftedge.microsoft.com/addons/...) (Coming Soon)
- **Firefox Add-ons**: [Download](https://addons.mozilla.org/...) (Coming Soon)

**Full Changelog**: https://github.com/thijsmat/rolodink/compare/ext-v1.1.6...ext-v1.1.7
