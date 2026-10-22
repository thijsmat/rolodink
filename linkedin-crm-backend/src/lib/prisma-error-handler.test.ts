import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from './prisma-error-handler';

// Error details go to the log; the client only ever sees the route's own
// message. These messages are what used to leak.
describe('handlePrismaError', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});

  it('does not echo an unmapped Prisma error message', async () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Invalid `prisma.connection.update()` invocation: column "secret_col" of relation "Connection"',
      { code: 'P2010', clientVersion: 'test' },
    );
    const { response } = handlePrismaError(err, {}, 'Fallback message');
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Fallback message' });
  });

  it('does not echo the message of a generic error such as a failed connection', async () => {
    const err = new Error("Can't reach database server at `db.example.internal:5432`");
    const { response } = handlePrismaError(err, {}, 'Fallback message');
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('db.example.internal');
    expect(body).toEqual({ error: 'Fallback message' });
  });

  it('still maps known codes to their status', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: 'test' });
    const { response } = handlePrismaError(err, {});
    expect(response.status).toBe(404);
  });
});
