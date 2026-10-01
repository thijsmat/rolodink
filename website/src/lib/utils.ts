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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExtensionUrl() {
  return process.env.NEXT_PUBLIC_EXTENSION_URL?.trim() || DEFAULT_EXTENSION_URL
}

/**
 * A store link with UTM parameters, so the click is attributable on both ends:
 * Plausible records it as an "Outbound Link: Click" with this URL, and the
 * stores' own install stats show utm_source/utm_content. No personal data:
 * only which store and which spot on the site.
 */
export function storeUrl(store: Store, placement: StorePlacement): string {
  const base =
    store === "chrome" ? getExtensionUrl() : store === "edge" ? EDGE_STORE_URL : FIREFOX_STORE_URL
  const url = new URL(base)
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

/**
 * Validates a redirect URL to prevent open redirect vulnerabilities.
 * Ensures the path starts with / but not // or /\ (Safari bypass).
 */
export function getSafeRedirect(
  next: string | null | undefined,
  fallback: string
): string {
  if (
    next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/\\')
  ) {
    return next;
  }

  if (next) {
    console.warn('Invalid "next" redirect URL detected:', next);
  }

  return fallback;
}
