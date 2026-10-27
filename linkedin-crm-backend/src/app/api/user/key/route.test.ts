import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { ENVELOPE_VERSION, unwrapDataKey, wrapDataKey } from '@/lib/envelope';

const { findUnique, create } = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { userKey: { findUnique, create } } }));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));

import { GET } from './route';
import { getUserFromRequest } from '@/lib/supabase/server';

// This route hands out the key that unlocks every encrypted note. These tests
// pin its behaviour so the key logic can move into a shared helper (used by
// the legacy-field migration script too) without anything changing here.

const MASTER_KEY = randomBytes(32);
const previousMasterKey = process.env.ENCRYPTION_MASTER_KEY;

beforeAll(() => {
  process.env.ENCRYPTION_MASTER_KEY = MASTER_KEY.toString('base64');
});

afterAll(() => {
  process.env.ENCRYPTION_MASTER_KEY = previousMasterKey;
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Every test uses its own documentation-range IP (RFC 5737): the limiter's
// store is module-global.
function keyRequest(ip: string): NextRequest {
  return new NextRequest('https://api.rolodink.app/api/user/key', {
    headers: { 'x-forwarded-for': ip, authorization: 'Bearer token' },
  });
}

function storedKey(dataKey: Buffer, masterKey = MASTER_KEY) {
  return { user_id: 'user-1', encrypted_key: wrapDataKey(dataKey, masterKey), salt: ENVELOPE_VERSION };
}

describe('GET /api/user/key', () => {
  it('rejects a request without a valid session, checked strictly', async () => {
    vi.mocked(getUserFromRequest).mockResolvedValueOnce({ user: null, error: 'Unauthorized' } as never);

    const res = await GET(keyRequest('198.51.100.40'));

    expect(res.status).toBe(401);
    expect(getUserFromRequest).toHaveBeenCalledWith(expect.anything(), { strict: true });
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns the existing data key and creates nothing', async () => {
    const dataKey = randomBytes(32);
    findUnique.mockResolvedValueOnce(storedKey(dataKey));

    const res = await GET(keyRequest('198.51.100.41'));

    expect(res.status).toBe(200);
    expect((await res.json()).data_key).toBe(dataKey.toString('base64'));
    expect(findUnique).toHaveBeenCalledWith({ where: { user_id: 'user-1' } });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a key wrapped with the master key when the user has none', async () => {
    findUnique.mockResolvedValueOnce(null);
    create.mockImplementationOnce(async ({ data }) => data);

    const res = await GET(keyRequest('198.51.100.42'));

    expect(res.status).toBe(200);
    const { data_key } = await res.json();
    const { data } = create.mock.calls[0][0];
    expect(data.user_id).toBe('user-1');
    expect(data.salt).toBe(ENVELOPE_VERSION);
    expect(unwrapDataKey(data.encrypted_key, MASTER_KEY).toString('base64')).toBe(data_key);
  });

  it('uses the key a concurrent request created when its own create loses the race', async () => {
    const winner = randomBytes(32);
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(storedKey(winner));
    create.mockRejectedValueOnce(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));

    const res = await GET(keyRequest('198.51.100.43'));

    expect(res.status).toBe(200);
    expect((await res.json()).data_key).toBe(winner.toString('base64'));
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('fails when the create fails and there is still no key', async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValueOnce(new Error('connection lost'));

    const res = await GET(keyRequest('198.51.100.44'));

    expect(res.status).toBe(500);
    findUnique.mockReset();
  });

  it('refuses a stored key in another format', async () => {
    findUnique.mockResolvedValueOnce({ ...storedKey(randomBytes(32)), salt: 'some-passphrase-salt' });

    const res = await GET(keyRequest('198.51.100.45'));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid key format' });
  });

  it('fails without leaking anything when the key was wrapped with another master key', async () => {
    findUnique.mockResolvedValueOnce(storedKey(randomBytes(32), randomBytes(32)));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(keyRequest('198.51.100.46'));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to decrypt key' });
    consoleError.mockRestore();
  });
});
