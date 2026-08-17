import { describe, expect, it } from 'vitest';
import backgroundSource from './background/main.ts?raw';
import contentSource from './content/main.js?raw';

/**
 * The content script must not call the API directly, and the worker that calls
 * it for them must not be a general-purpose proxy.
 *
 * Source-text checks again, for the same reason as auth-invariants.ts: both
 * failures are invisible at runtime from inside a test. A direct fetch only
 * fails in a real browser, against a real cross-origin preflight, on a page
 * nobody can load in CI. And a proxy that fetches whatever it is handed looks
 * exactly like one that does not, right up until it is asked to fetch
 * something else.
 *
 * The behaviour these guard was found the hard way: with the button finally
 * rendering, every call it made died on
 *
 *   Access to fetch at 'https://api.rolodink.app/api/connections' from origin
 *   'https://www.linkedin.com' has been blocked by CORS policy
 */

const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('the content script does not talk to the API itself', () => {
    // It runs in the page's world, so its origin is www.linkedin.com - or
    // nl.linkedin.com, or any other locale host the manifest matches. cors.ts
    // allowlists none of them on purpose, and widening it to cover every
    // locale host is precisely the wildcard that file forbids.
    it('contains no fetch call', () => {
        expect(stripComments(contentSource)).not.toMatch(/\bfetch\s*\(/);
    });

    // The mirrored token existed so the content script could authenticate its
    // own requests. It makes none now, so reading the token would be a step
    // back towards a coupling storageAdapter.test.ts already documents as
    // fragile - removing a session takes the mirrored copy with it.
    it('never reads the mirrored access token', () => {
        expect(stripComments(contentSource)).not.toMatch(/supabaseAccessToken/);
    });
});

describe('the worker proxy is not a general-purpose one', () => {
    // A handler that fetched any URL handed to it would turn the content
    // script into an SSRF gadget against everything the extension's host
    // permissions can reach. Path and method are checked against fixed lists.
    it('checks the path against an allowlist', () => {
        const code = stripComments(backgroundSource);
        expect(code).toMatch(/ALLOWED_API_PATHS/);
        expect(code).toMatch(/ALLOWED_API_PATHS\.includes/);
    });

    it('checks the method against an allowlist', () => {
        const code = stripComments(backgroundSource);
        expect(code).toMatch(/ALLOWED_API_METHODS/);
        expect(code).toMatch(/ALLOWED_API_METHODS\.includes/);
    });

    // The URL is built from the worker's own compiled-in base plus an
    // allowlisted path. A caller-supplied base or full URL would make both
    // allowlists decorative.
    it('builds the URL from its own base rather than from the message', () => {
        const code = stripComments(backgroundSource);
        expect(code).toMatch(/new URL\(API_BASE_URL \+ path\)/);
        expect(code).not.toMatch(/new URL\(\s*message\./);
    });

    // The point of the whole exercise: the content script no longer needs a
    // token because the worker attaches one from the session it owns.
    it('attaches the token from its own session', () => {
        const code = stripComments(backgroundSource);
        expect(code).toMatch(/supabase\.auth\.getSession\(\)/);
        expect(code).toMatch(/Authorization: `Bearer \$\{accessToken\}`/);
    });
});
