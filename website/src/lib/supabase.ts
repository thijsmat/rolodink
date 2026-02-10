import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Centralized Supabase client for the website.
 * This helper ensures that we check for both standard NEXT_PUBLIC_ variables
 * and potential Vercel-managed variables (without the prefix).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any).SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('Supabase configuration is missing!', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        env: process.env.NODE_ENV
    });
}

// createClientComponentClient handles the case where it's called on the server vs client automatically.
// By passing them explicitly, we bypass the internal env check that specifically looks for NEXT_PUBLIC_ prefixes.
export const supabase = createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
});
