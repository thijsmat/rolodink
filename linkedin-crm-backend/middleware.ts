import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_PROTOCOLS = ['chrome-extension://', 'moz-extension://'] as const;

const ALLOWED_METHODS = 'GET,POST,PUT,DELETE,PATCH,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization,apikey,x-client-info';
const MAX_AGE = '86400';

/**
 * Determines whether the supplied origin is an allowed browser-extension origin.
 * Only chrome-extension:// and moz-extension:// schemes are permitted.
 */
function isAllowedExtensionOrigin(origin: string | null): origin is string {
  if (!origin) return false;

  // Fast check for the allowed schemes
  return ALLOWED_PROTOCOLS.some((protocol) => origin.startsWith(protocol));
}

/**
 * Apply CORS headers for approved extension origins.
 */
function withCorsHeaders(origin: string, response: NextResponse | Response): NextResponse | Response {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Vary', 'Origin'); // ensure caches key by Origin
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', MAX_AGE);
  return response;
}

export function middleware(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const isExtensionOrigin = isAllowedExtensionOrigin(requestOrigin);

  // Handle CORS preflight for approved extension origins
  if (request.method === 'OPTIONS') {
    if (!isExtensionOrigin) {
      // For non-extension origins we return 204 without CORS headers to avoid leaking policies.
      return new Response(null, { status: 204 });
    }

    const preflightResponse = new Response(null, { status: 200 });
    return withCorsHeaders(requestOrigin, preflightResponse);
  }

  // Continue to API route
  const response = NextResponse.next();

  if (isExtensionOrigin) {
    return withCorsHeaders(requestOrigin, response);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

