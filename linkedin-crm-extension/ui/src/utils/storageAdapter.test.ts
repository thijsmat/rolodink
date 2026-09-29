import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chromeStorageAdapter, getSupabaseStorageKey } from './storageAdapter';

/**
 * The adapter supabase-js writes every session through.
 *
 * Kept deliberately thin: it stores exactly what supabase-js hands it. It once
 * mirrored the access token to a flat key for the content script; see the
 * describe block below for why that is gone.
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

describe('sessions are stored as-is', () => {
    // The adapter used to copy access_token to a flat `supabaseAccessToken` key
    // for the content script. The content script goes through the worker now,
    // and a second copy of the token in storage.local - readable from the page
    // side of the extension - had no remaining reader.
    it('writes the session under its own key and nothing else', async () => {
        await chromeStorageAdapter.setItem(
            SESSION_KEY,
            JSON.stringify({ access_token: 'abc123', refresh_token: 'r', expires_at: 1 })
        );

        expect(store[SESSION_KEY]).toBeTypeOf('string');
        expect(Object.keys(store)).toEqual([SESSION_KEY]);
    });

    it('does not throw on a value that is not JSON', async () => {
        await expect(
            chromeStorageAdapter.setItem(SESSION_KEY, 'null-ish garbage')
        ).resolves.toBeUndefined();
    });
});

describe('removing a session', () => {
    it('removes the session key', async () => {
        store[SESSION_KEY] = 'session';
        await chromeStorageAdapter.removeItem(SESSION_KEY);
        expect(store[SESSION_KEY]).toBeUndefined();
    });

    it('leaves other keys alone', async () => {
        store.rolodink_other = 'keep';
        await chromeStorageAdapter.removeItem('rolodink_data_key');
        expect(store.rolodink_other).toBe('keep');
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
