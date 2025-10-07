// Central API base URL for the UI code. Change this once for staging/production.
// NOTE: Staging backend is currently not working due to missing environment variables
// Use production backend until staging is properly configured
export const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

// Fallback configuration for when staging is ready
// export const API_BASE_URL = 'https://linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app';

// Supabase configuration
// Note: These should be set as environment variables in production
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://matthijs-goes-projects.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'PLACEHOLDER_KEY_NEEDS_REPLACEMENT';


