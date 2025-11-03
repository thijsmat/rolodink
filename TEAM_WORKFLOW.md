# Team Workflow Guide

## 🎯 Overview
This guide explains how our team works with GitHub Flow and the development process for the Rolodink project.

## 🚀 Quick Start

### For New Team Members
1. **Clone the repository**
   ```bash
   git clone https://github.com/thijsmat/rolodink.git
   cd rolodink
   ```

2. **Set up development environment**
   ```bash
   # Install dependencies for website
   cd website && npm install
   
   # Install dependencies for extension
   cd ../linkedin-crm-extension/ui && npm install
   
   # Install dependencies for backend
   cd ../../linkedin-crm-backend && npm install
   ```

3. **Read the documentation**
   - [GitHub Flow Guide](.github/GITHUB_FLOW.md)
   - [Cursor Rules](.cursorrules)
   - [Project README](README.md)

## 🌳 Branch Strategy

### Main Branches
- **`main`**: Production branch (always deployable)
- **`develop`**: Integration branch (being phased out)

### Feature Branches
- **`feature/description`**: New features
- **`fix/description`**: Bug fixes
- **`hotfix/description`**: Urgent production fixes
- **`docs/description`**: Documentation updates

## 🔄 Daily Workflow

### Starting New Work
```bash
# 1. Always start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Work on your feature
# ... make changes ...

# 4. Commit with clear messages
git add .
git commit -m "feat: add user authentication"

# 5. Push to remote
git push origin feature/your-feature-name
```

### Creating Pull Requests
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill out the PR template completely
4. Request appropriate reviewers
5. Wait for approval + CI checks
6. Merge when ready

### Code Review Process
- **Required**: At least 1 approval
- **Required**: All CI checks pass
- **Required**: No merge conflicts
- **Reviewers**: Request team members familiar with the code

## 📋 Commit Message Standards

### Format
```
type(scope): description

feat(auth): add OAuth2 integration
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🏗️ Project Structure

### Website (`/website/`)
- **Purpose**: Marketing website (rolodink.app)
- **Tech**: Next.js 15.4.7, Tailwind CSS, shadcn/ui
- **Development**: `npm run dev`
- **Build**: `npm run build`

### Extension (`/linkedin-crm-extension/`)
- **Purpose**: Browser extension for LinkedIn
- **Tech**: React, Vite, TypeScript
- **Development**: `npm run dev`
- **Build**: `npm run build`

### Backend (`/linkedin-crm-backend/`)
- **Purpose**: API backend for extension
- **Tech**: Next.js API routes, Prisma, SQLite
- **Development**: `npm run dev`
- **Build**: `npm run build`

## 🎨 Design System

### Colors
- **Primary**: `azure: #1B2951` (navy blue)
- **Background**: `background: #F7F5F0` (warm cream)
- **Accent**: `gold: #B8860B` (gold)
- **LinkedIn**: `linkBlue: #0066CC` (LinkedIn blue)
- **Text**: `grey: #525252` (dark gray)

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Sizes**: Use Tailwind's text scale

### Components
- Use shadcn/ui components when possible
- Follow Tailwind CSS patterns
- Maintain responsive design
- Ensure accessibility

## 🧪 Testing Guidelines

### Before Submitting PR
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)
- [ ] Mobile responsiveness tested

### Testing Checklist
- [ ] New features work as expected
- [ ] No breaking changes
- [ ] Performance is acceptable
- [ ] Accessibility standards met
- [ ] Documentation updated

## 🚀 Deployment Process

### Automatic Deployment
- **Website**: Deploys automatically from `main` branch
- **Backend**: Deploys automatically from `main` branch
- **Extension**: Manual build and upload process

### Manual Deployment
```bash
# Build website
cd website && npm run build

# Build extension
cd linkedin-crm-extension/ui && npm run build

# Build backend
cd ../../linkedin-crm-backend && npm run build
```

## 🆘 Getting Help

### Documentation
1. Check this guide first
2. Read [GitHub Flow Guide](.github/GITHUB_FLOW.md)
3. Review [Cursor Rules](.cursorrules)
4. Check existing issues/PRs

### Team Communication
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions
- **PR Comments**: For code review discussions
- **Team Chat**: For urgent matters

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit
```

#### Git Issues
```bash
# Reset to main if needed
git checkout main
git pull origin main
```

## 📚 Resources

### Documentation
- [GitHub Flow Guide](.github/GITHUB_FLOW.md)
- [Cursor Rules](.cursorrules)
- [PR Template](.github/pull_request_template.md)
- [Issue Templates](.github/ISSUE_TEMPLATE/)

### Tools
- **Git**: Version control
- **GitHub CLI**: `gh` command
- **Node.js**: Runtime environment
- **npm**: Package manager
- **VS Code/Cursor**: Code editor

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Documentation](https://react.dev/)

## 🎯 Best Practices

### Do's ✅
- Always start from `main` branch
- Use descriptive branch names
- Write clear commit messages
- Keep PRs small and focused
- Test before submitting PR
- Update documentation
- Ask for help when needed

### Don'ts ❌
- Don't commit directly to `main`
- Don't merge without review
- Don't leave branches unmerged
- Don't use generic commit messages
- Don't skip testing
- Don't ignore CI failures

## 🔄 Emergency Procedures

### Rollback Production
```bash
# Revert last commit
git revert HEAD
git push origin main
```

### Force Push (Emergency Only)
```bash
# Only in extreme emergencies
git push origin main --force-with-lease
```

### Hotfix Process
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-issue-description

# Make fix and create PR
git add .
git commit -m "hotfix: resolve urgent production issue"
git push origin hotfix/urgent-issue-description
```

## 📊 Success Metrics

### Code Quality
- Zero TypeScript errors
- All tests passing
- No console errors
- Good performance scores

### Process Quality
- All PRs reviewed
- Clear commit messages
- Updated documentation
- Successful deployments

---

**Remember**: This workflow is designed to be simple and effective. When in doubt, ask for help rather than guessing!
