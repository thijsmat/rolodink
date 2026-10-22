/**
 * Leaked-password check against Have I Been Pwned's Pwned Passwords API.
 *
 * Supabase only offers this check on paid plans, so every place that sets a
 * password (backend sign-up, website sign-up, the extension's password change)
 * runs it itself through this one implementation.
 *
 * The password never leaves the device: it is hashed with SHA-1 and only the
 * first five hex characters of the hash are sent (k-anonymity). The API
 * answers with every hash suffix in that range, and the match happens here.
 * `Add-Padding` makes every response roughly the same size, so the response
 * length does not leak the range either; padding rows carry a count of 0.
 *
 * Fails open: when the API cannot be reached, is slow or answers oddly, the
 * result is `null` and callers let the password through. An outage at HIBP
 * must not block anyone from signing up.
 */

export const PWNED_PASSWORDS_RANGE_URL = 'https://api.pwnedpasswords.com/range/';

export interface PwnedPasswordOptions {
    /** Injected for tests; defaults to the global fetch. */
    fetch?: typeof fetch;
    /** Give up after this long and report `null`. */
    timeoutMs?: number;
}

async function sha1Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/**
 * How often `password` appears in known breaches: 0 when it does not, `null`
 * when the check could not be done.
 */
export async function pwnedPasswordCount(
    password: string,
    { fetch: fetchImpl = globalThis.fetch, timeoutMs = 3000 }: PwnedPasswordOptions = {},
): Promise<number | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const hash = await sha1Hex(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        const response = await fetchImpl(PWNED_PASSWORDS_RANGE_URL + prefix, {
            headers: { 'Add-Padding': 'true' },
            signal: controller.signal,
        });
        if (!response.ok) return null;

        for (const line of (await response.text()).split('\n')) {
            const [lineSuffix, count] = line.trim().split(':');
            if (lineSuffix?.toUpperCase() === suffix) {
                const n = Number(count);
                return Number.isFinite(n) ? n : null;
            }
        }
        return 0;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/** True only when the password is known to be leaked; false when clean or unknown. */
export async function isPwnedPassword(
    password: string,
    options?: PwnedPasswordOptions,
): Promise<boolean> {
    const count = await pwnedPasswordCount(password, options);
    return count !== null && count > 0;
}
