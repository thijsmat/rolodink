import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * The extension popup signs in and signs up through these two routes, and they
 * call Supabase from the server, so Supabase only ever sees Vercel's IP. That
 * makes this limiter the only per-client brake on password guessing and
 * sign-up spam: it has to stay at 60 per IP per hour, apart from the 600 the
 * rest of the API got.
 */

const { signInWithPassword, signUp } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signInWithPassword, signUp } })),
}));

import { POST as signInPOST } from './signin/route';
import { POST as signUpPOST } from './signup/route';
import { rateLimitMiddleware } from '@/lib/rate-limit';

const EXTENSION_ORIGIN = 'chrome-extension://jfgnbkeagmpmappmekainclghhndlimc';
const credentials = { email: 'someone@example.com', password: 'not-the-password' };

// Every test uses its own documentation-range IP (RFC 5737): the limiter's
// store is module-global.
function post(route: 'signin' | 'signup', ip: string): NextRequest {
  return new NextRequest(`https://api.rolodink.app/api/auth/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, origin: EXTENSION_ORIGIN },
    body: JSON.stringify(credentials),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });
  signUp.mockResolvedValue({ data: { user: { id: 'new-user' }, session: null }, error: null });
});

describe('/api/auth rate limit', () => {
  it('stops password guessing after 60 attempts per IP, before Supabase is called', async () => {
    for (let i = 0; i < 60; i++) {
      expect((await signInPOST(post('signin', '203.0.113.20'))).status).toBe(401);
    }

    const blocked = await signInPOST(post('signin', '203.0.113.20'));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(blocked.headers.get('Access-Control-Allow-Origin')).toBe(EXTENSION_ORIGIN);
    expect(signInWithPassword).toHaveBeenCalledTimes(60);
  });

  it('gives sign-up the same 60, shared with sign-in', async () => {
    for (let i = 0; i < 30; i++) {
      expect((await signInPOST(post('signin', '203.0.113.21'))).status).toBe(401);
      expect((await signUpPOST(post('signup', '203.0.113.21'))).status).toBe(200);
    }

    expect((await signUpPOST(post('signup', '203.0.113.21'))).status).toBe(429);
    expect((await signInPOST(post('signin', '203.0.113.21'))).status).toBe(429);
    expect(signUp).toHaveBeenCalledTimes(30);
  });

  it('still lets a user sign in after they used up the API budget', async () => {
    const apiRequest = () =>
      new Request('https://api.rolodink.app/api/connections', { headers: { 'x-forwarded-for': '203.0.113.22' } });
    for (let i = 0; i < 600; i++) expect(rateLimitMiddleware(apiRequest())).toBeNull();
    expect(rateLimitMiddleware(apiRequest())?.status).toBe(429);

    expect((await signInPOST(post('signin', '203.0.113.22'))).status).toBe(401);
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
