# Build Instructions for Chrome Web Store Submission

## 🎯 Quick Start

```bash
# From linkedin-crm-extension/ directory
npm run build:production
```

This will:
1. ✅ Validate all files and permissions
2. 🏗️  Build the UI with Vite
3. 📦 Create dist/ folder with correct structure
4. 🗜️  Create rolodink-v1.0.3-chrome.zip
5. ✔️  Verify ZIP contents

---

## 🔍 Problems Fixed

### Problem 1: Icon Loading Error ✅ FIXED
**Error:** "Could not load icon 'icon.png' specified in 'action'"

**Root Cause:** Icon paths were correct in manifest, but build process didn't properly package them.

**Solution:**
- Build script now copies `icon.png` to dist root
- All `icons/*.png` files copied to `dist/icons/`
- ZIP structure verified automatically

### Problem 2: Unused Permission ✅ FIXED
**Error:** "De volgende rechten worden aangevraagd maar niet gebruikt: scripting"

**Root Cause:** `chrome.scripting` API was never used in code. Content scripts run declaratively and don't need this permission.

**Solution:**
- Removed `"scripting"` from permissions array in manifest.json
- Version bumped to 1.0.3
- Validation script now checks for unused permissions

---

## 📋 Available Scripts

```bash
# Validate manifest and files (no build)
npm run validate

# Full production build with validation
npm run build:production

# Build only (skip validation)
npm run build

# Start UI dev server
npm run dev

# Test instructions
npm run test:local
```

---

## 🏗️ Build Process Details

### Step 1: Validation (`validate.js`)

Checks:
- ✅ All icons exist and are valid
- ✅ Content scripts exist
- ✅ Popup HTML exists
- ⚠️  Permissions usage (warnings for popup-only APIs)
- ✅ Web accessible resources are valid

```bash
npm run validate
```

### Step 2: Production Build (`build-production.js`)

Process:
1. **Clean** - Remove old `dist/` folder
2. **Build UI** - Run `npm run build` in `ui/` folder
3. **Copy Files:**
   - `manifest.json` → `dist/manifest.json`
   - `icon.png` → `dist/icon.png`
   - `icons/` → `dist/icons/`
   - `content.js` → `dist/content.js`
   - `ui/dist/` → `dist/ui/dist/`
4. **Create ZIP** - `rolodink-v1.0.3-chrome.zip`
5. **Verify** - Check all required files are in ZIP

```bash
npm run build
```

### Step 3: Manual Testing

```bash
# 1. Load unpacked extension (dist folder)
# Open Chrome → chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select: linkedin-crm-extension/dist/

# 2. Test on LinkedIn
# Go to: https://linkedin.com/in/any-profile
# Verify "Add to CRM" button appears
# Click button → popup should open
# Test all functionality

# 3. Test ZIP (extract first)
mkdir test-zip && cd test-zip
unzip ../rolodink-v1.0.3-chrome.zip
# Load unpacked from test-zip/ folder
# Repeat tests
```

---

## 📦 ZIP Structure (Verified)

```
rolodink-v1.0.3-chrome.zip
├── manifest.json          ✅ Version 1.0.3, no "scripting" permission
├── icon.png               ✅ Extension action icon
├── icons/
│   ├── icon16.png        ✅ Toolbar icon 16x16
│   ├── icon32.png        ✅ Settings icon 32x32
│   ├── icon48.png        ✅ Extension management 48x48
│   └── icon128.png       ✅ Chrome Web Store 128x128
├── content.js            ✅ LinkedIn profile injection
└── ui/
    └── dist/
        ├── index.html    ✅ Popup HTML
        └── assets/       ✅ JS/CSS bundles
```

---

## ✅ Pre-Submission Checklist

Before uploading to Chrome Web Store:

