// CORS utility with secure origin whitelisting.
//
// This is the single source of truth for which origins may talk to the API.
// Both the Next.js middleware (preflight handling) and the individual route
// handlers import from here, so the two can no longer drift apart.
//
// Two kinds of origin are allowed, and they are checked differently on purpose:
//
//  1. Browser extensions, matched on scheme only. ID-based allowlisting is not
//     possible here: Firefox gives every *installation* its own random
//     `moz-extension://<uuid>` origin, so there is no stable value to list.
//     Chrome and Edge do have stable IDs, but they differ per store listing and
//     per unpacked dev build - the two IDs previously hardcoded in this file
//     were both stale and matched neither published extension.
//     This is a deliberately weak boundary and an acceptable one: CORS is not
//     the authentication boundary (every endpoint requires a Supabase JWT), and
//     an extension holding host permissions bypasses CORS regardless.
//
//  2. Web origins, matched against an exact allowlist. This is where the real
//     restriction lives, because a malicious *page* is the threat CORS exists
//     to stop. Never put a wildcard here.

const EXTENSION_ORIGIN_SCHEMES = ['chrome-extension://', 'moz-extension://'] as const;

/**
 * Exact-match allowlist for web origins.
 * SECURITY: whitelist only - never a wildcard, never a reflected origin.
 */
const ALLOWED_WEB_ORIGINS = [
  // The Rolodink web app.
  'https://app.rolodink.app',

  // Local development only; this block is empty in a production build.
  ...(process.env.NODE_ENV === 'development'
    ? [
        'http://localhost:3000',
        'http://localhost:3002', // web app dev server
        'http://localhost:5173', // Vite dev server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
      ]
    : []),

  // Additional origins via environment variable (comma-separated). This is how
  // preview deployments get access, without ever loosening the compiled-in list.
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
];

/** True for any browser-extension origin. See the note above on why this is scheme-based. */
export function isExtensionOrigin(origin: string | null | undefined): origin is string {
  if (!origin) return false;
  return EXTENSION_ORIGIN_SCHEMES.some((scheme) => origin.startsWith(scheme));
}

/** True only for exactly allowlisted web origins. */
export function isAllowedWebOrigin(origin: string | null | undefined): origin is string {
  if (!origin) return false;
  return ALLOWED_WEB_ORIGINS.includes(origin);
}

/**
 * True when the origin may receive CORS headers.
 * Used by both the middleware and the route handlers.
 */
export function isOriginAllowed(origin: string | null | undefined): origin is string {
  return isExtensionOrigin(origin) || isAllowedWebOrigin(origin);
}

/**
 * Returns the origin to echo back, or null when it is not allowed.
 * SECURITY: returns the exact origin or nothing - never a wildcard.
 */
export function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get('origin') || request.headers.get('Origin');

  // No Origin header: a same-origin request, or a non-browser client such as a
  // native app or curl. Neither needs CORS headers.
  if (!origin) return null;

  if (isOriginAllowed(origin)) return origin;

  console.warn(`[CORS] Blocked origin: ${origin}`);
  return null;
}

export const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
export const ALLOWED_HEADERS = 'Content-Type, Authorization, apikey, x-client-info';
export const MAX_AGE = '86400';

/**
 * Builds the CORS response headers for a request.
 *
 * `Access-Control-Allow-Credentials` is deliberately `false`: every client
 * authenticates with an `Authorization: Bearer` token and none of them sends
 * cookies, so allowing credentials would widen the surface for nothing.
 */
export function buildCorsHeaders(request: Request): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(request);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Credentials': 'false',
    // Always vary on Origin: the response differs per origin, so a shared cache
    // must never serve one origin's response to another.
    Vary: 'Origin',
  };

  // Access-Control-Allow-Origin is omitted entirely when the origin is not
  // allowed - that omission is what makes the browser block the response.
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}
