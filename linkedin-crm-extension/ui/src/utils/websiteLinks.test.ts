import { describe, expect, it } from 'vitest';
import { forgotPasswordUrl, websiteLocaleFor } from './websiteLinks';

describe('websiteLocaleFor', () => {
    it('maps Dutch UI languages to nl', () => {
        expect(websiteLocaleFor('nl')).toBe('nl');
        expect(websiteLocaleFor('nl-BE')).toBe('nl');
        expect(websiteLocaleFor('NL')).toBe('nl');
    });

    it('falls back to en for every other language, so no link ends on a 404', () => {
        expect(websiteLocaleFor('en-US')).toBe('en');
        expect(websiteLocaleFor('de')).toBe('en');
        expect(websiteLocaleFor('')).toBe('en');
    });
});

describe('forgotPasswordUrl', () => {
    it('points at the localized reset page on the website', () => {
        expect(forgotPasswordUrl('nl')).toBe('https://rolodink.app/nl/forgot-password');
        expect(forgotPasswordUrl('fr')).toBe('https://rolodink.app/en/forgot-password');
    });
});
