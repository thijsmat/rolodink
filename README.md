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
- **[Installation Guide](INSTALL.md)** - User installation instructions
- **[Cursor Rules](.cursorrules)** - Development guidelines

## 🎨 Design System

- **Colors**: Navy (`#1B2951`), Gold (`#B8860B`), LinkedIn Blue (`#0066CC`)
- **Typography**: Playfair Display (headings), Inter (body)
- **Components**: shadcn/ui + Tailwind CSS
- **Framework**: Next.js 15.4.7 with App Router

## 🚀 Deployment

- **Website**: Automatic deployment from `main` branch via Vercel
- **Extension**: Manual build and upload to Chrome Web Store, Firefox AMO, Edge Add-ons
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

## 🤝 Contributing

1. Read the [Team Workflow Guide](TEAM_WORKFLOW.md)
2. Follow [GitHub Flow](.github/GITHUB_FLOW.md)
3. Create feature branches from `main`
4. Submit pull requests for review
5. Follow our [code standards](.cursorrules)

---

**Built with ❤️ for LinkedIn professionals**
