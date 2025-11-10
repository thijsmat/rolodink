# Environment Variables Setup Guide

This guide explains how to configure environment variables for all Rolodink projects.

## Overview

Rolodink consists of three main components, each requiring different environment variables:

1. **Backend** (`linkedin-crm-backend/`) - Next.js API routes
2. **Extension** (`linkedin-crm-extension/`) - Browser extension UI
3. **Website** (`website/`) - Marketing website

## Quick Start

1. Copy `.env.example` to `.env.local` in each project directory
2. Fill in the required values from your service providers
3. Never commit `.env.local` to git (already in `.gitignore`)

## Backend Environment Variables

### Required Variables

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Where to get**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous (public) API key
- **Where to get**: Supabase Dashboard → Settings → API → Project API keys → anon/public
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `DATABASE_URL`
- **Description**: PostgreSQL connection string for Prisma
- **Where to get**: Supabase Dashboard → Settings → Database → Connection string → Connection pooling
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Note**: Use connection pooling URL (not direct connection)

#### `DIRECT_URL`
- **Description**: Direct PostgreSQL connection string (for migrations)
- **Where to get**: Supabase Dashboard → Settings → Database → Connection string → Direct connection
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Optional Variables

#### `EXTENSION_DOWNLOAD_URL`
- **Description**: URL for extension download (used in version check endpoint)
- **Default**: GitHub releases page
- **Example**: `https://github.com/your-org/rolodink/releases/latest`

#### `NODE_ENV`
- **Description**: Node environment (`development`, `production`, `test`)
- **Default**: `development`
- **Note**: Set automatically by deployment platforms

## Extension Environment Variables

### For Development

Create `.env.local` in `linkedin-crm-extension/`:

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Production Build

Set environment variables in your build process:

```bash
# Vercel
vercel env add VITE_API_BASE_URL
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Or in Vercel Dashboard:
# Settings → Environment Variables → Add
```

**Note**: Vite uses `VITE_` prefix for client-side environment variables.

## Website Environment Variables

### Required Variables

#### `NEXT_PUBLIC_EXTENSION_URL`
- **Description**: Chrome Web Store extension URL
- **Where to get**: After publishing extension to Chrome Web Store
- **Example**: `https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc`

### Optional Variables

#### `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Only needed if website makes direct Supabase calls
- **Usually**: Not required (extension handles auth)

## Setting Up Local Development

### 1. Backend Setup

```bash
cd linkedin-crm-backend
cp .env.example .env.local
# Edit .env.local with your values
npm install
npm run dev
```

### 2. Extension Setup

```bash
cd linkedin-crm-extension
cp .env.example .env.local
# Edit .env.local with your values
cd ui
npm install
npm run dev
```

### 3. Website Setup

```bash
cd website
cp .env.example .env.local
# Edit .env.local with your values
npm install
npm run dev
```

## Production Deployment (Vercel)

### Backend Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `linkedin-crm-backend/.env.example`
3. Set for **Production**, **Preview**, and **Development** environments
4. Redeploy if variables were changed

### Website Deployment

1. Go to Vercel Dashboard → Website Project → Settings → Environment Variables
2. Add variables from `website/.env.example`
3. Set for appropriate environments

### Extension Build

Extension is built manually or via CI/CD. Set environment variables in:
- GitHub Actions secrets (for automated builds)
- Local `.env.local` (for manual builds)

## Security Best Practices

### ✅ DO:
- Use `.env.local` for local development (gitignored)
- Use Vercel Environment Variables for production
- Use GitHub Secrets for CI/CD
- Rotate secrets immediately if exposed
- Use different values for staging/production

### ❌ DON'T:
- Commit `.env.local` to git
- Hardcode secrets in source code
- Share secrets via email/chat
- Use production secrets in development
- Expose secrets in client-side code (unless they're public keys)

## Verifying Setup

### Backend

```bash
cd linkedin-crm-backend
npm run dev
# Check console for "Missing Supabase credentials" warnings
# Test API endpoint: http://localhost:3000/api/version
```

### Extension

```bash
cd linkedin-crm-extension/ui
npm run dev
# Check browser console for missing env warnings
```

#### Vereiste variabelen (Vite)

Maak in `linkedin-crm-extension/ui` een `.env.local` bestand met:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key

# Optioneel: overschrijf het API eindpunt tijdens lokaal testen
# VITE_API_BASE_URL=http://localhost:3000
```

> Let op: gebruik altijd de publieke Supabase anon key en nooit de service role key in de extensie.

### Website

```bash
cd website
npm run dev
# Check for missing NEXT_PUBLIC_* warnings
```

## Troubleshooting

### "Missing environment variable" errors
- Verify `.env.local` exists in project root
- Check variable names match exactly (case-sensitive)
- Restart dev server after changing `.env.local`
- For Vercel: Check Environment Variables in dashboard

### Supabase connection errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon/public key (not service_role)
- Verify database is accessible (check Supabase dashboard)

### Database connection errors
- Verify `DATABASE_URL` uses connection pooling (not direct)
- Check password is URL-encoded if it contains special characters
- Verify IP allowlist in Supabase (if enabled)

## Related Documentation

- `docs/SECURITY.md` - Security best practices
- `docs/RLS_SETUP.md` - Row-Level Security setup
- `.gitignore` - Ensures secrets aren't committed

