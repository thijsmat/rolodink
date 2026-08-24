/**
 * The one place the content script talks to the extension platform.
 *
 * It exists so a single bundle can run in Chrome, Edge and Firefox. Until now
 * Firefox ran its own hand-maintained content-firefox.js — 353 lines against
 * 900, with no injectContextField at all, so Firefox users have never had the
 * inline note card. The fork was kept because the two platforms disagree about
 * how their APIs are called, and that disagreement lives here now.
 *
 * **Two calling styles, chosen up front rather than probed.**
 *
 * Firefox's `browser.*` is promise-native. Chrome's `chrome.*` takes a
 * callback and reports failure through `runtime.lastError`. Chrome has since
 * grown promise support, but callbacks work on every version of it, so that is
 * what we use there.
 *
 * The style is decided from which global exists, synchronously, before any
 * call. That matters more than it looks: the obvious alternative — call it and
 * see whether a promise comes back — cannot be made safe for `sendMessage`.
 * A call with no callback has already sent the message, so discovering "this
 * API is callback-style" means the reply to that first message is gone. There
 * is no free probe, so there is no probe.
 *
 * `browser` is preferred where both exist: Firefox defines `chrome` too, as a
 * callback-style compatibility shim, and promises are the better contract.
 * A Chrome extension carrying webextension-polyfill lands on the same path,
 * which is also correct — that polyfill *is* promise-style.
 *
 * Everything is injectable, because the whole point is behaviour we cannot
 * observe here: there is no Firefox in CI and none on the machine this is
 * developed from. browser-api.test.ts runs the same assertions against a fake
 * of each platform.
 */

type Callback<T> = (value: T) => void;

export interface RuntimeApi {
    sendMessage(message: unknown, callback?: Callback<unknown>): unknown;
    lastError?: { message?: string } | null;
}

export interface StorageArea {
    get(keys: string[] | string | null, callback?: Callback<Record<string, unknown>>): unknown;
    set(items: Record<string, unknown>, callback?: Callback<void>): unknown;
}

export interface ExtensionApi {
    runtime: RuntimeApi;
    storage?: { local?: StorageArea };
}

export type ApiStyle = 'promise' | 'callback';

export interface ResolvedApi {
    api: ExtensionApi;
    style: ApiStyle;
}

/** The globals to look in. A parameter so tests do not touch globalThis. */
export interface ApiScope {
    browser?: unknown;
    chrome?: unknown;
}

const hasRuntime = (candidate: unknown): candidate is ExtensionApi =>
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof (candidate as ExtensionApi).runtime?.sendMessage === 'function';

/**
 * Which platform we are on, or null when neither global is there.
 *
 * Null is a real case, not paranoia: the content script keeps running after
 * the extension is reloaded or removed, and the page it is injected into is
 * not ours. Callers must handle it rather than assume a platform.
 */
export function resolveExtensionApi(scope: ApiScope = globalThis as ApiScope): ResolvedApi | null {
    if (hasRuntime(scope.browser)) return { api: scope.browser, style: 'promise' };
    if (hasRuntime(scope.chrome)) return { api: scope.chrome, style: 'callback' };
    return null;
}

/**
 * Wraps a callback-style call. Rejects on `runtime.lastError`, which is how
 * Chrome reports a dead service worker or an invalidated extension context —
 * the same conditions Firefox reports by rejecting its promise.
 */
function fromCallback<T>(
    runtime: RuntimeApi,
    invoke: (callback: Callback<T>) => void,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        let settled = false;
        const finish = (act: () => void) => {
            if (settled) return;
            settled = true;
            act();
        };
        try {
            invoke((value) => {
                const error = runtime.lastError;
                // Reading lastError is what marks it handled in Chrome; leaving
                // it unread logs an "Unchecked runtime.lastError" warning even
                // when the call succeeded.
                if (error) finish(() => reject(new Error(error.message ?? 'Extension API error')));
                else finish(() => resolve(value));
            });
        } catch (error) {
            finish(() => reject(error instanceof Error ? error : new Error(String(error))));
        }
    });
}

/** Wraps a promise-style call so a synchronous throw becomes a rejection too. */
function fromPromise<T>(invoke: () => unknown): Promise<T> {
    try {
        return Promise.resolve(invoke() as T | PromiseLike<T>);
    } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
}

export interface BrowserApi {
    /** True when storage is reachable. False after the extension is reloaded. */
    hasStorage(): boolean;
    sendMessage(message: unknown): Promise<unknown>;
    storageGet(keys: string[] | string): Promise<Record<string, unknown>>;
    storageSet(items: Record<string, unknown>): Promise<void>;
}

export function createBrowserApi({ api, style }: ResolvedApi): BrowserApi {
    const local = () => api.storage?.local;

    const missingStorage = <T>(): Promise<T> =>
        Promise.reject(new Error('Extension storage is not available'));

    return {
        hasStorage: () => Boolean(local()),

        sendMessage(message) {
            if (style === 'promise') {
                return fromPromise(() => api.runtime.sendMessage(message));
            }
            return fromCallback(api.runtime, (callback) => {
                api.runtime.sendMessage(message, callback);
            });
        },

        storageGet(keys) {
            const area = local();
            if (!area) return missingStorage();
            if (style === 'promise') {
                return fromPromise(() => area.get(keys));
            }
            return fromCallback(api.runtime, (callback) => {
                area.get(keys, callback);
            });
        },

        storageSet(items) {
            const area = local();
            if (!area) return missingStorage();
            if (style === 'promise') {
                return fromPromise<void>(() => area.set(items));
            }
            return fromCallback<void>(api.runtime, (callback) => {
                area.set(items, callback);
            });
        },
    };
}

/**
 * The API for the platform we are actually on, or null off-platform.
 *
 * Resolved once at import: the globals do not change under a running content
 * script, and an extension reload replaces the script rather than mutating it.
 */
export function getBrowserApi(scope: ApiScope = globalThis as ApiScope): BrowserApi | null {
    const resolved = resolveExtensionApi(scope);
    return resolved ? createBrowserApi(resolved) : null;
}
