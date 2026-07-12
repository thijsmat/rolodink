import './polyfill'; // MUST BE FIRST
import { createClient } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../utils/auth';
import { getBrowserAPI } from '../utils/browser';
import { chromeStorageAdapter, getSupabaseStorageKey } from '../utils/storageAdapter';
import { importDataKey, encryptText, decryptText } from '../utils/cryptoHelper';

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
        await logToStorage('Background script loaded (v1.1.1)');
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
        const expiresIn = hashParams.get('expires_in');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
            throw new Error(errorDescription || error);
        }

        if (!accessToken) {
            throw new Error('No access token received');
        }

        // 4. Store session
        if (!refreshToken) {
            console.warn('[Rolodink] OAuth redirect did not include a refresh_token. Session will not be refreshable and will expire.');
            await logToStorage('Warning: No refresh_token in OAuth response');
        }

        const sessionData = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
            token_type: 'bearer',
            user: null,
        };

        const storageKey = getSupabaseStorageKey(supabaseUrl);
        await logToStorage('Saving session');

        await browserAPI.storage.local.set({
            [storageKey]: JSON.stringify(sessionData),
        });

        // 5. Notify Supabase client
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
        });

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${apiBase}/api/user/key`, {
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
