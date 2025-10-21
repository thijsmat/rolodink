# GitHub Flow Workflow

## Overview
This repository uses GitHub Flow, a simple branching strategy with one main branch (`main`) and feature branches.

## Branch Structure

### Main Branch
- **`main`** - Production-ready code
- Always deployable
- Protected branch (requires PR reviews)
- All features merge here

### Feature Branches
- **`feature/description`** - New features
- **`fix/description`** - Bug fixes  
- **`hotfix/description`** - Urgent production fixes
- **`docs/description`** - Documentation updates

## Workflow

### 1. Starting New Work

```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Working on Features

```bash
# Make commits with clear messages
git add .
git commit -m "feat: add new feature description"

# Push to remote
git push origin feature/your-feature-name
```

### 3. Creating Pull Requests

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill out PR template:
   - **Title**: Clear description of changes
   - **Description**: What, why, how
   - **Checklist**: Testing, documentation, etc.

### 4. Code Review Process

- **Required**: At least 1 approval
- **Required**: All CI checks pass
- **Required**: No merge conflicts
- **Optional**: Request specific reviewers

### 5. Merging

- **Squash and merge** for feature branches
- **Merge commit** for hotfixes (preserve history)
- **Delete branch** after merge

## Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/user-authentication` |
| Bug Fix | `fix/description` | `fix/login-validation` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Docs | `docs/description` | `docs/api-documentation` |
| Chore | `chore/description` | `chore/update-dependencies` |

## Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add OAuth2 integration
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

## Branch Protection Rules

### Main Branch
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to main
- ✅ Allow force pushes: ❌
- ✅ Allow deletions: ❌

### Required Status Checks
- Build must pass
- Tests must pass
- Linting must pass
- Security scan must pass

## Hotfix Process

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-issue-description

# Make fix
git add .
git commit -m "hotfix: resolve urgent production issue"

# Push and create PR
git push origin hotfix/urgent-issue-description
```

## Release Process

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md`
3. **Tag**: Create git tag `v1.0.0`
4. **Deploy**: Automatic deployment via CI/CD

## Best Practices

### Do's ✅
- Always start from `main`
- Use descriptive branch names
- Write clear commit messages
- Keep PRs small and focused
- Test before submitting PR
- Update documentation

### Don'ts ❌
- Don't commit directly to `main`
- Don't merge without review
- Don't leave branches unmerged
- Don't use generic commit messages
- Don't skip testing

## Emergency Procedures

### Rollback Production
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert specific commit
git revert <commit-hash>
git push origin main
```

### Force Push (Emergency Only)
```bash
# Only in extreme emergencies
git push origin main --force-with-lease
```

## Tools & Automation

### Required Tools
- GitHub CLI (`gh`)
- Git LFS (for large files)
- Pre-commit hooks

### Automation
- Auto-merge on approval + CI pass
- Auto-delete merged branches
- Auto-assign reviewers
- Auto-label PRs

## Getting Help

- **Documentation**: Check this file first
- **Issues**: Create GitHub issue for questions
- **Discussions**: Use GitHub Discussions for general questions
- **Team Chat**: Use team communication channels

---

**Remember**: GitHub Flow is designed to be simple. When in doubt, ask for help rather than guessing!
