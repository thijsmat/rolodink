# Rolodink

Personal notes layer for LinkedIn profiles.

## 🚀 Quick Start

### For Users
1. **Download**: Get the latest release from [GitHub Releases](https://github.com/thijsmat/rolodink/releases)
2. **Install**: Follow the [Installation Guide](INSTALL.md)
3. **Use**: Add notes to LinkedIn profiles directly

### For Developers
1. **Clone**: `git clone https://github.com/thijsmat/rolodink.git`
2. **Setup**: Follow the [Team Workflow Guide](TEAM_WORKFLOW.md)
3. **Contribute**: Use [GitHub Flow](.github/GITHUB_FLOW.md)

## 🏗️ Project Structure

- **`/website/`** - Marketing website (Next.js + Tailwind)
- **`/linkedin-crm-extension/`** - Browser extension (React + Vite)
- **`/linkedin-crm-backend/`** - API backend (Next.js + Prisma)

## 🌳 Development Workflow

We use **GitHub Flow** for version control:

- **`main`** - Production branch (always deployable)
- **`feature/description`** - New features
- **`fix/description`** - Bug fixes
- **`hotfix/description`** - Urgent production fixes

### Quick Development Setup
```bash
# Website development
cd website && npm install && npm run dev

# Extension development  
cd linkedin-crm-extension/ui && npm install && npm run dev

# Backend development
cd linkedin-crm-backend && npm install && npm run dev
```

## 📚 Documentation

- **[Team Workflow](TEAM_WORKFLOW.md)** - Complete development guide
- **[GitHub Flow](.github/GITHUB_FLOW.md)** - Version control strategy
- **[GitHub Actions Setup](docs/GITHUB_ACTIONS_SETUP.md)** - CI/CD and automated publishing
- **[Secret Scanning](docs/SECRET_SCANNING.md)** - Security and secret management
- **[Installation Guide](INSTALL.md)** - User installation instructions
- **[Styling Architecture](STYLING.md)** - CSS and styling guide
- **[Cursor Rules](.cursorrules)** - Development guidelines

## 🎨 Design System

- **Colors**: Navy (`#1B2951`), Gold (`#B8860B`), LinkedIn Blue (`#0066CC`)
- **Typography**: Playfair Display (headings), Inter (body)
- **Components**: shadcn/ui + Tailwind CSS
- **Framework**: Next.js 15.4.7 with App Router

## 🚀 Deployment & CI/CD

### Automated Publishing

**Extension Releases** are automated via GitHub Actions:

- **Firefox**: Fully automated - signs and uploads to AMO when you push `ext-v*` tag
- **Chrome**: Fully automated - uploads to Chrome Web Store when you push `ext-v*` tag
- **Edge**: Manual upload required (workflow provides instructions)

**How to Release:**
```bash
# Create and push release tag
git tag -a ext-v1.0.4 -m "Release Rolodink v1.0.4"
git push origin ext-v1.0.4
```

**Setup Required:**
- Configure GitHub secrets (see `docs/GITHUB_ACTIONS_SETUP.md`)
- Firefox: `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`
- Chrome: `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`, `CHROME_EXTENSION_ID`

📚 **Full Guide:** [GitHub Actions Setup](docs/GITHUB_ACTIONS_SETUP.md)

### Other Deployments

- **Website**: Automatic deployment from `main` branch via Vercel
- **Backend**: Automatic deployment from `main` branch via Vercel

## 📦 Releases

See [GitHub Releases](https://github.com/thijsmat/rolodink/releases) for:
- Packaged extension ZIPs
- Installation instructions
- Changelog and version history

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/thijsmat/rolodink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thijsmat/rolodink/discussions)
- **Documentation**: Check the guides above

## 🔒 Security

**Secret scanning is automatically enabled** on every push and pull request:

- **Tool**: TruffleHog scans for exposed secrets, API keys, and credentials
- **Action**: Workflow fails if secrets are detected, blocking merges
- **Coverage**: All commits and file changes are scanned
- **Prevention**: Pre-commit hook available for local scanning (optional)

📚 **Full Guide:** [Secret Scanning Documentation](docs/SECRET_SCANNING.md)

**Best Practices:**
- Never commit secrets to the repository
- Use GitHub Secrets for CI/CD credentials
- Store secrets in `.env` files (gitignored)
- Rotate secrets immediately if accidentally exposed

## 🤝 Contributing

1. Read the [Team Workflow Guide](TEAM_WORKFLOW.md)
2. Follow [GitHub Flow](.github/GITHUB_FLOW.md)
3. Create feature branches from `main`
4. Submit pull requests for review
5. Follow our [code standards](.cursorrules)

---

**Built with ❤️ for LinkedIn professionals**
