# Microsoft Edge Add-ons Upload Instructions - Rolodink v1.0.3

Step-by-step guide for uploading Rolodink v1.0.3 to Microsoft Edge Add-ons.

---

## ✅ Pre-Upload Verification

### Verify Build File

**File Location:**
```
Rolodink-Edge-v1.0.3.zip
```

**Expected Specifications:**
- **Size:** ~149 KB
- **Manifest Version:** 3 (Edge uses MV3 like Chrome)
- **Extension Version:** 1.0.3
- **Contains:** manifest.json, content.js, icon.png, icons/, ui/dist/

**Quick Verification:**
```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM
ls -lh Rolodink-Edge-v1.0.3.zip
unzip -p Rolodink-Edge-v1.0.3.zip manifest.json | jq -r '.name, .version, .manifest_version'
```

**Expected Output:**
```
Rolodink
1.0.3
3
```

**Note:** Edge supports Manifest V3, so the Chrome build works for Edge. Both use the same ZIP structure.

---

## 🚀 Upload Process

### Step 1: Access Microsoft Partner Center

1. **Go to Microsoft Partner Center:**
   ```
   https://partner.microsoft.com/en-us/dashboard/microsoftedge/
   ```

2. **Sign in** with your Microsoft account
   - Use the account associated with your developer account
   - Ensure you have access to Edge Add-ons program

3. **Navigate to Edge Add-ons:**
   - If not already in Edge Add-ons section, click "Edge Add-ons" from the dashboard
   - You should see your extensions (or empty list if first time)

---

### Step 2: Create New Extension (First Time) or Select Existing

#### If Rolodink Already Exists (Update)

1. **Find your extension:**
   - Look for "Rolodink" in the list of extensions
   - Click on the extension name to open it

2. **Go to Packages/Versions tab:**
   - Click on the package/version management section
   - You'll see current version listed

#### If First Time Upload (New Extension)

1. **Click "Create new extension"** or **"Add new item"** button
   - Usually located at top-right or top of the extensions list

2. **Fill basic information:**
   - Extension name: "Rolodink"
   - Publisher: Your publisher name
   - Save draft

---

### Step 3: Upload Package

1. **In the package/version section**, click **"Upload package"** or **"Add new version"** button

2. **Select ZIP file:**
   - Click "Choose file" or drag-and-drop
   - Navigate to: `Rolodink-Edge-v1.0.3.zip`
   - Select the file

3. **Wait for processing:**
   - Upload progress indicator appears
   - Microsoft automatically:
     - Parses manifest.json
     - Validates structure
     - Checks for errors
   - Usually takes 15-30 seconds

4. **Review validation results:**
   - ✅ **No errors:** Proceed to next step
   - ❌ **Errors found:** 
     - Read error messages carefully
     - Fix issues (see troubleshooting below)
     - Re-upload ZIP

---

### Step 4: Review Package Details

1. **Version information:**
   - Version 1.0.3 should appear
   - Review manifest details shown
   - Confirm version is higher than current (if updating)

2. **Check for warnings:**
   - Yellow warnings (non-blocking): Can proceed
   - Red errors (blocking): Must fix before submitting

3. **Package details:**
   - Verify extension ID
   - Confirm all required files present
   - Review permission requirements

---

### Step 5: Complete Store Listing

1. **Navigate to "Store listing"** or **"Metadata"** tab

2. **Fill required fields:**

   **English (EN) - Primary Language:**
   - **Title:** Rolodink — LinkedIn Notes CRM
   - **Short description:** Add private notes to LinkedIn profiles. Your modern Rolodex.
   - **Long description:** 
     ```
     Add and view private notes directly on LinkedIn profile pages.
     Keep context, remember follow-ups, and streamline your networking.
     Privacy-first with minimal permissions; your data remains yours.
     ```
   - **Category:** Productivity or Business
   - **Privacy policy URL:** https://rolodink.app/privacy

   **Dutch (NL) - Secondary Language (Optional):**
   - **Titel:** Rolodink — LinkedIn Notities CRM
   - **Korte beschrijving:** Voeg privé-notities toe aan LinkedIn-profielen. Je moderne rolodex.
   - **Lange beschrijving:**
     ```
     Voeg en bekijk privé-notities op LinkedIn-profielen.
     Bewaar context en onthoud acties/afspraken.
     Privacy-eerst met minimale permissies; jouw data blijft van jou.
     ```

