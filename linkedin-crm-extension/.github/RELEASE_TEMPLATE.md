# Rolodink v[VERSION] - [RELEASE_TITLE]

**Release Date:** [YYYY-MM-DD]  
**Status:** [🟢 Stable / 🟡 Beta / 🔴 Alpha]  
**Type:** [Feature Release / Bug Fix / Security Update]

---

## 🎯 Overview

[Brief summary of this release - what's the main focus? Why should users care?]

---

## ✨ New Features

[List new features added in this release]

### [Feature Name]
- **Description:** [What does this feature do?]
- **Why:** [Why is this valuable for users?]
- **Usage:** [How do users access/use this feature?]

**Example:**
```
[Code example or screenshot if applicable]
```

---

## 🔧 Bug Fixes

[List bugs fixed in this release]

### Fixed: [Bug Description]
- **Issue:** [What was broken?]
- **Impact:** [Who was affected?]
- **Solution:** [How was it fixed?]
- **Affects:** [Which users/scenarios?]

---

## 🚀 Improvements

[List improvements and enhancements]

### [Improvement Name]
- **Before:** [Old behavior]
- **After:** [New behavior]
- **Benefit:** [How this improves user experience]

---

## ⚠️ Breaking Changes

[List breaking changes - if none, state "No breaking changes in this release"]

### [Breaking Change Description]
- **What Changed:** [Detailed description]
- **Who's Affected:** [Which users need to take action]
- **Migration Guide:** [Steps to update]
- **Deadline:** [When old behavior will be removed, if applicable]

---

## 🔒 Security Updates

[List security fixes - if none, remove this section]

### [Security Issue]
- **Severity:** [Critical / High / Medium / Low]
- **Description:** [What was the vulnerability?]
- **Fix:** [How was it addressed?]
- **CVE:** [CVE number if applicable]

---

## 📦 Installation

### Option 1: Chrome Web Store (Recommended)

```
https://chrome.google.com/webstore/detail/rolodink/[extension-id]
```

**Automatic update:** Extension will update automatically within 24-48 hours.

---

### Option 2: Manual Install from GitHub

```bash
# Download latest release
curl -LO https://github.com/thijsmat/rolodink/releases/download/v[VERSION]/rolodink-v[VERSION]-chrome.zip

# Extract
unzip rolodink-v[VERSION]-chrome.zip -d rolodink-extension

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select rolodink-extension folder
```

---

## ⬆️ Upgrade Guide

### From v[PREVIOUS_VERSION] to v[VERSION]

**Automatic Upgrade (Chrome Web Store):**
- No action required
- Updates automatically within 24-48 hours
- Your data and settings are preserved

**Manual Upgrade:**
1. Remove old version from `chrome://extensions/`
2. Download and install new version (see Installation above)
3. Your data is synced via Supabase (no data loss)

**Migration Notes:**
[Any special migration steps users need to follow]

---

## 📝 Full Changelog

### Added
- [New feature or capability]
- [New feature or capability]

### Changed
- [Modified behavior or UI]
- [Modified behavior or UI]

### Deprecated
- [Features marked for removal in future]
- [Timeline for removal]

### Removed
- [Features removed in this version]
- [Why they were removed]

### Fixed
- [Bug fix description]
- [Bug fix description]

### Security
- [Security improvement]
- [Vulnerability fixed]

---

## 🧪 Technical Changes

### Dependencies
```diff
  "@supabase/supabase-js": "^2.74.0"
  "react": "^18.3.1"
+ "new-package": "^1.0.0"
- "old-package": "^0.5.0"
```

### API Changes
[Document any API or integration changes]

### Build System
[Changes to build process, if any]

### Performance
[Performance improvements with metrics]

---

## 🔗 Links

### Documentation
- [Changelog](https://github.com/thijsmat/rolodink/blob/main/CHANGELOG.md)
- [Build Instructions](BUILD_INSTRUCTIONS.md)
- [Roadmap](ROADMAP.md)

### Resources
- **Website:** https://rolodink.app
- **Support:** support@rolodink.app
- **Privacy Policy:** https://rolodink.app/privacy

### Development
- **GitHub:** https://github.com/thijsmat/rolodink
- **Issues:** https://github.com/thijsmat/rolodink/issues
- **Releases:** https://github.com/thijsmat/rolodink/releases

---

## 🐛 Known Issues

[List any known issues in this release]

### [Issue Description]
- **Impact:** [Who/what is affected]
- **Workaround:** [Temporary solution if available]
- **Status:** [Being investigated / Fix in progress / Planned for next release]
- **Tracking:** [Link to GitHub issue]

---

## 🎯 What's Next

### Coming in v[NEXT_VERSION]
- [Planned feature]
- [Planned improvement]
- [Planned fix]

**Timeline:** [Expected release date or timeframe]

See [ROADMAP.md](ROADMAP.md) for long-term plans.

---

## 💬 Feedback

### We Want to Hear From You!

**Love this release?** ⭐ Star the repo and leave a review on Chrome Web Store!

**Found a bug?** [Report it here](https://github.com/thijsmat/rolodink/issues/new)

**Have a feature idea?** [Submit it here](https://github.com/thijsmat/rolodink/issues/new)

**General feedback:** support@rolodink.app

---

## 🙏 Acknowledgments

[Thank contributors, testers, or anyone who helped with this release]

Special thanks to:
- [Contributor name] for [contribution]
- [Tester name] for finding [critical bug]
- All users who provided feedback on v[PREVIOUS_VERSION]

---

## 📊 Release Metadata

```json
{
  "version": "[VERSION]",
  "release_date": "[YYYY-MM-DD]",
  "status": "[stable|beta|alpha]",
  "package_size": "[X.XX MB]",
  "manifest_version": 3,
  "required_chrome_version": "88+",
  "breaking_changes": [true|false],
  "security_updates": [true|false]
}
```

---

## 📋 Release Checklist

Before publishing this release, ensure:

- [ ] Version bumped in manifest.json
- [ ] CHANGELOG.md updated
- [ ] All tests passing
- [ ] Build succeeds without warnings
- [ ] Chrome Web Store screenshots updated (if UI changed)
- [ ] Documentation updated
- [ ] Migration guide written (if breaking changes)
- [ ] Known issues documented
- [ ] Release notes reviewed
- [ ] Git tag created: `git tag -a v[VERSION] -m "Release v[VERSION]"`
- [ ] ZIP file uploaded to GitHub release
- [ ] Chrome Web Store updated (if already published)

---

**Last Updated:** [YYYY-MM-DD]  
**Release Manager:** [Your Name] ([@username](https://github.com/username))  
**Previous Version:** [PREVIOUS_VERSION]  
**Next Version:** [NEXT_VERSION] (planned)

