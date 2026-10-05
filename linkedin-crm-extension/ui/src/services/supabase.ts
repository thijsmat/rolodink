import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { createAuthClient, type AuthOnlyClient } from './authClient';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️  Missing Supabase credentials in services/supabase.ts');
}

let supabaseClient: AuthOnlyClient;

try {
    console.log('Initializing Supabase auth client...');
    // The popup keeps auto-refresh on; it is short-lived, so the ticker stops
    // when the popup closes.
    supabaseClient = createAuthClient(
        SUPABASE_URL || 'https://placeholder.supabase.co',
        SUPABASE_ANON_KEY || 'placeholder',
        { autoRefreshToken: true }
    );
    console.log('Supabase auth client initialized');
} catch (error) {
    console.error('Failed to initialize Supabase auth client:', error);
    // Fallback to avoid crash on import
    supabaseClient = {
        auth: {
            signInWithOAuth: async () => ({ error: new Error('Supabase not initialized') }),
            setSession: async () => ({ error: new Error('Supabase not initialized') }),
            getSession: async () => ({ data: { session: null }, error: new Error('Supabase not initialized') }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        }
    } as unknown as AuthOnlyClient;
}

export const supabase = supabaseClient;