3. **Upload screenshots:**
   - **Recommended size:** 1366×768 pixels
   - **Minimum:** 1 screenshot required
   - **Recommended:** 3-5 screenshots
   - Screenshots should show:
     1. LinkedIn profile with "Add to CRM" button
     2. Popup UI (login or main view)
     3. Add note form
     4. All connections list
     5. Connection detail view
   - Add captions/descriptions for each screenshot

4. **Store logo:**
   - **Size:** 300×300 PNG
   - Upload extension logo/icon

5. **Promotional images (Optional):**
   - Small promotional tile
   - Large promotional banner
   - Similar to Chrome Web Store requirements

6. **Support and contact:**
   - **Support URL:** https://rolodink.app/help
   - **Official website:** https://rolodink.app

7. **Save draft:**
   - Click "Save" or "Save draft"
   - Changes may auto-save, but click to confirm

---

### Step 6: Privacy

Partner Center → **Privacy**. The answers below match version 1.3.8: `manifest.json` requests `activeTab`, `storage`
and `identity`, plus the hosts `*.linkedin.com` and `api.rolodink.app`. Each text field takes at most 1,000 characters.
The Chrome Web Store's **Privacy practices** tab asks the same questions; give the same answers there, so the stores
match each other and `data_collection_permissions` in `manifest-firefox.json`.

1. **Single purpose description**
   ```text
   Rolodink adds private notes to LinkedIn profiles, so you remember where you met someone and what you talked about. On a LinkedIn profile page it shows an "Add to Rldnk" button and a note card; the toolbar popup lets you search the people you saved. Notes are encrypted before they are stored and are visible only to you.
   ```

2. **Permission justification**
   - **activeTab justification**
     ```text
     When the user opens the Rolodink popup, it reads the URL of the active tab to check whether it is a LinkedIn profile. On a profile, the popup shows the saved note for that person; on any other page it shows the user's list of saved connections. The popup can also open a saved connection's LinkedIn profile in the current tab. This permission is not used to read or change page content.
     ```
   - **storage justification**
     ```text
     storage.local keeps the user's sign-in session, their settings (for example whether the note card is shown on LinkedIn) and a cache of their saved connections, which stays encrypted, so the popup opens instantly. storage.session holds the key that decrypts the user's notes; it is cleared when the browser closes or the user signs out.
     ```
   - **identity justification**
     ```text
     Used for "Sign in with LinkedIn". chrome.identity.launchWebAuthFlow opens LinkedIn's sign-in page through our authentication provider (Supabase) and returns the result to the extension via its identity redirect URL. No other identity API is used, and the extension does not read the account the browser is signed in with.
     ```
   - **Host permission justification**
     ```text
     linkedin.com: the content script adds the "Add to Rldnk" button and the note card to LinkedIn profile pages, and reads the name and web address of the profile the user is viewing, so the note is linked to the right person. api.rolodink.app: Rolodink's own backend. It stores and returns the user's saved connections and encrypted notes, and provides the user's encryption key after sign-in. No other hosts are requested.
     ```

3. **Are you using remote code?** No, I am not using remote code. All code ships in the package, and Manifest V3
   does not allow remote code.

4. **Data usage.** Check exactly these four, the same four that `manifest-firefox.json` declares:
   - **Personally identifiable information:** the account's name and email address, and the names, email addresses
     and phone numbers the user saves with a contact.
   - **Authentication information:** sign-in with email and password, or with LinkedIn.
   - **Web history:** on every LinkedIn profile visit, the profile's web address goes to the API to check whether that
     person is already saved.
   - **Website content:** the name on the LinkedIn profile is read from the page and saved with the contact.

   Leave **Health information**, **Financial and payment information**, **Personal communications**, **Location**
   and **User activity** unchecked.

5. **Privacy policy URL:** https://rolodink.app/en/privacy. `https://rolodink.app/privacy` works too, but redirects to
   the visitor's language first.

6. **I certify that the following disclosures are true:** check all three. The privacy policy already says that user
   data is not sold or shared, and is used only for the extension itself.

7. **Save & Continue**

---

### Step 7: Distribution Settings

1. **Navigate to "Distribution" or "Publishing" tab**

