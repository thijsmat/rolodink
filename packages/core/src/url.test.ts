import { describe, it, expect } from 'vitest';
import {
    normalizeLinkedInUrl,
    legacyNormalizeLinkedInUrl,
    getProfileSlug,
    isOpaqueProfileId,
    deriveNameFromSlug,
    extractLinkedInProfileUrl,
    buildLookupCandidates,
    isSameProfile,
} from './url.js';

const CANONICAL = 'https://www.linkedin.com/in/jan-jansen';

describe('normalizeLinkedInUrl', () => {
    it('leaves an already-canonical desktop URL untouched', () => {
        // This is the case that must not regress: it is what the extension has
        // been storing all along, so canonical output has to equal it exactly.
        expect(normalizeLinkedInUrl(CANONICAL)).toBe(CANONICAL);
    });

    it.each([
        ['trailing slash', 'https://www.linkedin.com/in/jan-jansen/'],
        ['Android share tracking', 'https://www.linkedin.com/in/jan-jansen?utm_source=share&utm_medium=member_android'],
        ['iOS share tracking', 'https://www.linkedin.com/in/jan-jansen?utm_source=share&utm_medium=member_ios'],
        ['localized host', 'https://nl.linkedin.com/in/jan-jansen'],
        ['bare host', 'https://linkedin.com/in/jan-jansen'],
        ['mobile host', 'https://m.linkedin.com/in/jan-jansen'],
        ['mwlite path', 'https://www.linkedin.com/mwlite/in/jan-jansen'],
        ['profile subpage', 'https://www.linkedin.com/in/jan-jansen/details/experience'],
        ['hash fragment', 'https://www.linkedin.com/in/jan-jansen#experience'],
        ['uppercase host', 'https://WWW.LINKEDIN.COM/in/jan-jansen'],
        ['schemeless', 'www.linkedin.com/in/jan-jansen'],
        ['http scheme', 'http://www.linkedin.com/in/jan-jansen'],
        ['surrounding whitespace', '  https://www.linkedin.com/in/jan-jansen  '],
        ['miniProfileUrn noise', 'https://www.linkedin.com/in/jan-jansen?miniProfileUrn=urn%3Ali%3Afs_x&trk=abc'],
    ])('canonicalises %s', (_label, input) => {
        expect(normalizeLinkedInUrl(input)).toBe(CANONICAL);
    });

    it('preserves slug case, because opaque member IDs are case-sensitive', () => {
        const opaque = 'https://www.linkedin.com/in/ACoAAAxYzAbC';
        expect(normalizeLinkedInUrl(opaque)).toBe(opaque);
    });

    it.each([
        ['a non-LinkedIn URL', 'https://example.com/in/jan-jansen'],
        ['a lookalike domain', 'https://notlinkedin.com/in/jan-jansen'],
        ['a company page', 'https://www.linkedin.com/company/rolodink'],
        ['the feed', 'https://www.linkedin.com/feed/'],
        ['plain garbage', 'not a url at all'],
        ['an empty string', ''],
    ])('returns %s unchanged rather than mangling it', (_label, input) => {
        expect(normalizeLinkedInUrl(input)).toBe(input);
    });
});

describe('legacyNormalizeLinkedInUrl', () => {
    it('matches what the extension and backend already do', () => {
        expect(legacyNormalizeLinkedInUrl('https://www.linkedin.com/in/jan-jansen?x=1#y')).toBe(CANONICAL);
        expect(legacyNormalizeLinkedInUrl('https://www.linkedin.com/in/jan-jansen/')).toBe(CANONICAL);
    });

    it('keeps the host, which is why rows can exist under nl.linkedin.com', () => {
        expect(legacyNormalizeLinkedInUrl('https://nl.linkedin.com/in/jan-jansen?utm_source=share'))
            .toBe('https://nl.linkedin.com/in/jan-jansen');
    });
});

/**
 * The regression guard for the lookup path.
 *
 * `GET /api/connections?url=` is an exact string match and the server does not
 * normalize the parameter, so a lookup only hits a stored row if it sends the
 * string that was stored. Rows were written by the legacy normalizer, which
 * preserves the host. Switching the extension to the canonical form would make
 * every non-`www` row unfindable: the button would stop saying "Already added",
 * the note card would claim the profile is not in the CRM, and a note typed
 * into it could not be saved.
 *
 * These tests exist so that switch cannot happen quietly.
 */
describe('legacy and canonical normalisation differ on host, deliberately', () => {
    it.each([
        ['localized', 'https://nl.linkedin.com/in/jan-jansen'],
        ['bare', 'https://linkedin.com/in/jan-jansen'],
        ['mobile', 'https://m.linkedin.com/in/jan-jansen'],
        ['German', 'https://de.linkedin.com/in/jan-jansen'],
    ])('canonical rewrites the %s host to www, legacy leaves it alone', (_label, input) => {
        expect(normalizeLinkedInUrl(input)).toBe(CANONICAL);
        expect(legacyNormalizeLinkedInUrl(input)).toBe(input);
        // The two forms must actually differ, otherwise this test would still
        // pass after someone made legacy canonicalise the host too.
        expect(legacyNormalizeLinkedInUrl(input)).not.toBe(normalizeLinkedInUrl(input));
    });

    it('agrees with canonical only when the host is already www', () => {
        expect(legacyNormalizeLinkedInUrl(CANONICAL)).toBe(normalizeLinkedInUrl(CANONICAL));
    });

    it('legacy keeps profile subpaths, canonical strips them to the slug', () => {
        // A row stored from a subpage keeps the subpage in its URL, so the
        // legacy form has to reproduce that too.
        const subpage = 'https://www.linkedin.com/in/jan-jansen/details/experience';
        expect(legacyNormalizeLinkedInUrl(subpage)).toBe(subpage);
        expect(normalizeLinkedInUrl(subpage)).toBe(CANONICAL);
    });

    it('offers both forms as lookup candidates when they differ', () => {
        const candidates = buildLookupCandidates('https://nl.linkedin.com/in/jan-jansen?utm_source=share');
        expect(candidates).toContain(CANONICAL);
        expect(candidates).toContain('https://nl.linkedin.com/in/jan-jansen');
    });

    it('offers a single candidate when the two forms coincide', () => {
        expect(buildLookupCandidates(CANONICAL)).toEqual([CANONICAL]);
    });
});

