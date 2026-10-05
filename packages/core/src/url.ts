/**
 * LinkedIn profile URL handling.
 *
 * This replaces five near-identical copies of the same logic (three in
 * `content.js` / `useConnectionLogic.ts`, one in `content-firefox.js`, one in
 * the backend's `connections/route.ts`).
 *
 * `profileLookupUrl` is the one function every client and the API route a
 * profile URL through before it is used for lookup, create, update or as a
 * cache key. It returns the canonical form of `normalizeLinkedInUrl` for a
 * profile URL. The API applies it on every write and on `GET ?url=`, so two
 * URLs for the same person can no longer become two rows.
 *
 * `legacyNormalizeLinkedInUrl` reproduces what the extension sent before:
 * strip query, hash and trailing slash, keep the host and the full path. Rows
 * stored before the API canonicalised can look like that (`nl.linkedin.com`,
 * `/in/<slug>/details/…`, mixed case). The API still finds those by comparing
 * `profileLookupUrl` of the stored value, see `findOwnedConnectionByUrl` in
 * the backend; `buildLookupCandidates` remains for clients that may talk to an
 * API that does not canonicalise yet.
 */

const LINKEDIN_HOST = /(^|\.)linkedin\.com$/;
const CANONICAL_HOST = 'www.linkedin.com';

/** Matches the current extension/backend behaviour. Use it to find existing rows. */
export function legacyNormalizeLinkedInUrl(rawUrl: string): string {
    let normalized = rawUrl.split('?')[0]?.split('#')[0] ?? rawUrl;
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return normalized;
}

/** Parses a URL that may lack its scheme; null when it does not parse. */
function parseLoose(rawUrl: string): URL | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        return new URL(withScheme);
    } catch {
        return null;
    }
}

function isLinkedInHost(url: URL): boolean {
    return LINKEDIN_HOST.test(url.hostname.toLowerCase());
}

/**
 * Canonical form: `https://www.linkedin.com/in/<slug>`.
 *
 * - host forced to `www.linkedin.com` and scheme to https;
 * - path reduced to the first segment after `/in/` (drops `/overlay/…`,
 *   `/details/…`, `/recent-activity/…` and a locale suffix such as `/nl`);
 * - query and hash dropped (`?originalSubdomain=`, `?locale=`, utm, trk …);
 * - the slug percent-decoded and, for vanity slugs, lowercased: LinkedIn
 *   treats `/in/Jan-Jansen` and `/in/jan-jansen` as the same profile.
 *
 * Opaque member IDs (`/in/ACoAA…`) keep their case: they are base64-like and
 * case-sensitive. They also cannot be mapped to the vanity slug offline, so a
 * profile saved once under its member ID and once under its slug stays two
 * rows. That is a known limitation.
 *
 * Anything that is not a LinkedIn profile URL is returned untouched rather than
 * mangled — callers decide what to do with it.
 */
export function normalizeLinkedInUrl(rawUrl: string): string {
    const url = parseLoose(rawUrl);
    if (!url || !isLinkedInHost(url)) return rawUrl;

    const slug = extractSlugFromPath(url.pathname);
    if (!slug) return rawUrl;

    return `https://${CANONICAL_HOST}/in/${canonicalSlug(slug)}`;
}

/**
 * The one key for a profile URL: what the extension sends to the API for
 * lookup, create and update, what the API stores, and what both use as a
 * cache or dedupe key.
 *
 * LinkedIn profile URLs get the canonical form of `normalizeLinkedInUrl`.
 * Anything else keeps the behaviour the API has always had: for a LinkedIn
 * host query, hash and one trailing slash are stripped (company pages and the
 * like); any other URL is returned as it came in.
 */
export function profileLookupUrl(rawUrl: string): string {
    const url = parseLoose(rawUrl);
    if (!url || !isLinkedInHost(url)) return rawUrl;
    if (extractSlugFromPath(url.pathname)) return normalizeLinkedInUrl(rawUrl);

    url.search = '';
    url.hash = '';
    let pathname = url.pathname.trim();
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    url.pathname = pathname;
    return url.toString();
}

