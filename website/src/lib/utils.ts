import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const DEFAULT_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExtensionUrl() {
  return process.env.NEXT_PUBLIC_EXTENSION_URL?.trim() || DEFAULT_EXTENSION_URL
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
