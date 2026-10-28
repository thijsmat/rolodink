# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rolodink is a LinkedIn notes layer: a browser extension (Chrome, Edge, Firefox) with a backend API and a marketing website. The README, `.cursorrules` and many top-level `*.md` files are partly outdated. They mention Next.js 15, SQLite and manual Edge uploads, none of which is true any more. Trust the code, CI (`.github/workflows/github-flow.yml`) and the two project skills over them.

## Project skills (read these first)

- `.claude/skills/rolodink-extension/SKILL.md`: required for **any** change in `linkedin-crm-extension/`. Every change must be checked against all three browsers in the same change. It holds the build and checksum commands and the known pitfalls.
- `.claude/skills/rolodink-release/SKILL.md`: releases, store publishing, Vercel/Supabase operations, the encryption architecture, master-key rotation and the legacy-field migration.
- `/release-prep X.Y.Z` (`.claude/skills/release-prep/`): opens the release PR with the version bump, release notes, CHANGELOG, website changelog and a manual test checklist for the three browsers.
- `/release X.Y.Z` (`.claude/skills/release/`): runs the release itself once that PR is merged. Only the user can start it.
- Subagent `crypto-reviewer` (`.claude/agents/`): run it on any change to encryption or key handling before pushing, and give it the diff.
- Hooks (`.claude/settings.json`):
  - In cloud sessions, `session-start.sh` installs dependencies the way CI does.
  - `guard-edits.mjs` blocks edits to `.env*`, `package-lock.json`, `extension-keys.json` and the fixed vector in `envelope.test.ts`. If it blocks you, don't work around it with Bash.

## Layout and commands

An npm-workspaces + Turbo monorepo on Node 22. Workspaces are `linkedin-crm-backend`, `linkedin-crm-extension` (only `build.js` and the manifests), `website` and `packages/*`. **`linkedin-crm-extension/ui` is not a workspace member.** It has its own lockfile and its own `npm ci`, and root `npm test` does not reach it.

```bash
npm ci --ignore-scripts                                   # root install (CI always uses --ignore-scripts)
(cd linkedin-crm-extension/ui && npm ci --ignore-scripts) # extension UI install
npm run prisma:generate --prefix linkedin-crm-backend     # needed after --ignore-scripts; no DB required

npm test                                    # turbo: backend + packages/core (vitest)
(cd linkedin-crm-backend && npm run lint && ../node_modules/.bin/tsc --noEmit && npm run build)
(cd linkedin-crm-extension/ui && npm run typecheck && npm run lint && npm test)
(cd linkedin-crm-extension && node build.js chrome edge firefox)   # packages into ../dist/tmp/<target>; rm -rf dist afterwards
(cd website && npm run lint && npm run build)

# single test file / single test
(cd linkedin-crm-backend && npx vitest run src/lib/envelope.test.ts -t "pre-authTagLength")
```

- The extension UI lint has a ratchet: `--max-warnings 35`. Don't push it up.
- In CI, use `npm run <script>` rather than `npx <tool>`, so only lockfile-pinned binaries run.
- A version bump goes through `./scripts/bump-version.sh X.Y.Z`. It updates six package/manifest files plus `linkedin-crm-backend/src/lib/version.ts`, and tests enforce that they stay in sync.

## Architecture

**Backend** (`linkedin-crm-backend`): Next.js 16 API routes only. It runs on Vercel in `fra1` and uses Prisma on Supabase Postgres, with both the `auth` and `public` schemas in `prisma/schema.prisma`.
- `src/lib/prisma.ts` → `databaseUrl()` picks `DATABASE_URL`, falling back to `POSTGRES_PRISMA_URL`. Vercel has no `DATABASE_URL`.
- Every `/api/*` route uses `rateLimitMiddleware` (`src/lib/rate-limit.ts`, counters in the DB) and `buildCorsHeaders` (`src/lib/cors.ts`). The CORS allowlist deliberately has no wildcards and no linkedin.com origins.
- Auth goes through `getUserFromRequest` (`src/lib/supabase/server.ts`). Pass `{ strict: true }` where a still-valid JWT for a signed-out or deleted user must not be enough, as in `/api/user/key`.
- `GET /api/cron/keep-alive` (Vercel Cron, daily 04:23 UTC) makes one Supabase REST call; Prisma traffic does not count as activity. Without it the free-tier project pauses and deploys fail with "Resource provisioning failed". The same route also cleans up rate-limit counters and runs master-key rotation (`src/lib/key-rotation.ts`).
- One-off and maintenance scripts live in `scripts/`, with tested logic in `scripts/lib/`. Run them with `tsx`; on Windows use `npx tsx --env-file=.env.local …`.

**Encryption** is client-side with a server-held key wrap:
- The backend gives each user an AES-256 data key, wrapped with `ENCRYPTION_MASTER_KEY` in `public.user_keys` (format marker `envelope-v1`). See `src/lib/envelope.ts`.
- `GET /api/user/key` hands the raw data key to the signed-in user. The extension encrypts the `SENSITIVE_FIELDS` (`notes`, `meetingPlace`, `userCompanyAtTheTime`, `email`, `phone`) itself, so ciphertext carries the prefix `rolodink-enc:`. The server never sees those plaintexts.
- `packages/core` (`@rolodink/core`) is shared, source-only TypeScript: crypto, field encryption, LinkedIn URL normalization, conflict logic and password checks. The extension UI reaches it via an alias in `vite.config.ts` that is mirrored in `tsconfig.app.json`; keep the two in sync.
- Invariants:
  - Encryption failure aborts the save; there is no plaintext fallback.
  - There is no `POST /api/user/key`.
  - Never encrypt an already-prefixed value.
  - The fixed vector in `envelope.test.ts` must never be "updated". If it fails, the change is wrong.
  - Losing or blindly replacing `ENCRYPTION_MASTER_KEY` makes all notes unreadable. Rotation only goes through `ENCRYPTION_MASTER_KEY_NEXT` (see the release skill).

**Extension** (`linkedin-crm-extension/ui`, React + Vite) is built into three outputs:
- the popup (`index.html`);
- `background.js` (`src/background/`). This is the only place that calls the API, and it is a narrow proxy, not a general fetch relay;
- `content.js` (`src/content/`), which runs on linkedin.com. It never fetches the API itself (CORS) and talks to the background via `sendMessage`.

All three browsers share the same bundles. Only the manifests (`manifest.json` vs `manifest-firefox.json`), the manifest `key` (Chrome only), and `firefox-postbuild.cjs` differ. All browser API calls go through `src/content/browser-api.ts`; a bare `chrome.*` call fails silently in Firefox. Many tests are source-text invariant tests (`*-invariants.test.ts`) or run against captured LinkedIn markup in `src/content/__fixtures__`. They guard failures that only appear in a real browser. Fix the code, not the invariant.

**Website** (`website`): Next.js 16 App Router with `next-intl`, routes under `src/app/[locale]`. Translations are in `src/messages/{nl,en}.json`, and both files must get the same keys. The changelog and download version shown on the site live there too (`ChangelogPage.releases`, `DownloadPage.version`) and are updated on every release.

## Conventions

- Code comments are in English. Skills, PR descriptions and commit subjects are usually Dutch, in the form `<Area>: <description>` (e.g. `Backend: …`, `Website: …`), and PRs follow `.github/pull_request_template.md`.
- GitHub Actions pin third-party actions to commit SHAs and never interpolate `${{ }}` directly in `run:` blocks. SonarCloud fails the security gate otherwise.
- The SonarCloud API is not reachable from Claude Code sessions; ask the user for dashboard findings.
