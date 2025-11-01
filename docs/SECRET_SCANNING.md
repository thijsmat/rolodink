# Secret Scanning with TruffleHog

## 🔒 Why Secret Scanning is Important

Accidentally committing secrets (API keys, passwords, tokens, etc.) to a repository is a serious security risk:

- **Public repositories**: Secrets become immediately accessible to anyone
- **Private repositories**: Secrets can leak through forks, collaborators, or breaches
- **Git history**: Once committed, secrets remain in git history even if removed later
- **Compliance**: Many regulations (GDPR, SOC2, etc.) require secret management

**Prevention is much easier than remediation!**

---

## 🤖 How TruffleHog Works

TruffleHog scans your repository for secrets using:

1. **Pattern matching**: Detects common secret formats (API keys, tokens, passwords)
2. **Entropy analysis**: Identifies high-entropy strings that look like secrets
3. **Verified results**: Checks detected secrets against known patterns
4. **Git history scanning**: Scans all commits, not just current files

### What Gets Scanned

- All files in the repository
- Git commit history
- Pull request diffs
- Branch comparisons

### What Gets Detected

- API keys (AWS, Google Cloud, etc.)
- OAuth tokens and refresh tokens
- Database connection strings
- SSH private keys
- Passwords and credentials
- Environment variables with secrets
- JWT secrets
- And many more secret patterns

---

## 🔍 GitHub Actions Workflow

### Automatic Scanning

Every push and pull request triggers TruffleHog scanning:

- **Workflow**: `.github/workflows/secret-scanning.yml`
- **Triggers**: Push to `main` and PRs
- **Action**: Fails workflow if secrets found
- **Result**: PR cannot be merged if secrets detected

### Workflow Behavior

```yaml
- Scans all commits in the push/PR
- Uses verified and unknown results (both fail)
- Fails workflow on detection
- Blocks merge if secrets found
```

---

## 🚨 What to Do if a Secret is Found

### Immediate Actions

1. **Don't panic** - but act quickly!
2. **Don't merge the PR** - or revert the commit immediately
3. **Rotate the secret** - assume it's compromised
4. **Remove from git history** - use `git filter-branch` or BFG Repo-Cleaner
5. **Notify team** - if it's a shared secret

### Step-by-Step Remediation

#### 1. Rotate the Secret

**This is the most important step!** The secret is potentially exposed.

- **Firefox AMO**: Generate new JWT credentials at https://addons.mozilla.org/developers/addon/api/key/
- **Chrome Web Store**: Generate new OAuth credentials in Google Cloud Console
- **Database**: Change database passwords
- **API keys**: Regenerate all affected keys
- **Any other service**: Rotate immediately

#### 2. Remove from Repository

**Option A: Remove from current commit (if not yet merged)**

```bash
# If secret in latest commit
git reset --soft HEAD~1
# Remove secret from files
git commit --amend
# Force push (only if safe to do so)
git push origin --force
```

**Option B: Remove from git history (if already merged)**

```bash
# Install BFG Repo-Cleaner (recommended)
# Or use git filter-branch

# Example with BFG:
bfg --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

#### 3. Update GitHub Secrets

After rotating:
- Update secret in GitHub Settings → Secrets → Actions
- Verify workflow still works with new secret
- Document rotation date in team notes

#### 4. Prevent Future Leaks

- Review `.gitignore` - ensure secrets are excluded
- Add secret files to `.gitignore` if needed
- Use environment variables or secret managers
- Double-check before committing

---

## 🛡️ Prevention Best Practices

### 1. Use `.gitignore` Properly

Always exclude files with secrets:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Credentials
credentials.json
*.pem
*.key
*.p12

# Secrets
secrets/
*.secret
```

### 2. Use Environment Variables

**Never hardcode secrets:**

```javascript
// ❌ BAD
const API_KEY = "sk_live_1234567890abcdef";

// ✅ GOOD
const API_KEY = process.env.API_KEY;
```

### 3. Use GitHub Secrets for CI/CD

Store secrets in GitHub, not in code:

- Go to: Repository → Settings → Secrets → Actions
- Add secrets there
- Reference in workflows: `${{ secrets.SECRET_NAME }}`

### 4. Use Secret Managers for Production

- **HashiCorp Vault**: Enterprise secret management
- **AWS Secrets Manager**: For AWS deployments
- **Google Secret Manager**: For GCP deployments
- **Azure Key Vault**: For Azure deployments

### 5. Review Code Before Committing

**Checklist before commit:**
- [ ] No hardcoded credentials
- [ ] No API keys in strings
- [ ] No passwords in code
- [ ] `.env` files are in `.gitignore`
- [ ] Secret files excluded
- [ ] Sensitive data removed

### 6. Use Pre-commit Hooks

See pre-commit hook setup below to catch secrets before they're committed.

---

## 🔧 Pre-commit Hook Setup (Recommended)

Install TruffleHog locally to catch secrets before committing:

### Installation

