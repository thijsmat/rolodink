// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthClient } from './authClient';

/**
 * The real auth-js client against a fake storage.local and a fake GoTrue.
 *
 * The extension used to get this client from supabase-js's createClient. It now
 * builds it itself, so these tests pin what supabase-js used to decide for us:
 * the storage key (or every user is signed out by the update), the endpoint,
 * the apikey headers and the flow - and then walk the auth paths the popup and
 * the worker actually use, over the wire format GoTrue speaks.
 */

const PROJECT_URL = 'https://adacfwaslbcimqgvbpqd.supabase.co';
const AUTH_URL = `${PROJECT_URL}/auth/v1`;
// The key supabase-js 2.x derived for this URL: `sb-<first label>-auth-token`.
const SUPABASE_JS_STORAGE_KEY = 'sb-adacfwaslbcimqgvbpqd-auth-token';
const ANON_KEY = 'anon-key';
const USER = { id: 'user-1', email: 'jane@example.com', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };

function b64url(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function jwt(expiresAt: number): string {
    return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: USER.id, exp: expiresAt, aud: 'authenticated' })}.sig`;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

function tokenResponse(accessToken: string, refreshToken: string) {
    return { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer', expires_in: 3600, expires_at: nowSeconds() + 3600, user: USER };
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

let store: Record<string, unknown>;
let fetchMock: ReturnType<typeof vi.fn>;

function calls(): Array<{ url: string; method: string; headers: Headers; body: unknown }> {
    return fetchMock.mock.calls.map(([url, init]) => ({
        url: String(url),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        body: init?.body ? JSON.parse(init.body) : undefined,
    }));
}

beforeEach(() => {
    store = {};
    vi.stubGlobal('chrome', {
        storage: {
            local: {
                get: vi.fn(async (key: string) => (key in store ? { [key]: store[key] } : {})),
                set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(store, items); }),
                remove: vi.fn(async (key: string) => { delete store[key]; }),
            },
        },
    });
    fetchMock = vi.fn(async () => json({ msg: 'unexpected call' }, 500));
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function client(autoRefreshToken = false) {
    return createAuthClient(PROJECT_URL, ANON_KEY, { autoRefreshToken }).auth;
}

function storeSession(accessToken: string, refreshToken: string, expiresAt: number) {
    // Exactly what supabase-js persisted: the session JSON under its key.
    store[SUPABASE_JS_STORAGE_KEY] = JSON.stringify({
        access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer',
        expires_in: 3600, expires_at: expiresAt, user: USER,
    });
}

describe('client construction', () => {
    it('keeps the storage key supabase-js used, so existing sessions survive the update', () => {
        const auth = client() as unknown as Record<string, unknown>;
        expect(auth.storageKey).toBe(SUPABASE_JS_STORAGE_KEY);
        // A trailing slash or surrounding whitespace in the configured URL does not change it.
        const withSlash = createAuthClient(` ${PROJECT_URL}/ `, ANON_KEY, { autoRefreshToken: false }).auth as unknown as Record<string, unknown>;
        expect(withSlash.storageKey).toBe(SUPABASE_JS_STORAGE_KEY);
    });

    it('uses the options supabase-js passed to its auth client', () => {
        const auth = client(true) as unknown as Record<string, unknown>;
        expect(auth.url).toBe(AUTH_URL);
        expect(auth.headers).toEqual({ Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY });
        expect(auth.flowType).toBe('implicit');
        expect(auth.persistSession).toBe(true);
        expect(auth.detectSessionInUrl).toBe(false);
        expect(auth.autoRefreshToken).toBe(true);
        expect((client(false) as unknown as Record<string, unknown>).autoRefreshToken).toBe(false);
    });

    it('rejects a URL or key that supabase-js would also have rejected', () => {
        expect(() => createAuthClient('example.supabase.co', ANON_KEY, { autoRefreshToken: false })).toThrow(/HTTP or HTTPS/);
        expect(() => createAuthClient(PROJECT_URL, '', { autoRefreshToken: false })).toThrow(/supabaseKey/);
    });
});

describe('session restore from storage', () => {
    it('reads a session that supabase-js wrote, without a network call', async () => {
        const access = jwt(nowSeconds() + 3600);
        storeSession(access, 'refresh-1', nowSeconds() + 3600);

        const { data, error } = await client().getSession();

        expect(error).toBeNull();
        expect(data.session?.access_token).toBe(access);
        expect(data.session?.user.id).toBe(USER.id);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('refresh', () => {
    it('refreshes an expired session on getSession and stores the new one under the same key', async () => {
        storeSession(jwt(nowSeconds() - 60), 'refresh-old', nowSeconds() - 60);
        const fresh = jwt(nowSeconds() + 3600);
        fetchMock.mockImplementation(async () => json(tokenResponse(fresh, 'refresh-new')));

        const { data } = await client().getSession();

        expect(data.session?.access_token).toBe(fresh);
        const [call] = calls();
        expect(call.url).toBe(`${AUTH_URL}/token?grant_type=refresh_token`);
        expect(call.method).toBe('POST');
        expect(call.headers.get('apikey')).toBe(ANON_KEY);
        expect(call.body).toEqual({ refresh_token: 'refresh-old' });
        expect(JSON.parse(store[SUPABASE_JS_STORAGE_KEY] as string).refresh_token).toBe('refresh-new');
    });
});

describe('sign-in with email and password', () => {
    it('posts to the token endpoint and persists the session', async () => {
        const access = jwt(nowSeconds() + 3600);
        fetchMock.mockImplementation(async () => json(tokenResponse(access, 'refresh-1')));

        const { data, error } = await client().signInWithPassword({ email: USER.email, password: 'secret' });

        expect(error).toBeNull();
        expect(data.user?.id).toBe(USER.id);
        const [call] = calls();
        expect(call.url).toBe(`${AUTH_URL}/token?grant_type=password`);
        expect(call.headers.get('apikey')).toBe(ANON_KEY);
        expect(call.headers.get('Authorization')).toBe(`Bearer ${ANON_KEY}`);
        expect(call.body).toMatchObject({ email: USER.email, password: 'secret' });
        expect(JSON.parse(store[SUPABASE_JS_STORAGE_KEY] as string).access_token).toBe(access);
    });
});

describe('sign-out', () => {
    beforeEach(() => {
        storeSession(jwt(nowSeconds() + 3600), 'refresh-1', nowSeconds() + 3600);
        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
    });

    it("scope 'others' revokes the other sessions and keeps this one", async () => {
        const { error } = await client().signOut({ scope: 'others' });

        expect(error).toBeNull();
        expect(calls().map((c) => `${c.method} ${c.url}`)).toEqual([`POST ${AUTH_URL}/logout?scope=others`]);
        expect(store[SUPABASE_JS_STORAGE_KEY]).toBeDefined();
    });

    it("scope 'local' ends only this session and clears it from storage", async () => {
        await client().signOut({ scope: 'local' });

        expect(calls().map((c) => c.url)).toEqual([`${AUTH_URL}/logout?scope=local`]);
        expect(store[SUPABASE_JS_STORAGE_KEY]).toBeUndefined();
    });

    it('the default is global, as with supabase-js', async () => {
        await client().signOut();

        expect(calls().map((c) => c.url)).toEqual([`${AUTH_URL}/logout?scope=global`]);
        expect(store[SUPABASE_JS_STORAGE_KEY]).toBeUndefined();
    });
});

describe('OAuth (LinkedIn) as the worker runs it', () => {
    it('builds the authorize URL without a redirect and without PKCE', async () => {
        const { data, error } = await client().signInWithOAuth({
            provider: 'linkedin_oidc',
            options: { redirectTo: 'https://ext.chromiumapp.org/provider_cb', skipBrowserRedirect: true, scopes: 'email profile openid' },
        });

        expect(error).toBeNull();
        const url = new URL(data.url as string);
        expect(`${url.origin}${url.pathname}`).toBe(`${AUTH_URL}/authorize`);
        expect(url.searchParams.get('provider')).toBe('linkedin_oidc');
        expect(url.searchParams.get('redirect_to')).toBe('https://ext.chromiumapp.org/provider_cb');
        expect(url.searchParams.get('scopes')).toBe('email profile openid');
        // Implicit flow: the tokens come back in the hash, which main.ts parses.
        expect(url.searchParams.has('code_challenge')).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('stores the tokens from the redirect hash via setSession', async () => {
        const access = jwt(nowSeconds() + 3600);
        fetchMock.mockImplementation(async () => json(USER));

        const { error } = await client().setSession({ access_token: access, refresh_token: 'refresh-oauth' });

        expect(error).toBeNull();
        const [call] = calls();
        expect(call.url).toBe(`${AUTH_URL}/user`);
        expect(call.headers.get('Authorization')).toBe(`Bearer ${access}`);
        const stored = JSON.parse(store[SUPABASE_JS_STORAGE_KEY] as string);
        expect(stored).toMatchObject({ access_token: access, refresh_token: 'refresh-oauth' });
        expect(stored.expires_at).toBeTypeOf('number');
    });
});

describe('password change as SettingsView runs it', () => {
    it('re-checks the current password, then updates it with the new session', async () => {
        storeSession(jwt(nowSeconds() + 3600), 'refresh-1', nowSeconds() + 3600);
        const rechecked = jwt(nowSeconds() + 3600);
        fetchMock.mockImplementation(async (url: string) =>
            String(url).includes('grant_type=password')
                ? json(tokenResponse(rechecked, 'refresh-2'))
                : json({ ...USER, updated_at: '2026-10-01T00:00:00Z' })
        );

        const auth = client();
        const verify = await auth.signInWithPassword({ email: USER.email, password: 'old-secret' });
        expect(verify.error).toBeNull();
        const { error } = await auth.updateUser({ password: 'new-secret-1' });

        expect(error).toBeNull();
        const [check, update] = calls();
        expect(check.url).toBe(`${AUTH_URL}/token?grant_type=password`);
        expect(update.url).toBe(`${AUTH_URL}/user`);
        expect(update.method).toBe('PUT');
        expect(update.headers.get('Authorization')).toBe(`Bearer ${rechecked}`);
        expect(update.body).toMatchObject({ password: 'new-secret-1' });
    });
});
