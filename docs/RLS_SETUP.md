# Row-Level Security (RLS) Setup Guide

## Overview

Row-Level Security (RLS) ensures that users can only access their own data in the Supabase database. This is a critical security feature that prevents data leakage and unauthorized access.

## Tables with RLS Enabled

### Connection Table
- **RLS Status**: ✅ Enabled
- **Policies**: Users can only SELECT, INSERT, UPDATE, DELETE connections where `ownerId = auth.uid()`

### Note Table
- **RLS Status**: ✅ Enabled
- **Policies**: Users can only access notes for connections they own (via Connection.ownerId = auth.uid())

## Applying RLS Policies

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `prisma/migrations/enable_rls.sql`
4. Paste and execute the SQL script
5. Verify policies are created in **Database → Policies**

### Option 2: Using Supabase CLI

```bash
# Connect to your Supabase project
supabase db remote set <your-project-ref>

# Apply the migration
supabase db execute -f prisma/migrations/enable_rls.sql
```

### Option 3: Using Prisma Migrate (if using direct DB connection)

```bash
cd linkedin-crm-backend
npx prisma migrate dev --name enable_rls
```

## Verifying RLS is Working

### Test 1: Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Connection', 'Note');
```

Both tables should have `rowsecurity = true`.

### Test 2: Check Policies Exist

```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('Connection', 'Note');
```

You should see 4 policies for Connection and 4 policies for Note.

### Test 3: Test with Authenticated User

1. Sign in as User A
2. Create a connection
3. Sign in as User B
4. Attempt to access User A's connection - should fail with permission denied

## Testing RLS Policies

### Manual Testing

```sql
-- Test as authenticated user (replace with actual user ID)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to SELECT (should only return own connections)
SELECT * FROM "public"."Connection";

-- Try to INSERT (should only allow with own ownerId)
INSERT INTO "public"."Connection" (id, name, "linkedInUrl", "ownerId") 
VALUES ('test-id', 'Test', 'https://linkedin.com/test', 'user-uuid-here');

-- Reset
RESET ROLE;
```

### Automated Testing

Create tests that:
1. Create connection as User A
2. Attempt to access as User B
3. Verify access is denied

## Security Considerations

### ✅ What RLS Protects Against
- Users accessing other users' connections
- Users viewing other users' notes
- Users modifying data they don't own
- Direct database access (if RLS is enforced at DB level)

### ⚠️ What RLS Does NOT Protect Against
- Application-level bugs (if app queries are wrong)
- Supabase admin access (service_role key bypasses RLS)
- Proper authentication (RLS depends on auth.uid() being correct)

## Troubleshooting

### "Permission denied" errors
- Verify user is authenticated (`auth.uid()` is not null)
- Check that policies are correctly defined
- Ensure `ownerId` matches `auth.uid()`

### Policies not applying
- Check if RLS is actually enabled: `SELECT tablename, rowsecurity FROM pg_tables...`
- Verify policies are created: `SELECT * FROM pg_policies...`
- Check Supabase logs for policy evaluation errors

### Testing issues
- Use Supabase dashboard SQL editor with authenticated role
- Verify JWT token contains correct `sub` (user ID) claim
- Test with multiple users to ensure isolation

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Internal: `prisma/migrations/enable_rls.sql`

## Related Documentation

- `docs/SECURITY.md` - Comprehensive security guide
- `docs/ENV_SETUP.md` - Environment variable setup

