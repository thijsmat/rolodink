-- Gedeelde teller voor de rate limiter (src/lib/rate-limit.ts, model
-- RateLimitCounter in schema.prisma). Eenmalig uitvoeren in de Supabase
-- SQL-editor; tot dan valt de limiter terug op een teller per instance.

CREATE TABLE IF NOT EXISTS "public"."RateLimitCounter" (
  "key"         TEXT        NOT NULL,
  "windowStart" TIMESTAMPTZ(6) NOT NULL,
  "count"       INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX IF NOT EXISTS "RateLimitCounter_windowStart_idx"
  ON "public"."RateLimitCounter" ("windowStart");

-- Alleen de server (Prisma, als tabeleigenaar) komt erbij. RLS aan zonder
-- policies en geen grants maakt de tabel onzichtbaar voor de Supabase
-- REST-API (anon en authenticated), zodat niemand tellers kan lezen of
-- resetten.
ALTER TABLE "public"."RateLimitCounter" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "public"."RateLimitCounter" FROM anon, authenticated;
