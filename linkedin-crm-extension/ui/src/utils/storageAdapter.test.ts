import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chromeStorageAdapter, getSupabaseStorageKey } from './storageAdapter';

/**
 * The adapter supabase-js writes every session through.
 *
 * Worth testing on its own because of the mirroring it does: the content script
 * cannot reach the Supabase client, so the adapter copies the access token to a
 * flat `supabaseAccessToken` key for it. That coupling is invisible from either
 * side and it made a session bug worse than it looked - when auth-js discarded a
 * malformed session and called removeItem, the content script lost its token in
 * the same breath and stopped being able to talk to the API at all.
 */

const SESSION_KEY = 'sb-adacfwaslbcimqgvbpqd-auth-token';

let store: Record<string, unknown>;

beforeEach(() => {
    store = {};
    vi.stubGlobal('chrome', {
        storage: {
            local: {
                get: vi.fn(async (key: string | string[]) => {
                    const keys = Array.isArray(key) ? key : [key];
                    return Object.fromEntries(
                        keys.filter((k) => k in store).map((k) => [k, store[k]])
                    );
                }),
                set: vi.fn(async (items: Record<string, unknown>) => {
                    Object.assign(store, items);
                }),
                remove: vi.fn(async (key: string | string[]) => {
                    for (const k of Array.isArray(key) ? key : [key]) delete store[k];
                }),
            },
        },
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('getSupabaseStorageKey', () => {
    // Must agree with the key auth-js derives internally, or we would be
    // reading and writing a key nobody else touches.
    it('derives the key from the project ref', () => {
        expect(getSupabaseStorageKey('https://adacfwaslbcimqgvbpqd.supabase.co')).toBe(SESSION_KEY);
    });
});

describe('mirroring the access token for the content script', () => {
    it('copies access_token out of a stored session', async () => {
        await chromeStorageAdapter.setItem(
            SESSION_KEY,
            JSON.stringify({ access_token: 'abc123', refresh_token: 'r', expires_at: 1 })
        );

        expect(store[SESSION_KEY]).toBeTypeOf('string');
        expect(store.supabaseAccessToken).toBe('abc123');
    });

    it('leaves unrelated keys alone', async () => {
        await chromeStorageAdapter.setItem('rolodink_data_key', 'not-a-session');
        expect(store.supabaseAccessToken).toBeUndefined();
    });

    it('does not throw on a value that is not JSON', async () => {
        await expect(
            chromeStorageAdapter.setItem(SESSION_KEY, 'null-ish garbage')
        ).resolves.toBeUndefined();
        expect(store.supabaseAccessToken).toBeUndefined();
    });

    it('does not mirror when the session has no access_token', async () => {
        await chromeStorageAdapter.setItem(SESSION_KEY, JSON.stringify({ refresh_token: 'r' }));
        expect(store.supabaseAccessToken).toBeUndefined();
    });
});

describe('removing a session', () => {
    // The behaviour that turned a discarded session into a content script with
    // no token. Correct - a stale mirrored token would be worse - but it means
    // anything that makes auth-js drop the session takes the content script
    // down with it, which is why writing a session by hand was so damaging.
    it('removes the mirrored token together with the session', async () => {
        store[SESSION_KEY] = 'session';
        store.supabaseAccessToken = 'abc123';

        await chromeStorageAdapter.removeItem(SESSION_KEY);

        expect(store[SESSION_KEY]).toBeUndefined();
        expect(store.supabaseAccessToken).toBeUndefined();
    });

    it('leaves the mirrored token alone when removing something else', async () => {
        store.supabaseAccessToken = 'abc123';
        await chromeStorageAdapter.removeItem('rolodink_data_key');
        expect(store.supabaseAccessToken).toBe('abc123');
    });
});

describe('reading', () => {
    it('returns null for a key that is not there', async () => {
        await expect(chromeStorageAdapter.getItem(SESSION_KEY)).resolves.toBeNull();
    });

    it('returns the stored value', async () => {
        store[SESSION_KEY] = 'session';
        await expect(chromeStorageAdapter.getItem(SESSION_KEY)).resolves.toBe('session');
    });
});
