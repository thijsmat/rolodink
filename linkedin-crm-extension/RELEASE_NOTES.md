# Rolodink v1.0.3 - Chrome Web Store Resubmission

**Release Date:** October 29, 2025  
**Status:** 🟡 Pending Chrome Web Store Approval  
**Type:** Bug Fix Release

---

## 🔧 Fixes

This release addresses Chrome Web Store rejection issues from the initial v1.0.2 submission:

### Issue #1: Icon Loading Error ✅ Fixed
- **Problem:** Chrome Web Store reported "Could not load icon 'icon.png' specified in 'action'"
- **Root Cause:** Build process didn't properly package icons in distribution structure
- **Solution:** Implemented automated build system that correctly copies all icons to dist/ folder
- **Verification:** All icons (16px, 32px, 48px, 128px) now present in production ZIP

### Issue #2: Unused Permission ✅ Fixed
- **Problem:** Chrome Web Store reported "scripting permission requested but not used"
- **Root Cause:** `chrome.scripting` API was never used in codebase (content scripts run declaratively)
- **Solution:** Removed `"scripting"` from permissions array in manifest.json
- **Impact:** Extension now requests only essential permissions (activeTab, storage, tabs)

---

## 📦 Installation

### ⚠️ Important: Chrome Web Store Status

This extension is **currently under review** by Chrome Web Store. Once approved, it will be available for one-click installation.

**Estimated approval:** 1-3 business days from submission (Oct 29, 2025)

### Option 1: Chrome Web Store (Recommended)

**Status:** 🟡 Pending Approval

Once approved, install from:
```
https://chrome.google.com/webstore/detail/rolodink/[extension-id]
```

**Benefits:**
- ✅ One-click installation
- ✅ Automatic updates
- ✅ Chrome security verification
- ✅ No manual setup required

---

### Option 2: Manual Sideload from GitHub (Advanced Users)

**For testing or if you can't wait for Chrome Web Store approval:**

#### Prerequisites
- Google Chrome browser (latest version)
- Developer mode enabled in Chrome

#### Installation Steps

1. **Download Release:**
   ```bash
   # Download from GitHub Releases
   wget https://github.com/thijsmat/rolodink/releases/download/v1.0.3/rolodink-v1.0.3-chrome.zip
   
   # Or use curl
   curl -LO https://github.com/thijsmat/rolodink/releases/download/v1.0.3/rolodink-v1.0.3-chrome.zip
   ```

2. **Extract ZIP:**
   ```bash
   unzip rolodink-v1.0.3-chrome.zip -d rolodink-extension
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the `rolodink-extension` folder
   - Extension should now appear in your toolbar

4. **Verify Installation:**
   - Extension icon appears in Chrome toolbar
   - Visit any LinkedIn profile: `https://linkedin.com/in/*`
   - "Add to CRM" button should appear in profile header
   - Click extension icon to open popup

#### ⚠️ Manual Installation Limitations

- ❌ No automatic updates (must manually install new versions)
- ⚠️  Chrome may show "unrecognized extension" warnings
- ⚠️  May be disabled on browser restart (requires re-enable)

**Recommendation:** Switch to Chrome Web Store version once approved for automatic updates and better user experience.

---

## 🚀 Technical Changes

### Build System Improvements

**New Scripts:**
- `validate.js` - Validates manifest references and file existence before build
- `build-production.js` - Automated production build with ZIP generation
- `package.json` - Root package file with convenient npm scripts

**Build Process:**
```bash
npm run validate          # Validate manifest and files
npm run build            # Build production version
npm run build:production # Validate + build + create ZIP
```

**Build Output:**
- `dist/` - Clean distribution folder with correct structure
- `rolodink-v1.0.3-chrome.zip` - Production-ready package (verified)

### Manifest Changes

**Version:**
```diff
- "version": "1.0.2"
+ "version": "1.0.3"
```

**Permissions:**
```diff
  "permissions": [
    "activeTab",
-   "scripting",
    "storage",
    "tabs"
  ]
```

**Impact:** Extension now complies with Chrome Web Store "minimal permissions" policy

### Documentation Improvements

**New Documentation:**
- `BUILD_INSTRUCTIONS.md` - Complete build and submission guide
- `test-local.sh` - Interactive testing script
- `README-SCREENSHOTS.md` - Screenshot guide for store listing
- `STORE-LISTING.md` - Chrome Web Store listing content
- `SUBMISSION-CHECKLIST.md` - Pre-submission checklist
- `SUBMISSION.md` - Step-by-step submission guide

