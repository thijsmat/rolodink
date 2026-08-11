import { resolveApiBaseUrl } from '@rolodink/core';

export const DEFAULT_API_BASE_URL = 'https://api.rolodink.app';

// The normalisation lives in core so that every consumer - popup, service
// worker and content script - derives the same URL from the same value. The
// service worker used to read this environment variable raw, and a configured
// value ending in '/' produced '<host>//api/...', which the server answers with
// a redirect that a CORS preflight is not allowed to follow. See core's api.ts.
// Written as a bare `import.meta.env.VITE_API_BASE_URL`, character for
// character, because vite.background.config.ts substitutes exactly that string
// via `define`. An optional-chained or guarded variant does not match the
// define and would silently leave the service worker on the default, ignoring
// whatever the release secret says. resolveApiBaseUrl already treats undefined
// as "fall through", so no guard is needed here.
export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  DEFAULT_API_BASE_URL
);

// Supabase configuration
// NOTE: These MUST be set as environment variables - never hardcode in production!
// For Vite, use import.meta.env (not process.env)
// For development, set these in .env.local with VITE_ prefix
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that Supabase credentials are provided
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️  Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.',
  );
}