2. **Visibility:**
   - Select **"Public"** (recommended)
   - Makes extension searchable in Edge Add-ons store
   - Alternative: "Unlisted" (only via direct link)

3. **Regions:**
   - Select **"All regions"** (recommended)
   - Or select specific countries
   - Maximum audience reach

4. **Pricing:**
   - Select **"Free"**
   - No in-app purchases or subscriptions

5. **Age restrictions:**
   - Usually "None" or "13+" for productivity tools
   - Check Microsoft requirements for your category

---

### Step 8: Final Review

1. **Preview listing:**
   - Use preview feature if available
   - Review how extension appears in store
   - Check all text, images, and links

2. **Review checklist:**
   - [ ] Package uploaded successfully
   - [ ] Version 1.0.3 showing
   - [ ] Store listing complete (description, screenshots)
   - [ ] Privacy policy URL live and accessible
   - [ ] All required fields completed
   - [ ] No validation errors
   - [ ] Screenshots uploaded
   - [ ] Support URL provided
   - [ ] Distribution settings configured

3. **Make any final edits:**
   - Fix typos or errors
   - Update screenshots if needed
   - Refine descriptions
   - Save after each change

---

### Step 9: Submit for Review

1. **Click "Submit for review"** or **"Publish"** button:
   - Usually located at top-right or bottom of page
   - May require confirming all sections are complete

2. **Review confirmation dialog:**
   - Shows submission summary
   - Lists any warnings
   - Read carefully

3. **Confirm submission:**
   - Accept terms and conditions
   - Check compliance with Edge Add-ons policies
   - Click "Confirm" or "Submit"

4. **Success!** 🎉
   - Status changes to **"Under review"** or **"Pending review"**
   - Confirmation message appears
   - Extension enters review queue

---

## ⏰ Expected Review Timeline

- **Automated checks:** Immediate (< 1 minute)
- **Manual review:** 3-5 business days (typical)
- **Total time:** Usually within 5-7 business days
- **Follow-up questions:** 24-48 hours if needed

### Review Process

**Stages:**
1. **Automated validation** (immediate):
   - Manifest validation
   - Security scan
   - Policy compliance check

2. **Manual review** (3-5 days):
   - Human reviewer tests functionality
   - Verifies policy compliance
   - Reviews privacy practices
   - Checks store listing accuracy

**Possible Outcomes:**
- ✅ **Approved:** Published automatically
- ⚠️  **Pending:** Additional info requested
- ❌ **Rejected:** Issues to fix

### Monitor Status

**Check Dashboard:**
- Go to: https://partner.microsoft.com/en-us/dashboard/microsoftedge/
- Status shown next to extension name
- Possible statuses:
  - "Under review" → Just submitted
  - "In review" → Being reviewed
  - "Published" → ✅ Approved!
  - "Rejected" → Needs fixes

**Check Email:**
- Notifications sent to Microsoft account email
- Read all emails carefully
- Respond promptly to questions

---

## ✅ Post-Submission Actions

### Immediate (Day 1)

- [ ] Check email for confirmation
- [ ] Note submission date/time
- [ ] Bookmark dashboard page
- [ ] Set reminder for 5 days

### While Waiting (Days 2-5)

- [ ] Monitor dashboard daily
- [ ] Check email regularly
- [ ] Prepare response templates (if questions asked)
- [ ] Plan launch announcement (if approved)

### After Approval

- [ ] ✅ Verify extension is live in Edge Add-ons store
- [ ] Test installation process
- [ ] Update website with Edge Add-ons URL
- [ ] Share on social media
- [ ] Monitor reviews and ratings
- [ ] Add Edge store URL to GitHub release notes

### If Rejected

- [ ] Read rejection reasons carefully
- [ ] Address ALL issues listed
- [ ] Fix code/listing as needed
- [ ] Resubmit with explanation of fixes
- [ ] Second review usually faster (2-3 days)

---

## 🆘 Troubleshooting

### Error: "Version must be higher than current"

**Solution:**
- Current version in store is v1.0.2 (or higher)
- You're uploading v1.0.3
- If error persists, check manifest.json version in ZIP
- Verify: `unzip -p Rolodink-Edge-v1.0.3.zip manifest.json | jq .version`

### Error: "Manifest invalid"

