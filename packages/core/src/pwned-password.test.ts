import { describe, it, expect, vi } from 'vitest';
import { PWNED_PASSWORDS_RANGE_URL, isPwnedPassword, pwnedPasswordCount } from './pwned-password.js';

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PREFIX = '5BAA6';
const SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';

function rangeFetch(body: string, status = 200) {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(body, { status }));
}

describe('pwnedPasswordCount', () => {
    it('sends only the first five hash characters, with padding on', async () => {
        const fetch = rangeFetch('');
        await pwnedPasswordCount('password', { fetch });

        expect(fetch).toHaveBeenCalledOnce();
        const [url, init] = fetch.mock.calls[0]!;
        expect(url).toBe(PWNED_PASSWORDS_RANGE_URL + PREFIX);
        expect(String(url)).not.toContain(SUFFIX);
        expect((init?.headers as Record<string, string>)['Add-Padding']).toBe('true');
    });

    it('returns the breach count when the suffix is listed', async () => {
        const fetch = rangeFetch(`0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:9545824\r\n`);
        expect(await pwnedPasswordCount('password', { fetch })).toBe(9545824);
    });

    it('matches the suffix case-insensitively', async () => {
        const fetch = rangeFetch(`${SUFFIX.toLowerCase()}:3`);
        expect(await pwnedPasswordCount('password', { fetch })).toBe(3);
    });

    it('returns 0 when the suffix is not listed', async () => {
        const fetch = rangeFetch('0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n');
        expect(await pwnedPasswordCount('password', { fetch })).toBe(0);
    });

    it('treats a padding row (count 0) as not leaked', async () => {
        const fetch = rangeFetch(`${SUFFIX}:0\r\n`);
        expect(await isPwnedPassword('password', { fetch })).toBe(false);
    });

    it('fails open on an error status', async () => {
        const fetch = rangeFetch('busy', 503);
        expect(await pwnedPasswordCount('password', { fetch })).toBeNull();
        expect(await isPwnedPassword('password', { fetch })).toBe(false);
    });

    it('fails open when the request throws', async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError('network down');
        });
        expect(await pwnedPasswordCount('password', { fetch })).toBeNull();
    });

    it('gives up after the timeout', async () => {
        const fetch = vi.fn(
            (_url: string | URL | Request, init?: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
                }),
        );
        expect(await pwnedPasswordCount('password', { fetch, timeoutMs: 10 })).toBeNull();
    });
});

describe('isPwnedPassword', () => {
    it('is true for a listed password', async () => {
        const fetch = rangeFetch(`${SUFFIX}:12`);
        expect(await isPwnedPassword('password', { fetch })).toBe(true);
    });
});
