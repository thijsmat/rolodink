import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signUp } })),
}));

import { POST } from './route';

// SHA-1("password") = 5BAA6 + this suffix.
const PASSWORD_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';

function post(password: string, ip: string): NextRequest {
  return new NextRequest('https://api.rolodink.app/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email: 'someone@example.com', password }),
  });
}

function hibpAnswers(body: string | Error) {
  const fetch = vi.fn(async (_url: string | URL | Request) => {
    if (body instanceof Error) throw body;
    return new Response(body);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
  signUp.mockResolvedValue({ data: { user: { id: 'new-user' }, session: null }, error: null });
});

describe('/api/auth/signup leaked-password check', () => {
  it('refuses a password listed by Have I Been Pwned, before Supabase is called', async () => {
    const fetch = hibpAnswers(`${PASSWORD_SUFFIX}:9545824\r\n`);

    const res = await POST(post('password', '198.51.100.60'));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'password_pwned' });
    expect(signUp).not.toHaveBeenCalled();
    // Only the five-character hash prefix goes out.
    expect(String(fetch.mock.calls[0]![0])).toBe('https://api.pwnedpasswords.com/range/5BAA6');
  });

  it('signs up with a password that is not listed', async () => {
    hibpAnswers('0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n');

    const res = await POST(post('password', '198.51.100.61'));

    expect(res.status).toBe(200);
    expect(signUp).toHaveBeenCalledOnce();
  });

  it('still signs up when Have I Been Pwned cannot be reached', async () => {
    hibpAnswers(new TypeError('network down'));

    const res = await POST(post('password', '198.51.100.62'));

    expect(res.status).toBe(200);
    expect(signUp).toHaveBeenCalledOnce();
  });
});