```bash
# Install TruffleHog
# Option 1: Using Homebrew (macOS)
brew install trufflesecurity/trufflehog/trufflehog

# Option 2: Using Go
go install github.com/trufflesecurity/trufflehog/v3/cmd/trufflehog@latest

# Option 3: Download binary
# Visit: https://github.com/trufflesecurity/trufflehog/releases
```

### Setup Pre-commit Hook

1. **Create hook file:**
   ```bash
   touch .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

2. **Add hook script:**
   ```bash
   #!/bin/bash
   # Run TruffleHog on staged changes
   
   if ! command -v trufflehog &> /dev/null; then
     echo "⚠️  TruffleHog not installed. Skipping secret scan."
     echo "Install: brew install trufflesecurity/trufflehog/trufflehog"
     exit 0
   fi
   
   echo "🔍 Scanning for secrets..."
   
   # Get staged files
   STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
   
   if [ -z "$STAGED_FILES" ]; then
     echo "✅ No files to scan"
     exit 0
   fi
   
   # Run TruffleHog on staged changes
   trufflehog filesystem \
     --paths="$(echo "$STAGED_FILES" | tr '\n' ',')" \
     --json | jq -r 'select(.Redacted != null) | "Secret detected in \(.SourceMetadata.Data.Git.file): \(.DetectorName)"'
   
   if [ $? -ne 0 ]; then
     echo "❌ Secrets detected! Commit blocked."
     echo "Remove secrets from files before committing."
     exit 1
   fi
   
   echo "✅ No secrets detected"
   exit 0
   ```

3. **Test the hook:**
   ```bash
   # Try committing a test file with a fake API key
   echo "API_KEY=sk_test_1234567890abcdef" > test-secret.txt
   git add test-secret.txt
   git commit -m "test"
   # Should be blocked!
   
   # Clean up
   git reset HEAD test-secret.txt
   rm test-secret.txt
   ```

### Hook Behavior

- **Runs automatically** before each commit
- **Scans only staged files** (fast)
- **Blocks commit** if secrets found
- **Allows commit** if no secrets detected
- **Graceful failure** if TruffleHog not installed

---

## ⚠️ How to Bypass (Only if Absolutely Necessary)

**⚠️ Warning: Only bypass in emergency situations with team approval!**

### Option 1: Skip Pre-commit Hook

```bash
# Use --no-verify flag (bypasses all hooks)
git commit --no-verify -m "Emergency fix"

# ⚠️ This is dangerous - use sparingly!
```

### Option 2: Temporarily Disable GitHub Action

1. Go to: Repository → Settings → Actions → Workflows
2. Find "Secret Scanning" workflow
3. Click "Disable workflow"
4. **Re-enable immediately after emergency fix!**

### Option 3: Allow Known False Positives

If TruffleHog flags a false positive (not a real secret):

1. **Verify it's safe:**
   - Check it's not a real secret
   - Confirm it's not sensitive data
   - Document why it's safe

2. **Add to allowlist** (if supported):
   - Contact maintainers
   - Request allowlist addition
   - Document exception

3. **Alternative naming:**
   - Rename variable to avoid pattern matching
   - Use comments to explain why it's safe

**Never bypass without good reason!**

---

## 📊 Monitoring and Alerts

### GitHub Actions Status

- **Green checkmark**: ✅ No secrets found
- **Red X**: ❌ Secrets detected - investigate immediately
- **Yellow circle**: ⏳ Scan in progress

### Email Notifications

Configure GitHub notifications to receive alerts:
- Settings → Notifications → Actions
- Enable email for workflow failures
- Get immediate alerts when secrets detected

### Team Communication

- Use team chat for urgent secret rotation
- Document rotation in incident log
- Share lessons learned in team meetings

---

## 📚 Resources

### Official Documentation

- **TruffleHog**: https://github.com/trufflesecurity/trufflehog
- **GitHub Actions**: https://docs.github.com/en/actions
- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/

### Secret Management

- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Environment Variables**: https://docs.github.com/en/actions/learn-github-actions/environment-variables
- **Secret Managers**: Choose based on your cloud provider

### Related Documentation

- **Git Best Practices**: See `.cursorrules`
- **CI/CD Setup**: `docs/GITHUB_ACTIONS_SETUP.md`
- **Security Guidelines**: `.cursorrules` (Security section)

---

## ✅ Quick Reference

### Before Committing

- [ ] Run `git status` - review all changes
- [ ] Check for hardcoded secrets
- [ ] Verify `.env` files aren't committed
- [ ] Review diff carefully
- [ ] Pre-commit hook will catch most issues

### If Secret Detected

1. **Stop immediately** - don't merge/commit
2. **Rotate secret** - assume compromised
3. **Remove from git** - clean history
4. **Update secrets** - new values everywhere
5. **Notify team** - if shared secret

### Prevention Checklist

- [ ] `.gitignore` excludes secret files
- [ ] Pre-commit hook installed
- [ ] Using GitHub Secrets for CI/CD
- [ ] No secrets in code or config
- [ ] Using secret managers for production

---

**Last Updated:** 2025-10-31  
**Status:** ✅ Active - scanning on all pushes and PRs

**Remember:** Prevention is always better than remediation. Take time to review your commits!

