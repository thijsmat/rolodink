import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { chromeStorageAdapter } from '../utils/storageAdapter';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️  Missing Supabase credentials in services/supabase.ts');
}

let supabaseClient: SupabaseClient;

try {
    console.log('Initializing Supabase client...');
    supabaseClient = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
        auth: {
            storage: chromeStorageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
    console.log('Supabase client initialized');
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Fallback to avoid crash on import
    supabaseClient = {
        auth: {
            signInWithOAuth: async () => ({ error: new Error('Supabase not initialized') }),
            setSession: async () => ({ error: new Error('Supabase not initialized') }),
            getSession: async () => ({ data: { session: null }, error: new Error('Supabase not initialized') }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        }
    } as any;
}

export const supabase = supabaseClient;
