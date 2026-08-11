import { describe, expect, it } from 'vitest';
import { normalizeApiBaseUrl, resolveApiBaseUrl } from './api.js';

const PROD = 'https://api.rolodink.app';

describe('normalizeApiBaseUrl', () => {
    it('leaves an already-clean URL alone', () => {
        expect(normalizeApiBaseUrl(PROD)).toBe(PROD);
    });

    // The regression this file exists for. A single trailing slash turned
    // `${base}/api/user/key` into `//api/user/key`, which the server answers
    // with a redirect - and a redirect to a CORS preflight is rejected outright.
    it('strips a trailing slash', () => {
        expect(normalizeApiBaseUrl(`${PROD}/`)).toBe(PROD);
    });

    it('strips repeated trailing slashes', () => {
        expect(normalizeApiBaseUrl(`${PROD}///`)).toBe(PROD);
    });

    it('strips surrounding whitespace before the slash check', () => {
        expect(normalizeApiBaseUrl(`  ${PROD}/  `)).toBe(PROD);
    });

    it('never produces a doubled slash when a path is appended', () => {
        for (const input of [PROD, `${PROD}/`, `${PROD}//`, ` ${PROD}/ `]) {
            expect(`${normalizeApiBaseUrl(input)}/api/user/key`).toBe(`${PROD}/api/user/key`);
        }
    });

    it('keeps a path prefix intact, minus its trailing slash', () => {
        expect(normalizeApiBaseUrl('https://example.test/backend/')).toBe(
            'https://example.test/backend'
        );
    });

    it('returns an empty string for anything that is not a usable string', () => {
        for (const input of [undefined, null, '', '   ', 42, {}, []]) {
            expect(normalizeApiBaseUrl(input)).toBe('');
        }
    });

    // '/' normalises to '' rather than to itself, so it falls through to the
    // caller's default instead of turning every request into a relative one.
    it('reduces a bare slash to empty', () => {
        expect(normalizeApiBaseUrl('/')).toBe('');
    });
});

describe('resolveApiBaseUrl', () => {
    it('takes the first usable candidate', () => {
        expect(resolveApiBaseUrl('https://stored.test/', PROD)).toBe('https://stored.test');
    });

    it('skips empty and whitespace-only candidates', () => {
        expect(resolveApiBaseUrl('', '   ', `${PROD}/`)).toBe(PROD);
    });

    // The case that shipped as `|| 'http://localhost:3001'` in the service
    // worker: a missing environment variable must reach the real default.
    it('skips undefined candidates so a missing env var falls through', () => {
        expect(resolveApiBaseUrl(undefined, PROD)).toBe(PROD);
    });

    it('returns empty when nothing is usable', () => {
        expect(resolveApiBaseUrl(undefined, null, '  ')).toBe('');
    });
});
