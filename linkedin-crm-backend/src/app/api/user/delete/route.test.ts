import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { findUnique, connectionDeleteMany, userKeyDeleteMany, userDelete, transaction, deleteUser, createAdmin } =
  vi.hoisted(() => ({
    findUnique: vi.fn(),
    connectionDeleteMany: vi.fn(),
    userKeyDeleteMany: vi.fn(),
    userDelete: vi.fn(),
    transaction: vi.fn(),
    deleteUser: vi.fn(),
    createAdmin: vi.fn(),
  }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique, delete: userDelete },
    connection: { deleteMany: connectionDeleteMany },
    userKey: { deleteMany: userKeyDeleteMany },
    $transaction: transaction,
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: createAdmin }));

import { DELETE } from './route';
import { getUserFromRequest } from '@/lib/supabase/server';

function del(ip: string): NextRequest {
  return new NextRequest('https://api.rolodink.app/api/user/delete', {
    method: 'DELETE',
    headers: { authorization: 'Bearer token', 'x-forwarded-for': ip },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  findUnique.mockResolvedValue({ id: 'user-1', email: 'owner@example.com', _count: { connections: 3 } });
  connectionDeleteMany.mockReturnValue('delete-connections');
  userKeyDeleteMany.mockReturnValue('delete-key');
  transaction.mockResolvedValue([{ count: 3 }, { count: 1 }]);
  userDelete.mockResolvedValue({});
  deleteUser.mockResolvedValue({ data: {}, error: null });
  createAdmin.mockReturnValue({ auth: { admin: { deleteUser } } });
});

describe('DELETE /api/user/delete', () => {
  it('deletes connections and the data key in one transaction, then the login through the admin API', async () => {
    const res = await DELETE(del('203.0.113.40'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(connectionDeleteMany).toHaveBeenCalledWith({ where: { ownerId: 'user-1' } });
    expect(userKeyDeleteMany).toHaveBeenCalledWith({ where: { user_id: 'user-1' } });
    expect(transaction).toHaveBeenCalledWith(['delete-connections', 'delete-key']);
    expect(deleteUser).toHaveBeenCalledWith('user-1');
    expect(userDelete).not.toHaveBeenCalled();
    expect(body).toMatchObject({ deletedConnections: 3, loginDeleted: true });
  });

  it('checks the session with the Auth server (strict), not only the JWT', async () => {
    await DELETE(del('203.0.113.46'));

    expect(getUserFromRequest).toHaveBeenCalledWith(expect.anything(), { strict: true });
  });

  it('falls back to the database when there is no service-role key', async () => {
    createAdmin.mockReturnValue(null);

    const body = await (await DELETE(del('203.0.113.41'))).json();

    expect(userDelete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(body.loginDeleted).toBe(true);
  });

  it('falls back to the database when the admin API refuses', async () => {
    deleteUser.mockResolvedValue({ data: null, error: { message: 'User not allowed' } });

    const body = await (await DELETE(del('203.0.113.42'))).json();

    expect(userDelete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(body.loginDeleted).toBe(true);
  });

  it('still reports the data as deleted when the login cannot be removed', async () => {
    createAdmin.mockReturnValue(null);
    userDelete.mockRejectedValue(new Error('permission denied for table users'));

    const res = await DELETE(del('203.0.113.43'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.loginDeleted).toBe(false);
    expect(body.message).toMatch(/could not be removed/);
  });

  it('deletes nothing else when the data transaction fails', async () => {
    transaction.mockRejectedValue(new Error('db down'));

    const res = await DELETE(del('203.0.113.44'));

    expect(res.status).toBe(500);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it('answers 404 for a user that is already gone', async () => {
    findUnique.mockResolvedValue(null);

    const res = await DELETE(del('203.0.113.45'));

    expect(res.status).toBe(404);
    expect(transaction).not.toHaveBeenCalled();
  });
});
