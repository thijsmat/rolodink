/**
 * Normalisation for the API base URL.
 *
 * This exists because of a real, shipped failure. The background service worker
 * read `import.meta.env.VITE_API_BASE_URL` raw while `config.ts` stripped the
 * trailing slash, so the same value produced two different URLs depending on
 * which file asked. With a configured value that ended in `/`, the worker built
 *
 *     https://host//api/user/key
 *
 * The server answers a doubled slash with a redirect, and a redirect is not
 * allowed in response to a CORS preflight - so the request died before it was
 * ever sent, with an error that reads like a CORS misconfiguration and is not
 * one. `/api/user/key` is where the wrapped data key comes from, so nothing
 * could be decrypted either.
 *
 * Keeping this in core means every consumer normalises identically and CI
 * proves it, rather than each caller remembering to.
 */
export function normalizeApiBaseUrl(value: unknown): string {
    if (typeof value !== 'string') return '';
    // Strip every trailing slash, not just one: '.../' and '...//' are both
    // values a copy-paste into a settings field or a CI secret can produce.
    return value.trim().replace(/\/+$/, '');
}

/**
 * Pick the first usable base URL, falling back to the last argument.
 *
 * Callers pass their candidates in priority order - typically a value stored by
 * the user, then the build-time environment, then the compiled-in default. An
 * empty or whitespace-only candidate is skipped rather than accepted, which is
 * the behaviour a missing environment variable needs: it should fall through to
 * the default, not produce a request against the empty string.
 */
export function resolveApiBaseUrl(...candidates: unknown[]): string {
    for (const candidate of candidates) {
        const normalized = normalizeApiBaseUrl(candidate);
        if (normalized.length > 0) return normalized;
    }
    return '';
}