/** True for a URL that `profileLookupUrl` reduces to `https://www.linkedin.com/in/<slug>`. */
export function isLinkedInProfileUrl(rawUrl: string): boolean {
    return getProfileSlug(rawUrl) !== null;
}

/**
 * Lowercases a vanity slug, never a member ID. A slug that only decodes into
 * something that is not a single path segment keeps its encoded form, so the
 * canonical URL always parses back to the same slug.
 */
function canonicalSlug(slug: string): string {
    const safe = /[/?#%\s]/.test(slug) ? encodeURIComponent(slug) : slug;
    return isOpaqueProfileId(safe) ? safe : safe.toLowerCase();
}

/**
 * Pulls `<slug>` out of a profile path, tolerating the mobile-web `/mwlite`
 * prefix and any trailing subpage such as `/details/experience`.
 *
 * Split on `/` rather than a regex: no backtracking to think about.
 * The slug keeps its original case here; `canonicalSlug` decides about case.
 */
function extractSlugFromPath(pathname: string): string | null {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0]?.toLowerCase() === 'mwlite') segments.shift();
    if (segments[0] !== 'in' || !segments[1]) return null;
    const segment = segments[1];
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

/** The profile slug as written (decoded, case kept), or null when the URL is not a LinkedIn profile. */
export function getProfileSlug(rawUrl: string): string | null {
    const url = parseLoose(rawUrl);
    if (!url || !isLinkedInHost(url)) return null;
    return extractSlugFromPath(url.pathname);
}

/**
 * LinkedIn sometimes shares an opaque member ID instead of the vanity slug.
 * Those carry no readable name and cannot be resolved to one without scraping,
 * so the UI has to ask the user which contact they meant.
 */
export function isOpaqueProfileId(slug: string | null | undefined): boolean {
    return typeof slug === 'string' && /^ACoAA/i.test(slug);
}

/**
 * Best-effort display name from a vanity slug: `jan-jansen-1a2b3c4` becomes
 * "Jan Jansen". Returns null for opaque IDs, where guessing would be worse than
 * admitting we do not know.
 */
export function deriveNameFromSlug(slug: string | null | undefined): string | null {
    if (!slug || isOpaqueProfileId(slug)) return null;

    const parts = slug.split('-').filter(Boolean);
    // Trailing hex/numeric segments are LinkedIn's disambiguator, not the name.
    while (parts.length > 1 && /^[0-9a-f]+$/i.test(parts[parts.length - 1] as string)) {
        parts.pop();
    }
    if (parts.length === 0) return null;

    const name = parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
        .trim();

    return name || null;
}

const PROFILE_URL_PATTERN = /https?:\/\/[^\s"'<>]*linkedin\.com\/(?:mwlite\/)?in\/[^\s"'<>]+/i;

/**
 * Finds the first LinkedIn profile URL inside free text.
 *
 * Needed because Android share payloads are inconsistent: the LinkedIn app may
 * put the URL in `url`, or bury it in a `text` blob alongside the profile name.
 */
export function extractLinkedInProfileUrl(text: string | null | undefined): string | null {
    if (!text) return null;
    const match = PROFILE_URL_PATTERN.exec(text);
    return match ? match[0] : null;
}

/**
 * The URL strings worth trying against `GET /api/connections?url=`, most likely
 * first and without duplicates.
 *
 * Both forms are included because an API from before canonicalisation did not
 * normalize the query parameter, so only an exact match on the stored string
 * would hit. The current API canonicalises and finds legacy rows itself.
 */
export function buildLookupCandidates(rawUrl: string): string[] {
    const candidates = [
        normalizeLinkedInUrl(rawUrl),
        legacyNormalizeLinkedInUrl(rawUrl.trim()),
    ].filter((candidate) => Boolean(candidate));

    return [...new Set(candidates)];
}

/** True when two URLs point at the same profile, ignoring host, path depth and vanity-slug case. */
export function isSameProfile(a: string, b: string): boolean {
    if (!isLinkedInProfileUrl(a) || !isLinkedInProfileUrl(b)) return false;
    return normalizeLinkedInUrl(a) === normalizeLinkedInUrl(b);
}
