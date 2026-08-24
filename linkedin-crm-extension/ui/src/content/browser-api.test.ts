import { describe, expect, it, vi } from 'vitest';
import {
    createBrowserApi,
    getBrowserApi,
    resolveExtensionApi,
    type ApiScope,
    type ExtensionApi,
} from './browser-api';

/**
 * There is no Firefox here — not in CI, not on the machine this is written
 * from — so the only honest way to claim the adapter handles both platforms is
 * to build one of each and run the same assertions over both.
 *
 * The fakes are deliberately faithful to how the two disagree: Firefox returns
 * promises and rejects, Chrome takes a callback and reports failure by setting
 * runtime.lastError before invoking it.
 */

/** Firefox: browser.*, promise-native. */
function makeFirefox(overrides: Partial<Record<string, unknown>> = {}) {
    const calls: unknown[] = [];
    const stored: Record<string, unknown> = { contextFieldEnabled: true };
    const api: ExtensionApi = {
        runtime: {
            sendMessage: (message: unknown) => {
                calls.push(message);
                return Promise.resolve({ success: true, echoed: message });
            },
        },
        storage: {
            local: {
                get: (keys) => {
                    const wanted = Array.isArray(keys) ? keys : [keys as string];
                    return Promise.resolve(
                        Object.fromEntries(wanted.filter((k) => k in stored).map((k) => [k, stored[k]])),
                    );
                },
                set: (items) => {
                    Object.assign(stored, items);
                    return Promise.resolve();
                },
            },
        },
        ...overrides,
    };
    return { api, calls, stored };
}

/** Chrome/Edge: chrome.*, callback style with runtime.lastError. */
function makeChrome(overrides: Partial<Record<string, unknown>> = {}) {
    const calls: unknown[] = [];
    const stored: Record<string, unknown> = { contextFieldEnabled: true };
    const runtime: ExtensionApi['runtime'] = {
        lastError: null,
        sendMessage: (message: unknown, callback?: (value: unknown) => void) => {
            calls.push(message);
            callback?.({ success: true, echoed: message });
            return undefined;
        },
    };
    const api: ExtensionApi = {
        runtime,
        storage: {
            local: {
                get: (keys, callback) => {
                    const wanted = Array.isArray(keys) ? keys : [keys as string];
                    callback?.(
                        Object.fromEntries(wanted.filter((k) => k in stored).map((k) => [k, stored[k]])),
                    );
                    return undefined;
                },
                set: (items, callback) => {
                    Object.assign(stored, items);
                    callback?.();
                    return undefined;
                },
            },
        },
        ...overrides,
    };
    return { api, runtime, calls, stored };
}

const PLATFORMS = [
    ['firefox (promise)', () => ({ ...makeFirefox(), style: 'promise' as const })],
    ['chrome (callback)', () => ({ ...makeChrome(), style: 'callback' as const })],
] as const;

describe('resolveExtensionApi', () => {
    it('prefers browser over chrome', () => {
        // Firefox defines both. `chrome` there is a callback-style shim, so
        // picking it would give up promises for no reason - and would make the
        // adapter behave differently on Firefox than this test claims.
        const scope: ApiScope = { browser: makeFirefox().api, chrome: makeChrome().api };
        expect(resolveExtensionApi(scope)?.style).toBe('promise');
    });

    it('falls back to chrome when browser is absent', () => {
        expect(resolveExtensionApi({ chrome: makeChrome().api })?.style).toBe('callback');
    });

    it('ignores a global that is not an extension API', () => {
        // A page can define `window.browser` itself. Requiring runtime.sendMessage
        // keeps us off somebody else's object.
        const scope: ApiScope = { browser: { notAnExtension: true }, chrome: makeChrome().api };
        expect(resolveExtensionApi(scope)?.style).toBe('callback');
    });

    it('returns null when neither exists', () => {
        // The real case: the extension was reloaded or removed while the
        // content script kept running.
        expect(resolveExtensionApi({})).toBeNull();
        expect(getBrowserApi({})).toBeNull();
    });
});

