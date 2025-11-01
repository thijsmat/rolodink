# GitHub Actions Setup for Extension Publishing

Complete guide for setting up automated publishing to Chrome Web Store, Firefox Add-ons (AMO), and Edge Add-ons.

---

## 📋 Overview

This repository uses GitHub Actions to automatically publish browser extensions when you create a release tag:

- **Firefox**: Fully automated (signs and uploads to AMO)
- **Chrome**: Fully automated (uploads to Chrome Web Store)
- **Edge**: Manual upload (workflow logs instructions)

---

## 🔐 Required Secrets

You need to configure the following secrets in GitHub:

### Firefox Add-ons (AMO)

1. **`FIREFOX_JWT_ISSUER`**
   - Your AMO JWT Issuer (e.g., `user:12345678:999`)
   - Get from: https://addons.mozilla.org/developers/addon/api/key/

2. **`FIREFOX_JWT_SECRET`**
   - Your AMO JWT Secret (long hex string)
   - **⚠️ Important**: Only shown once when created!
   - Get from: https://addons.mozilla.org/developers/addon/api/key/

### Chrome Web Store

1. **`CHROME_CLIENT_ID`**
   - OAuth 2.0 Client ID from Google Cloud Console
   - See: [Chrome Web Store API setup](#chrome-api-setup)

2. **`CHROME_CLIENT_SECRET`**
   - OAuth 2.0 Client Secret from Google Cloud Console

3. **`CHROME_REFRESH_TOKEN`**
   - OAuth 2.0 Refresh Token (generated via OAuth flow)

4. **`CHROME_EXTENSION_ID`**
   - Your extension's ID from Chrome Web Store (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
   - Found in Chrome Web Store developer dashboard URL

### Edge Add-ons

Currently no secrets needed (manual upload). Future automation may require:
- `EDGE_CLIENT_ID`
- `EDGE_CLIENT_SECRET`

---

## 🔧 How to Add Secrets to GitHub

### Step-by-Step:

1. **Go to your repository on GitHub**

2. **Navigate to Settings:**
   - Click "Settings" tab (top navigation)
   - Or go to: `https://github.com/username/repo/settings`

3. **Go to Secrets:**
   - In left sidebar, click "Secrets and variables"
   - Click "Actions"

4. **Add each secret:**
   - Click "New repository secret"
   - Enter secret name (e.g., `FIREFOX_JWT_ISSUER`)
   - Paste secret value
   - Click "Add secret"

5. **Verify secrets:**
   - All secrets listed under "Repository secrets"
   - Secrets are encrypted and only shown when editing

### Security Best Practices:

- ✅ Never commit secrets to repository
- ✅ Use repository secrets (not environment secrets) for simplicity
- ✅ Rotate secrets periodically
- ✅ Limit access to secrets (use branch protection)
- ✅ Review who has access to repository

---

## 🚀 How to Trigger a Release

### Creating and Pushing a Tag

Releases are triggered by pushing a tag with the format `ext-v*`:

```bash
# Extract version from your release (e.g., 1.0.3)
VERSION="1.0.3"

# Create tag
git tag -a "ext-v${VERSION}" -m "Release Rolodink extension v${VERSION}"

# Push tag (this triggers workflows)
git push origin "ext-v${VERSION}"
```

### Tag Format

- **Required format:** `ext-vX.Y.Z` (e.g., `ext-v1.0.3`)
- **Why `ext-v` prefix?** Distinguishes extension releases from website releases
- **Version extraction:** Workflows extract version by removing `ext-v` prefix

### Example Release Flow

```bash
# 1. Ensure you're on main branch and up to date
git checkout main
git pull origin main

# 2. Ensure all changes are committed
git status

# 3. Build extension locally (optional, to verify)
cd linkedin-crm-extension
npm run build:production
cd ..

# 4. Create tag for version 1.0.4
git tag -a ext-v1.0.4 -m "Release Rolodink v1.0.4 - Bug fixes and improvements"

# 5. Push tag to trigger workflows
git push origin ext-v1.0.4

# 6. Monitor workflows at:
# https://github.com/username/repo/actions
```

---

## 📊 Expected Behavior for Each Workflow

### Firefox Workflow (`publish-firefox.yml`)

**Trigger:** Tag `ext-v*` pushed

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 18
3. ✅ Install dependencies (`npm install`)
4. ✅ Prepare Firefox source (`scripts/prepare-firefox-source.sh`)
5. ✅ Sign extension with `web-ext sign`
6. ✅ Upload to AMO (Firefox Add-ons)
7. ✅ Upload signed XPI as artifact

**Output:**
- Extension submitted to AMO
- Signed XPI available in workflow artifacts
- Status: "Pending review" in AMO dashboard

**Review Time:** 3-7 days (AMO manual review)

**Monitor:**
- Workflow status: https://github.com/username/repo/actions
- AMO dashboard: https://addons.mozilla.org/en-US/developers/

---

### Chrome Workflow (`publish-chrome.yml`)

**Trigger:** Tag `ext-v*` pushed

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 18
3. ✅ Extract version from tag
4. ✅ Check if Chrome ZIP exists
5. ✅ Build Chrome extension (if ZIP doesn't exist)
6. ✅ Verify ZIP file exists
7. ✅ Publish to Chrome Web Store using `mobilefirstllc/cws-publish`
8. ✅ Upload ZIP as artifact

**Output:**
- Extension submitted to Chrome Web Store
- ZIP file available in workflow artifacts
- Status: "Pending review" in Chrome Web Store dashboard

**Review Time:** 24-48 hours (typical)

**Monitor:**
- Workflow status: https://github.com/username/repo/actions
- Chrome dashboard: https://chrome.google.com/webstore/devconsole

**ZIP File Location:**
- Expected: `linkedin-crm-extension/rolodink-vX.Y.Z-chrome.zip`
- If missing, workflow builds it automatically

---

### Edge Workflow (`publish-edge.yml`)

**Trigger:** Tag `ext-v*` pushed

**Steps:**
1. ✅ Checkout code
2. ✅ Extract version from tag
3. ✅ Check for Edge ZIP file
4. ✅ Log instructions for manual upload
5. ✅ Upload ZIP as artifact (if exists)

**Output:**
- Instructions logged in workflow
- ZIP file available in workflow artifacts (if exists)
- **Note:** Requires manual upload to Microsoft Partner Center

**Next Steps:**
1. Download ZIP from workflow artifacts
2. Follow: https://partner.microsoft.com/en-us/dashboard/microsoftedge/
3. Upload manually (see `docs/EDGE_UPLOAD_INSTRUCTIONS.md`)

**Review Time:** 3-5 days (manual review)

**Future:** Automated publishing when API becomes available

---

## 📈 Monitoring Release Progress

### During Workflow Execution

1. **GitHub Actions Tab:**
   ```
   https://github.com/username/repo/actions
   ```
   - See all workflow runs
   - Click on specific run for details
   - View logs for each step

2. **Workflow Run Page:**
   - Real-time logs
   - Artifact downloads
   - Step-by-step progress
   - Error messages (if any)

### After Workflow Completion

1. **Check Workflow Status:**
   - Green checkmark = Success ✅
   - Red X = Failed ❌
   - Yellow circle = In progress ⏳

2. **Download Artifacts:**
   - Click workflow run
   - Scroll to "Artifacts" section
   - Download signed XPI (Firefox) or ZIP (Chrome/Edge)

3. **Verify Store Submissions:**
   - **Firefox:** https://addons.mozilla.org/en-US/developers/
   - **Chrome:** https://chrome.google.com/webstore/devconsole
   - **Edge:** https://partner.microsoft.com/en-us/dashboard/microsoftedge/

### Notification Options

**GitHub Notifications:**
- Configure in GitHub Settings → Notifications
- Receive emails when workflows fail
- Get status updates via email

**GitHub App:**
- Install GitHub mobile app
- Get push notifications for workflow status

---

## 🔍 Troubleshooting

### Workflow Fails: "Secret not found"

**Solution:**
- Verify secret name matches exactly (case-sensitive)
- Check secret exists in repository settings
- Ensure workflow has access to secrets

### Firefox: "401 Unauthorized"

**Solution:**
- Verify `FIREFOX_JWT_ISSUER` and `FIREFOX_JWT_SECRET` are correct
- Check credentials at: https://addons.mozilla.org/developers/addon/api/key/
- Ensure credentials haven't expired

### Chrome: "Invalid refresh token"

**Solution:**
- Refresh token may have expired
- Regenerate OAuth credentials
- Update `CHROME_REFRESH_TOKEN` secret
- See: [Chrome API setup](#chrome-api-setup)

### Chrome: "Extension ID not found"

**Solution:**
- Verify `CHROME_EXTENSION_ID` is correct
- Find ID in Chrome Web Store dashboard URL
- Ensure extension exists in your account

### Chrome: "ZIP file not found"

**Solution:**
- Verify ZIP file exists at expected path
- Check naming convention matches: `rolodink-vX.Y.Z-chrome.zip`
- Workflow will try to build if ZIP missing (check build logs)

### Edge: "Manual upload required"

**Solution:**
- This is expected behavior
- Edge workflow logs instructions
- Follow `docs/EDGE_UPLOAD_INSTRUCTIONS.md`

### Workflow: "Tag format invalid"

**Solution:**
- Ensure tag format: `ext-vX.Y.Z` (e.g., `ext-v1.0.3`)
- Don't use `v1.0.3` (missing `ext-` prefix)
- Check tag name: `git tag -l`

---

## 🔧 Chrome API Setup (Detailed)

### Step 1: Create OAuth 2.0 Credentials

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Create/Select Project:**
   - Create new project or select existing
   - Note project ID

3. **Enable Chrome Web Store API:**
   - Go to "APIs & Services" → "Library"
   - Search "Chrome Web Store API"
   - Click "Enable"

4. **Create OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type
   - Fill required fields
   - Add scopes: `https://www.googleapis.com/auth/chromewebstore`

5. **Create Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Chrome Web Store Publishing"
   - Authorized redirect URIs: Not needed for service account
   - Save **Client ID** and **Client Secret**

### Step 2: Generate Refresh Token

Use Google OAuth 2.0 Playground (recommended method):

**Google OAuth 2.0 Playground:**

1. Go to: https://developers.google.com/oauthplayground/
2. Click gear icon (top-right) → "Use your own OAuth credentials"
3. Enter Client ID and Client Secret
4. In left panel, find "Chrome Web Store API v1"
5. Select: `https://www.googleapis.com/auth/chromewebstore`
6. Click "Authorize APIs"
7. Allow access
8. Click "Exchange authorization code for tokens"
9. Copy **Refresh Token**

### Step 3: Get Extension ID

1. **Upload extension once manually** (or if already uploaded)
2. **Check Chrome Web Store dashboard URL:**
   ```
   https://chrome.google.com/webstore/devconsole/.../abcdefghijklmnopqrstuvwxyz123456/...
   ```
   The long string is your Extension ID

### Step 4: Add Secrets to GitHub

Add all four secrets:
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_EXTENSION_ID`

---

## 📚 Related Documentation

- **Firefox Publishing:** `linkedin-crm-extension/AMO-submission.md`
- **Edge Upload:** `linkedin-crm-extension/edge-submission.md`
- **Build Instructions:** `linkedin-crm-extension/BUILD_INSTRUCTIONS.md`
- **Release Notes:** `linkedin-crm-extension/RELEASE_NOTES.md`

---

## ✅ Quick Checklist

Before your first automated release:

- [ ] All GitHub secrets configured
- [ ] Firefox credentials verified (test with `web-ext sign` locally)
- [ ] Chrome credentials verified (test upload manually first)
- [ ] Extension builds successfully locally
- [ ] Tag format understood (`ext-vX.Y.Z`)
- [ ] Workflows visible in Actions tab

---

**Last Updated:** 2025-10-31  
**Workflow Files:**
- `.github/workflows/publish-firefox.yml`
- `.github/workflows/publish-chrome.yml`
- `.github/workflows/publish-edge.yml`

**Status:** ✅ Ready for automated releases

