import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * A Supabase client with the service-role key, for the one thing the anon key
 * cannot do: `auth.admin.deleteUser`. Server-only - the key bypasses RLS, so it
 * must never get a NEXT_PUBLIC_ name or reach a client bundle.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not set, so callers can fall
 * back instead of failing.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
