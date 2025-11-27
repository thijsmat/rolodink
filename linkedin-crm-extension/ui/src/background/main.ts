import { createClient } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../utils/auth';
import { getBrowserAPI } from '../utils/browser';
import { chromeStorageAdapter, getSupabaseStorageKey } from '../utils/storageAdapter';

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

try {
    await logToStorage('Background script loaded (v1.0.9-lazy)');
} catch (e) {
    console.error(e);
}

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

    } catch (error: any) {
        await logToStorage('Background auth failed', { error: error.message || error });
        console.error('Background auth failed:', error);
        throw error;
    }
}

// Listen for messages
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'START_AUTH') {
            handleAuth()
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true; // Keep channel open
        }
    });
}
