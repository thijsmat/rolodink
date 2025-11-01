# Rolodink Security Documentation

## 🔒 Overview

This document outlines the comprehensive security measures implemented in Rolodink to protect user data, prevent unauthorized access, and mitigate common security threats.

## Security Architecture

### Defense in Depth

Rolodink implements multiple layers of security:

1. **Rate Limiting** - Prevents abuse and DDoS attacks
2. **Row-Level Security (RLS)** - Database-level access control
3. **Authentication** - Secure OAuth via Supabase
4. **API Security** - Token-based authorization
5. **Secret Management** - Environment variables and secure storage
6. **Dependency Scanning** - Regular security audits

## 1. Rate Limiting

### Implementation

**Location**: `linkedin-crm-backend/src/lib/rate-limit.ts`

**Limit**: 100 requests per IP address per hour

**Scope**: All API routes (`/api/*`)

### Why Rate Limiting is Critical

Rate limiting protects against:
- **Bot attacks**: Automated scraping or abuse
- **DDoS attacks**: Overwhelming the server with requests
- **Cost overruns**: Preventing excessive Supabase API calls (protecting against $600+ AWS bills)
- **Brute force attacks**: Limiting login attempts

### How It Works

1. Each request is tracked by IP address
2. Counter resets after 1 hour window
3. When limit is exceeded, returns `429 Too Many Requests`
4. Response includes `Retry-After` header

### Testing Rate Limits

```bash
# Test rate limit (should fail after 100 requests)
for i in {1..101}; do
  curl -X GET https://your-api.vercel.app/api/version
done
```

## 2. Row-Level Security (RLS)

### Implementation

**Location**: `prisma/migrations/enable_rls.sql`

**Tables Protected**:
- `Connection` - Users can only access their own connections
- `Note` - Users can only access notes for their own connections

### Policies

All policies use `auth.uid()` to ensure users can only access their own data:

```sql
-- Example: Users can only SELECT their own connections
CREATE POLICY "Users can view own connections"
  ON "public"."Connection"
  FOR SELECT
  USING (auth.uid() = "ownerId");
```

### Testing RLS

**Setup**: See `docs/RLS_SETUP.md` for detailed setup instructions

**Verification**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Connection', 'Note');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('Connection', 'Note');
```

### Security Benefits

- **Database-level protection**: Even if application code has bugs, RLS prevents data leakage
- **Defense in depth**: Multiple layers of access control
- **Automatic enforcement**: PostgreSQL enforces policies at query time

## 3. API Key Security

### Secret Management

**Never hardcode secrets** in source code. All secrets are stored in:

1. **Local Development**: `.env.local` files (gitignored)
2. **Production**: Vercel Environment Variables
3. **CI/CD**: GitHub Secrets

### Required Secrets

#### Backend
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

#### Extension (Build-time)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

#### CI/CD (GitHub Actions)
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

### Secret Scanning

**Automatic**: TruffleHog scans every commit and PR via GitHub Actions

**If secrets detected**:
1. Rotate the secret immediately (assume compromised)
2. Remove from git history
3. Update environment variables
4. See `docs/SECRET_SCANNING.md` for remediation

## 4. Authentication Security

### OAuth Flow

Rolodink uses Supabase Auth with OAuth providers:

1. **Email/Password**: Secure password-based authentication
2. **OAuth Providers**: Google, GitHub, etc. (configurable)

### Token Storage

**Extension**: Uses `chrome.storage.local` (encrypted by browser)

**Backend**: Validates JWT tokens on every request

### Token Validation

Every API request requires:
```
Authorization: Bearer <access_token>
```

Token is validated via Supabase Auth API before processing request.

### CORS Configuration

**Allowed Origins**:
- Chrome Extension: `chrome-extension://[extension-id]`
- Custom domains: Configurable in `next.config.ts`

**Headers**:
- `Authorization`: Required for authenticated requests
- `Content-Type`: Required for POST/PATCH requests

## 5. Environment Variables Documentation

### Setup Guide

See `docs/ENV_SETUP.md` for:
- Complete list of required variables
- Where to obtain each value
- Setup instructions for local development
- Production deployment configuration

### .env.example Files

Each project has an `.env.example` file showing required variables (without actual secrets).

**Projects**:
- `linkedin-crm-backend/.env.example`
- `linkedin-crm-extension/.env.example`
- `website/.env.example`

