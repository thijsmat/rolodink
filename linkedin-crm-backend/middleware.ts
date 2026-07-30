import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  isOriginAllowed,
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  MAX_AGE,
} from '@/lib/cors';

/**
 * CORS preflight and response headers for /api/*.
 *
 * The allowlist itself lives in `src/lib/cors.ts` and is shared with the route
 * handlers, so a request can no longer pass one layer and fail the other.
 *
 * This file used to carry its own check that only recognised extension
 * origins, which meant a preflight from any web origin got a bare 204 with no
 * CORS headers - and the browser then blocked the real request. That is why the
 * web app could not reach the API at all, and no environment variable could
 * have fixed it.
 *
 * Runtime note: middleware runs on the Edge runtime, so `@/lib/cors` must stay
 * free of Node built-ins. It is - do not import `rate-limit.ts` here, that one
 * pulls in `net`.
 */
function withCorsHeaders(origin: string, response: NextResponse | Response): NextResponse | Response {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Vary', 'Origin'); // ensure caches key by Origin
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  // Bearer-token auth only; no client sends cookies. Kept in sync with
  // buildCorsHeaders() in src/lib/cors.ts, which previously said 'false' here
  // while this file said 'true'.
  response.headers.set('Access-Control-Allow-Credentials', 'false');
  response.headers.set('Access-Control-Max-Age', MAX_AGE);
  return response;
}

export function middleware(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const originAllowed = isOriginAllowed(requestOrigin);

  if (request.method === 'OPTIONS') {
    if (!originAllowed) {
      // Unknown origin: answer without CORS headers rather than describing the
      // policy. The browser blocks the follow-up request either way.
      return new Response(null, { status: 204 });
    }

    return withCorsHeaders(requestOrigin, new Response(null, { status: 200 }));
  }

  const response = NextResponse.next();

  if (originAllowed) {
    return withCorsHeaders(requestOrigin, response);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
