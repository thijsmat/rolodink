import { describe, expect, it } from 'vitest';
import { PROFILE_URL_VECTORS, profileLookupUrl } from '@rolodink/core';

/**
 * The shared URL table, run against the profileLookupUrl this extension
 * actually bundles (through the @rolodink/core alias). The backend route tests
 * run the same table, so popup, content script and API agree on which URLs
 * are one profile.
 */
describe('profileLookupUrl as bundled in the extension', () => {
    it.each(PROFILE_URL_VECTORS.map((v) => [v.label, v.input, v.expected] as const))(
        '%s',
        (_label, input, expected) => {
            expect(profileLookupUrl(input)).toBe(expected);
        },
    );
});