- [x] Version bumped to 1.0.3
- [x] "scripting" permission removed from manifest.json
- [x] All icons exist and are valid
- [x] Build script creates correct ZIP structure
- [x] Validation script passes with 0 errors
- [ ] Tested unpacked extension in Chrome
- [ ] Tested extracted ZIP in Chrome
- [ ] All features work (login, add note, view notes)
- [ ] No console errors
- [ ] Privacy policy updated on website
- [ ] Terms of service updated on website

---

## 🚀 Chrome Web Store Submission

### 1. Prepare Materials

**Screenshots needed (1280×800 or 640×400):**
- Screenshot 1: LinkedIn profile with "Add to CRM" button
- Screenshot 2: Popup with login view
- Screenshot 3: Popup with note form
- Screenshot 4: All connections view
- Screenshot 5: Connection details

**Promotional images:**
- Small tile: 440×280
- Large tile: 1400×560 (optional but recommended)

**Legal:**
- Privacy policy: https://rolodink.app/privacy
- Terms of service: https://rolodink.app/terms

### 2. Upload Steps

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item" (or edit existing)
3. Upload `rolodink-v1.0.3-chrome.zip`
4. Fill in store listing:
   - **Product name:** Rolodink - LinkedIn CRM Notes
   - **Summary (132 chars):** Add personal notes to LinkedIn profiles. Remember why every connection matters.
   - **Description:** (detailed description)
   - **Category:** Productivity
   - **Language:** English
5. Upload screenshots
6. Upload promotional images
7. **Privacy practices:**
   - Data collection: User-provided content (notes)
   - Privacy policy: https://rolodink.app/privacy
8. Submit for review

### 3. Review Timeline

- **Initial review:** 1-3 business days
- **Address feedback:** Within 24 hours recommended
- **Re-review:** 1-2 business days

---

## 🐛 Troubleshooting

### "Could not load icon" Error

**Check:**
```bash
# Verify icon exists in ZIP
unzip -l rolodink-v1.0.3-chrome.zip | grep icon.png

# Should show:
# icon.png
# icons/icon16.png
# icons/icon32.png
# icons/icon48.png
# icons/icon128.png
```

**Fix:** Re-run `npm run build:production`

### "Unused permission" Error

**Check manifest.json:**
```bash
cat manifest.json | grep -A 10 '"permissions"'
```

**Should NOT include:** `"scripting"`

**Should include:**
- `"activeTab"`
- `"storage"`
- `"tabs"`

### Build Fails

**UI build fails:**
```bash
cd ui
npm install
npm run build
cd ..
npm run build
```

**ZIP creation fails:**
```bash
# Install zip utility (if not available)
# Ubuntu/Debian:
sudo apt-get install zip

# macOS:
brew install zip
```

### Validation Fails

```bash
npm run validate

# Fix any errors shown
# Re-run until all checks pass
```

---

## 📊 File Checklist

From `linkedin-crm-extension/` directory:

```bash
# Required files in root:
✅ manifest.json
✅ icon.png
✅ icons/icon16.png
✅ icons/icon32.png
✅ icons/icon48.png
✅ icons/icon128.png
✅ content.js

# Required after build:
✅ ui/dist/index.html
✅ ui/dist/assets/*.js
✅ ui/dist/assets/*.css

# Build artifacts:
✅ dist/ (build output)
✅ rolodink-v1.0.3-chrome.zip
```

---

## 🎯 Success Criteria

Extension is ready for submission when:

1. ✅ `npm run validate` shows 0 errors
2. ✅ `npm run build:production` completes successfully
3. ✅ ZIP file size < 10MB
4. ✅ Loads in Chrome without errors
5. ✅ All features work on LinkedIn
6. ✅ No console errors or warnings
7. ✅ Privacy policy and ToS are live

---

## 📞 Support

If you encounter issues:

1. Check this document first
2. Run `npm run validate` for detailed errors
3. Check Chrome DevTools console for runtime errors
4. Review ROADMAP.md for known issues

---

**Last Updated:** 2025-10-29  
**Build Scripts Version:** 1.0  
**Extension Version:** 1.0.3

