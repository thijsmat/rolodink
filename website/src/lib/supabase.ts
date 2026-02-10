import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Centralized Supabase client for the website.
 * 
 * Environment variables are mapped in next.config.js so that
 * Vercel-managed SUPABASE_URL / SUPABASE_ANON_KEY are exposed as
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at build time.
 */
export const supabase = createClientComponentClient();
