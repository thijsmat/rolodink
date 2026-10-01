/**
 * Test vectors for `profileLookupUrl`: input URL and the key it must map to.
 *
 * One table, run by the core tests, the extension tests and the backend route
 * tests, so the three can never disagree about which URLs are the same
 * profile. Add a row here, not a private case in one suite.
 */
export interface ProfileUrlVector {
    readonly label: string;
    readonly input: string;
    readonly expected: string;
}

const JAN = 'https://www.linkedin.com/in/jan-jansen';
const OPAQUE = 'https://www.linkedin.com/in/ACoAAAxYzAbC';

export const PROFILE_URL_VECTORS: readonly ProfileUrlVector[] = [
    { label: 'already canonical', input: JAN, expected: JAN },
    { label: 'trailing slash', input: `${JAN}/`, expected: JAN },
    { label: 'http scheme', input: 'http://www.linkedin.com/in/jan-jansen', expected: JAN },
    { label: 'bare host', input: 'https://linkedin.com/in/jan-jansen', expected: JAN },
    { label: 'nl subdomain', input: 'https://nl.linkedin.com/in/jan-jansen/', expected: JAN },
    { label: 'de subdomain', input: 'https://de.linkedin.com/in/jan-jansen', expected: JAN },
    { label: 'mobile host', input: 'https://m.linkedin.com/in/jan-jansen', expected: JAN },
    { label: 'uppercase host', input: 'https://WWW.LINKEDIN.COM/in/jan-jansen', expected: JAN },
    { label: 'uppercase slug', input: 'https://www.linkedin.com/in/Jan-Jansen', expected: JAN },
    { label: 'schemeless', input: 'www.linkedin.com/in/jan-jansen', expected: JAN },
    { label: 'surrounding whitespace', input: `  ${JAN}  `, expected: JAN },
    { label: 'originalSubdomain query', input: `${JAN}?originalSubdomain=nl`, expected: JAN },
    { label: 'utm query', input: `${JAN}/?utm_source=share&utm_medium=member_android`, expected: JAN },
    { label: 'locale query', input: `${JAN}?locale=nl_NL`, expected: JAN },
    { label: 'hash fragment', input: `${JAN}#experience`, expected: JAN },
    { label: 'locale suffix', input: `${JAN}/nl`, expected: JAN },
    { label: 'overlay subpage', input: `${JAN}/overlay/contact-info/`, expected: JAN },
    { label: 'details subpage', input: `${JAN}/details/experience/?trk=x`, expected: JAN },
    { label: 'recent activity', input: `${JAN}/recent-activity/all/`, expected: JAN },
    { label: 'mwlite path', input: 'https://www.linkedin.com/mwlite/in/jan-jansen', expected: JAN },
    {
        label: 'percent-encoded slug',
        input: 'https://www.linkedin.com/in/jos%C3%A9-garc%C3%ADa/',
        expected: 'https://www.linkedin.com/in/josé-garcía',
    },
    {
        label: 'percent-encoded uppercase slug',
        input: 'https://nl.linkedin.com/in/JOS%C3%89-Garc%C3%ADa',
        expected: 'https://www.linkedin.com/in/josé-garcía',
    },
    { label: 'decoded unicode slug', input: 'https://www.linkedin.com/in/josé-garcía', expected: 'https://www.linkedin.com/in/josé-garcía' },
    { label: 'member id keeps its case', input: OPAQUE, expected: OPAQUE },
    { label: 'member id on another host', input: 'https://nl.linkedin.com/in/ACoAAAxYzAbC/?trk=x', expected: OPAQUE },
    {
        label: 'company page keeps host, loses query',
        input: 'https://nl.linkedin.com/company/rolodink/?trk=x',
        expected: 'https://nl.linkedin.com/company/rolodink',
    },
    { label: 'non-LinkedIn URL untouched', input: 'https://example.com/in/jan-jansen/', expected: 'https://example.com/in/jan-jansen/' },
    { label: 'lookalike domain untouched', input: 'https://notlinkedin.com/in/jan-jansen', expected: 'https://notlinkedin.com/in/jan-jansen' },
    { label: 'garbage untouched', input: 'not a url at all', expected: 'not a url at all' },
];
