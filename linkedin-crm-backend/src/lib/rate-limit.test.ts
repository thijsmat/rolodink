import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_RATE_LIMIT,
  DEFAULT_RATE_LIMIT,
  checkRateLimit,
  createPrismaStore,
  getClientIP,
  memoryStore,
  rateLimitMiddleware,
  windowStart,
  type CounterStore,
  type RateLimitOptions,
} from './rate-limit';

/**
 * Outside production the limiter counts in memory. That store is module-global
 * and has no reset, so every test uses its own identifier or
 * documentation-range IP (RFC 5737) instead of sharing state.
 */

const EXTENSION_ORIGIN = 'chrome-extension://jfgnbkeagmpmappmekainclghhndlimc';

function request(ip?: string, origin?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) headers['x-forwarded-for'] = ip;
  if (origin) headers.origin = origin;
  return new Request('https://api.rolodink.app/api/connections', { headers });
}

/** Sends `times` requests from `ip` that must all be let through. */
async function drain(ip: string, times: number, options?: RateLimitOptions) {
  for (let i = 0; i < times; i++) {
    expect(await rateLimitMiddleware(request(ip), options)).toBeNull();
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('limits', () => {
  it('are 600 per IP per hour for the API and 60 for sign-in/sign-up, in its own bucket', async () => {
    expect(DEFAULT_RATE_LIMIT).toBe(600);
    expect(AUTH_RATE_LIMIT).toEqual({ bucket: 'auth', limit: 60 });
    expect(Object.isFrozen(AUTH_RATE_LIMIT)).toBe(true);
  });
});

describe('checkRateLimit', () => {
  it('allows exactly DEFAULT_RATE_LIMIT requests per identifier, then blocks', async () => {
    for (let i = 1; i <= 600; i++) {
      expect(await checkRateLimit('limit-default')).toMatchObject({ success: true, remaining: 600 - i, limit: 600 });
    }
    expect(await checkRateLimit('limit-default')).toMatchObject({ success: false, remaining: 0, limit: 600 });
  });

  it('honours an explicit limit', async () => {
    for (let i = 1; i <= 100; i++) {
      expect(await checkRateLimit('limit-100', 100)).toMatchObject({ success: true, remaining: 100 - i, limit: 100 });
    }
    expect(await checkRateLimit('limit-100', 100)).toMatchObject({ success: false, remaining: 0, limit: 100 });
  });

  it('keeps separate budgets per identifier', async () => {
    for (let i = 0; i < 600; i++) await checkRateLimit('identifier-a');
    expect((await checkRateLimit('identifier-a')).success).toBe(false);
    expect((await checkRateLimit('identifier-b')).success).toBe(true);
  });

  it('opens a fresh window after one hour', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T06:30:00Z'));
    for (let i = 0; i < 600; i++) await checkRateLimit('window-reset');
    expect((await checkRateLimit('window-reset')).success).toBe(false);

    vi.setSystemTime(new Date('2026-10-01T07:30:00.001Z'));
    expect(await checkRateLimit('window-reset')).toMatchObject({ success: true, remaining: 599 });
  });
});

describe('getClientIP', () => {
  it('uses the first valid address in X-Forwarded-For', async () => {
    expect(getClientIP(request('203.0.113.7, 10.0.0.1'))).toBe('203.0.113.7');
  });

  it('returns undefined when no valid address is present', async () => {
    expect(getClientIP(request('not-an-ip'))).toBeUndefined();
    expect(getClientIP(request())).toBeUndefined();
  });
});

describe('rateLimitMiddleware', () => {
  it('blocks with 400 when the client IP cannot be determined, for every bucket', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await rateLimitMiddleware(request()))?.status).toBe(400);
    expect((await rateLimitMiddleware(request(), AUTH_RATE_LIMIT))?.status).toBe(400);
  });

  it('lets 600 requests per IP through on the shared counter, then answers 429', async () => {
    await drain('203.0.113.1', 600);

    const res = await rateLimitMiddleware(request('203.0.113.1', EXTENSION_ORIGIN));
    expect(res?.status).toBe(429);
    expect(res?.headers.get('X-RateLimit-Limit')).toBe('600');
    expect(res?.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(Number(res?.headers.get('Retry-After'))).toBeGreaterThan(0);
    // Without this header the extension sees a CORS failure instead of the 429.
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe(EXTENSION_ORIGIN);
    expect(await res?.json()).toMatchObject({ error: 'Rate limit exceeded' });
  });

  it('keeps sign-in/sign-up at 60 per IP', async () => {
    await drain('203.0.113.2', 60, AUTH_RATE_LIMIT);

    const res = await rateLimitMiddleware(request('203.0.113.2'), AUTH_RATE_LIMIT);
    expect(res?.status).toBe(429);
    expect(res?.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('counts auth and API traffic separately, in both directions', async () => {
    // A locked-out password guesser gains nothing on the API side ...
    await drain('203.0.113.3', 60, AUTH_RATE_LIMIT);
    expect((await rateLimitMiddleware(request('203.0.113.3'), AUTH_RATE_LIMIT))?.status).toBe(429);
    expect(await rateLimitMiddleware(request('203.0.113.3'))).toBeNull();

    // ... and a busy extension user can still log in.
    await drain('203.0.113.4', 600);
    expect((await rateLimitMiddleware(request('203.0.113.4')))?.status).toBe(429);
    expect(await rateLimitMiddleware(request('203.0.113.4'), AUTH_RATE_LIMIT)).toBeNull();
  });

  it('does not share the auth budget between IPs', async () => {
    await drain('203.0.113.5', 60, AUTH_RATE_LIMIT);
    expect((await rateLimitMiddleware(request('203.0.113.5'), AUTH_RATE_LIMIT))?.status).toBe(429);
    expect(await rateLimitMiddleware(request('203.0.113.6'), AUTH_RATE_LIMIT)).toBeNull();
  });
});

describe('windowStart', () => {
  it('aligns to the start of the clock hour', () => {
    expect(windowStart(Date.parse('2026-10-01T06:59:59.999Z'))).toBe(Date.parse('2026-10-01T06:00:00Z'));
    expect(windowStart(Date.parse('2026-10-01T07:00:00Z'))).toBe(Date.parse('2026-10-01T07:00:00Z'));
  });
});

/**
 * A stand-in for prisma.rateLimitCounter that behaves like the real upsert:
 * insert with count 1, or add one to the existing row.
 */
function fakePrisma() {
  const rows = new Map<string, number>();
  const upsert = vi.fn(async (args: {
    where: { key_windowStart: { key: string; windowStart: Date } };
    create: { count: number };
  }) => {
    const { key, windowStart: start } = args.where.key_windowStart;
    const id = `${key}@${start.toISOString()}`;
    const count = (rows.get(id) ?? 0) + 1;
    rows.set(id, count);
    return { count };
  });
  return { client: { rateLimitCounter: { upsert } } as never, upsert, rows };
}

/** A fallback that records what reaches it. */
function recordingFallback(): CounterStore & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async increment(key, start) {
      calls.push(key);
      return memoryStore.increment(`fallback:${key}`, start);
    },
  };
}

