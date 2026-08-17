import { describe, expect, it } from 'vitest';
import backgroundSource from './background/main.ts?raw';
import connectionLogicSource from './hooks/useConnectionLogic.ts?raw';

/**
 * Two patterns that must not come back.
 *
 * These read source text rather than behaviour, which is normally a poor test.
 * It is the right tool here for one reason: both bugs were invisible for months
 * because the failure had no observable signal to assert on. A hand-written
 * session looked fine until auth-js discarded it on the next read, and a global
 * signOut looked identical to a local one from inside the extension. There is
 * no runtime assertion that would have caught either without mocking most of
 * supabase-js and the chrome API.
 *
 * The behavioural coverage lives next door in storageAdapter.test.ts. This file
 * only guards against reintroduction, in the same spirit as the CI step that
 * greps the packaged content script to prove it is the bundle.
 */

describe('the session has exactly one writer', () => {
    // A hand-built object written straight to the Supabase storage key carried
    // expires_in but no expires_at. auth-js's _isValidSession requires
    // access_token, refresh_token AND expires_at; anything else is deleted on
    // the next getSession(). Logging in worked and the session was gone by the
    // time the popup reopened. setSession writes it correctly - let it.
    it('the background script never writes the Supabase session key itself', () => {
        expect(backgroundSource).not.toMatch(/getSupabaseStorageKey/);
        expect(backgroundSource).not.toMatch(/storage\.local\.set\(\s*\{\s*\[/);
    });

    it('the background script checks what setSession returns', () => {
        expect(backgroundSource).toMatch(/setSessionError/);
    });

    // An empty string is not a refresh token; it is a missing one wearing a
    // disguise, and it produces a session that expires within the hour with
    // nothing in MV3 able to renew it.
    it('no empty-string fallback for the refresh token', () => {
        expect(backgroundSource).not.toMatch(/refresh_token:\s*refreshToken\s*\|\|\s*''/);
    });
});

describe('an expired token does not log you out everywhere', () => {
    // signOut() defaults to scope: 'global' in auth-js, which asks the server to
    // revoke every refresh token the user has - phone, website, other browsers.
    // On a 401 that merely meant "this access token expired", that turned a
    // refreshable session into an unrecoverable one, across all their devices.
    it('every signOut in the connection logic is scoped to this client', () => {
        // Comments are stripped first, and the pattern requires the `.signOut(`
        // member call rather than the bare name. The first version of this test
        // failed against the explanatory comment two lines above the call it was
        // checking - prose that mentions a pattern is not the pattern.
        const code = connectionLogicSource
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
        const calls = code.match(/\.signOut\([^)]*\)/g) ?? [];

        expect(calls.length).toBeGreaterThan(0);
        for (const call of calls) {
            expect(call).toContain("scope: 'local'");
        }
    });

    // Deliberately not asserted for useAuthLogic.ts. The signOut there is the
    // user pressing "log out", and whether that should end their session
    // everywhere is a product decision rather than a bug - unlike these two,
    // which fire on a network response the user never asked for.
});