describe('buildLookupCandidates', () => {
    it('offers one candidate when both normalizers agree', () => {
        expect(buildLookupCandidates(CANONICAL)).toEqual([CANONICAL]);
    });

    it('offers the canonical and the stored-as form when the host differs', () => {
        expect(buildLookupCandidates('https://nl.linkedin.com/in/jan-jansen?utm_source=share')).toEqual([
            CANONICAL,
            'https://nl.linkedin.com/in/jan-jansen',
        ]);
    });
});

describe('getProfileSlug', () => {
    it.each([
        ['https://www.linkedin.com/in/jan-jansen', 'jan-jansen'],
        ['https://nl.linkedin.com/in/jan-jansen/details/experience', 'jan-jansen'],
        ['https://www.linkedin.com/mwlite/in/jan-jansen', 'jan-jansen'],
        ['https://www.linkedin.com/in/ACoAAAxYzAbC', 'ACoAAAxYzAbC'],
    ])('reads the slug from %s', (input, expected) => {
        expect(getProfileSlug(input)).toBe(expected);
    });

    it('decodes percent-encoded slugs', () => {
        expect(getProfileSlug('https://www.linkedin.com/in/jos%C3%A9-garc%C3%ADa')).toBe('josé-garcía');
    });

    it('returns null for non-profile URLs', () => {
        expect(getProfileSlug('https://www.linkedin.com/company/rolodink')).toBeNull();
        expect(getProfileSlug('https://example.com/in/x')).toBeNull();
        expect(getProfileSlug('rubbish')).toBeNull();
    });
});

describe('isOpaqueProfileId', () => {
    it('flags LinkedIn member IDs', () => {
        expect(isOpaqueProfileId('ACoAAAxYzAbC')).toBe(true);
        expect(isOpaqueProfileId('acoaaaxyzabc')).toBe(true);
    });

    it('does not flag vanity slugs', () => {
        expect(isOpaqueProfileId('jan-jansen')).toBe(false);
        expect(isOpaqueProfileId(null)).toBe(false);
    });
});

describe('deriveNameFromSlug', () => {
    it.each([
        ['jan-jansen', 'Jan Jansen'],
        ['jan-jansen-1a2b3c4', 'Jan Jansen'],
        ['sanne-de-vries-98765432', 'Sanne De Vries'],
        ['madonna', 'Madonna'],
    ])('turns %s into a display name', (slug, expected) => {
        expect(deriveNameFromSlug(slug)).toBe(expected);
    });

    it('refuses to guess a name from an opaque ID', () => {
        expect(deriveNameFromSlug('ACoAAAxYzAbC')).toBeNull();
    });

    it('returns null when there is nothing to work with', () => {
        expect(deriveNameFromSlug(null)).toBeNull();
        expect(deriveNameFromSlug('')).toBeNull();
    });

    it('keeps a purely numeric slug rather than emptying it', () => {
        expect(deriveNameFromSlug('12345')).toBe('12345');
    });
});

describe('extractLinkedInProfileUrl', () => {
    it('finds the URL inside an Android share blob', () => {
        const shared = "Check out Jan Jansen's profile on LinkedIn https://www.linkedin.com/in/jan-jansen?utm_source=share";
        expect(extractLinkedInProfileUrl(shared))
            .toBe('https://www.linkedin.com/in/jan-jansen?utm_source=share');
    });

    it('finds a bare URL', () => {
        expect(extractLinkedInProfileUrl(CANONICAL)).toBe(CANONICAL);
    });

    it('finds an mwlite URL', () => {
        expect(extractLinkedInProfileUrl('kijk: https://www.linkedin.com/mwlite/in/jan-jansen'))
            .toBe('https://www.linkedin.com/mwlite/in/jan-jansen');
    });

    it('ignores text without a profile URL', () => {
        expect(extractLinkedInProfileUrl('https://www.linkedin.com/feed/')).toBeNull();
        expect(extractLinkedInProfileUrl('geen link hier')).toBeNull();
        expect(extractLinkedInProfileUrl(null)).toBeNull();
        expect(extractLinkedInProfileUrl(undefined)).toBeNull();
    });
});

describe('isSameProfile', () => {
    it('matches across hosts and tracking parameters', () => {
        expect(isSameProfile(
            'https://nl.linkedin.com/in/jan-jansen?utm_source=share',
            'https://www.linkedin.com/in/jan-jansen'
        )).toBe(true);
    });

    it('does not match different people', () => {
        expect(isSameProfile(CANONICAL, 'https://www.linkedin.com/in/sanne-de-vries')).toBe(false);
    });

    it('does not match when either side is not a profile', () => {
        expect(isSameProfile(CANONICAL, 'https://example.com')).toBe(false);
    });
});
