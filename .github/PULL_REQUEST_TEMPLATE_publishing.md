# Publishing Automation for v1.0.3

## 🎯 Overview

This PR adds automated publishing workflows for Rolodink to Chrome Web Store, Firefox AMO, and Edge Add-ons, eliminating manual upload processes.

## ✅ Changes

### Publishing Workflows
- ✅ Added `.github/workflows/publish-chrome.yml` - Chrome Web Store automation
- ✅ Added `.github/workflows/publish-firefox.yml` - Firefox AMO automation  
- ✅ Added `.github/workflows/publish-edge.yml` - Edge Add-ons automation
- ✅ Added `.web-ext-config.js` for Firefox web-ext configuration

### Documentation
- ✅ Created `docs/GITHUB_ACTIONS_SETUP.md` - Complete setup guide
- ✅ Added `linkedin-crm-extension/AMO-submission.md` - Firefox submission guide
- ✅ Added `linkedin-crm-extension/edge-submission.md` - Edge submission guide

### Release Scripts
- ✅ Added `RELEASE-NOTES-v1.0.3.md` - Release notes
- ✅ Added `scripts/create-github-release-v1.0.3.sh` - Release automation
- ✅ Added `scripts/prepare-firefox-source.sh` - Firefox build prep

## 📊 Statistics

- **15 files changed**: 999 insertions(+), 69 deletions(-)
- **New workflows**: 3 (Chrome, Firefox, Edge)
- **New documentation**: 3 guides

## 🚀 How It Works

### Trigger
All workflows are triggered by git tags matching pattern: `ext-v*` (e.g., `ext-v1.0.3`)

### Chrome Workflow
1. Builds extension
2. Signs with Chrome Web Store API
3. Uploads to Chrome Web Store
4. Publishes to production

### Firefox Workflow
1. Prepares Firefox source
2. Signs with `web-ext sign`
3. Uploads to Firefox AMO
4. Waits for review (3-7 days)

### Edge Workflow
1. Builds extension
2. Signs with Edge Add-ons API
3. Uploads to Edge Add-ons
4. Publishes

## 🔐 Required Secrets

All secrets must be configured in GitHub Settings → Secrets → Actions:

### Chrome
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_EXTENSION_ID`

### Firefox
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

### Edge
- Currently manual (workflow is placeholder)

## ⚠️ Before Merge

1. **GitHub Secrets**:
   - [ ] Verify all required secrets are set in GitHub
   - [ ] Test secrets with manual workflow run
   - [ ] See `docs/GITHUB_ACTIONS_SETUP.md` for setup

2. **Documentation Review**:
   - [ ] Review submission guides are accurate
   - [ ] Verify store URLs are correct
   - [ ] Check version numbers match

3. **Testing**:
   - [ ] Test workflow syntax (validate YAML)
   - [ ] Verify build scripts work
   - [ ] Check extension ID matches actual extension

## 📚 Documentation

- GitHub Actions Setup: `docs/GITHUB_ACTIONS_SETUP.md`
- Firefox Submission: `linkedin-crm-extension/AMO-submission.md`
- Edge Submission: `linkedin-crm-extension/edge-submission.md`

## 🔗 Related

- Related: Security Hardening PR
- Part of: v1.0.3 release automation

## 📝 Notes

- Edge automation is placeholder (better API tooling needed)
- Firefox review can take 3-7 days
- Chrome review typically 24-48 hours
- All workflows require proper secrets configuration

