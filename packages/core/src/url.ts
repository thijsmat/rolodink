/**
 * LinkedIn profile URL handling.
 *
 * This replaces five near-identical copies of the same logic (three in
 * `content.js` / `useConnectionLogic.ts`, one in `content-firefox.js`, one in
 * the backend's `connections/route.ts`).
 *
 * Two normalizers exist on purpose, and the difference matters:
 *
 * - `legacyNormalizeLinkedInUrl` reproduces exactly what the extension and the
 *   backend do today: strip query, hash and trailing slash, keep the host and
 *   the full path. Rows already in the database were stored this way, and
 *   `GET /api/connections?url=` is an exact string match that the server does
 *   NOT normalize. So this is the form that matches stored data.
 * - `normalizeLinkedInUrl` is the canonical form we want going forward:
 *   host forced to `www.linkedin.com`, path reduced to `/in/<slug>`.
 *
 * A mobile share can produce a URL that normalizes to something the database
 * has never seen (`nl.linkedin.com`, `/mwlite/in/…`, tracking parameters), so a
 * lookup should try both forms and then fall back to matching on the slug alone
 * against the locally cached list. `buildLookupCandidates` does the first part.
 */

const LINKEDIN_HOST = /(^|\.)linkedin\.com$/;
const CANONICAL_HOST = 'www.linkedin.com';

/** Matches the current extension/backend behaviour. Use it to find existing rows. */
export function legacyNormalizeLinkedInUrl(rawUrl: string): string {
    let normalized = rawUrl.split('?')[0]?.split('#')[0] ?? rawUrl;
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return normalized;
}

/**
 * Canonical form: `https://www.linkedin.com/in/<slug>`.
 *
 * Anything that is not a LinkedIn profile URL is returned untouched rather than
 * mangled — callers decide what to do with it.
 */
export function normalizeLinkedInUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) return rawUrl;

    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let url: URL;
    try {
        url = new URL(withScheme);
    } catch {
        return rawUrl;
    }

    if (!LINKEDIN_HOST.test(url.hostname.toLowerCase())) {
        return rawUrl;
    }

    const slug = extractSlugFromPath(url.pathname);
    if (!slug) {
        return rawUrl;
    }

    // Query and hash are dropped wholesale: utm_*, trk, lipi, miniProfileUrn and
    // whatever LinkedIn adds next are all tracking noise.
    return `https://${CANONICAL_HOST}/in/${slug}`;
}

/**
 * Pulls `<slug>` out of a profile path, tolerating the mobile-web `/mwlite`
 * prefix and any trailing subpage such as `/details/experience`.
 *
 * The slug keeps its original case: opaque member IDs like `ACoAAA…` are
 * case-sensitive, and lowercasing them would break matching.
 */
function extractSlugFromPath(pathname: string): string | null {
    const cleaned = pathname.replace(/^\/mwlite/i, '');
    const match = /^\/in\/([^/]+)/.exec(cleaned);
    if (!match?.[1]) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

/** The profile slug, or null when the URL is not a LinkedIn profile. */
export function getProfileSlug(rawUrl: string): string | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const url = new URL(withScheme);
        if (!LINKEDIN_HOST.test(url.hostname.toLowerCase())) return null;
        return extractSlugFromPath(url.pathname);
    } catch {
        return null;
    }
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
 * Both forms are included because the server does not normalize the query
 * parameter, so only an exact match on the stored string will hit.
 */
export function buildLookupCandidates(rawUrl: string): string[] {
    const candidates = [
        normalizeLinkedInUrl(rawUrl),
        legacyNormalizeLinkedInUrl(rawUrl.trim()),
    ].filter((candidate) => Boolean(candidate));

    return [...new Set(candidates)];
}

/** True when two URLs point at the same profile, ignoring host and path depth. */
export function isSameProfile(a: string, b: string): boolean {
    const slugA = getProfileSlug(a);
    const slugB = getProfileSlug(b);
    if (!slugA || !slugB) return false;
    return slugA.toLowerCase() === slugB.toLowerCase();
}
