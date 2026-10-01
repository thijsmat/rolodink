import { AuthClient, type GoTrueClient } from '@supabase/auth-js';
import { chromeStorageAdapter, getSupabaseStorageKey } from '../utils/storageAdapter';

/**
 * The extension only ever talks to Supabase Auth. Everything else - notes,
 * connections, the data key - goes through our own API. So instead of the
 * whole supabase-js client (PostgREST, Storage, Realtime, Functions) this builds
 * the auth client on its own, the way supabase-js 2.112 builds it internally
 * in `SupabaseClient._initSupabaseAuthClient` - same URL, keys, storage and
 * flow. Only the `X-Client-Info` header (Supabase's client statistics) is no
 * longer sent; nothing on the server depends on it.
 *
 * The one thing that must not drift is the storage key. supabase-js derived it
 * as `sb-<project-ref>-auth-token`; an existing user's session sits under that
 * key in storage.local. Any other key and every user is signed out by the
 * update. authClient.test.ts pins it.
 */

/** Same shape as `supabase.auth`, so the call sites stay as they were. */
export interface AuthOnlyClient {
    auth: GoTrueClient;
}

export interface AuthClientOptions {
    /** Off in the service worker: the 30 s ticker would keep it awake. */
    autoRefreshToken: boolean;
}

function toBaseUrl(supabaseUrl: string): URL {
    const trimmed = supabaseUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        throw new Error('Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.');
    }
    return new URL(trimmed.endsWith('/') ? trimmed : `${trimmed}/`);
}

export function createAuthClient(
    supabaseUrl: string,
    anonKey: string,
    { autoRefreshToken }: AuthClientOptions
): AuthOnlyClient {
    if (!anonKey) throw new Error('supabaseKey is required.');
    const baseUrl = toBaseUrl(supabaseUrl);

    const auth = new AuthClient({
        url: new URL('auth/v1', baseUrl).href,
        headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
        },
        storageKey: getSupabaseStorageKey(baseUrl.href),
        storage: chromeStorageAdapter,
        autoRefreshToken,
        persistSession: true,
        detectSessionInUrl: false,
        // supabase-js's default. The LinkedIn login reads the tokens from the
        // redirect's hash, which is the implicit flow; PKCE would return a code.
        flowType: 'implicit',
    });

    return { auth };
}
