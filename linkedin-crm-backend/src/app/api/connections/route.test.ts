import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const { findUnique, findMany, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { connection: { findUnique, findMany, update } } }));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));

import { GET, PATCH } from './route';

// Every request its own documentation-range IP (RFC 5737): the limiter's store
// is module-global.
let ip = 0;
const headers = () => ({ 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${++ip}` });

const get = (query = '') => new NextRequest(`https://api.rolodink.app/api/connections${query}`, { headers: headers() });
const patch = (body: unknown) =>
  new NextRequest('https://api.rolodink.app/api/connections', { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });

const notFound = () => new PrismaClientKnownRequestError('No record found', { code: 'P2025', clientVersion: '5.22.0' });

const row = { id: 'c1', ownerId: 'user-1', name: 'Jan', linkedInUrl: 'https://www.linkedin.com/in/jan' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/connections', () => {
  it('looks one profile up by the unique (owner, url) pair and answers with a list', async () => {
    findUnique.mockResolvedValue(row);

    const res = await GET(get('?url=' + encodeURIComponent('https://www.linkedin.com/in/jan/?trk=x')));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([row]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { ownerId_linkedInUrl: { ownerId: 'user-1', linkedInUrl: 'https://www.linkedin.com/in/jan' } },
    });
  });

  it('answers an empty list for a profile that is not stored', async () => {
    findUnique.mockResolvedValue(null);

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

describe('PATCH /api/connections', () => {
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
