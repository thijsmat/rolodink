import type { Connection, Prisma } from '@prisma/client';
import { getProfileSlug, profileLookupUrl } from '@rolodink/core/url';
import { prisma } from '@/lib/prisma';

/**
 * Finding a connection by LinkedIn URL, for GET ?url=, POST and PATCH.
 *
 * Every write stores `profileLookupUrl(url)` (`https://www.linkedin.com/in/<slug>`),
 * so for rows written from now on an exact match on that key is enough.
 *
 * Rows written before that were stored with the old normalizer: host kept
 * (`nl.linkedin.com`), the full path kept (`/in/<slug>/details/…`), slug case
 * and percent-encoding as the browser had them. There is no migration that
 * rewrites them - rewriting could collide with a canonical row and the server
 * cannot merge encrypted notes - so the lookup finds them instead:
 *
 *  1. one query over the owner's rows: the canonical key exactly, or a stored
 *     URL that ends in `/in/<slug>` or contains `/in/<slug>/` (case-insensitive,
 *     for each spelling of the slug the request could have been stored with);
 *  2. those candidates are filtered in code on `profileLookupUrl(stored) ===
 *     profileLookupUrl(requested)`, which is the actual definition of "same
 *     profile"; the SQL is only a narrow pre-filter;
 *  3. the canonical row wins, otherwise the most recently updated legacy row.
 *
 * Non-profile URLs (company pages and the like) keep the old exact match.
 */
export async function findOwnedConnectionByUrl(ownerId: string, rawUrl: string): Promise<Connection | null> {
  const key = profileLookupUrl(rawUrl);
  const requestedSlug = getProfileSlug(rawUrl);
  const canonicalSlug = getProfileSlug(key);

  if (!requestedSlug || !canonicalSlug) {
    return prisma.connection.findUnique({
      where: { ownerId_linkedInUrl: { ownerId, linkedInUrl: key } },
    });
  }

  const spellings = new Set<string>();
  for (const slug of [canonicalSlug, requestedSlug]) {
    spellings.add(slug);
    spellings.add(encodeURIComponent(slug));
  }
  const legacyMatches: Prisma.ConnectionWhereInput[] = [];
  for (const slug of spellings) {
    legacyMatches.push(
      { linkedInUrl: { endsWith: `/in/${slug}`, mode: 'insensitive' } },
      { linkedInUrl: { contains: `/in/${slug}/`, mode: 'insensitive' } },
    );
  }

  const candidates = await prisma.connection.findMany({
    where: { ownerId, OR: [{ linkedInUrl: key }, ...legacyMatches] },
    orderBy: { updatedAt: 'desc' },
  });

  const sameProfile = candidates.filter((row) => profileLookupUrl(row.linkedInUrl) === key);
  return sameProfile.find((row) => row.linkedInUrl === key) ?? sameProfile[0] ?? null;
}
