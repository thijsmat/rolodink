import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { ENVELOPE_VERSION, masterKeyFingerprint, unwrapDataKey, wrapDataKey } from '@/lib/envelope';

const { findMany, updateMany, deleteMany, head } = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  head: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { userKey: { findMany, updateMany }, rateLimitCounter: { deleteMany } },
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ select: () => ({ limit: head }) }) }),
}));

import { GET } from './route';

const CURRENT = randomBytes(32);
const NEXT = randomBytes(32);
const ROTATION_ENV = [
  'CRON_SECRET',
  'ENCRYPTION_MASTER_KEY',
  'ENCRYPTION_MASTER_KEY_NEXT',
  'ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT',
] as const;
const saved = Object.fromEntries(ROTATION_ENV.map((name) => [name, process.env[name]]));

function cronRequest(secret = 'cron-secret') {
  return new NextRequest('https://api.rolodink.app/api/cron/keep-alive', {
    headers: { authorization: `Bearer ${secret}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  head.mockResolvedValue({ error: null });
  deleteMany.mockResolvedValue({ count: 0 });
  process.env.CRON_SECRET = 'cron-secret';
  process.env.ENCRYPTION_MASTER_KEY = CURRENT.toString('base64');
  delete process.env.ENCRYPTION_MASTER_KEY_NEXT;
  delete process.env.ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const name of ROTATION_ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe('GET /api/cron/keep-alive', () => {
  it('rejects a request without the cron secret and touches no key', async () => {
    const res = await GET(cronRequest('wrong'));

    expect(res.status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('leaves user_keys alone when no rotation is going on', async () => {
    const res = await GET(cronRequest());

    expect(await res.json()).toEqual({ ok: true, keyRotation: { state: 'unset' } });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('re-wraps with a compare-and-set on the old value once the next key is confirmed', async () => {
    process.env.ENCRYPTION_MASTER_KEY_NEXT = NEXT.toString('base64');
    process.env.ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT = masterKeyFingerprint(NEXT);
    const dataKey = randomBytes(32);
    const old = wrapDataKey(dataKey, CURRENT);
    findMany.mockResolvedValue([{ user_id: 'user-1', encrypted_key: old, salt: ENVELOPE_VERSION }]);
    updateMany.mockResolvedValue({ count: 1 });

    const res = await GET(cronRequest());

    expect(await res.json()).toEqual({
      ok: true,
      keyRotation: {
        state: 'confirmed',
        done: true,
        currentIsNext: false,
        total: 1,
        rewrapped: 1,
        alreadyNext: 0,
        changedMeanwhile: 0,
        failed: 0,
      },
    });
    const { where, data } = updateMany.mock.calls[0][0];
    expect(where).toEqual({ user_id: 'user-1', encrypted_key: old });
    expect(unwrapDataKey(data.encrypted_key, NEXT).equals(dataKey)).toBe(true);
  });

  it('still succeeds as a keep-alive when the rotation fails', async () => {
    process.env.ENCRYPTION_MASTER_KEY_NEXT = NEXT.toString('base64');
    process.env.ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT = masterKeyFingerprint(NEXT);
    findMany.mockRejectedValue(new Error('connection lost'));

    const res = await GET(cronRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, keyRotation: { state: 'error' } });
  });

  it('logs only the name and code of a failed rotation, never its message', async () => {
    // A Prisma validation error spells out its arguments, which here are wrapped keys.
    process.env.ENCRYPTION_MASTER_KEY_NEXT = NEXT.toString('base64');
    process.env.ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT = masterKeyFingerprint(NEXT);
    findMany.mockResolvedValue([{ user_id: 'user-1', encrypted_key: wrapDataKey(randomBytes(32), CURRENT), salt: ENVELOPE_VERSION }]);
    updateMany.mockRejectedValue(
      Object.assign(new Error('Invalid `updateMany()` invocation: encrypted_key: "wrapped-key-blob"'), {
        name: 'PrismaClientValidationError',
      })
    );

    await GET(cronRequest());

    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain('PrismaClientValidationError');
    expect(logged).not.toContain('wrapped-key-blob');
  });
});
