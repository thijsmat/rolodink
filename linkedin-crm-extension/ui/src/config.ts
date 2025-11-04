// Central API base URL for the UI code. Use Vite environment variable.
// Configure via .env.local (VITE_API_BASE_URL) or CI/CD envs.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Example staging/production values should be provided in .env.example

// Supabase configuration
// NOTE: These MUST be set as environment variables - never hardcode in production!
// For Vite, use import.meta.env (not process.env)
// For development, set these in .env.local with VITE_ prefix
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that Supabase credentials are provided
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️  Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
}


