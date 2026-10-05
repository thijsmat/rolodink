import { describe, expect, it } from 'vitest';
import backgroundSource from './main.ts?raw';
import adapterSource from '../utils/storageAdapter.ts?raw';

/**
 * The service worker reaches the extension platform through getBrowserAPI()
 * only. A bare `chrome.*` call works in Chrome and Edge and misbehaves in
 * Firefox, where that global is a callback-style shim: an `await` on it yields
 * undefined instead of throwing, so the data key is silently never cached and
 * never cleared on sign-out. Nothing raises, which is why this is guarded as
 * source text - the same reasoning as selector-invariants.test.ts.
 */
const code = backgroundSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

describe('background worker platform access', () => {
    it('makes no bare chrome.* calls', () => {
        expect(code).not.toMatch(/\bchrome\.\w/);
    });

    it('does not read runtime.lastError after an await', () => {
        expect(code).not.toContain('lastError');
    });

    it('registers its listeners on the resolved platform object', () => {
        expect(code).toContain('browserAPI.runtime.onMessage.addListener');
        expect(code).toContain('browserAPI.runtime.onInstalled.addListener');
        expect(code).toContain('browserAPI.storage.session');
    });
});

describe('background worker leaks nothing into the debug log', () => {
    it('does not log the OAuth authorisation URL', () => {
        // It carries state and the PKCE challenge, and debug_logs sits readable
        // in storage.local.
        expect(code).not.toMatch(/logToStorage\([^)]*\burl:\s*data\.url/);
    });

    it('does not mirror the access token to a second storage key', () => {
        // The adapter is the only writer supabase-js goes through.
        const adapter = adapterSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        expect(adapter).not.toContain('supabaseAccessToken');
    });
});

describe('background worker is allowed to sleep', () => {
    it('does not run the auth-js auto-refresh ticker', () => {
        // With autoRefreshToken on, auth-js ticks every 30 s, reads storage on
        // each tick and so keeps the MV3 service worker from ever stopping -
        // plus a token refresh roughly every hour, all day. getSession()
        // refreshes an expired token on demand, which is all the worker needs.
        expect(code).toMatch(/autoRefreshToken:\s*false/);
        expect(code).not.toMatch(/autoRefreshToken:\s*true/);
    });
});

describe('background worker bundles only the auth client', () => {
    it('builds it through createAuthClient, not supabase-js', () => {
        // supabase-js doubled background.js (226 KB against 110 KB) for
        // PostgREST, Storage, Realtime and Functions, none of which the
        // extension calls. services/authClient.ts keeps the storage key.
        expect(code).toContain('createAuthClient(');
        expect(code).not.toContain('@supabase/supabase-js');
    });
});