**Total Documentation:** 6 new guides, ~5,000 lines

---

## 📋 Submission Status

### Chrome Web Store Review Process

**Current Status:** ⏳ Pending Manual Review

**Timeline:**
- ✅ **Submitted:** October 29, 2025
- 🔄 **Automated Checks:** Passed
- ⏳ **Manual Review:** In Progress (1-3 business days)
- 🎯 **Expected Approval:** November 1-4, 2025

**What's Being Reviewed:**
- ✅ Manifest v3 compliance
- ✅ Minimal permissions usage
- ✅ Privacy policy completeness
- ✅ Single purpose (LinkedIn note-taking)
- ✅ No policy violations
- ✅ Working functionality

**Store Listing:**
- **Name:** Rolodink - LinkedIn CRM Notes
- **Category:** Productivity
- **Description:** Add personal notes to LinkedIn profiles. Remember why every connection matters.
- **Privacy Policy:** https://rolodink.app/privacy
- **Terms of Service:** https://rolodink.app/terms

---

## 🔗 Links

### Official Resources
- **Website:** https://rolodink.app
- **Privacy Policy:** https://rolodink.app/privacy
- **Terms of Service:** https://rolodink.app/terms
- **Support:** https://rolodink.app/help

### Development
- **GitHub Repository:** https://github.com/thijsmat/rolodink
- **Issues:** https://github.com/thijsmat/rolodink/issues
- **Releases:** https://github.com/thijsmat/rolodink/releases
- **Changelog:** https://github.com/thijsmat/rolodink/blob/main/CHANGELOG.md

### Chrome Web Store
- **Store Listing:** *Pending approval - link will be added once live*
- **Review Status:** Check Developer Dashboard

---

## 📝 Changelog Since v1.0.2

### Fixed
- 🔧 Icon loading error in Chrome Web Store submission
- 🔧 Removed unused "scripting" permission from manifest
- 🔧 Build process now correctly packages all required files

### Added
- ✨ Automated validation script (validate.js)
- ✨ Production build system (build-production.js)
- ✨ Interactive testing script (test-local.sh)
- ✨ Comprehensive submission documentation (6 guides)

### Changed
- 📦 Extension package structure optimized for Chrome Web Store
- 📝 manifest.json version bumped to 1.0.3
- 📝 Updated all documentation references to v1.0.3

### Developer Experience
- 🛠️ Added npm scripts for common tasks
- 🧪 Enhanced testing workflow with interactive script
- 📖 Complete Chrome Web Store submission guide
- ✅ Pre-submission checklist with 100+ items

---

## 🎯 What's Next

### Short Term (This Week)
1. **Chrome Web Store Approval** - Waiting for review completion
2. **Public Launch** - Announce once approved
3. **User Onboarding** - Monitor first user experiences

### Medium Term (Next Month)
- 🔍 Search/filter functionality in All Connections view
- 🏷️ Tags system for categorizing connections
- 📥 Export functionality (CSV/JSON)
- 🌙 Dark mode support

### Long Term (Next Quarter)
- 🔄 Offline mode with sync
- 📱 Mobile browser support
- 🌐 Multi-language interface
- 🤝 Team features (optional)

See [ROADMAP.md](ROADMAP.md) for complete feature roadmap.

---

## 💬 Feedback & Support

### Report Issues
Found a bug? Please [open an issue](https://github.com/thijsmat/rolodink/issues/new) on GitHub.

**When reporting issues, please include:**
- Chrome version
- Extension version (v1.0.3)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### Feature Requests
Have an idea? We'd love to hear it!
- [Feature Request Template](https://github.com/thijsmat/rolodink/issues/new?template=feature_request.md)

### General Support
- Email: support@rolodink.app
- GitHub Discussions: https://github.com/thijsmat/rolodink/discussions

---

## 🙏 Acknowledgments

Thank you to everyone who tested the initial release and provided feedback that helped improve this submission!

Special thanks to the Chrome Web Store review team for their thorough feedback.

---

## 📊 Release Metadata

```json
{
  "version": "1.0.3",
  "release_date": "2025-10-29",
  "status": "pending_review",
  "chrome_store_status": "submitted",
  "package_size": "0.14 MB",
  "manifest_version": 3,
  "required_chrome_version": "88+",
  "supported_platforms": ["Chrome", "Edge", "Brave", "Chromium-based browsers"]
}
```

---

**Last Updated:** October 29, 2025  
**Release Manager:** Matthijs Goes (@thijsmat)  
**Next Version:** 1.0.4 (planned after Chrome Web Store approval)

