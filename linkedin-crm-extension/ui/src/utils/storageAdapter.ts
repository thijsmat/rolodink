import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Custom storage adapter for Supabase to use chrome.storage.local
 * This allows session persistence within the browser extension environment.
 */
declare global {
    interface BrowserAPI {
        storage: {
            local: {
                get: (key: string | string[]) => Promise<Record<string, any>>;
                set: (items: Record<string, any>) => Promise<void>;
                remove: (keys: string | string[]) => Promise<void>;
            };
            onChanged: {
                addListener: (callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) => void;
                removeListener: (callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) => void;
            };
        };
        runtime: {
            sendMessage: (message: any) => Promise<any>;
            onMessage: {
                addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void;
            };
        };
        identity: {
            launchWebAuthFlow: (details: { url: string; interactive?: boolean }) => Promise<string>;
        };
        tabs: {
            query: (queryInfo: any) => Promise<any[]>;
        };
        i18n: {
            getMessage: (messageName: string, substitutions?: string | string[]) => string;
            getUILanguage: () => string;
        };
    }
    const browser: BrowserAPI;
}

const getStorage = () => {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
        return browser.storage.local;
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return chrome.storage.local;
    }
    return null;
};

export const chromeStorageAdapter: SupportedStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const storage = getStorage();
        if (!storage) return null;
        try {
            const result = await storage.get(key);
            return result[key] || null;
        } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        const storage = getStorage();
        if (!storage) return;
        try {
            const updates: Record<string, any> = { [key]: value };

            // Rolodink Fix: Sync access token to a predictable key for content.js
            // Only check Supabase session keys to avoid unnecessary parsing
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                try {
                    const parsed = JSON.parse(value);
                    if (parsed && typeof parsed === 'object' && typeof parsed.access_token === 'string') {
                        updates['supabaseAccessToken'] = parsed.access_token;
                    }
                } catch (e) {
                    // Ignore parsing errors, it might not be a session object
                }
            }

            await storage.set(updates);
        } catch (error) {
            console.error('Error setting item in storage:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        const storage = getStorage();
        if (!storage) return;
        try {
            // Also clean up the synced access token when the Supabase session key is removed
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                await storage.remove([key, 'supabaseAccessToken']);
            } else {
                await storage.remove(key);
            }
        } catch (error) {
            console.error('Error removing item from storage:', error);
        }
    },
};

export function getSupabaseStorageKey(url: string): string {
    const key = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
    return key;
}
