# Rolodink v1.1.6

## Highlights
- **Auth Hardening**: Implemented security improvements based on an internal audit to strengthen user authentication.
- **Improved Deployment**: Enhanced Vercel/Supabase environment variable integration for a smoother onboarding experience.

## Changes
- **Security**:
  - Increased minimum password length to 8 characters for OWASP compliance.
  - Implemented cleanup of access tokens from storage on sign-out.
  - Added warning logs for missing refresh tokens in OAuth redirects.
- **Quality Fixes**:
  - Removed redundant `syncConfig()` calls to improve performance and stability.
  - Fixed issues with Vercel-managed Supabase environment variables in the onboarding flow.

## 📥 Installation

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" width="24" height="24" alt="Chrome" /> Google Chrome
1. Download `Rolodink-Chrome-v1.1.6.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" width="24" height="24" alt="Edge" /> Microsoft Edge
1. Download `Rolodink-Edge-v1.1.6.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode** (toggle in left sidebar or bottom).
5. Click **Load unpacked** and select the unzipped folder.

### <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" width="24" height="24" alt="Firefox" /> Mozilla Firefox
1. Download `Rolodink-Firefox-v1.1.6.zip` from the Assets section below.
2. Open `about:debugging` in your browser.
3. Click **This Firefox** in the sidebar.
4. Click **Load Temporary Add-on...**
5. Navigate to the zip file (or unzip it and select `manifest.json`).
   *Note: This installation is temporary and will be removed when you restart Firefox.*

## 🏪 Store Links
- **Chrome Web Store**: [Download](https://chromewebstore.google.com/detail/rolodink/...) (Coming Soon)
- **Microsoft Edge Add-ons**: [Download](https://microsoftedge.microsoft.com/addons/...) (Coming Soon)
- **Firefox Add-ons**: [Download](https://addons.mozilla.org/...) (Coming Soon)

**Full Changelog**: https://github.com/thijsmat/rolodink/compare/ext-v1.1.5...ext-v1.1.6