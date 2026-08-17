import './polyfill'; // MUST BE FIRST
import { createClient } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../utils/auth';
import { getBrowserAPI } from '../utils/browser';
import { chromeStorageAdapter } from '../utils/storageAdapter';
import { importDataKey, encryptText, decryptText } from '@rolodink/core';
import { API_BASE_URL } from '../config';

// 1. Immediate Alive Check
console.log('Background script loading (restored)...');
const browserAPI = getBrowserAPI();
if (browserAPI?.storage?.local) {
    browserAPI.storage.local.set({ 'bg_alive_restored': Date.now() });
}

// Helper to log to storage
async function logToStorage(message: string, data?: any) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}`;
        const result = await browserAPI.storage.local.get('debug_logs');
        const logs = result.debug_logs || [];
        logs.push(logEntry);
        if (logs.length > 50) logs.shift();
        await browserAPI.storage.local.set({ debug_logs: logs });
        console.log(logEntry);
    } catch (e) {
        console.error('Failed to log to storage:', e);
    }
}

// Wrap in IIFE to avoid top-level await issues in some environments
(async () => {
    try {
        // Read the version off the manifest. This line used to carry a
        // hardcoded 'v1.1.1', which survived every release since and made the
        // debug log claim an ancient build was running while debugging a
        // genuine auth failure.
        const manifestVersion = browserAPI?.runtime?.getManifest?.().version ?? 'unknown';
        await logToStorage(`Background script loaded (v${manifestVersion})`);
    } catch (e) {
        console.error('Failed to log startup:', e);
    }
})();

// Lazy Supabase Initialization
let supabaseInstance: any = null;

function getSupabase() {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials missing in background script');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: chromeStorageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
    return supabaseInstance;
}

async function handleAuth() {
    await logToStorage('Starting auth flow in background...');

    try {
        // Get Supabase URL from storage (synced from UI) - Optional check
        const config = await browserAPI.storage.local.get('supabaseUrl');
        const supabaseUrl = config.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;

        await logToStorage('Config retrieved', { supabaseUrl });

        if (!supabaseUrl) {
            throw new Error('Supabase URL is not configured.');
        }

        const supabase = getSupabase();

        // 1. Generate Auth URL
        const redirectUrl = getAuthRedirectUrl('provider_cb');
        await logToStorage('Generating auth URL', { redirectUrl });

        const { data, error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'linkedin_oidc',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                scopes: 'email profile openid',
            },
        });

        if (authError) throw authError;
        if (!data?.url) throw new Error('No auth URL generated');

        await logToStorage('Auth URL generated', { url: data.url });

        // 2. Launch Web Auth Flow
        const responseUrl = await browserAPI.identity.launchWebAuthFlow({
            url: data.url,
            interactive: true,
        });

        await logToStorage('WebAuthFlow completed');

        if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
            throw new Error(chrome.runtime.lastError.message || 'Login cancelled');
        }

        if (!responseUrl) {
            throw new Error('Login cancelled');
        }

        // 3. Parse response
        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
            throw new Error(errorDescription || error);
        }

        if (!accessToken) {
            throw new Error('No access token received');
        }

        // 4. Hand the tokens to supabase-js and let it own the session.
        //
        // There used to be a hand-built object written straight to the Supabase
        // storage key here, before this call. It looked harmless and it silently
        // logged everyone out: it carried `expires_in` but no `expires_at`, and
        // auth-js's _isValidSession requires access_token, refresh_token AND
        // expires_at. Anything else is discarded on the next read -
        // GoTrueClient.getSession() calls _removeSession() on it - and our
        // storage adapter deletes the mirrored `supabaseAccessToken` with it, so
        // the content script lost its token too. Logging in appeared to work and
        // the session was gone by the time the popup next opened.
        //
        // setSession writes the session itself, with expires_at derived from the
        // JWT and the real user attached. It is the only writer now. The
        // Supabase docs show exactly this shape, error check included.
        if (!refreshToken) {
            // Not a warning to be logged and walked past: without a refresh
            // token the session cannot be renewed and dies within the hour, and
            // in MV3 nothing refreshes in the background anyway. Better to fail
            // the login than to hand out a session that quietly expires.
            await logToStorage('No refresh_token in OAuth response');
            throw new Error(
                'De inlogpoging gaf geen refresh-token terug. Probeer het opnieuw; blijft dit gebeuren, neem dan contact op met support.'
            );
        }

        await logToStorage('Saving session');

        const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        // Previously discarded. A failure here left the caller believing the
        // login had succeeded while no session existed anywhere.
        if (setSessionError) {
            throw setSessionError;
        }

        await logToStorage('Auth flow completed successfully');
        return { success: true };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logToStorage('Background auth failed', { error: errorMessage });
        console.error('Background auth failed:', error);
        throw error;
    }
}

const DATA_KEY_STORAGE = 'rolodink_data_key';
const DATA_KEY_USER_STORAGE = 'rolodink_data_key_user';
let cachedCryptoKey: CryptoKey | null = null;
let cachedKeyUserId: string | null = null;
let keyPromise: Promise<CryptoKey> | null = null;
let keyPromiseUserId: string | null = null;

function getUserIdFromToken(token: string): string | null {
    try {
        const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadB64));
        return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
        return null;
    }
}

async function clearDataKeyCache(): Promise<void> {
    cachedCryptoKey = null;
    cachedKeyUserId = null;
    keyPromise = null;
    keyPromiseUserId = null;
    try {
        await chrome.storage.session.remove([DATA_KEY_STORAGE, DATA_KEY_USER_STORAGE]);
    } catch (e) {
        console.warn('Kon sleutelcache niet wissen:', e);
    }
}

async function fetchDataKeyFromServer(token: string): Promise<string> {
    // Use the shared, normalised value rather than reading the environment
    // variable again. Reading it raw here is what produced '<host>//api/user/key'
    // when the configured value ended in a slash: the server redirects on the
    // doubled slash, a CORS preflight may not follow a redirect, and the wrapped
    // data key never arrived - so nothing could be decrypted. The old
    // 'http://localhost:3001' fallback is gone with it; a shipped service worker
    // must never quietly aim at a developer machine.
    const response = await fetch(`${API_BASE_URL}/api/user/key`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        throw new Error(`Kon encryptiesleutel niet ophalen (status ${response.status})`);
    }

    const { data_key: dataKey } = await response.json();
    if (!dataKey) {
        throw new Error('Server gaf geen encryptiesleutel terug');
    }

    return dataKey;
}

// De sleutelcache is gebonden aan het user-id uit de actieve sessie: na een
// account-wissel zou hergebruik van de oude sleutel data onleesbaar versleutelen.
async function getDataKey(): Promise<CryptoKey> {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
        await clearDataKeyCache();
        throw new Error('Niet ingelogd: geen sessietoken beschikbaar voor encryptie');
    }
    const userId = session?.user?.id ?? getUserIdFromToken(token);
    if (!userId) {
        await clearDataKeyCache();
        throw new Error('Kon gebruiker niet bepalen voor encryptiesleutel');
    }

    if (cachedCryptoKey && cachedKeyUserId === userId) return cachedCryptoKey;
    if (keyPromise && keyPromiseUserId === userId) return keyPromise;

    keyPromiseUserId = userId;
    keyPromise = (async () => {
        try {
            const stored = await chrome.storage.session.get([DATA_KEY_STORAGE, DATA_KEY_USER_STORAGE]);
            let rawKey: string | undefined =
                stored?.[DATA_KEY_USER_STORAGE] === userId ? stored?.[DATA_KEY_STORAGE] : undefined;

            if (!rawKey) {
                rawKey = await fetchDataKeyFromServer(token);
                await chrome.storage.session.set({
                    [DATA_KEY_STORAGE]: rawKey,
                    [DATA_KEY_USER_STORAGE]: userId,
                });
            }

            cachedCryptoKey = await importDataKey(rawKey);
            cachedKeyUserId = userId;
            return cachedCryptoKey;
        } finally {
            keyPromise = null;
            keyPromiseUserId = null;
        }
    })();

    return keyPromise;
}

/**
 * API calls on behalf of the content script.
 *
 * The content script runs in the page's world, so its origin is
 * https://www.linkedin.com - or nl.linkedin.com, de.linkedin.com, and every
 * other locale host the manifest matches. Its fetches to api.rolodink.app are
 * therefore cross-origin and subject to CORS, and the API allowlists neither
 * (deliberately: cors.ts says in as many words that a malicious *page* is the
 * threat CORS exists to stop, and never to put a wildcard in the web list).
 *
 * Widening that list is not a real option. It would need every locale host
 * enumerated, and the moment LinkedIn adds one the button silently stops
 * working again - the exact failure mode this whole workstream exists to
 * remove. A pattern match would be the wildcard cors.ts forbids.
 *
 * The service worker has host_permissions for api.rolodink.app, so its own
 * fetches are not subject to page CORS at all. Routing through here needs no
 * server change, works on every locale host, and keeps the API's web-origin
 * allowlist as tight as it is.
 *
 * It also means the content script no longer needs the access token: the worker
 * attaches it from the session it already owns. That is the coupling
 * storageAdapter.test.ts documents as fragile - a token mirrored into
 * chrome.storage.local for the content script to read - and this is the first
 * step in being able to drop it.
 *
 * Deliberately not a general-purpose proxy. Path and method are checked against
 * a fixed list, and the base URL is the worker's own. A handler that fetched
 * whatever it was handed would turn every content script into an SSRF gadget
 * against anything the extension's host permissions can reach.
 */
const ALLOWED_API_PATHS = ['/api/connections'] as const;
const ALLOWED_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

async function performApiRequest(message: {
    path?: unknown;
    method?: unknown;
    query?: unknown;
    body?: unknown;
}): Promise<{ status: number; ok: boolean; data: unknown }> {
    const path = message.path;
    const method = typeof message.method === 'string' ? message.method.toUpperCase() : 'GET';

    if (typeof path !== 'string' || !ALLOWED_API_PATHS.includes(path as never)) {
        throw new Error(`Refusing to call disallowed API path: ${String(path)}`);
    }
    if (!ALLOWED_API_METHODS.includes(method as never)) {
        throw new Error(`Refusing to use disallowed method: ${method}`);
    }

    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
        // 401 rather than a thrown error: this is the ordinary "not signed in"
        // state, and the content script already knows how to render it.
        return { status: 401, ok: false, data: null };
    }

    const url = new URL(API_BASE_URL + path);
    if (message.query && typeof message.query === 'object') {
        for (const [key, value] of Object.entries(message.query as Record<string, unknown>)) {
            if (typeof value === 'string') url.searchParams.set(key, value);
        }
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    if (message.body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(url.toString(), {
        method,
        headers,
        body: message.body === undefined ? undefined : JSON.stringify(message.body),
    });

    // Parsed here rather than in the caller: a Response cannot cross the
    // message channel, and an empty or non-JSON body is normal on some of
    // these responses.
    const data = await response.json().catch(() => null);
    return { status: response.status, ok: response.ok, data };
}

// Luister naar berichten van de UI en content scripts
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'START_AUTH') {
            handleAuth()
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true; // Houd kanaal open voor async response
        }

        // Wis de gecachte encryptiesleutel (bij uitloggen)
        if (message.type === 'CLEAR_KEY_CACHE') {
            clearDataKeyCache()
                .then(() => sendResponse({ success: true }))
                .catch((error: Error) => sendResponse({ success: false, error: error.message }));
            return true;
        }

        // Versleutel een stuk tekst met de opgeslagen sessiesleutel
        if (message.type === 'ENCRYPT_TEXT') {
            (async () => {
                try {
                    const key = await getDataKey();
                    const ciphertext = await encryptText(message.text, key);
                    sendResponse({ success: true, ciphertext });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
                    sendResponse({ success: false, error: errorMessage });
                }
            })();
            return true;
        }

        // Doe een API-aanroep namens het content script, dat vanuit de
        // paginacontext geen CORS-toestemming heeft. Zie performApiRequest.
        if (message.type === 'API_REQUEST') {
            (async () => {
                try {
                    const result = await performApiRequest(message);
                    sendResponse({ success: true, ...result });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
                    sendResponse({ success: false, error: errorMessage });
                }
            })();
            return true;
        }

        // Ontsleutel een Base64 ciphertext met de opgeslagen sessiesleutel
        if (message.type === 'DECRYPT_TEXT') {
            (async () => {
                try {
                    const key = await getDataKey();
                    const plaintext = await decryptText(message.ciphertext, key);
                    sendResponse({ success: true, plaintext });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
                    sendResponse({ success: false, error: errorMessage });
                }
            })();
            return true;
        }
    });
}

// Handle installation
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === 'install') {
            // Get user locale
            const uiLang = chrome.i18n.getUILanguage() || 'en';
            const locale = uiLang.startsWith('nl') ? 'nl' : 'en';

            // Website URL
            const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'https://rolodink.app';
            const onboardingUrl = `${websiteUrl}/${locale}/onboarding`;

            await logToStorage(`Extension installed. Redirecting to onboarding: ${onboardingUrl}`);
            chrome.tabs.create({ url: onboardingUrl });
        }
    });
}
