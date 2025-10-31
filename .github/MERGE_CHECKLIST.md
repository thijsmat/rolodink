# Rolodink v1.0.3 - Merge & Deployment Checklist

## Pre-Merge Checklist

### Security Hardening PR
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Rate limiting thresholds verified (100 req/hour)
- [ ] RLS migration SQL syntax checked

### Publishing Automation PR
- [ ] Code review completed
- [ ] All tests passing
- [ ] GitHub Secrets configured
- [ ] Workflow YAML validated
- [ ] Documentation reviewed

## Merge Order

1. **First**: Merge `feature/security-hardening` → `main`
2. **Second**: Merge `feature/publishing-automation` → `main`

## Post-Merge: Security Deployment

### 1. RLS Migration (CRITICAL - Do First)
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy contents from: linkedin-crm-backend/prisma/migrations/enable_rls.sql
-- Execute in Supabase SQL Editor
```

**Verification**:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Connection', 'Note');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('Connection', 'Note');
```

- [ ] RLS migration executed
- [ ] Policies verified active
- [ ] Test: User A cannot access User B's data

### 2. Environment Variables (Vercel)
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Verify `DATABASE_URL` is set (connection pooling)
- [ ] Verify `DIRECT_URL` is set (direct connection)
- [ ] Check staging environment variables (if applicable)

### 3. Rate Limiting Test
After Vercel deployment:
```bash
# Test rate limiting
for i in {1..101}; do
  curl https://your-api.vercel.app/api/version
done
```

- [ ] First 100 requests return 200 OK
- [ ] Request 101+ returns 429 Too Many Requests
- [ ] Response includes `X-RateLimit-*` headers
- [ ] `Retry-After` header present

### 4. Authentication Flow Test
- [ ] Sign in works correctly
- [ ] Sign up works correctly
- [ ] Token validation works
- [ ] Extension can authenticate

## Post-Merge: Publishing Automation

### 5. GitHub Secrets Verification
Check GitHub Settings → Secrets → Actions:

**Chrome**:
- [ ] `CHROME_CLIENT_ID` set
- [ ] `CHROME_CLIENT_SECRET` set
- [ ] `CHROME_REFRESH_TOKEN` set
- [ ] `CHROME_EXTENSION_ID` set

**Firefox**:
- [ ] `FIREFOX_JWT_ISSUER` set
- [ ] `FIREFOX_JWT_SECRET` set

### 6. Test Publishing Workflow
Create a test tag to verify workflows:
```bash
git tag -a ext-v1.0.3-test -m "Test publishing automation"
git push origin ext-v1.0.3-test
```

- [ ] Chrome workflow runs successfully
- [ ] Firefox workflow runs successfully
- [ ] Edge workflow runs (or documents manual process)
- [ ] Check GitHub Actions tab for errors

## Monitoring & Verification

### 7. Production Monitoring
After 24 hours, check:
- [ ] Vercel logs: no rate limit errors (except legitimate 429s)
- [ ] Supabase logs: RLS policies evaluated correctly
- [ ] GitHub Actions: workflows running on tags
- [ ] Extension stores: submissions progressing

### 8. Security Audit
- [ ] Run `npm audit` - verify no critical vulnerabilities
- [ ] Run TruffleHog scan - verify 0 secrets
- [ ] Check Supabase logs for unauthorized access attempts
- [ ] Review API access logs for anomalies

## Rollback Plan

If issues detected:

1. **Rate Limiting Issues**:
   - Remove rate limiting middleware from routes
   - Redeploy via Vercel
   - Monitor and adjust thresholds

2. **RLS Issues**:
   - Disable RLS policies in Supabase:
     ```sql
     ALTER TABLE "public"."Connection" DISABLE ROW LEVEL SECURITY;
     ALTER TABLE "public"."Note" DISABLE ROW LEVEL SECURITY;
     ```
   - Fix policies and re-enable

3. **Publishing Issues**:
   - Manual upload to stores as fallback
   - Check GitHub Secrets configuration
   - Review workflow logs for errors

## Success Criteria

✅ All checkboxes completed
✅ No critical errors in logs
✅ RLS policies protecting user data
✅ Rate limiting preventing abuse
✅ Publishing automation working
✅ Extension available in all 3 stores

## Next Steps After Deployment

1. Monitor for 1 week
2. Gather user feedback
3. Address any issues
4. Plan v1.0.4 improvements
5. Update documentation based on learnings

