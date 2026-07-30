## v1.3.2 (2026-07-30) - Popup Polish

### Fixed
- Show the connection's name when editing a connection: the form only received the editable fields, so its header could not say whose details were being changed
- Stop rendering "Nieuwe Connectie" twice — the surrounding view added a heading above a form that already renders its own
- Bound the update notice's content with a scroll, so a long release-notes list from the server can no longer push the rest of the popup out of view
- Fix a 404 on `/onboarding/success`: the onboarding page passed a path without a locale prefix into the auth redirect, which the next-intl middleware does not match

### Notes
- Found while verifying v1.3.1 in a browser; the note-encryption fix itself is unchanged
- Edge is still on v1.3.0: the v1.3.1 publish uploaded and validated but could not be published while the v1.3.0 submission was in review

## v1.3.1 (2026-07-30) - Note Encryption Fix

### Fixed
- Fix a data-loss bug in the inline note card on LinkedIn profile pages: it read and wrote `Connection.notes` in plaintext while the popup encrypted the same field. An encrypted note therefore rendered as literal `rolodink-enc:...` in the textarea, and the 1-second autosave persisted that string plus any typed text back unencrypted — leaving a value that still carried the prefix but could no longer be decrypted, making the note permanently unreadable
- Route the inline card through the `ENCRYPT_TEXT` / `DECRYPT_TEXT` background handlers, so it reads and writes with the same encryption as the popup
- Leave notes written by earlier versions (stored without the prefix) readable, and encrypt them on their next edit
- Disable the textarea with an explanation when a note cannot be decrypted, so an unreadable note is never overwritten by the autosave

### Backend
- Extract the wrapped-data-key envelope format into `src/lib/envelope.ts`, now the single implementation shared by `GET /api/user/key` and the maintenance scripts
- Add `npm run audit:notes`, a read-only script that classifies every encrypted field as empty, legacy plaintext, decryptable or corrupt, so the extent of any existing damage can be measured

### Notes
- Firefox is unaffected: `content-firefox.js` does not include the inline note card
- This release cannot repair notes that were already corrupted — where plaintext was appended to ciphertext the original text is gone

## v1.3.0 (2026-07-30) - Server-tied Encryption

### Security
- Replace passphrase-based encryption with automatic server-tied account encryption: the backend generates a per-user AES-256 data key on first use and wraps it with `ENCRYPTION_MASTER_KEY` (AES-256-GCM envelope encryption); the extension imports it as a non-extractable CryptoKey
- Fix silent plaintext fallback: encryption failures now abort the save instead of silently storing data unencrypted
- Bind the background data-key cache to the logged-in user and clear it on logout, so an account switch can never encrypt data with the previous user's key
- Remove the unused `POST /api/user/key` endpoint that allowed overwriting the wrapped key (which would have made stored data permanently unreadable)
- Validate that `ENCRYPTION_MASTER_KEY` decodes to exactly 32 bytes so misconfiguration fails loudly

### Changed
- Remove the entire passphrase setup flow (Settings section, SecurityBanner, `SET_PASSPHRASE`/`CHECK_PASSPHRASE` handlers) — encryption now works automatically after login, no separate passphrase required
- Update signup messaging: personal data is encrypted automatically

### Backend
- Add `GET /api/cron/keep-alive` plus a daily Vercel Cron Job (04:23 UTC) that keeps the free-tier Supabase project active through a cheap Supabase REST query, preventing the "Resource provisioning failed" deploy breakage

### Infrastructure
- Make store publish workflows reliable: wait for release assets (fixes the publish race), migrate Edge publishing to the Partner Center API-key flow (`edge-addon@v2`), pin all third-party actions to commit SHAs, fail fast with clear errors on missing secrets
- Fix the Trivy security scan (`trivy-action` v0.36.0)
- Add a manual "Store Credentials Check" workflow that validates Chrome/Edge store credentials without publishing
- Rewrite `RELEASE_PROCESS.md` around the automated tag → draft → publish flow

## v1.2.0 (2026-02-24) - E2E Encryption & GDPR Onboarding

### Security
- Extend AES-GCM end-to-end encryption to cover `email`, `phone`, `meetingPlace`, and `userCompanyAtTheTime` in addition to `notes`
- Add `SENSITIVE_FIELDS` constant to centralise which fields are encrypted — single source of truth for future extensions
- Add `CHECK_PASSPHRASE` message handler in background script so UI can detect whether a passphrase is active in the current session

### New Features
- **Client-side migration tool** in Settings → Security: encrypts all existing plaintext data on-device without server involvement
- Passphrase-aware button (disabled until a passphrase is stored in session) with progress and result feedback
- Auth callback route (`/auth/callback`) fully rewritten to use `@supabase/ssr` (`createServerClient`) — fixes email-confirmation link on Next.js 15+/16
- New success page at `/[locale]/onboarding/success`: 5-step getting-started guide replacing the minimal placeholder

### Backend
- Add `email` (TEXT, nullable) and `phone` (TEXT, nullable) columns to `Connection` table (Supabase migration)
- Update Prisma schema and Zod validation schemas (`createConnectionSchema`, `updateConnectionSchema`) with new fields

## v1.1.6 (2026-02-10) - Auth Hardening


### Security
- Clean up access token from storage on sign-out to prevent stale token leakage
- Increase minimum password length from 6 to 8 characters (OWASP compliance)
- Add warning log when OAuth redirect lacks a refresh token

### Improvements
- Remove unnecessary `syncConfig()` that wrote build-time constants to mutable storage
- Add TODO for persistent rate limiter (Upstash Redis / Vercel KV) on serverless

## v1.1.5 (2026-02-10) - Hotfix

### Bug Fixes
- Fix `TypeError: Image is not a constructor` caused by `next/image` import shadowing the native `Image` constructor
- Fix missing `sizes` prop on `NextImage` with `fill` layout in onboarding page
- Replace raw `<img>` with `NextImage` in website hero section to resolve `no-img-element` lint warning

### Improvements
- Add direct email/password authentication flow to onboarding page
- Add LinkedIn sign-in option to onboarding page
- Update extension login translations for EN and NL

## v1.1.4

- Onboarding page redesign with step-by-step flow
- Centered layout with improved visual hierarchy
- i18n support for onboarding (EN/NL)

## v0.1.1 (staging)

- Point extension to staging API base URL (`linkedin-crm-staging-…vercel.app`)
- Centralize `API_BASE_URL` in `ui/src/config.ts`
- Improve packaging script to only flip `config.ts`, `content.js`, `manifest.json`
- UI fixes: scrolling, layout, LinkedIn tab navigation, toasts