describe('createPrismaStore', () => {
  it('shares one count between instances that use the same database', async () => {
    const db = fakePrisma();
    const instanceA = createPrismaStore(db.client);
    const instanceB = createPrismaStore(db.client);

    for (let i = 0; i < 30; i++) {
      await checkRateLimit('shared-ip', 60, instanceA);
      await checkRateLimit('shared-ip', 60, instanceB);
    }
    // 60 hits spread over two instances: the next one is over the limit on either.
    expect(await checkRateLimit('shared-ip', 60, instanceA)).toMatchObject({ success: false, remaining: 0 });
    expect((await checkRateLimit('shared-ip', 60, instanceB)).success).toBe(false);
  });

  it('stores a hash of the identifier, never the IP itself', async () => {
    const db = fakePrisma();
    await checkRateLimit('auth:203.0.113.50', 60, createPrismaStore(db.client));

    const { key, windowStart: start } = db.upsert.mock.calls[0][0].where.key_windowStart;
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('203.0.113.50');
    expect(start.getTime()).toBe(windowStart(Date.now()));
  });

  it('falls back to the per-instance counter when the database fails, then retries after a minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T06:10:00Z'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = fakePrisma();
    db.upsert.mockRejectedValueOnce(new Error('relation "RateLimitCounter" does not exist'));
    const fallback = recordingFallback();
    const store = createPrismaStore(db.client, fallback);

    expect((await checkRateLimit('outage-ip', 60, store)).success).toBe(true);
    expect(fallback.calls).toHaveLength(1);

    // Within the minute the database is not tried again.
    vi.setSystemTime(new Date('2026-10-01T06:10:59Z'));
    await checkRateLimit('outage-ip', 60, store);
    expect(db.upsert).toHaveBeenCalledTimes(1);
    expect(fallback.calls).toHaveLength(2);

    // After it, the database is used again.
    vi.setSystemTime(new Date('2026-10-01T06:11:01Z'));
    await checkRateLimit('outage-ip', 60, store);
    expect(db.upsert).toHaveBeenCalledTimes(2);
    expect(fallback.calls).toHaveLength(2);
  });
});
