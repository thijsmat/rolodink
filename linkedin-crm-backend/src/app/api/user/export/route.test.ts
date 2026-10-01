import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique } } }));
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: { id: 'user-1' }, error: null })),
}));

import { GET } from './route';
import { getUserFromRequest } from '@/lib/supabase/server';

// Mirrors SENSITIVE_FIELDS in packages/core/src/fields.ts. A field added there
// has to be exported too (GDPR data portability).
const SENSITIVE_FIELDS = ['notes', 'meetingPlace', 'userCompanyAtTheTime', 'email', 'phone'];

const created = new Date('2026-09-01T10:00:00Z');

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue({
    id: 'user-1',
    email: 'owner@example.com',
    created_at: created,
    updated_at: created,
    connections: [
      {
        id: 'c1',
        name: 'Jan Jansen',
        linkedInUrl: 'https://www.linkedin.com/in/jan',
        ownerId: 'user-1',
        notes: 'rolodink-enc:AAAA',
        meetingPlace: 'Rotterdam',
        userCompanyAtTheTime: 'Acme',
        email: 'rolodink-enc:BBBB',
        phone: '+31 6 12345678',
        createdAt: created,
        updatedAt: created,
      },
    ],
  });
});

// Every test uses its own documentation-range IP (RFC 5737): the limiter's
// store is module-global.
function exportRequest(ip: string): NextRequest {
  return new NextRequest('https://api.rolodink.app/api/user/export', {
    headers: { 'x-forwarded-for': ip, authorization: 'Bearer token' },
  });
}

describe('GET /api/user/export', () => {
  it('exports every sensitive field, exactly as stored', async () => {
    const res = await GET(exportRequest('203.0.113.30'));
    expect(res.status).toBe(200);
    expect(getUserFromRequest).toHaveBeenCalledWith(expect.anything(), { strict: true });
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
    const body = await res.json();

    const [connection] = body.connections;
    for (const field of SENSITIVE_FIELDS) expect(connection).toHaveProperty(field);
    expect(connection.notes).toBe('rolodink-enc:AAAA');
    expect(connection.email).toBe('rolodink-enc:BBBB');
    expect(connection.phone).toBe('+31 6 12345678');
    expect(body.exportInfo).toMatchObject({ version: '1.1', totalConnections: 1 });
    for (const field of SENSITIVE_FIELDS) expect(body.exportInfo.encryptedFieldsNote).toContain(field);
  });

  it('exports exactly the connection fields, without the owner id', async () => {
    const res = await GET(exportRequest('203.0.113.31'));
    const [connection] = (await res.json()).connections;
    expect(Object.keys(connection).sort()).toEqual(
      [
        'createdAt', 'email', 'id', 'linkedInUrl', 'meetingPlace', 'name', 'notes',
        'phone', 'updatedAt', 'userCompanyAtTheTime',
      ].sort()
    );
  });
});
