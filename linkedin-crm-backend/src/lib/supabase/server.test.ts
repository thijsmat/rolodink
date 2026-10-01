import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getClaims, getUser } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project-ref.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  return { getClaims: vi.fn(), getUser: vi.fn() };
});
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: { getClaims, getUser } })),
}));

import type { JwtPayload } from '@supabase/supabase-js';
import { getUserFromRequest, userFromClaims } from './server';

const NOW = Math.floor(Date.now() / 1000);
const ISSUER = 'https://project-ref.supabase.co/auth/v1';

function claims(overrides: Record<string, unknown> = {}): JwtPayload {
  return {
    iss: ISSUER,
    sub: 'user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'owner@example.com',
    exp: NOW + 3600,
    iat: NOW,
    session_id: 'session-1',
    aal: 'aal1',
    ...overrides,
  };
}

function request(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new Request('https://api.rolodink.app/api/connections', { headers });
}

const noSession = { data: null, error: null };

beforeEach(() => {
  vi.clearAllMocks();
  // No cookie session unless a test says otherwise.
  getClaims.mockImplementation(async (jwt?: string) =>
    jwt ? { data: { claims: claims(), header: {}, signature: new Uint8Array() }, error: null } : noSession
  );
  getUser.mockImplementation(async (jwt?: string) =>
    jwt
      ? { data: { user: { id: 'user-1', email: 'owner@example.com' } }, error: null }
      : { data: { user: null }, error: { message: 'Auth session missing!' } }
  );
});

describe('getUserFromRequest (default: getClaims)', () => {
  it('returns the user from valid Bearer claims without calling getUser', async () => {
    const result = await getUserFromRequest(request('Bearer good-token'));

    expect(result).toEqual({ user: { id: 'user-1', email: 'owner@example.com' }, error: null });
    expect(getClaims).toHaveBeenCalledWith('good-token');
    expect(getUser).not.toHaveBeenCalled();
  });

  it('returns no user when getClaims rejects the token (bad signature, expired)', async () => {
    getClaims.mockImplementation(async (jwt?: string) =>
      jwt ? { data: null, error: { message: 'JWT has expired' } } : noSession
    );

    expect(await getUserFromRequest(request('Bearer expired'))).toEqual({ user: null, error: 'Invalid token' });
  });

  it('returns no user when getClaims throws on a malformed token', async () => {
    getClaims.mockImplementation(async (jwt?: string) => {
      if (jwt) throw new SyntaxError('Unexpected token');
      return noSession;
    });

    expect(await getUserFromRequest(request('Bearer garbage'))).toEqual({ user: null, error: 'Invalid token' });
  });

  it('needs an Authorization header without a cookie session', async () => {
    expect(await getUserFromRequest(request())).toEqual({
      user: null,
      error: 'Missing or invalid Authorization header',
    });
    expect(await getUserFromRequest(request('Bearer '))).toEqual({
      user: null,
      error: 'Missing or invalid Authorization header',
    });
    // Only the cookie lookup ran: an empty token never reaches getClaims.
    expect(getClaims.mock.calls.every((args) => args[0] === undefined)).toBe(true);
  });

  it('uses a valid cookie session first', async () => {
    getClaims.mockResolvedValue({ data: { claims: claims({ sub: 'cookie-user' }) }, error: null });

    const result = await getUserFromRequest(request());

    expect(result.user?.id).toBe('cookie-user');
    expect(getClaims).toHaveBeenCalledWith(undefined);
  });
});

describe('getUserFromRequest (strict: getUser)', () => {
  it('asks the Auth server and never verifies locally', async () => {
    const result = await getUserFromRequest(request('Bearer good-token'), { strict: true });

    expect(result).toEqual({ user: { id: 'user-1', email: 'owner@example.com' }, error: null });
    expect(getUser).toHaveBeenCalledWith('good-token');
    expect(getClaims).not.toHaveBeenCalled();
  });

  it('returns no user for a revoked session or deleted user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Session from session_id claim in JWT does not exist' } });

    expect(await getUserFromRequest(request('Bearer revoked'), { strict: true })).toEqual({
      user: null,
      error: 'Invalid token',
    });
  });
});

describe('userFromClaims', () => {
  it('accepts an authenticated user token for this project', () => {
    expect(userFromClaims(claims(), NOW)).toEqual({ id: 'user-1', email: 'owner@example.com' });
    expect(userFromClaims(claims({ aud: ['authenticated', 'other'] }), NOW)?.id).toBe('user-1');
  });

  it.each([
    ['the anon key', { role: 'anon', sub: undefined }],
    ['an anon role with a subject', { role: 'anon' }],
    ['the service_role key', { role: 'service_role' }],
    ['a missing subject', { sub: undefined }],
    ['an empty subject', { sub: '' }],
    ['another audience', { aud: 'anon' }],
    ['another project', { iss: 'https://other-project.supabase.co/auth/v1' }],
    ['an expired token', { exp: NOW - 1 }],
    ['a missing exp', { exp: undefined }],
    ['a token that is not valid yet', { nbf: NOW + 60 }],
  ])('rejects %s', (_label, overrides) => {
    expect(userFromClaims(claims(overrides), NOW)).toBeNull();
  });

  it('rejects missing claims', () => {
    expect(userFromClaims(null)).toBeNull();
    expect(userFromClaims(undefined)).toBeNull();
  });

  it('rejects an anon token in getUserFromRequest too', async () => {
    getClaims.mockImplementation(async (jwt?: string) =>
      jwt ? { data: { claims: claims({ role: 'anon' }) }, error: null } : noSession
    );

    expect(await getUserFromRequest(request('Bearer anon-key'))).toEqual({ user: null, error: 'Invalid token' });
  });
});
