/**
 * Helper to get the browser API object.
 * Firefox uses 'browser', Chrome/Edge use 'chrome'.
 *
 * Typed as `typeof chrome` because the two share one surface, and the call
 * styles agree where it matters: `browser.*` is promise-native, and Chrome's
 * MV3 `chrome.*` returns a promise whenever no callback is passed. Anything
 * that awaits must go through here and not through a bare `chrome.*`: in
 * Firefox that global is a callback-style compatibility shim, and an await on
 * it fails silently instead of throwing.
 */
export const getBrowserAPI = (): typeof chrome => {
    // @ts-ignore - browser is defined in Firefox
    if (typeof browser !== 'undefined') {
        // @ts-ignore
        return browser;
    }
    return chrome;
};
