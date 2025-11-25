declare const browser: any;

/**
 * Gets the redirect URL for OAuth flow, handling cross-browser differences.
 * 
 * Firefox uses the `browser` namespace and may require a specific callback path.
 * Chrome/Edge use the `chrome` namespace.
 * 
 * @param path The path to append to the redirect URL (default: 'provider_cb')
 * @returns The redirect URL
 */
export function getAuthRedirectUrl(path: string = 'provider_cb'): string {
    // Check for Firefox (browser namespace)
    if (typeof browser !== 'undefined' && browser.identity && browser.identity.getRedirectURL) {
        return browser.identity.getRedirectURL(path);
    }

    // Check for Chrome/Edge (chrome namespace)
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL) {
        return chrome.identity.getRedirectURL(path);
    }

    // Fallback for development/web environment (should not happen in extension)
    console.warn('Authentication redirect URL generation failed: browser/chrome.identity API not available.');
    return `https://rolodink.app/${path}`;
}
