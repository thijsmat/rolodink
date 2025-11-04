# 🚀 Quick Release Guide - v1.0.3

## Copy-Paste Commands (All-in-One)

```bash
# Navigate to extension folder
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension

# Add release files
git add README.md RELEASE_NOTES.md CHANGELOG.md .github/RELEASE_TEMPLATE.md

# Commit
git commit -m "docs(release): prepare v1.0.3 release documentation"

# Push commits
git push origin main

# Create tag
git tag -a v1.0.3 -m "Release v1.0.3 - Chrome Web Store Resubmission"

# Push tag
git push origin v1.0.3

# Verify
git tag -l | tail -5
git show v1.0.3 --quiet
```

---

## GitHub Release Creation

### 1. Go to Releases Page
```
https://github.com/thijsmat/rolodink/releases/new?tag=v1.0.3
```

### 2. Fill Out Release Form

**Tag:** `v1.0.3` (should be pre-selected)

**Release Title:**
```
Rolodink v1.0.3 - Chrome Web Store Resubmission
```

**Description:** Copy entire content from `RELEASE_NOTES.md`

### 3. Upload Asset

**File to upload:**
```
rolodink-v1.0.3-chrome.zip
```

**Location:**
```
/home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/rolodink-v1.0.3-chrome.zip
```

### 4. Publish Settings

- ✅ Set as the latest release
- 🟡 This is a pre-release (optional - check if still pending Chrome Web Store approval)
- 📝 Generate release notes (optional)

### 5. Click "Publish release"

---

## Verification Links

After publishing:

- **All Releases:** https://github.com/thijsmat/rolodink/releases
- **v1.0.3 Release:** https://github.com/thijsmat/rolodink/releases/tag/v1.0.3
- **Tags:** https://github.com/thijsmat/rolodink/tags
- **Changelog:** https://github.com/thijsmat/rolodink/blob/main/linkedin-crm-extension/CHANGELOG.md

---

## Download Links (After Release)

Users can download via:

```bash
# Download ZIP directly
curl -LO https://github.com/thijsmat/rolodink/releases/download/v1.0.3/rolodink-v1.0.3-chrome.zip

# Or with wget
wget https://github.com/thijsmat/rolodink/releases/download/v1.0.3/rolodink-v1.0.3-chrome.zip
```

---

## What Happens Next

1. **Tag appears** on GitHub (immediately)
2. **Release is published** (immediately after you publish)
3. **Asset is downloadable** (immediately)
4. **Badges update** (README.md shields.io badges)
5. **Users can install** manually (from release ZIP)
6. **Chrome Web Store approval** (separate, 1-3 days)

---

## Troubleshooting

### If tag already exists:
```bash
# Delete local tag
git tag -d v1.0.3

# Delete remote tag
git push origin :refs/tags/v1.0.3

# Create new tag
git tag -a v1.0.3 -m "Release v1.0.3"
git push origin v1.0.3
```

### If you need to update release:
- Go to: https://github.com/thijsmat/rolodink/releases
- Click "Edit" on v1.0.3 release
- Update description or assets
- Click "Update release"

---

**Last Updated:** 2025-10-29  
**Status:** Ready to release! 🚀

