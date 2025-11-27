import { useCallback } from 'react';
import { getBrowserAPI } from '../utils/browser';

export function useTranslation() {
  const t = useCallback((key: string, substitutions?: string | string[]) => {
    const browser = getBrowserAPI();
    // chrome.i18n is available in both Chrome and Firefox (as browser.i18n)
    // The getBrowserAPI helper returns the correct object.

    // Fallback if i18n API is not available (e.g. running in standard web env)
    if (!browser?.i18n?.getMessage) {
      console.warn(`[i18n] Missing translation for key: ${key} (API unavailable)`);
      return key;
    }

    const message = browser.i18n.getMessage(key, substitutions);

    // If message is empty string, it might be a missing key or empty translation.
    // Chrome returns "" for missing keys sometimes, or the key itself if not found?
    // Actually, getMessage returns "" if the message is not found.
    if (!message) {
      // console.warn(`[i18n] Missing translation for key: ${key}`);
      return key;
    }

    return message;
  }, []);

  return { t };
}
