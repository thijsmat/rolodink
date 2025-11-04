# 📸 Screenshots Guide - Chrome Web Store

Complete guide voor het maken van Chrome Web Store screenshots voor Rolodink v1.0.3.

---

## 📋 Screenshot Requirements

### Technical Specifications

| Requirement | Specification |
|------------|---------------|
| **Size Option 1** | 1280 × 800 pixels |
| **Size Option 2** | 640 × 400 pixels |
| **Format** | PNG or JPEG |
| **Max File Size** | 1MB per screenshot |
| **Number Required** | Minimum 1, Maximum 5 |
| **Recommended** | 5 screenshots (shows full feature set) |

### Chrome Web Store Display

- Screenshots appear in store listing
- First screenshot is most important (shown prominently)
- Users swipe through screenshots before installing
- Good screenshots can increase install rate by 30%+

---

## 🎯 Required Screenshots (5 Total)

### Screenshot 1: LinkedIn Profile with Button ⭐ **MOST IMPORTANT**

**Purpose:** Show waar de extensie verschijnt en wat het doet

**Setup:**
1. Go to any LinkedIn profile (e.g., https://linkedin.com/in/test-profile)
2. Ensure "Add to CRM" button is visible in profile header
3. Make sure profile looks professional (real person, complete profile)

**Frame:**
- LinkedIn profile header (top of page)
- "Add to CRM" button clearly visible
- Profile photo, name, title visible for context

**Screenshot Tips:**
- Use a real, complete LinkedIn profile (not test account)
- Clear, high-resolution
- Good contrast (button stands out)

**Suggested Caption:**
> "Add personal notes to any LinkedIn profile with one click"

---

### Screenshot 2: Login View

**Purpose:** Show first-time user experience

**Setup:**
1. Log out of extension (if logged in)
2. Click Rolodink icon in Chrome toolbar
3. Popup opens with login view

**Frame:**
- Entire popup (380px wide)
- Login form visible
- Extension branding/logo visible
- Clean, professional UI

**Suggested Caption:**
> "Secure login with your Rolodink account"

---

### Screenshot 3: Add/Edit Note Form

**Purpose:** Show core functionality - adding notes

**Setup:**
1. Be on a LinkedIn profile
2. Click "Add to CRM" button
3. Popup opens with note form

**Frame:**
- Popup with note form
- Profile info (name, URL) pre-filled
- Note textarea with example text like:
  > "Met tijdens networking event in Amsterdam. Geïnteresseerd in AI recruitment. Follow-up: stuur artikel over ChatGPT."
- Save button visible

**Suggested Caption:**
> "Add detailed notes about every connection"

---

### Screenshot 4: All Connections View

**Purpose:** Show organization and overview features

**Setup:**
1. Have at least 3-5 test connections saved
2. Open popup
3. Navigate to "All Connections" view

**Frame:**
- List of connections
- Each connection showing:
  - Name
  - Company/role
  - Note preview
- Search/filter bar (if applicable)

**Suggested Caption:**
> "View and manage all your LinkedIn connections in one place"

---

### Screenshot 5: Connection Detail View

**Purpose:** Show individual connection management

**Setup:**
1. From All Connections, click on a connection
2. Show detail view with full note

**Frame:**
- Connection details (name, LinkedIn URL, profile pic if shown)
- Full note visible with multiple lines
- Edit/Delete buttons visible
- Back button to return to list

**Suggested Caption:**
> "Edit, update, and manage notes for each connection"

---

## 🛠️ How to Take Screenshots

### Method 1: Chrome Built-in Screenshot Tool (Recommended)

1. **Open DevTools:**
   - Press `F12` or `Cmd+Option+I` (Mac)

2. **Open Device Toolbar:**
   - Click phone/tablet icon or press `Cmd+Shift+M` (Mac)

3. **Set Dimensions:**
   - Choose "Responsive" mode
   - Set width to **1280px** or **640px**
   - Set height to **800px** or **400px**

4. **Take Screenshot:**
   - Click the three-dot menu (⋮) in Device Toolbar
   - Select "Capture screenshot"
   - Saves to Downloads folder

### Method 2: macOS Screenshot Tool

```bash
# Press Cmd+Shift+5 to open screenshot tool
# Select "Capture Selected Window" or "Capture Selected Portion"
# Click on popup or drag to select area
# Screenshot saved to Desktop
```

### Method 3: Linux Screenshot Tool

```bash
# GNOME Screenshot
gnome-screenshot -i

# Or use Spectacle (KDE)
spectacle -r

# Or use GIMP for precise cropping
gimp
```

### Method 4: Third-party Tools

- **Awesome Screenshot** (Chrome Extension) - Add text, arrows, blur
- **Lightshot** - Quick annotations
- **Snagit** - Professional editing (paid)

---

## ✂️ Resize Screenshots

### If Screenshots are Wrong Size:

#### Using ImageMagick (Command Line)

```bash
# Install ImageMagick (if not installed)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Resize to 1280×800
convert screenshot.png -resize 1280x800 screenshot-resized.png

# Resize all screenshots in folder
for file in *.png; do
    convert "$file" -resize 1280x800 "${file%.png}-resized.png"
done
```

#### Using GIMP (Free, Cross-platform)

1. Open screenshot in GIMP
2. Go to **Image → Scale Image**
3. Set Width to **1280** or **640**
4. Set Height to **800** or **400**
5. Click **Scale**
6. Export as PNG: **File → Export As**

#### Using Online Tools

- **iloveimg.com/resize-image** - Free, no signup
- **resizeimage.net** - Simple interface
- **photopea.com** - Online Photoshop alternative

---

## 🎨 Screenshot Best Practices

### Content Guidelines

✅ **DO:**
- Use real, professional-looking data
- Show clean, working UI
- Include realistic notes (no Lorem Ipsum)
- Use Nederlandse + Engelse text (shows internationaal)
- Ensure no personal data visible (GDPR)
- High resolution, crisp text

❌ **DON'T:**
- Show debug data or test accounts
- Include console errors
- Use profanity or inappropriate content
- Show other people's private info
- Include browser bookmarks bar
- Show other extensions that might compete

### Visual Polish

**Lighting & Contrast:**
- Light mode recommended (better contrast)
- Avoid dark theme (harder to read thumbnails)

**Focus:**
- Highlight the feature being shown
- Use arrows/annotations if needed (but keep minimal)

**Consistency:**
- Same LinkedIn profile across screenshots 1-3
- Same test data in screenshots 4-5
- Uniform UI state (all logged in, same theme)

---

## 📁 Screenshot Naming Convention

Save screenshots with clear names:

```
rolodink-screenshot-1-linkedin-button.png
rolodink-screenshot-2-login-view.png
rolodink-screenshot-3-add-note-form.png
rolodink-screenshot-4-all-connections.png
rolodink-screenshot-5-connection-detail.png
```

---

## ✅ Screenshot Checklist

Before uploading to Chrome Web Store:

### Technical Quality
- [ ] All screenshots are 1280×800 or 640×400 pixels
- [ ] All screenshots are PNG or JPEG format
- [ ] All screenshots are under 1MB each
- [ ] Screenshots are crisp and high-resolution
- [ ] No pixelation or blur

### Content Quality
- [ ] Screenshot 1 shows LinkedIn profile with "Add to CRM" button
- [ ] Screenshot 2 shows login view
- [ ] Screenshot 3 shows add/edit note form with realistic data
- [ ] Screenshot 4 shows all connections list
- [ ] Screenshot 5 shows connection detail view
- [ ] All screenshots show clean, working UI
- [ ] No console errors visible
- [ ] No personal/private data visible

### Branding & Consistency
- [ ] All screenshots use same test profile/data
- [ ] UI looks consistent across screenshots
- [ ] Extension branding visible where appropriate
- [ ] Professional appearance throughout

### Legal & Policy
- [ ] No inappropriate content
- [ ] No third-party logos (except LinkedIn, which is allowed in context)
- [ ] GDPR compliant (no real user data)
- [ ] Chrome Web Store policy compliant

---

## 🚀 Upload to Chrome Web Store

Once screenshots are ready:

1. **Go to Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole

2. **Edit Store Listing**
   - Click on Rolodink extension
   - Go to "Store listing" tab

3. **Upload Screenshots**
   - Scroll to "Screenshots" section
   - Click "Upload screenshot"
   - Upload in order (1-5)
   - Add captions for each

4. **Preview**
   - Click "Preview" to see how it looks in store
   - Check on desktop and mobile view

5. **Save Draft**
   - Save before submitting
   - Review everything one more time

---

## 💡 Pro Tips

### Increase Install Rates

**First Screenshot is Key:**
- Shows the extension in action on LinkedIn
- Clear value proposition visible
- Professional, polished appearance

**Tell a Story:**
- Screenshot 1: Problem (remembering connections)
- Screenshot 2: Solution (login to Rolodink)
- Screenshot 3: Action (add notes)
- Screenshot 4-5: Result (organized connections)

**Add Annotations (Optional):**
- Use arrows to highlight key features
- Add short text labels (keep minimal)
- Circle important buttons
- But don't overdo it - keep clean

### Tools for Annotations

```bash
# Annotate screenshots (if needed)
# macOS: Preview app (Tools → Annotate)
# Windows: Paint 3D or Snip & Sketch
# Linux: GIMP, Krita, or Pinta
# Online: Photopea.com
```

---

## 📞 Need Help?

**Screenshot Issues:**
- Wrong size? Use ImageMagick or GIMP to resize
- Blurry? Take screenshot again at correct resolution
- Too large file size? Use PNG optimizer or convert to JPEG

**Can't find feature to screenshot:**
- Run `./test-local.sh` to verify everything works
- Check BUILD_INSTRUCTIONS.md for setup steps

**Content Questions:**
- See STORE-LISTING.md for approved captions
- Check Chrome Web Store policy: https://developer.chrome.com/docs/webstore/program-policies/

---

**Last Updated:** 2025-10-29  
**Extension Version:** 1.0.3  
**Required Screenshots:** 5 (1280×800 or 640×400)

