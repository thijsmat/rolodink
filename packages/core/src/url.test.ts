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