describe.each(PLATFORMS)('on %s', (_label, build) => {
    it('sends a message and resolves with the reply', async () => {
        const platform = build();
        const api = createBrowserApi({ api: platform.api, style: platform.style });

        await expect(api.sendMessage({ type: 'API_REQUEST' })).resolves.toEqual({
            success: true,
            echoed: { type: 'API_REQUEST' },
        });
        expect(platform.calls).toEqual([{ type: 'API_REQUEST' }]);
    });

    it('sends exactly one message per call', async () => {
        // The reason the style is decided up front instead of probed: a probe
        // would have to call once to see what comes back, and that call has
        // already delivered the message.
        const platform = build();
        const api = createBrowserApi({ api: platform.api, style: platform.style });

        await api.sendMessage({ type: 'ENCRYPT_TEXT' });
        expect(platform.calls).toHaveLength(1);
    });

    it('reads and writes storage', async () => {
        const platform = build();
        const api = createBrowserApi({ api: platform.api, style: platform.style });

        expect(api.hasStorage()).toBe(true);
        await expect(api.storageGet(['contextFieldEnabled'])).resolves.toEqual({
            contextFieldEnabled: true,
        });

        await api.storageSet({ contextFieldEnabled: false });
        await expect(api.storageGet(['contextFieldEnabled'])).resolves.toEqual({
            contextFieldEnabled: false,
        });
    });

    it('omits keys that are not stored rather than inventing them', async () => {
        const platform = build();
        const api = createBrowserApi({ api: platform.api, style: platform.style });
        await expect(api.storageGet(['neverSet'])).resolves.toEqual({});
    });

    it('reports missing storage instead of throwing on undefined', async () => {
        const platform = build();
        const api = createBrowserApi({
            api: { runtime: platform.api.runtime },
            style: platform.style,
        });

        expect(api.hasStorage()).toBe(false);
        await expect(api.storageGet(['contextFieldEnabled'])).rejects.toThrow(/storage/i);
        await expect(api.storageSet({ a: 1 })).rejects.toThrow(/storage/i);
    });

    it('turns a synchronous throw into a rejection', async () => {
        // "Extension context invalidated" arrives this way on both platforms:
        // thrown out of the call, not delivered to a handler.
        const platform = build();
        const api = createBrowserApi({
            api: {
                ...platform.api,
                runtime: {
                    ...platform.api.runtime,
                    sendMessage: () => {
                        throw new Error('Extension context invalidated');
                    },
                },
            },
            style: platform.style,
        });

        await expect(api.sendMessage({})).rejects.toThrow('Extension context invalidated');
    });
});

describe('failures that are reported differently per platform', () => {
    it('firefox: a rejected promise rejects', async () => {
        const platform = makeFirefox();
        const api = createBrowserApi({
            api: {
                ...platform.api,
                runtime: { sendMessage: () => Promise.reject(new Error('Receiving end does not exist')) },
            },
            style: 'promise',
        });

        await expect(api.sendMessage({})).rejects.toThrow('Receiving end does not exist');
    });

    it('chrome: runtime.lastError rejects, and is read', async () => {
        const platform = makeChrome();
        platform.runtime.lastError = { message: 'Receiving end does not exist' };
        const api = createBrowserApi({ api: platform.api, style: 'callback' });

        await expect(api.sendMessage({})).rejects.toThrow('Receiving end does not exist');
    });

    it('chrome: a lastError without a message still rejects', async () => {
        const platform = makeChrome();
        platform.runtime.lastError = {};
        const api = createBrowserApi({ api: platform.api, style: 'callback' });

        await expect(api.sendMessage({})).rejects.toThrow(/Extension API error/);
    });

    it('chrome: a callback fired twice settles once', async () => {
        const twice: ExtensionApi = {
            runtime: {
                lastError: null,
                sendMessage: (_message, callback) => {
                    callback?.('first');
                    callback?.('second');
                },
            },
        };
        const api = createBrowserApi({ api: twice, style: 'callback' });
        await expect(api.sendMessage({})).resolves.toBe('first');
    });

    it('chrome: a success does not leave lastError unread', async () => {
        // Chrome logs "Unchecked runtime.lastError" when nothing reads it, even
        // on a call that worked. Reading it on every callback is the fix.
        const platform = makeChrome();
        const read = vi.fn(() => null);
        Object.defineProperty(platform.runtime, 'lastError', { get: read });
        const api = createBrowserApi({ api: platform.api, style: 'callback' });

        await api.sendMessage({ type: 'DECRYPT_TEXT' });
        expect(read).toHaveBeenCalled();
    });
});
