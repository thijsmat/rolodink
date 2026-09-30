import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_RATE_LIMIT,
  DEFAULT_RATE_LIMIT,
  checkRateLimit,
  getClientIP,
  rateLimitMiddleware,
  type RateLimitOptions,
} from './rate-limit';

/**
 * The store is module-global and has no reset, so every test uses its own
 * identifier or documentation-range IP (RFC 5737) instead of sharing state.
 */

const EXTENSION_ORIGIN = 'chrome-extension://jfgnbkeagmpmappmekainclghhndlimc';

function request(ip?: string, origin?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) headers['x-forwarded-for'] = ip;
  if (origin) headers.origin = origin;
  return new Request('https://api.rolodink.app/api/connections', { headers });
}

/** Sends `times` requests from `ip` that must all be let through. */
function drain(ip: string, times: number, options?: RateLimitOptions) {
  for (let i = 0; i < times; i++) {
    expect(rateLimitMiddleware(request(ip), options)).toBeNull();
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('limits', () => {
  it('are 600 per IP per hour for the API and 100 for sign-in/sign-up, in its own bucket', () => {
    expect(DEFAULT_RATE_LIMIT).toBe(600);
    expect(AUTH_RATE_LIMIT).toEqual({ bucket: 'auth', limit: 100 });
    expect(Object.isFrozen(AUTH_RATE_LIMIT)).toBe(true);
  });
});

describe('checkRateLimit', () => {
  it('allows exactly DEFAULT_RATE_LIMIT requests per identifier, then blocks', () => {
    for (let i = 1; i <= 600; i++) {
      expect(checkRateLimit('limit-default')).toMatchObject({ success: true, remaining: 600 - i, limit: 600 });
    }
    expect(checkRateLimit('limit-default')).toMatchObject({ success: false, remaining: 0, limit: 600 });
  });

  it('honours an explicit limit', () => {
    for (let i = 1; i <= 100; i++) {
      expect(checkRateLimit('limit-100', 100)).toMatchObject({ success: true, remaining: 100 - i, limit: 100 });
    }
    expect(checkRateLimit('limit-100', 100)).toMatchObject({ success: false, remaining: 0, limit: 100 });
  });

  it('keeps separate budgets per identifier', () => {
    for (let i = 0; i < 600; i++) checkRateLimit('identifier-a');
    expect(checkRateLimit('identifier-a').success).toBe(false);
    expect(checkRateLimit('identifier-b').success).toBe(true);
  });

  it('opens a fresh window after one hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T06:30:00Z'));
    for (let i = 0; i < 600; i++) checkRateLimit('window-reset');
    expect(checkRateLimit('window-reset').success).toBe(false);

    vi.setSystemTime(new Date('2026-10-01T07:30:00.001Z'));
    expect(checkRateLimit('window-reset')).toMatchObject({ success: true, remaining: 599 });
  });
});

describe('getClientIP', () => {
  it('uses the first valid address in X-Forwarded-For', () => {
    expect(getClientIP(request('203.0.113.7, 10.0.0.1'))).toBe('203.0.113.7');
  });

  it('returns undefined when no valid address is present', () => {
    expect(getClientIP(request('not-an-ip'))).toBeUndefined();
    expect(getClientIP(request())).toBeUndefined();
  });
});

describe('rateLimitMiddleware', () => {
  it('blocks with 400 when the client IP cannot be determined, for every bucket', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(rateLimitMiddleware(request())?.status).toBe(400);
    expect(rateLimitMiddleware(request(), AUTH_RATE_LIMIT)?.status).toBe(400);
  });

  it('lets 600 requests per IP through on the shared counter, then answers 429', async () => {
    drain('203.0.113.1', 600);

    const res = rateLimitMiddleware(request('203.0.113.1', EXTENSION_ORIGIN));
    expect(res?.status).toBe(429);
    expect(res?.headers.get('X-RateLimit-Limit')).toBe('600');
    expect(res?.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(Number(res?.headers.get('Retry-After'))).toBeGreaterThan(0);
    // Without this header the extension sees a CORS failure instead of the 429.
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe(EXTENSION_ORIGIN);
    expect(await res?.json()).toMatchObject({ error: 'Rate limit exceeded' });
  });

  it('keeps sign-in/sign-up at 100 per IP', () => {
    drain('203.0.113.2', 100, AUTH_RATE_LIMIT);

    const res = rateLimitMiddleware(request('203.0.113.2'), AUTH_RATE_LIMIT);
    expect(res?.status).toBe(429);
    expect(res?.headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('counts auth and API traffic separately, in both directions', () => {
    // A locked-out password guesser gains nothing on the API side ...
    drain('203.0.113.3', 100, AUTH_RATE_LIMIT);
    expect(rateLimitMiddleware(request('203.0.113.3'), AUTH_RATE_LIMIT)?.status).toBe(429);
    expect(rateLimitMiddleware(request('203.0.113.3'))).toBeNull();

    // ... and a busy extension user can still log in.
    drain('203.0.113.4', 600);
    expect(rateLimitMiddleware(request('203.0.113.4'))?.status).toBe(429);
    expect(rateLimitMiddleware(request('203.0.113.4'), AUTH_RATE_LIMIT)).toBeNull();
  });

  it('does not share the auth budget between IPs', () => {
    drain('203.0.113.5', 100, AUTH_RATE_LIMIT);
    expect(rateLimitMiddleware(request('203.0.113.5'), AUTH_RATE_LIMIT)?.status).toBe(429);
    expect(rateLimitMiddleware(request('203.0.113.6'), AUTH_RATE_LIMIT)).toBeNull();
  });
});
