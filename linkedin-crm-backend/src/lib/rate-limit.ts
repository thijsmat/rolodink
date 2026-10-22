// Rate limiting utility for API routes
// Limits: 600 requests per IP per hour; sign-in and sign-up 60 (see below).
//
// Was 100. Every LinkedIn profile visit costs two GETs from the extension and
// every typing pause in the note card a PATCH, so an active user hit 429 after
// roughly 35-50 profiles an hour - and colleagues behind one office NAT share
// the budget. A 429 on the note card's initial load is also what exposes the
// note-overwrite path in the content script. Since the counter moved to
// Postgres (see the store below) the limit holds across serverless
// instances, so 600 is a real hourly quota per IP, not a coarse brake.
//
// Password sign-in and sign-up do NOT get the raise: they get 60 per IP per
// hour, in a counter of their own (AUTH_RATE_LIMIT below). That was 100 during
// launch week, for sign-up bursts from shared networks. The extra
// room for profile visits must not become a 6x larger budget for password
// guessing or sign-up spam, and ordinary API traffic must not be able to lock
// anyone out of logging in (or the other way round).

import { createHash } from 'crypto';
import { isIP } from 'net';
import type { PrismaClient } from '@prisma/client';
import { getAllowedOrigin } from './cors';

// Counters run in fixed one-hour windows. In production they live in
// Postgres (model RateLimitCounter), so every serverless instance sees the
// same count; in dev and tests, and whenever the database cannot be reached,
// they fall back to a counter per instance.
const WINDOW_MS = 60 * 60 * 1000;

/** Start (ms) of the fixed one-hour window that `now` falls in. */
export function windowStart(now: number): number {
  return now - (now % WINDOW_MS);
}

export interface CounterStore {
  /** Adds one hit for `key` in the window starting at `start`; returns the new count. */
  increment(key: string, start: number): Promise<number>;
}

const memory = new Map<string, { start: number; count: number }>();

// Drop finished windows once an hour so the map cannot grow without bound.
setInterval(() => {
  const current = windowStart(Date.now());
  for (const [key, entry] of memory) {
    if (entry.start < current) memory.delete(key);
  }
}, WINDOW_MS).unref?.();

export const memoryStore: CounterStore = {
  async increment(key, start) {
    const entry = memory.get(key);
    if (!entry || entry.start !== start) {
      memory.set(key, { start, count: 1 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  },
};

/**
 * Shared counter in Postgres. The upsert runs as one INSERT ... ON CONFLICT DO
 * UPDATE, so concurrent instances cannot lose hits. If the database fails (or
 * the table has not been created yet) it counts in `fallback` and leaves the
 * database alone for `retryAfterMs`, so an outage does not add a failing
 * round trip to every request.
 */
export function createPrismaStore(
  client: Pick<PrismaClient, 'rateLimitCounter'>,
  fallback: CounterStore = memoryStore,
  retryAfterMs = 60_000,
): CounterStore {
  let unavailableUntil = 0;
  return {
    async increment(key, start) {
      const now = Date.now();
      if (now < unavailableUntil) return fallback.increment(key, start);
      try {
        const windowStartDate = new Date(start);
        const row = await client.rateLimitCounter.upsert({
          where: { key_windowStart: { key, windowStart: windowStartDate } },
          create: { key, windowStart: windowStartDate, count: 1 },
          update: { count: { increment: 1 } },
          select: { count: true },
        });
        return row.count;
      } catch (error) {
        unavailableUntil = now + retryAfterMs;
        console.error(
          '[Rate Limit] Shared counter unavailable, counting per instance for now:',
          error instanceof Error ? error.message : error,
        );
        return fallback.increment(key, start);
      }
    },
  };
}

let activeStore: CounterStore | undefined;

async function getStore(): Promise<CounterStore> {
  if (!activeStore) {
    activeStore =
      process.env.NODE_ENV === 'production'
        ? createPrismaStore((await import('./prisma')).prisma)
        : memoryStore;
  }
  return activeStore;
}

/** Counters are keyed on a hash, so the table holds no raw IP addresses. */
function counterKey(identifier: string): string {
  return createHash('sha256').update(identifier).digest('hex');
}

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
 * Counts one request for `identifier` and reports whether it is within
 * `limit` for the current hour.
 * @param identifier - IP address or user ID, optionally prefixed with a bucket
 * @param limit - requests allowed per window (default DEFAULT_RATE_LIMIT)
 * @param store - counter store; defaults to Postgres in production, memory elsewhere
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = DEFAULT_RATE_LIMIT,
  store?: CounterStore,
): Promise<RateLimitResult> {
  const start = windowStart(Date.now());
  const count = await (store ?? (await getStore())).increment(counterKey(identifier), start);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetTime: start + WINDOW_MS,
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
export async function rateLimitMiddleware(
  request: Request,
  options: RateLimitOptions = {},
): Promise<Response | null> {
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
  const result = await checkRateLimit(key, options.limit ?? DEFAULT_RATE_LIMIT);

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

