import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const DEFAULT_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc"

const EDGE_STORE_URL =
  "https://microsoftedge.microsoft.com/addons/detail/ihcocnphebdemiipmoedinojihpbcmmf"

const FIREFOX_STORE_URL = "https://addons.mozilla.org/addon/rolodink/"

export type Store = "chrome" | "edge" | "firefox"

/** Where on the site a store link sits; shows up in the store's own stats. */
export type StorePlacement =
  | "hero"
  | "cta"
  | "download"
  | "article"
  | "features"
  | "help"
  | "how-it-works"
  | "landing"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExtensionUrl() {
  return process.env.NEXT_PUBLIC_EXTENSION_URL?.trim() || DEFAULT_EXTENSION_URL
}

/**
 * A store link with UTM parameters, so the stores' own install stats show
 * which spot on the site a visitor came from (utm_source/utm_content). No
 * personal data: only which store and which spot on the site.
 */
export function storeUrl(store: Store, placement: StorePlacement): string {
  const bases: Record<Store, string> = {
    chrome: getExtensionUrl(),
    edge: EDGE_STORE_URL,
    firefox: FIREFOX_STORE_URL,
  }
  const url = new URL(bases[store])
  url.searchParams.set("utm_source", "rolodink.app")
  url.searchParams.set("utm_medium", "website")
  url.searchParams.set("utm_content", placement)
  return url.toString()
}

/**
 * Utility function to extract OAuth error from search params
 */
export function extractOAuthError(
  oauthErrorParam: string | string[] | undefined
): string | null {
  if (typeof oauthErrorParam === 'string') {
    return oauthErrorParam;
  }
  if (Array.isArray(oauthErrorParam) && oauthErrorParam.length > 0) {
    return oauthErrorParam[0];
  }
  return null;
}

// Placeholder origin to resolve a relative path against. `.invalid` is a
// reserved TLD, so it can never be a real host an attacker controls.
const SAFE_REDIRECT_BASE = 'https://redirect-check.invalid'

/**
 * Validates a redirect URL to prevent open redirect vulnerabilities.
 *
 * Only a same-origin path is accepted. A prefix check alone is not enough: the
 * URL parser strips tabs and newlines and treats a backslash as a slash, so
 * `/\t/evil.com` passes a "starts with / but not //" test and still resolves to
 * https://evil.com. Hence: no control characters or backslashes at all, and
 * the value must resolve to the placeholder origin. The returned path is the
 * parsed one, so the browser navigates to exactly what was checked.
 */
export function getSafeRedirect(
  next: string | null | undefined,
  fallback: string
): string {
  if (
    next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !/[\u0000-\u001F\u007F\\]/.test(next)
  ) {
    try {
      const url = new URL(next, SAFE_REDIRECT_BASE)
      if (url.origin === SAFE_REDIRECT_BASE) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      // Unparseable: fall through to the fallback.
    }
  }

  if (next) {
    console.warn('Invalid "next" redirect URL detected:', next);
  }

  return fallback;
}
