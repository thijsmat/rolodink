/**
 * Polyfills for Service Worker environment
 * This is required because some dependencies (like @supabase/auth-js) 
 * expect a browser environment with window/document/localStorage.
 */

// Mock window
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    (self as any).window = self;
}

// Mock document
if (typeof document === 'undefined') {
    (self as any).document = {
        location: {
            href: 'chrome-extension://' + (chrome?.runtime?.id || 'unknown') + '/',
            protocol: 'chrome-extension:',
            host: chrome?.runtime?.id || 'unknown',
            hostname: chrome?.runtime?.id || 'unknown',
            origin: 'chrome-extension://' + (chrome?.runtime?.id || 'unknown'),
            pathname: '/',
            search: '',
            hash: '',
        },
        visibilityState: 'visible',
        addEventListener: () => { },
        removeEventListener: () => { },
    };
}

// Mock localStorage (in-memory only, just to prevent crashes)
if (typeof localStorage === 'undefined') {
    const store: Record<string, string> = {};
    (self as any).localStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = String(value); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { for (const key in store) delete store[key]; },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() { return Object.keys(store).length; },
    };
}

// Mock XMLHttpRequest if missing (rarely needed but good for safety)
if (typeof XMLHttpRequest === 'undefined') {
    (self as any).XMLHttpRequest = function () {
        return {
            open: () => { },
            send: () => { },
            setRequestHeader: () => { },
            getAllResponseHeaders: () => '',
            onreadystatechange: () => { },
        };
    };
}
