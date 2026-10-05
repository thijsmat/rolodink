// Rate limiting utility for API routes
// Limits: 600 requests per IP per hour; sign-in and sign-up 60 (see below).
//
// Was 100. Every LinkedIn profile visit costs two GETs from the extension and
// every typing pause in the note card a PATCH, so an active user hit 429 after
// roughly 35-50 profiles an hour - and colleagues behind one office NAT share
// the budget. A 429 on the note card's initial load is also what exposes the
// note-overwrite path in the content script. The counter lives per serverless
// instance anyway (see the store below), so this is a coarse brake, not a
// precise quota; a Vercel WAF rule is the planned replacement.
//
// Password sign-in and sign-up do NOT get the raise: they get 60 per IP per
// hour, in a counter of their own (AUTH_RATE_LIMIT below). That was 100 during
// launch week, for sign-up bursts from shared networks. The extra
// room for profile visits must not become a 6x larger budget for password
// guessing or sign-up spam, and ordinary API traffic must not be able to lock
// anyone out of logging in (or the other way round).

import { isIP } from 'net';
import { getAllowedOrigin } from './cors';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production for distributed systems)
// TODO: Replace with a persistent store (e.g. Upstash Redis, Vercel KV) for reliable
// rate limiting across serverless function instances. The in-memory store resets on
// cold starts, which weakens protection in Vercel's serverless environment.
const store: RateLimitStore = {};

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60 * 60 * 1000); // Run every hour

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface RateLimitOptions {
  /** Separate counter namespace; omit for the shared API counter. */
  bucket?: string;
  /** Requests per IP per hour for this counter. Defaults to DEFAULT_RATE_LIMIT. */
  limit?: number;
}

/** Shared API counter: requests per IP per hour. */
export const DEFAULT_RATE_LIMIT = 600;

/** /api/auth/signin and /api/auth/signup, counted apart from the API. */
export const AUTH_RATE_LIMIT: Readonly<RateLimitOptions> = Object.freeze({ bucket: 'auth', limit: 60 });

/**
 * Rate limit check - `limit` requests per identifier per hour
 * @param identifier - IP address or user ID, optionally prefixed with a bucket
 * @param limit - requests allowed per window (default DEFAULT_RATE_LIMIT)
 * @returns RateLimitResult with success status and remaining requests
 */
export function checkRateLimit(identifier: string, limit: number = DEFAULT_RATE_LIMIT): RateLimitResult {
  const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
  const now = Date.now();

  const key = identifier;
  const entry = store[key];

  // No entry exists or window expired - create new entry
  if (!entry || entry.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
      limit,
    };
  }

  // Window still active - increment counter
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
    limit,
  };
}

/**
 * Get client IP from request
 * Handles proxy headers (X-Forwarded-For, X-Real-IP)
 * SECURITY: Returns undefined if IP cannot be determined (safer than fallback)
 * Based on Gemini Code Assist recommendation: block requests if IP cannot be determined
 */
export function getClientIP(request: Request): string | undefined {
  // Check X-Forwarded-For header (first IP if multiple)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean);
    // Validate IP format before using
    if (ips.length > 0 && isValidIP(ips[0])) {
      return ips[0];
    }
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  // SECURITY: Return undefined if IP cannot be determined
  // This forces route handlers to decide how to handle requests without IP
  return undefined;
}

/**
 * Validate IP address using Node.js built-in net.isIP()
 * Handles all IPv4 and IPv6 variations including compressed formats
 * Returns true if valid IPv4 or IPv6, false otherwise
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  // isIP returns 4 for IPv4, 6 for IPv6, or 0 for invalid
  return isIP(ip) !== 0;
}

/**
 * Rate limit middleware wrapper for Next.js API routes
 * Returns response if rate limited, null if allowed
 * SECURITY: Uses secure CORS headers with origin whitelisting
 * Based on Gemini Code Assist recommendation: block requests if IP cannot be determined
 */
export function rateLimitMiddleware(request: Request, options: RateLimitOptions = {}): Response | null {
  const ip = getClientIP(request);

  // If IP cannot be determined, block the request for security
  // This prevents potential abuse where requests without IP headers bypass rate limiting
  // Based on Gemini Code Assist recommendation
  if (!ip) {
    console.warn('[Rate Limit] Blocking request because client IP could not be determined for rate limiting.');

    const allowedOrigin = getAllowedOrigin(request);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add CORS headers if origin is whitelisted
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Vary'] = 'Origin';
    }

    return new Response(
      JSON.stringify({
        error: 'Could not determine client IP',
        message: 'Request blocked for security reasons'
      }),
      {
        status: 400,
        headers
      }
    );
  }

  // A named bucket gets its own key ("auth:<ip>"). getClientIP only returns
  // validated IPs, which never start with "auth:", so the keys cannot collide.
  const key = options.bucket ? `${options.bucket}:${ip}` : ip;
  const result = checkRateLimit(key, options.limit ?? DEFAULT_RATE_LIMIT);

  if (!result.success) {
    // Use secure CORS headers with origin whitelisting
    // Based on Gemini Code Assist recommendation: use strict whitelist, include Vary header
    const allowedOrigin = getAllowedOrigin(request);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
      'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
    };

    // Only add CORS headers if origin is whitelisted (prevents reflection attacks)
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Vary'] = 'Origin'; // Important: prevents browser caching for wrong origin
    }

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

