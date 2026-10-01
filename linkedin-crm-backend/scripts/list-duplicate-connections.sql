-- Lists duplicate connections: rows of one owner whose linkedInUrl is the same
-- LinkedIn profile once canonicalised. READ-ONLY: a single SELECT, nothing is
-- written, merged or deleted. Run it in a read-only session, for example:
--
--   BEGIN TRANSACTION READ ONLY;
--   \i linkedin-crm-backend/scripts/list-duplicate-connections.sql
--   ROLLBACK;
--
-- It outputs ids, timestamps and URLs only. Note contents are never selected:
-- they are encrypted client-side and the server cannot read or merge them
-- anyway. `has_notes` and `note_entries` only say whether something is there.
--
-- The canonical URL is computed the way @rolodink/core profileLookupUrl does
-- it (packages/core/src/url.ts):
--   * only LinkedIn hosts (linkedin.com and any *.linkedin.com);
--   * the first path segment after /in/ (also under /mwlite/in/), so
--     subpages, locale suffixes, query and hash fall away;
--   * that slug percent-decoded, and lowercased (lower() follows the database
--     locale for non-ASCII letters) unless it is a member ID
--     (starts with ACoAA, case-insensitive), which is case-sensitive;
--   * 'https://www.linkedin.com/in/' || slug.
-- Rows that are not a profile URL keep their stored value and only group with
-- an identical string, which the unique index already rules out.
--
-- Known gap, same as in the code: a member-ID URL and the vanity URL of the
-- same person cannot be matched offline and are not reported here.
-- A slug whose percent-encoding is not valid UTF-8 makes convert_from fail;
-- if that happens, the error names the value.

WITH parsed AS (
    SELECT
        c.id,
        c."ownerId",
        c."linkedInUrl",
        c."createdAt",
        c."updatedAt",
        c.notes IS NOT NULL AND c.notes <> '' AS has_notes,
        CASE
            WHEN c."linkedInUrl" ~* '^(https?://)?([a-z0-9-]+\.)*linkedin\.com(:[0-9]+)?/(mwlite/)?in/[^/?#]+'
            THEN substring(c."linkedInUrl" FROM '(?i)/in/([^/?#]+)')
        END AS raw_slug
    FROM "public"."Connection" c
),
decoded AS (
    SELECT
        p.*,
        (
            SELECT convert_from(
                string_agg(
                    CASE
                        WHEN t.m[1] ~ '^%[0-9A-Fa-f]{2}$' THEN decode(substr(t.m[1], 2), 'hex')
                        ELSE convert_to(t.m[1], 'UTF8')
                    END,
                    ''::bytea ORDER BY t.ord ASC
                ),
                'UTF8'
            )
            FROM regexp_matches(p.raw_slug, '(%[0-9A-Fa-f]{2}|[^%]+|%)', 'g') WITH ORDINALITY AS t(m, ord)
        ) AS slug
    FROM parsed p
),
canonical AS (
    SELECT
        d.*,
        CASE
            WHEN d.slug IS NULL THEN d."linkedInUrl"
            WHEN d.slug ~* '^ACoAA' THEN 'https://www.linkedin.com/in/' || d.slug
            ELSE 'https://www.linkedin.com/in/' || lower(d.slug)
        END AS canonical_url
    FROM decoded d
)
SELECT
    k."ownerId",
    k.canonical_url,
    count(*) AS row_count,
    json_agg(
        json_build_object(
            'id', k.id,
            'linkedInUrl', k."linkedInUrl",
            'isCanonical', k."linkedInUrl" = k.canonical_url,
            'createdAt', k."createdAt",
            'updatedAt', k."updatedAt",
            'has_notes', k.has_notes,
            'note_entries', (SELECT count(*) FROM "public"."Note" n WHERE n."connectionId" = k.id)
        )
        ORDER BY k."updatedAt" DESC
    ) AS connections
FROM canonical k
GROUP BY k."ownerId", k.canonical_url
HAVING count(*) > 1
ORDER BY k."ownerId" ASC, k.canonical_url ASC;