**Solution:**
- Validate JSON syntax: `jq . manifest.json`
- Check required fields present (name, version, manifest_version)
- Verify manifest_version is 3 (Edge uses MV3)
- Run: `npm run validate` in extension directory (if script exists)

### Error: "Icon not found"

**Solution:**
- Verify `icon.png` exists in ZIP root
- Verify `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` exist
- Check manifest.json icon paths are correct
- Run: `unzip -l Rolodink-Edge-v1.0.3.zip | grep icon`

### Error: "Package too large"

**Solution:**
- Edge Add-ons limit: Usually 10 MB (verify current limit)
- Our ZIP is ~149 KB (well under limit)
- If you see this error, something is wrong
- Verify ZIP contains only runtime files (no node_modules, docs, etc.)

### Error: "Permission not justified"

**Solution:**
- Fill in every justification on the **Privacy** page with the texts from Step 6
- All three permissions (`activeTab`, `storage`, `identity`) and both hosts are in use. The extension no longer
  requests `tabs`, so it needs no justification

### Upload Fails Completely

**Solutions:**
- Try different browser (Edge recommended)
- Clear browser cache
- Check internet connection
- Verify ZIP file is not corrupted
- Try smaller ZIP first (test upload)
- Check file size is under limit

### "Extension already exists" Error

**Solution:**
- You're trying to create new but extension already exists
- Instead, find existing extension and upload new version
- Go to extensions list and click on Rolodink
- Upload new version in versions/packages section

### Store Listing Won't Save

**Solutions:**
- Fill all required fields (marked with *)
- Check field character limits
- Verify URLs are valid and accessible
- Try different browser
- Clear cache and cookies
- Contact Microsoft Partner Center support

---

## 📋 Reference Documents

**Detailed Guides:**
- **Edge submission overview:** `linkedin-crm-extension/edge-submission.md`
- **Store listing content:** `linkedin-crm-extension/STORE-LISTING.md`
- **Screenshot guide:** `linkedin-crm-extension/README-SCREENSHOTS.md`
- **Chrome upload (similar process):** `docs/CHROME_UPLOAD_INSTRUCTIONS.md`

**Official Resources:**
- **Partner Center Dashboard:** https://partner.microsoft.com/en-us/dashboard/microsoftedge/
- **Edge Add-ons Developer Docs:** https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/
- **Edge Add-ons Policies:** Check Partner Center for current policies
- **Support:** Contact via Partner Center dashboard

---

## 🎯 Quick Reference

### File to Upload
```
Rolodink-Edge-v1.0.3.zip
```

### Developer Dashboard
```
https://partner.microsoft.com/en-us/dashboard/microsoftedge/
```

### Steps Summary
1. Login to Partner Center dashboard
2. Find Rolodink extension (or create new)
3. Upload package: `Rolodink-Edge-v1.0.3.zip`
4. Complete store listing (EN + NL)
5. Upload screenshots (1366×768 recommended)
6. Configure privacy and permissions
7. Set distribution settings
8. Click "Submit for review"
9. Wait 3-5 days for review

### Review Timeline
- **Typical:** 3-5 business days
- **Maximum:** Up to 7 business days
- **Notifications:** Via email

### Key Differences from Chrome
- Uses Microsoft Partner Center (not Chrome Web Store console)
- Review time slightly longer (3-5 days vs 24-48 hours)
- Requires Microsoft account (not Google)
- Similar MV3 manifest structure (can reuse Chrome build)

---

## 💡 Tips for Success

### Before Submission
1. ✅ Test extension thoroughly in Edge browser
2. ✅ Prepare high-quality screenshots (1366×768)
3. ✅ Have privacy policy live and accessible
4. ✅ Review all text for typos
5. ✅ Test all URLs in store listing

### During Review
1. 📧 Check email daily
2. 🕐 Be patient (3-5 days is normal)
3. 📱 Respond quickly to questions
4. 🔄 Be ready to resubmit if needed

### After Approval
1. 🎉 Celebrate! (you earned it)
2. 📢 Market your extension
3. 👂 Listen to user feedback
4. 🔧 Iterate and improve
5. 📊 Monitor metrics

---

**Last Updated:** 2025-10-31  
**Extension Version:** 1.0.3  
**ZIP File:** `Rolodink-Edge-v1.0.3.zip` (~149 KB)  
**Status:** Ready for upload ✅

Good luck with your submission! 🚀

