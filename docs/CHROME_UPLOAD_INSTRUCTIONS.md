# Chrome Web Store Upload Instructions - Rolodink v1.0.3

Quick step-by-step guide for uploading Rolodink v1.0.3 to Chrome Web Store.

---

## ✅ Pre-Upload Verification

### Verify Build File

**File Location:**
```
linkedin-crm-extension/rolodink-v1.0.3-chrome.zip
```

**Expected Specifications:**
- **Size:** ~149 KB
- **Manifest Version:** 3
- **Extension Version:** 1.0.3
- **Contains:** manifest.json, content.js, icon.png, icons/, ui/dist/

**Quick Verification:**
```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension
ls -lh rolodink-v1.0.3-chrome.zip
unzip -p rolodink-v1.0.3-chrome.zip manifest.json | jq -r '.name, .version, .manifest_version'
```

**Expected Output:**
```
Rolodink
1.0.3
3
```

---

## 🚀 Upload Process

### Step 1: Access Developer Dashboard

1. **Go to Chrome Web Store Developer Dashboard:**
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. **Sign in** with your Google account
   - Use the account associated with your developer account
   - Ensure you've paid the $5 registration fee (one-time)

---

### Step 2: Navigate to Your Extension

#### If Rolodink Already Exists (Update)

1. **Find your extension:**
   - Look for "Rolodink" in the list of extensions
   - Click on the extension name to open it

2. **Go to Package tab:**
   - Click "Package" in the left sidebar
   - You'll see the current version listed

#### If First Time Upload (New Extension)

