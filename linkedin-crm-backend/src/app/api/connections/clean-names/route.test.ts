import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { findMany, update } = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { connection: { findMany, update } } }));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));

import { POST } from './route';

const request = () =>
  new NextRequest('https://api.rolodink.app/api/connections/clean-names', { method: 'POST' });

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue({});
});

describe('POST /api/connections/clean-names', () => {
  it('renames only the connections whose name changes', async () => {
    findMany.mockResolvedValue([
      { id: 'c1', name: '(3) Jan Jansen' },
      { id: 'c2', name: 'Piet Pietersen' },
    ]);

    const res = await POST(request());
    expect(res.status).toBe(200);
    expect((await res.json()).updatedCount).toBe(1);
    expect(update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'Jan Jansen' } });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when nothing changed', async () => {
    findMany.mockResolvedValue([{ id: 'c2', name: 'Piet Pietersen' }]);

    const res = await POST(request());
    expect((await res.json()).updatedCount).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });
});
