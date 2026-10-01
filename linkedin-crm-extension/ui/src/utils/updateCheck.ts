/**
 * When the popup asks the API whether a newer extension exists.
 *
 * UpdateContext used to write `lastUpdateCheck` only when an update was
 * available, so for everyone already on the latest version the 24-hour limit
 * never applied and every popup open called /api/version. It also kept showing
 * a cached banner after the user had installed the version it offered.
 */

export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Numeric, dot-separated compare: 1.3.10 > 1.3.9. Missing parts count as 0. */
export function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
    const pb = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
    const length = Math.max(pa.length, pb.length);
    for (let i = 0; i < length; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
}

/** A cached "update available" for a version that is already installed (or older). */
export function isStaleUpdate(installed: string, offered: string | undefined): boolean {
    if (!offered) return false;
    return compareVersions(installed, offered) >= 0;
}

export interface StoredCheck {
    lastUpdateCheck?: number;
    lastCheckedVersion?: string;
}

/**
 * Whether to ask the API now. Once a day, and straight away after the
 * extension itself was updated: an answer for the old version says nothing
 * about the new one.
 */
export function shouldCheckForUpdates(stored: StoredCheck, installed: string, now: number): boolean {
    if (!stored.lastUpdateCheck) return true;
    if (stored.lastCheckedVersion !== installed) return true;
    return now - stored.lastUpdateCheck > UPDATE_CHECK_INTERVAL_MS;
}
