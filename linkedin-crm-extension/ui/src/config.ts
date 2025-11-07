// Central API base URL for the UI code. Change this once for staging/production.
// NOTE: Staging backend is currently not working due to missing environment variables
// Use production backend until staging is properly configured
export const API_BASE_URL = 'https://api.rolodink.app';

// Fallback configuration for when staging is ready
// export const API_BASE_URL = 'https://linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app';

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