1. **Click "New Item" button** (top-right)
2. **Skip the initial upload** (we'll upload after creating item)
3. **Fill basic info:**
   - Extension name: "Rolodink"
   - Draft saved automatically

---

### Step 3: Upload New Package

1. **In the Package tab**, click **"Upload new package"** button

2. **Select ZIP file:**
   - Click "Choose file" or drag-and-drop
   - Navigate to: `linkedin-crm-extension/rolodink-v1.0.3-chrome.zip`
   - Select the file

3. **Wait for processing:**
   - Upload progress bar appears
   - Chrome automatically:
     - Parses manifest.json
     - Validates structure
     - Checks for errors
   - Usually takes 10-30 seconds

4. **Review validation results:**
   - ✅ **No errors:** Proceed to next step
   - ❌ **Errors found:** 
     - Read error messages carefully
     - Fix issues (see troubleshooting below)
     - Re-upload ZIP

---

### Step 4: Review Changes

1. **New version appears:**
   - Version 1.0.3 shows below previous version
   - Review manifest changes summary (if shown)

2. **Verify version number:**
   - Confirm version is "1.0.3" (higher than current)
   - Chrome won't accept same or lower version

3. **Check for warnings:**
   - Yellow warnings (non-blocking): Can proceed
   - Red errors (blocking): Must fix before submitting

---

### Step 5: Update Store Listing (If Needed)

1. **Navigate to "Store listing" tab** (left sidebar)

2. **Review and update:**
   - **Short description** (132 chars max)
   - **Detailed description** (see `STORE-LISTING.md`)
   - **Screenshots** (1-5 required, see `README-SCREENSHOTS.md`)
   - **Category:** Productivity
   - **Privacy policy URL:** https://rolodink.app/privacy

3. **Save draft:**
   - Click "Save draft" (bottom-right)
   - All changes auto-saved, but click to confirm

---

### Step 6: Review Privacy Practices

1. **Navigate to "Privacy practices" tab**

2. **Verify settings:**
   - ✅ Privacy policy URL: https://rolodink.app/privacy
   - ✅ Single purpose statement is clear
   - ✅ Permission justifications complete
   - ✅ Data usage declarations accurate

3. **Save if changes made**

---

### Step 7: Submit for Review

### Final Pre-Submission Checklist

- [ ] ZIP file uploaded successfully
- [ ] Version 1.0.3 showing in Package tab
- [ ] Store listing complete (description, screenshots)
- [ ] Privacy policy URL live and accessible
- [ ] All required fields completed
- [ ] No validation errors
- [ ] Draft saved

### Submit!

1. **Click "Submit for review"** button:
   - Located at top-right of page
   - Or at bottom of any tab

2. **Review confirmation dialog:**
   - Shows submission summary
   - Lists any warnings (not blockers)
   - Read carefully

3. **Confirm submission:**
   - Check box: "I confirm this submission complies with Chrome Web Store policies"
   - Click "Confirm"

4. **Success!** 🎉
   - Status changes to **"Pending review"**
   - Confirmation email sent
   - Extension enters review queue

---

## ⏰ Expected Review Timeline

- **Automated checks:** Immediate (< 1 minute)
- **Manual review:** 24-48 hours (typical)
- **Total time:** Usually within 3 business days
- **Follow-up questions:** 24-48 hours if needed

### Monitor Status

**Check Dashboard:**
- Go to: https://chrome.google.com/webstore/devconsole
- Status shown next to extension name
- Possible statuses:
  - "Pending review" → Just submitted
  - "In review" → Being reviewed
  - "Published" → ✅ Approved!
  - "Rejected" → Needs fixes (see below)

**Check Email:**
- Notifications sent to Google account email
- Read all emails carefully
- Respond promptly to questions

---

## ✅ Post-Submission Actions

### Immediate (Day 1)

- [ ] Check email for confirmation
- [ ] Note submission date/time
- [ ] Bookmark dashboard page
- [ ] Set reminder for 3 days

### While Waiting (Days 2-3)

- [ ] Monitor dashboard daily
- [ ] Check email regularly
- [ ] Prepare response templates (if questions asked)
- [ ] Plan launch announcement (if approved)

### After Approval

- [ ] ✅ Verify extension is live
- [ ] Test installation process
- [ ] Update website with Chrome Web Store URL
- [ ] Share on social media
- [ ] Monitor reviews and ratings

### If Rejected

- [ ] Read rejection reasons carefully
- [ ] Address ALL issues listed
- [ ] Fix code/listing as needed
- [ ] Resubmit with explanation of fixes
- [ ] Second review usually faster (1-2 days)

---

## 🆘 Troubleshooting

### Error: "Version must be higher than current"

**Solution:**
- Current version in store is v1.0.2 (or higher)
- You're uploading v1.0.3
- If error persists, check manifest.json version in ZIP
- Verify: `unzip -p rolodink-v1.0.3-chrome.zip manifest.json | jq .version`

### Error: "Icon not found"

**Solution:**
- Verify `icon.png` exists in ZIP root
- Verify `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` exist
- Check manifest.json icon paths are correct
- Run: `unzip -l rolodink-v1.0.3-chrome.zip | grep icon`

### Error: "Manifest invalid"

**Solution:**
- Validate JSON syntax: `jq . manifest.json`
- Check required fields present (name, version, manifest_version)
- Verify manifest_version is 3
- Run: `npm run validate` in extension directory

### Error: "Package too large"

**Solution:**
- Chrome Web Store limit: 10 MB
- Our ZIP is ~149 KB (well under limit)
- If you see this error, something is wrong
- Verify ZIP contains only runtime files (no node_modules, docs, etc.)

### Error: "Permission not justified"

**Solution:**
- Chrome may ask for permission justifications
- Go to "Privacy practices" tab
- Add clear explanations for each permission
- See `SUBMISSION.md` Step 4 for examples

### Upload Fails Completely

**Solutions:**
- Try different browser (Chrome recommended)
- Clear browser cache
- Check internet connection
- Verify ZIP file is not corrupted
- Try smaller ZIP first (test upload)

---

## 📋 Reference Documents

**Detailed Guides:**
- **Full submission process:** `linkedin-crm-extension/SUBMISSION.md`
- **Pre-submission checklist:** `linkedin-crm-extension/SUBMISSION-CHECKLIST.md`
- **Store listing content:** `linkedin-crm-extension/STORE-LISTING.md`
- **Screenshot guide:** `linkedin-crm-extension/README-SCREENSHOTS.md`

**Official Resources:**
- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Policies:** https://developer.chrome.com/docs/webstore/program-policies/
- **Support:** https://support.google.com/chrome_webstore/

---

## 🎯 Quick Reference

### File to Upload
```
linkedin-crm-extension/rolodink-v1.0.3-chrome.zip
```

### Developer Dashboard
```
https://chrome.google.com/webstore/devconsole
```

### Steps Summary
1. Login to dashboard
2. Find Rolodink extension (or create new)
3. Package tab → "Upload new package"
4. Select `rolodink-v1.0.3-chrome.zip`
5. Review validation
6. Update store listing (if needed)
7. Click "Submit for review"
8. Wait 24-48 hours for review

### Review Timeline
- **Typical:** 24-48 hours
- **Maximum:** Up to 7 business days
- **Notifications:** Via email

---

**Last Updated:** 2025-10-31  
**Extension Version:** 1.0.3  
**ZIP File:** `rolodink-v1.0.3-chrome.zip` (~149 KB)  
**Status:** Ready for upload ✅

Good luck with your submission! 🚀