## 6. Dependency Scanning

### npm audit

**Automated**: Runs in CI/CD on every push/PR

**Workflow**: `.github/workflows/github-flow.yml`

**Configuration**:
```yaml
- name: Run npm audit
  run: npm audit --audit-level=moderate
  continue-on-error: true
```

### Manual Checks

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Check specific package
npm audit [package-name]
```

### Severity Levels

- **Critical**: Immediate action required
- **High**: Fix as soon as possible
- **Moderate**: Fix when convenient
- **Low**: Consider fixing

## 7. Security Best Practices

### For Developers

#### ✅ DO:
- Always use environment variables for secrets
- Test RLS policies before deploying
- Run `npm audit` regularly
- Review security warnings in CI/CD
- Use HTTPS for all external requests
- Validate user input on API routes
- Follow principle of least privilege

#### ❌ DON'T:
- Commit secrets to git
- Hardcode API keys or passwords
- Bypass rate limiting
- Disable RLS policies
- Use `*` for CORS origins in production
- Store sensitive data in localStorage
- Trust client-side validation alone

### For Deployment

1. **Verify Environment Variables**: Check all required vars are set in Vercel
2. **Enable RLS**: Run `enable_rls.sql` migration in Supabase
3. **Test Rate Limiting**: Verify 429 responses after limit
4. **Monitor Logs**: Check for security warnings in Supabase/Vercel logs
5. **Review Dependencies**: Address any `npm audit` findings

## 8. Incident Response

### If Security Breach Detected

1. **Immediate Actions**:
   - Rotate all affected secrets immediately
   - Review access logs for unauthorized access
   - Notify affected users (if applicable)

2. **Investigation**:
   - Review git history for when secret was exposed
   - Check Supabase logs for suspicious queries
   - Review API access logs in Vercel

3. **Remediation**:
   - Remove secret from git history (see `docs/SECRET_SCANNING.md`)
   - Update all environment variables
   - Verify RLS policies are still enforced
   - Add additional monitoring if needed

4. **Prevention**:
   - Review why secret was committed
   - Update documentation/processes
   - Add additional safeguards

### Contact

For security issues:
1. **DO NOT** open a public issue
2. Contact maintainers via secure channel
3. Provide details without exposing sensitive information

## 9. Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (no hardcoded values)
- [ ] RLS policies enabled and tested
- [ ] Rate limiting active on all API routes
- [ ] CORS configured for production origins only
- [ ] npm audit passes (no critical/high vulnerabilities)
- [ ] Authentication tested (sign in/out works)
- [ ] Environment variables set in Vercel
- [ ] `.env.example` files updated

### Post-Deployment

- [ ] Verify rate limiting works (test with >100 requests)
- [ ] Test RLS by attempting cross-user data access
- [ ] Monitor logs for security warnings
- [ ] Verify HTTPS is enforced
- [ ] Check Supabase logs for suspicious activity

### Regular Maintenance

- [ ] Run `npm audit` weekly
- [ ] Review dependency updates monthly
- [ ] Rotate secrets quarterly
- [ ] Review access logs monthly
- [ ] Update security documentation as needed

## 10. Known Limitations & Risks

### Current Limitations

1. **Rate Limiting**: In-memory store (not distributed)
   - **Impact**: Resets on serverless function cold start
   - **Mitigation**: Use Redis for production at scale

2. **Token Storage**: Extension uses `chrome.storage.local`
   - **Risk**: Accessible to extension (not accessible to web pages)
   - **Mitigation**: Tokens expire automatically via Supabase

3. **RLS Enforcement**: Depends on `auth.uid()` being correct
   - **Risk**: If token validation fails, RLS may not work
   - **Mitigation**: Always validate tokens before querying database

### Future Improvements

- [ ] Add Redis for distributed rate limiting
- [ ] Implement request signing for extension requests
- [ ] Add API key rotation automation
- [ ] Set up security monitoring/alerting
- [ ] Add security headers (CSP, HSTS, etc.)

## Related Documentation

- `docs/RLS_SETUP.md` - Row-Level Security setup guide
- `docs/ENV_SETUP.md` - Environment variable setup
- `docs/SECRET_SCANNING.md` - Secret scanning with TruffleHog
- `.cursorrules` - Development guidelines including security

## Security Updates

This document is updated as security measures are added or changed. Last updated: 2024

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential.

