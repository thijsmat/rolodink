import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const { findUnique, findMany, update, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { connection: { findUnique, findMany, update, create } } }));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));

import { PROFILE_URL_VECTORS } from '@rolodink/core/url-vectors';
import { GET, PATCH, POST } from './route';

// Every request its own documentation-range IP (RFC 5737): the limiter's store
// is module-global.
let ip = 0;
const headers = () => ({ 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${++ip}` });

const get = (query = '') => new NextRequest(`https://api.rolodink.app/api/connections${query}`, { headers: headers() });
const patch = (body: unknown) =>
  new NextRequest('https://api.rolodink.app/api/connections', { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });

const post = (body: unknown) =>
  new NextRequest('https://api.rolodink.app/api/connections', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
const lookup = (url: string) => get('?url=' + encodeURIComponent(url));

const notFound = () => new PrismaClientKnownRequestError('No record found', { code: 'P2025', clientVersion: '5.22.0' });

const row = { id: 'c1', ownerId: 'user-1', name: 'Jan', linkedInUrl: 'https://www.linkedin.com/in/jan' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/connections', () => {
  it('looks one profile up among the owner\'s rows by its canonical key and answers with a list', async () => {
    findMany.mockResolvedValue([row]);

    const res = await GET(lookup('https://www.linkedin.com/in/jan/?trk=x'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([row]);
    const { where } = findMany.mock.calls[0][0];
    expect(where.ownerId).toBe('user-1');
    expect(where.OR).toContainEqual({ linkedInUrl: 'https://www.linkedin.com/in/jan' });
  });

  it('answers an empty list for a profile that is not stored', async () => {
    findMany.mockResolvedValue([]);

    const res = await GET(get('?url=' + encodeURIComponent('https://www.linkedin.com/in/nobody')));

    expect(await res.json()).toEqual([]);
  });

  it('lists every connection of the user, newest first, without a url', async () => {
    findMany.mockResolvedValue([row]);

    const res = await GET(get());

    expect(await res.json()).toEqual([row]);
    expect(findMany).toHaveBeenCalledWith({ where: { ownerId: 'user-1' }, orderBy: { createdAt: 'desc' } });
  });
});

// Every profile vector from the shared table: whatever spelling the client
// sends, the row stored under the canonical key is found.
const profileVectors = PROFILE_URL_VECTORS.filter((v) => v.expected.startsWith('https://www.linkedin.com/in/'));

describe('GET /api/connections?url= with URL variants', () => {
  it.each(profileVectors.map((v) => [v.label, v.input, v.expected] as const))(
    'finds the canonical row for %s',
    async (_label, input, expected) => {
      const stored = { ...row, linkedInUrl: expected };
      findMany.mockResolvedValue([stored]);

      const res = await GET(lookup(input));

      expect(await res.json()).toEqual([stored]);
      expect(findMany.mock.calls[0][0].where.OR).toContainEqual({ linkedInUrl: expected });
    },
  );

  it.each([
    'https://nl.linkedin.com/in/jan',
    'https://www.linkedin.com/in/jan/details/experience',
    'https://www.linkedin.com/in/Jan',
    'https://linkedin.com/in/jan',
  ])('still finds a row stored before canonicalisation as %s', async (legacy) => {
    const stored = { ...row, linkedInUrl: legacy };
    findMany.mockResolvedValue([stored]);

    const res = await GET(lookup('https://www.linkedin.com/in/jan/'));

    expect(await res.json()).toEqual([stored]);
    // The pre-filter has to be able to return that row at all.
    expect(findMany.mock.calls[0][0].where.OR).toEqual(
      expect.arrayContaining([
        { linkedInUrl: { endsWith: '/in/jan', mode: 'insensitive' } },
        { linkedInUrl: { contains: '/in/jan/', mode: 'insensitive' } },
      ]),
    );
  });

  it('finds an old client\'s exact non-canonical lookup of a legacy row', async () => {
    const stored = { ...row, linkedInUrl: 'https://nl.linkedin.com/in/jan' };
    findMany.mockResolvedValue([stored]);

    expect(await (await GET(lookup('https://nl.linkedin.com/in/jan'))).json()).toEqual([stored]);
  });

  it('ignores rows the pre-filter let through that are another profile', async () => {
    findMany.mockResolvedValue([
      { ...row, id: 'c2', linkedInUrl: 'https://www.linkedin.com/in/jan-2' },
      { ...row, id: 'c3', linkedInUrl: 'https://www.linkedin.com/in/ACoAAJan' },
    ]);

    expect(await (await GET(lookup('https://www.linkedin.com/in/jan'))).json()).toEqual([]);
  });

  it('prefers the canonical row when a legacy duplicate also exists', async () => {
    const legacy = { ...row, id: 'old', linkedInUrl: 'https://nl.linkedin.com/in/jan' };
    findMany.mockResolvedValue([legacy, row]);

    expect(await (await GET(lookup('https://de.linkedin.com/in/JAN/'))).json()).toEqual([row]);
  });

  it('keeps an exact match for a LinkedIn URL that is not a profile', async () => {
    findUnique.mockResolvedValue(null);

    await GET(lookup('https://www.linkedin.com/company/rolodink/?trk=x'));

    expect(findMany).not.toHaveBeenCalled();
    expect(findUnique).toHaveBeenCalledWith({
      where: { ownerId_linkedInUrl: { ownerId: 'user-1', linkedInUrl: 'https://www.linkedin.com/company/rolodink' } },
    });
  });
});

describe('POST /api/connections', () => {
  it.each(profileVectors.filter((v) => /^https?:\/\//.test(v.input)).map((v) => [v.label, v.input, v.expected] as const))(
    'stores %s under the canonical key',
    async (_label, input, expected) => {
      findMany.mockResolvedValue([]);
      create.mockResolvedValue({ ...row, linkedInUrl: expected });

      const res = await POST(post({ name: 'Jan', url: input }));

      expect(res.status).toBe(201);
      expect(create.mock.calls[0][0].data.linkedInUrl).toBe(expected);
    },
  );

  it('answers 409 without creating when a legacy row is the same profile', async () => {
    findMany.mockResolvedValue([{ ...row, linkedInUrl: 'https://nl.linkedin.com/in/jan/details/experience' }]);

    const res = await POST(post({ name: 'Jan', url: 'https://www.linkedin.com/in/Jan/' }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Connectie bestaat al voor deze URL.' });
    expect(create).not.toHaveBeenCalled();
  });

  it('answers the same 409 when the unique index catches a race', async () => {
    findMany.mockResolvedValue([]);
    create.mockRejectedValue(new PrismaClientKnownRequestError('Unique', { code: 'P2002', clientVersion: '5.22.0' }));

    const res = await POST(post({ name: 'Jan', url: 'https://www.linkedin.com/in/jan' }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Connectie bestaat al voor deze URL.' });
  });
});

describe('PATCH /api/connections', () => {
  it('refuses a url that would make the row a duplicate of another', async () => {
    findMany.mockResolvedValue([{ ...row, id: 'c2', linkedInUrl: 'https://nl.linkedin.com/in/sanne' }]);

    const res = await PATCH(patch({ id: 'c1', url: 'https://www.linkedin.com/in/Sanne/' }));

    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  it('stores a new url canonically, as linkedInUrl', async () => {
    findMany.mockResolvedValue([{ ...row, linkedInUrl: 'https://nl.linkedin.com/in/jan' }]);
    update.mockResolvedValue(row);

    const res = await PATCH(patch({ id: 'c1', url: 'https://nl.linkedin.com/in/jan/?trk=x', notes: 'x' }));

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1', ownerId: 'user-1' },
      data: { notes: 'x', linkedInUrl: 'https://www.linkedin.com/in/jan' },
    });
  });

  it('does not look URLs up for a patch without one', async () => {
    update.mockResolvedValue(row);

    await PATCH(patch({ id: 'c1', notes: 'x' }));

    expect(findMany).not.toHaveBeenCalled();
  });

  it('updates in one query, with ownership in the filter', async () => {
    update.mockResolvedValue({ ...row, notes: 'x' });

    const res = await PATCH(patch({ id: 'c1', notes: 'x' }));

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'c1', ownerId: 'user-1' }, data: { notes: 'x' } });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('answers 403 for a connection of someone else', async () => {
    update.mockRejectedValue(notFound());
    findUnique.mockResolvedValue({ ownerId: 'user-2' });

    expect((await PATCH(patch({ id: 'c9', notes: 'x' }))).status).toBe(403);
  });

  it('answers 404 for a connection that does not exist', async () => {
    update.mockRejectedValue(notFound());
    findUnique.mockResolvedValue(null);

    expect((await PATCH(patch({ id: 'c9', notes: 'x' }))).status).toBe(404);
  });

  it('rejects an id that is not a string before touching the database', async () => {
    expect((await PATCH(patch({ id: 42, notes: 'x' }))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/connections with expectedUpdatedAt', () => {
  const version = new Date('2026-09-30T12:34:56.789Z');
  const newer = new Date('2026-09-30T12:35:01.002Z');
  const stored = { ...row, notes: 'ENC:v1:abc', updatedAt: version };

  it('updates when the version matches, with the version in the filter', async () => {
    update.mockResolvedValue({ ...stored, notes: 'ENC:v1:new', updatedAt: newer });

    const res = await PATCH(patch({ id: 'c1', notes: 'ENC:v1:new', expectedUpdatedAt: version.toISOString() }));

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1', ownerId: 'user-1', updatedAt: version },
      data: { notes: 'ENC:v1:new' },
    });
    expect((await res.json()).updatedAt).toBe(newer.toISOString());
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('answers 409 with the current row when the version moved on', async () => {
    update.mockRejectedValue(notFound());
    const current = { ...stored, notes: 'ENC:v1:other', updatedAt: newer };
    findUnique.mockResolvedValue(current);

    const res = await PATCH(patch({ id: 'c1', notes: 'ENC:v1:mine', expectedUpdatedAt: version.toISOString() }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: 'conflict',
      code: 'CONNECTION_CONFLICT',
      current: JSON.parse(JSON.stringify(current)),
    });
  });

  it('keeps the old unconditional update without expectedUpdatedAt', async () => {
    update.mockResolvedValue(stored);

    const res = await PATCH(patch({ id: 'c1', notes: 'x' }));

    expect(res.status).toBe(200);
    expect(update.mock.calls[0][0].where).toEqual({ id: 'c1', ownerId: 'user-1' });
  });

  it('answers 403, not 409, for a connection of someone else', async () => {
    update.mockRejectedValue(notFound());
    findUnique.mockResolvedValue({ ...stored, ownerId: 'user-2' });

    const res = await PATCH(patch({ id: 'c1', notes: 'x', expectedUpdatedAt: version.toISOString() }));

    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain('ENC:v1');
  });

  it('answers 404 for a connection that does not exist', async () => {
    update.mockRejectedValue(notFound());
    findUnique.mockResolvedValue(null);

    const res = await PATCH(patch({ id: 'c9', notes: 'x', expectedUpdatedAt: version.toISOString() }));

    expect(res.status).toBe(404);
  });

  it.each(['yesterday', '2026-09-30', '', 42, null])('rejects expectedUpdatedAt %j with a 400', async (bad) => {
    const res = await PATCH(patch({ id: 'c1', notes: 'x', expectedUpdatedAt: bad }));

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('round-trips the updatedAt it serialised: sending it back matches the same instant', async () => {
    // What GET hands the client...
    findMany.mockResolvedValue([stored]);
    const [listed] = await (await GET(get())).json();
    expect(listed.updatedAt).toBe('2026-09-30T12:34:56.789Z');

    // ...is accepted as-is and becomes exactly the stored Date again.
    update.mockResolvedValue({ ...stored, updatedAt: newer });
    const res = await PATCH(patch({ id: 'c1', notes: 'y', expectedUpdatedAt: listed.updatedAt }));
    expect(res.status).toBe(200);
    expect(update.mock.calls[0][0].where.updatedAt.getTime()).toBe(version.getTime());

    // And the PATCH answer is again a value the next PATCH can send back.
    const saved = await res.json();
    update.mockResolvedValue({ ...stored, updatedAt: new Date(Date.parse(saved.updatedAt) + 1) });
    expect((await PATCH(patch({ id: 'c1', notes: 'z', expectedUpdatedAt: saved.updatedAt }))).status).toBe(200);
    expect(update.mock.calls[1][0].where.updatedAt.getTime()).toBe(newer.getTime());
  });

  it('accepts an offset spelling of the same instant', async () => {
    update.mockResolvedValue(stored);

    await PATCH(patch({ id: 'c1', notes: 'x', expectedUpdatedAt: '2026-09-30T14:34:56.789+02:00' }));

    expect(update.mock.calls[0][0].where.updatedAt.getTime()).toBe(version.getTime());
  });
});
