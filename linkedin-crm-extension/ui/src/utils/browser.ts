/**
 * Helper to get the browser API object.
 * Firefox uses 'browser', Chrome/Edge use 'chrome'.
 */
export const getBrowserAPI = () => {
    // @ts-ignore - browser is defined in Firefox
    if (typeof browser !== 'undefined') {
        // @ts-ignore
        return browser;
    }
    return chrome;
};
