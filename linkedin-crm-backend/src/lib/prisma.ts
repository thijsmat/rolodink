import { PrismaClient } from '@prisma/client';

/**
 * The connection string for the app. DATABASE_URL wins when it is set (local
 * development, CI, and production as long as the hand-made variable exists).
 * Without it, POSTGRES_PRISMA_URL is used: the pooled connection string the
 * Supabase integration on Vercel keeps in sync, so a database password reset
 * no longer has to be copied into Vercel by hand.
 */
export function databaseUrl(env: Partial<Record<string, string>> = process.env): string | undefined {
  return env.DATABASE_URL || env.POSTGRES_PRISMA_URL || undefined;
}

// Deze 'declare global' voorkomt dat 'hot reloading' 
// tijdens development honderden nieuwe verbindingen aanmaakt.
declare global {
   
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({ datasourceUrl: databaseUrl() });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
