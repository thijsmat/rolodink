import { useCallback } from 'react';
import { getBrowserAPI } from '../utils/browser';

/**
 * Custom hook for Extension i18n translations.
 * 
 * Rules:
 * 1. Cross-Browser: Tries to use standard WebExtension API (browser.i18n) via utility, falls back to chrome.i18n.
 * 2. Dev Safety: If i18n API is missing (e.g. localhost dev), returns the key itself to prevent crashes.
 */
export function useExtensionTranslation() {
    const t = useCallback((key: string, substitutions?: string | string[]) => {
        const browser = getBrowserAPI();

        // Check if i18n API is available
        if (!browser?.i18n?.getMessage) {
            if (import.meta.env.DEV) {
                console.warn(`[i18n] Missing API for key: ${key}`);
            }
            return key;
        }

        const message = browser.i18n.getMessage(key, substitutions);

        // If message is missing, getMessage returns "" or the key itself in some browsers.
        // We want to ensure we at least return the key so the UI doesn't look broken (empty).
        if (!message) {
            return key;
        }

        return message;
    }, []);

    return { t };
}
