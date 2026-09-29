import { describe, expect, it } from 'vitest';
import backgroundSource from './main.ts?raw';

/**
 * The service worker reaches the extension platform through getBrowserAPI()
 * only. A bare `chrome.*` call works in Chrome and Edge and misbehaves in
 * Firefox, where that global is a callback-style shim: an `await` on it yields
 * undefined instead of throwing, so the data key is silently never cached and
 * never cleared on sign-out. Nothing raises, which is why this is guarded as
 * source text - the same reasoning as selector-invariants.test.ts.
 */
const code = backgroundSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

describe('background worker platform access', () => {
    it('makes no bare chrome.* calls', () => {
        expect(code).not.toMatch(/\bchrome\.\w/);
    });

    it('does not read runtime.lastError after an await', () => {
        expect(code).not.toContain('lastError');
    });

    it('registers its listeners on the resolved platform object', () => {
        expect(code).toContain('browserAPI.runtime.onMessage.addListener');
        expect(code).toContain('browserAPI.runtime.onInstalled.addListener');
        expect(code).toContain('browserAPI.storage.session');
    });
});
