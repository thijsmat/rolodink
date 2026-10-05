import { describe, expect, it } from 'vitest';
import { databaseUrl } from './prisma';

describe('databaseUrl', () => {
  it('prefers DATABASE_URL', () => {
    expect(databaseUrl({ DATABASE_URL: 'postgres://manual', POSTGRES_PRISMA_URL: 'postgres://synced' })).toBe('postgres://manual');
  });

  it('falls back to the Supabase integration variable', () => {
    expect(databaseUrl({ POSTGRES_PRISMA_URL: 'postgres://synced' })).toBe('postgres://synced');
    expect(databaseUrl({ DATABASE_URL: '', POSTGRES_PRISMA_URL: 'postgres://synced' })).toBe('postgres://synced');
  });

  it('is undefined without either, so Prisma reports the missing variable itself', () => {
    expect(databaseUrl({})).toBeUndefined();
  });
});
