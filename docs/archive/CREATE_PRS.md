# 🚀 Create Pull Requests for v1.0.3

## PR 1: Security Hardening

### Direct Link
👉 **[Create Security Hardening PR](https://github.com/thijsmat/rolodink/compare/main...feature/security-hardening)**

### PR Details
**Title**: `Security Hardening for v1.0.3 Release`

**Body**: Kopieer de inhoud van `.github/PULL_REQUEST_TEMPLATE_security.md`

Of gebruik deze samenvatting:

```markdown
# Security Hardening for v1.0.3 Release

## 🎯 Overview
This PR implements comprehensive security hardening measures for Rolodink.

## ✅ Changes
- ✅ Rate limiting (100 req/hour) on all API routes
- ✅ RLS policies for Connection and Note tables
- ✅ Removed hardcoded secrets
- ✅ Added security documentation
- ✅ npm audit and secret scanning in CI/CD

## ⚠️ Before Merge
- [ ] Execute RLS migration in Supabase
- [ ] Verify environment variables in Vercel
- [ ] Test rate limiting (expect 429 after 100 requests)

See `.github/PULL_REQUEST_TEMPLATE_security.md` for full details.
```

---

## PR 2: Publishing Automation

### Direct Link
👉 **[Create Publishing Automation PR](https://github.com/thijsmat/rolodink/compare/main...feature/publishing-automation)**

### PR Details
**Title**: `Publishing Automation for v1.0.3`

**Body**: Kopieer de inhoud van `.github/PULL_REQUEST_TEMPLATE_publishing.md`

Of gebruik deze samenvatting:

```markdown
# Publishing Automation for v1.0.3

## 🎯 Overview
This PR adds automated publishing workflows for Chrome, Firefox, and Edge.

## ✅ Changes
- ✅ Automated Chrome Web Store publishing
- ✅ Automated Firefox AMO publishing
- ✅ Edge Add-ons workflow (placeholder)
- ✅ Complete setup documentation
- ✅ Release scripts and notes

## ⚠️ Before Merge
- [ ] Verify GitHub Secrets are configured
- [ ] Test workflow YAML syntax
- [ ] Review documentation accuracy

See `.github/PULL_REQUEST_TEMPLATE_publishing.md` for full details.
```

---

## Merge Order

1. **First**: Merge Security Hardening PR
2. **Second**: Merge Publishing Automation PR

## Post-Merge Checklist

See `.github/MERGE_CHECKLIST.md` for complete deployment checklist.

Key steps:
1. Execute RLS migration in Supabase
2. Verify environment variables
3. Test rate limiting
4. Verify publishing workflows

