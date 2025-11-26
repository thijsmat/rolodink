/// <reference types="chrome" />

// Cross-browser API compatibility
// Firefox uses browser.*, Chrome uses chrome.*
// @ts-ignore - browser is defined in Firefox but not in Chrome types
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Define types for messages
interface AuthMessage {
    type: 'START_AUTH';
    url: string;
}

// Listen for messages from the popup
browserAPI.runtime.onMessage.addListener((message: AuthMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'START_AUTH') {
        handleAuth(message.url).then(sendResponse).catch((error) => {
            console.error('Auth error in background:', error);
            sendResponse({ error: error.message });
        });
        return true; // Will respond asynchronously
    }
});

// Calculate the storage key that Supabase uses
// Format: sb-<project-ref>-auth-token
function getSupabaseStorageKey(supabaseUrl: string): string {
    try {
        const url = new URL(supabaseUrl);
        const projectRef = url.hostname.split('.')[0];
        return `sb-${projectRef}-auth-token`;
    } catch {
        return 'sb-auth-token'; // Fallback
    }
}

async function handleAuth(authUrl: string) {


    try {
        // Get Supabase URL from storage (synced from UI)
        const config = await browserAPI.storage.local.get('supabaseUrl');
        const supabaseUrl = config.supabaseUrl;

        if (!supabaseUrl) {
            throw new Error('Supabase URL is not configured. Please open the extension popup first.');
        }

        const responseUrl = await browserAPI.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true,
        });

        // Check for errors (Chrome uses chrome.runtime.lastError, Firefox throws)
        if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
            throw new Error(chrome.runtime.lastError.message || 'Login geannuleerd');
        }

        if (!responseUrl) {
            throw new Error('Login geannuleerd');
        }



        // Parse hash fragment from response URL
        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.substring(1)); // remove #
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
            throw new Error(errorDescription || error);
        }

        if (!accessToken) {
            throw new Error('Geen access token ontvangen');
        }

        // Store session in chrome.storage.local in Supabase's expected format
        // Supabase stores the session as a JSON string under a specific key
        const sessionData = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
            token_type: 'bearer',
            user: null, // Supabase will fetch user data when the session is loaded
        };

        const storageKey = getSupabaseStorageKey(supabaseUrl);


        await browserAPI.storage.local.set({
            [storageKey]: JSON.stringify(sessionData),
        });



        return { success: true, accessToken, refreshToken };

    } catch (error: any) {
        console.error('Background auth failed:', error);
        throw error;
    }
}
