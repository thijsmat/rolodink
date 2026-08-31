import { createBrowserClient } from '@supabase/ssr'

/**
 * Centralized Supabase client for the website.
 *
 * Environment variables are mapped in next.config.js so that
 * Vercel-managed SUPABASE_URL / SUPABASE_ANON_KEY are exposed as
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at build time.
 *
 * Dit is dezelfde client als /auth/callback server-side gebruikt, zodat het
 * wachtwoordlogin-pad en het OAuth-pad hun sessiecookie in hetzelfde formaat
 * schrijven. Voorheen stond hier @supabase/auth-helpers-nextjs, dat Supabase
 * heeft afgeschreven ten gunste van @supabase/ssr.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
