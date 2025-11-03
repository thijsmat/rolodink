# Rolodink v1.0.3 — First Official Multi‑Browser Release (Chrome • Edge • Firefox)

Release date: 2025-10-30

---

## ✨ Highlights
- ✅ Multi‑browser support: Chrome (MV3), Edge (MV3), Firefox (MV2)
- ✅ Firefox AMO compliance: browser_action + data collection disclosure
- ✅ Lean builds: ~149 KB each, no source maps or dev artifacts

---

## 🔧 What’s New in v1.0.3
- Fixed Chrome Web Store review issues (icons, permissions).
- Removed unused `scripting` permission; kept minimal set: `activeTab`, `storage`, `tabs`.
- Added automated build and verification scripts for cross‑browser artifacts.
- Introduced Firefox‑specific disclosure under `browser_specific_settings.data_collection_permissions`.

---

## 📦 Download Assets (GitHub Releases)
- `rolodink-v1.0.3-chrome.zip` (Chrome, MV3)
- `Rolodink-Edge-v1.0.3.zip` (Edge, MV3)
- `Rolodink-Firefox-1.0.3.zip` (Firefox, MV2)

Visit the Releases page: https://github.com/thijsmat/rolodink/releases/tag/v1.0.3

---

## 🚀 Installation

### Chrome (Recommended)
1) Open `chrome://extensions` → Enable Developer mode
2) Click “Load unpacked” → Select extracted `rolodink-v1.0.3-chrome` folder
3) Pin the extension from the toolbar

### Edge
1) Open `edge://extensions` → Enable Developer mode
2) Click “Load unpacked” → Select extracted `Rolodink-Edge-v1.0.3` folder

### Firefox (Temporary / Testing)
1) Open `about:debugging#/runtime/this-firefox`
2) Click “Load Temporary Add-on…” → choose `manifest.json` from the extracted `Rolodink-Firefox-1.0.3` folder

---

## 🛍️ Store Links (will be updated when published)
- Chrome Web Store: (pending) — https://chrome.google.com/webstore/detail/rolodink/[extension-id]
- Edge Add‑ons: (pending) — https://microsoftedge.microsoft.com/addons/detail/[listing-id]
- Firefox AMO: (pending) — https://addons.mozilla.org/firefox/addon/rolodink/

---

## 🔒 Permissions
- Runtime: `activeTab`, `storage`, `tabs`
- Hosts: `https://www.linkedin.com/*`, `https://api.rolodink.app/*`

Firefox (AMO) adds:
- `browser_specific_settings.data_collection_permissions` with purpose: "Store LinkedIn profile information in user's personal CRM database".

---

## 🧪 Build Integrity
- Verified via `scripts/verify-artifacts.sh`
- All artifacts ≈149 KB
- No source maps, TypeScript sources, `node_modules`, or config files inside packaging

---

## ℹ️ Notes
- This is the first official multi‑browser release. When store approvals complete, we’ll update the links above and the website.
- For issues or feedback: https://github.com/thijsmat/rolodink/issues

**Built with ❤️ for LinkedIn professionals**
