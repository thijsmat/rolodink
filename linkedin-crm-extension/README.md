# Rolodink - LinkedIn CRM Notes

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-pending%20review-yellow.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

**Add personal notes to LinkedIn profiles. Remember why every connection matters.**

[Website](https://rolodink.app) • [Documentation](#documentation) • [Installation](#installation) • [Roadmap](ROADMAP.md)

</div>

---

## 📖 About

Rolodink brings the personal touch of business cards to LinkedIn. Add private notes to every LinkedIn profile and never forget why each connection matters.

Just like writing notes on the back of a business card, Rolodink lets you add personal context to every LinkedIn profile. One click, one note, and you'll never forget a connection again.

### ✨ Key Features

- 📝 **Quick Note Taking** - Add notes directly from LinkedIn profiles
- 🔐 **Complete Privacy** - Your notes are 100% private and encrypted
- ⚡ **Lightning Fast** - Instant popup from any LinkedIn profile
- 💼 **Professional Design** - Clean interface matching LinkedIn's style
- 🔄 **Sync Everywhere** - Access your notes from any device

---

## 🚀 Installation

### Option 1: Chrome Web Store (Recommended)

**Status:** 🟡 Pending Approval (Submitted Oct 29, 2025)

Once approved, install with one click:
```
https://chromewebstore.google.com/detail/rolodink/[extension-id]
```

**Benefits:**
- ✅ One-click installation
- ✅ Automatic updates
- ✅ Chrome security verification

---

### Option 2: Manual Install from GitHub Releases

**For advanced users or testing:**

#### Prerequisites
- Google Chrome (latest version)
- Developer mode enabled

#### Steps

1. **Download Latest Release:**
   ```bash
   # Download v1.0.3
   curl -LO https://github.com/thijsmat/rolodink/releases/download/v1.0.3/rolodink-v1.0.3-chrome.zip
   
   # Extract
   unzip rolodink-v1.0.3-chrome.zip -d rolodink-extension
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `rolodink-extension` folder

3. **Verify:**
   - Extension icon appears in toolbar
   - Visit any LinkedIn profile
   - "Add to CRM" button appears

**⚠️ Note:** Manual installations don't receive automatic updates. Switch to Chrome Web Store version once approved.

---

## 🎯 Quick Start

### First Time Setup

1. **Install Extension** (see Installation section above)
2. **Click Extension Icon** in Chrome toolbar
3. **Login** with your Rolodink account (or create one)
4. **Visit LinkedIn Profile** - Go to any LinkedIn profile
5. **Click "Add to CRM"** button in profile header
6. **Write Your Note** - Add context, reminders, or meeting notes
7. **Save** - Your note is encrypted and synced

### Daily Usage

**Add Note:**
1. Browse to LinkedIn profile
2. Click "Add to CRM" button
3. Write note and save

**View All Notes:**
1. Click extension icon
2. Click "All Connections"
3. Browse or search your notes

**Edit/Delete:**
1. Open connection from list
2. Click edit or delete
3. Confirm changes

---

## 💻 Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Vanilla CSS + CSS Modules |
| **Backend** | Supabase |
| **Extension** | Manifest V3 |
| **Bundle Size** | ~140KB (0.14 MB) |

---

## 🏗️ Project Structure

```
linkedin-crm-extension/
├── manifest.json              # Extension manifest (v3)
├── content.js                 # LinkedIn page injection
├── icon.png                   # Extension icon
├── icons/                     # Icon sizes (16, 32, 48, 128)
├── ui/                        # React popup application
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   ├── context/           # React context
│   │   ├── styles/            # CSS variables
│   │   └── App.tsx            # Main app
│   └── dist/                  # Built popup (after build)
├── dist/                      # Production build output
├── validate.js                # Pre-build validation
├── build-production.js        # Production build script
└── package.json               # npm scripts
```

---

## 🛠️ Development

### Setup

```bash
# Install dependencies (UI)
cd ui
npm install

# Install dependencies (root for build scripts)
cd ..
npm install
```

### Development Workflow

```bash
# Start UI dev server (with HMR)
cd ui
npm run dev
# Opens on http://localhost:5173

# Build extension for testing
cd ..
npm run validate          # Validate manifest
npm run build            # Build production version
npm run build:production # Validate + build + create ZIP
```

### Load Extension Locally

1. Build extension: `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `dist/` folder

### Testing

```bash
# Run interactive test script
./test-local.sh
```

**Tests include:**
- ✅ Build validation
- ✅ Extension loading
- ✅ LinkedIn integration
- ✅ CRUD operations
- ✅ Error handling

---

## 📚 Documentation

### For Users
- [Installation Guide](#installation)
- [Quick Start](#quick-start)
- [Privacy Policy](https://rolodink.app/privacy)
- [Terms of Service](https://rolodink.app/terms)

### For Developers
- [Build Instructions](BUILD_INSTRUCTIONS.md) - Complete build guide
- [Roadmap](ROADMAP.md) - Feature roadmap and timeline
- [Changelog](CHANGELOG.md) - Version history
- [Styling Guide](ui/STYLING.md) - CSS architecture

### For Contributors
- [Submission Checklist](SUBMISSION-CHECKLIST.md) - Quality checklist
- [Release Template](.github/RELEASE_TEMPLATE.md) - Release format

### Chrome Web Store
- [Store Listing](STORE-LISTING.md) - Store content
- [Screenshots Guide](README-SCREENSHOTS.md) - Screenshot specs
- [Submission Guide](SUBMISSION.md) - Submission process

---

## 🔒 Privacy & Security

### Data We Collect
- LinkedIn profile URLs (to associate notes)
- Profile names (as you see them on LinkedIn)
- Your personal notes (encrypted)

### Data We DON'T Collect
- LinkedIn messages or private data
- Connection lists or network data
- Any data we don't explicitly need

### Security
- 🔐 End-to-end encryption for all notes
- 🔒 Secure HTTPS communication
- 🛡️ No third-party data sharing
- ✅ GDPR compliant

**Read full policy:** https://rolodink.app/privacy

---

## 📋 Permissions

Rolodink requests **minimal permissions**:

| Permission | Purpose | Required? |
|------------|---------|-----------|
| `activeTab` | Read current tab URL | ✅ Yes |
| `storage` | Store user notes locally | ✅ Yes |
| `tabs` | Get LinkedIn profile info | ✅ Yes |
| Host: `linkedin.com` | Inject "Add to CRM" button | ✅ Yes |
| Host: `api.rolodink.app` | Sync notes with backend | ✅ Yes |

**Note:** v1.0.3 removed unused `scripting` permission for better security.

---

## 🗺️ Roadmap

### ✅ Completed (v1.0.3)
- Chrome Web Store submission fixes
- Automated build system
- Comprehensive documentation
- Interactive testing

### 🚧 In Progress
- Chrome Web Store approval
- Public launch preparation

### 📋 Planned (v1.1.0)
- Search and filter connections
- Tags system for categorization
- Export functionality (CSV/JSON)
- Dark mode support

### 🔮 Future (v2.0.0)
- Offline mode with sync
- Mobile browser support
- Multi-language interface
- Team features (optional)

**See [ROADMAP.md](ROADMAP.md) for complete timeline.**

---

## 📊 Current Status

### Version: 1.0.3
**Release Date:** October 29, 2025  
**Status:** ✅ Built & Ready  
**Chrome Web Store:** 🟡 Pending Review (1-3 days)

### Recent Changes
- 🔧 Fixed icon loading in Chrome Web Store submission
- 🔧 Removed unused "scripting" permission
- ✨ Added automated build system
- 📖 Added comprehensive documentation

**See [CHANGELOG.md](CHANGELOG.md) for full history.**

---

## 🤝 Contributing

We're not accepting external contributions at this time, but we appreciate:

### Bug Reports
Found a bug? [Open an issue](https://github.com/thijsmat/rolodink/issues/new)

**Include:**
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### Feature Requests
Have an idea? [Submit a feature request](https://github.com/thijsmat/rolodink/issues/new)

**Include:**
- Use case description
- Expected behavior
- Why this would be valuable

---

## 📞 Support

### Get Help
- 📧 **Email:** support@rolodink.app
- 🌐 **Website:** https://rolodink.app
- 📖 **Documentation:** See [Documentation](#documentation) section
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/thijsmat/rolodink/issues)

### Response Time
- Critical bugs: Within 24 hours
- General inquiries: 2-3 business days
- Feature requests: Reviewed weekly

---

## 🔗 Links

### Official
- **Website:** https://rolodink.app
- **Privacy Policy:** https://rolodink.app/privacy
- **Terms of Service:** https://rolodink.app/terms
- **Support:** https://rolodink.app/help

### Development
- **GitHub:** https://github.com/thijsmat/rolodink
- **Issues:** https://github.com/thijsmat/rolodink/issues
- **Releases:** https://github.com/thijsmat/rolodink/releases
- **Changelog:** https://github.com/thijsmat/rolodink/blob/main/CHANGELOG.md

### Chrome Web Store
- **Listing:** *Coming soon* (pending approval)
- **Developer Dashboard:** (Private)

---

## 📜 License

**Proprietary License**

Copyright © 2025 Matthijs Goes. All rights reserved.

This software and associated documentation files are proprietary and confidential. No rights are granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the software without express written permission.

For licensing inquiries: support@rolodink.app

---

## 👏 Acknowledgments

Built with:
- ⚛️ React & TypeScript
- ⚡ Vite
- 🗄️ Supabase
- 🎨 Custom CSS architecture

Thanks to:
- Chrome Extension API team for Manifest V3
- LinkedIn for the professional networking platform
- Early beta testers for valuable feedback

---

## 📈 Stats

![GitHub release](https://img.shields.io/github/v/release/thijsmat/rolodink)
![GitHub last commit](https://img.shields.io/github/last-commit/thijsmat/rolodink)
![GitHub issues](https://img.shields.io/github/issues/thijsmat/rolodink)

---

<div align="center">

**Made with ❤️ for LinkedIn professionals**

[Install Extension](#installation) • [Read Docs](#documentation) • [Get Support](#support)

</div>

---

**Last Updated:** October 29, 2025  
**Maintainer:** Matthijs Goes ([@thijsmat](https://github.com/thijsmat))  
**Version:** 1.0.3

