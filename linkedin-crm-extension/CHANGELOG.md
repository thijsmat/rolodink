# Changelog

All notable changes to Rolodink Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Search and filter functionality in All Connections view
- Tags system for categorizing connections
- Export functionality (CSV/JSON)
- Dark mode support
- Keyboard shortcuts for common actions

---

## [1.0.3] - 2025-10-29

### Fixed
- **Icon loading error** in Chrome Web Store submission
  - Build process now correctly copies all icons (16px, 32px, 48px, 128px) to dist/ folder
  - All icon paths verified in production ZIP file
  - Resolves Chrome Web Store rejection: "Could not load icon 'icon.png' specified in 'action'"
  
- **Unused permission removed** from manifest
  - Removed `"scripting"` permission (was never used in codebase)
  - Content scripts run declaratively via `content_scripts` in manifest
  - Resolves Chrome Web Store rejection: "scripting permission requested but not used"
  - Extension now requests only essential permissions: `activeTab`, `storage`, `tabs`

### Added
- **Automated validation script** (`validate.js`)
  - Pre-build validation of manifest references
  - File existence checks
  - Permission usage verification
  - Prevents common submission errors
  
- **Production build system** (`build-production.js`)
  - Automated dist/ folder creation with correct structure
  - ZIP file generation for Chrome Web Store submission
  - Build verification (checks all required files present)
  - Size optimization (<150KB package)
  
- **Interactive testing script** (`test-local.sh`)
  - Step-by-step testing workflow
  - Manual test checklist
  - Color-coded pass/fail output
  - ZIP testing procedure
  
- **Comprehensive documentation** (6 new guides)
  - `BUILD_INSTRUCTIONS.md` - Complete build and submission guide
  - `README-SCREENSHOTS.md` - Screenshot specifications for store listing
  - `STORE-LISTING.md` - Chrome Web Store listing content (English + Dutch)
  - `SUBMISSION-CHECKLIST.md` - Pre-submission checklist (100+ items)
  - `SUBMISSION.md` - Step-by-step submission guide
  - `.github/RELEASE_TEMPLATE.md` - Template for future releases
  
- **Root package.json** with convenient npm scripts
  - `npm run validate` - Validate manifest and files
  - `npm run build` - Build production version
  - `npm run build:production` - Validate + build + create ZIP
  - `npm run dev` - Start UI development server

### Changed
- **manifest.json version** bumped from `1.0.2` to `1.0.3`
- **Extension permissions** reduced to minimal required set
- **Build output** optimized for Chrome Web Store compliance
- **Package structure** reorganized for better maintainability

### Developer Experience
- Added npm scripts for common development tasks
- Enhanced testing workflow with interactive checklist
- Complete Chrome Web Store submission documentation
- Pre-submission validation to catch issues early

### Submission Status
- ✅ Submitted to Chrome Web Store: October 29, 2025
- ⏳ Pending manual review (1-3 business days)
- 🎯 Expected approval: November 1-4, 2025

---

## [1.0.2] - 2025-10-XX

### Added
- Initial Chrome Web Store submission
- Core functionality: Add notes to LinkedIn profiles
- "Add to CRM" button injection on LinkedIn profiles
- Popup interface for managing notes
- All connections view
- Edit and delete functionality
- Supabase backend integration for note storage
- Offline support with local storage fallback

### Chrome Web Store
- ❌ Rejected due to icon loading and permission issues
- Issues addressed in v1.0.3

---

## [1.0.1] - 2025-10-XX

### Added
- Internal beta release
- LinkedIn profile detection
- Basic note-taking functionality
- Supabase authentication integration

### Fixed
- Profile URL normalization
- Note synchronization issues

---

## [1.0.0] - 2025-09-XX

### Added
- Initial development release
- React 18 + TypeScript UI
- Vite 5 build system
- Vanilla CSS + CSS Modules styling
- Chrome Extension Manifest V3
- Basic CRUD operations for notes
- LinkedIn content script injection
- Extension popup interface

### Security
- End-to-end encryption for notes
- Secure HTTPS communication
- GDPR-compliant data handling

---

## Release Types

- **Major version** (x.0.0): Breaking changes, major new features
- **Minor version** (1.x.0): New features, backward compatible
- **Patch version** (1.0.x): Bug fixes, security updates

---

## Categories

Changes are grouped using these categories:

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes
- **Developer Experience** - Improvements for developers
- **Submission Status** - Chrome Web Store submission updates

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [GitHub Releases](https://github.com/thijsmat/rolodink/releases)
- [Roadmap](ROADMAP.md)

---

**Note:** Versions prior to 1.0.0 were internal development releases and are not included in this changelog.

[Unreleased]: https://github.com/thijsmat/rolodink/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/thijsmat/rolodink/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/thijsmat/rolodink/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/thijsmat/rolodink/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/thijsmat/rolodink/releases/tag/v1.0.0

