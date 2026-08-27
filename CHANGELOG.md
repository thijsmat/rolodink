## v1.3.6 (2026-08-24) - One Extension, Three Browsers

**Firefox gets the inline note card.** It never had one: Firefox ran a separate
content script, `content-firefox.js`, 353 lines against 900, with no
`injectContextField` anywhere in it. Every fix written for LinkedIn's August
2026 redesign stopped at Chrome and Edge. All three now ship the same bundle.

### Added (Firefox)
- The "Rolodink Note" card on profile pages, with the same encryption round-trip as the other browsers
- Injection into the hero card next to Message rather than the sticky header
- Following LinkedIn's own navigation: a profile opened from the feed or a search result now works
- Teardown between profiles, so one profile's button and note never carry over to the next
- Everything else the bundled content script has gained since the fork was frozen

### Changed
- The platform difference the fork existed for now lives in one module. Firefox's `browser.*` is promise-native; Chrome's `chrome.*` takes a callback and reports failure through `runtime.lastError`. The style is chosen from which global exists, before any call - probing by calling and seeing what comes back cannot be made safe for `sendMessage`, because the call has already sent the message
- `manifest-firefox.json` matches all of LinkedIn, like Chrome's. It was narrowed to `/in/*` because the old fork had no path gating; the bundle gates on the path itself

### Fixed
- **A third manifest.** `ui/public/manifest.json` sat at version 1.1.1 with the old `/in/*` matches. Vite copies `public/` wholesale, so it landed as `dist/manifest.json` on every build and was overwritten a step later by `copy-assets.cjs` - a trap held shut by step ordering. It escaped through the source archive, where a reviewer saw 1.1.1 against a submission of 1.3.5
- **The AMO source archive could not be built.** It flattened the extension directory into the archive root, but `ui` resolves `@rolodink/core` above that directory, and `index.html` was never copied at all. It now reproduces the repository layout, verified by building from the archive rather than by reading the instructions

### Tests
- 121 tests in the extension workspace, up from 93. 21 of them run the same assertions against a fake of each platform - there is no Firefox in CI and none on the machine this was developed from, so a fake of each is the honest claim
- CI packages the Firefox target for the first time and fails if its `content.js` lacks the note card or comes in well under the Chrome bundle's size

## v1.3.5 (2026-08-18) - Delivery Fix

No change to what the extension does. This release exists because v1.3.4
reached only one of the three stores.

**If you use Chrome or Edge, this is the release that brings you everything in
v1.3.4** - the nine fixes for LinkedIn's August 2026 redesign. Firefox already
has them.

### Fixed (release pipeline)
- The Edge package no longer carries a `key` field in its manifest. Partner Center rejects such a package outright - "The manifest shouldn't contain the key field" - so the v1.3.4 Edge submission failed validation before it ever reached review. Chrome accepts the same field and keeps it
- Published releases now carry the notes written for them. `release.yml` ran `envsubst` over the template unconditionally and never read `RELEASE_NOTES_vX.Y.Z.md`, so v1.3.4 went out telling users "Brief summary of what's new in this release." while a complete set of notes sat unused in the repository
- A failed store upload can be retried. The three publish workflows fired only on `release: published`, so recovering from one store's failure meant unpublishing and republishing the release

### CI
- Packaging in pull-request CI now builds the Edge target as well, and fails if its manifest carries a key or differs from Chrome's in anything else. Only Chrome was packaged before, which is why a broken Edge package could reach a published release

### Note on v1.3.4
Published to Firefox only. The Chrome upload failed on an expired store
credential, unrelated to the package.

## v1.3.4 (2026-08-18) - LinkedIn's August 2026 Redesign *(Firefox only)*

LinkedIn rebuilt its profile pages, and every selector the extension used to
find its way around them stopped matching. The button and the note card were
gone. Nine separate faults sat behind that, and this release fixes all of them.

### Fixed
- **The "Add to Rldnk" button is back.** Every selector it used - `.pv-top-card`, `.artdeco-button--primary`, `.entry-point`, the Message button by `aria-label` - returned zero matches after the redesign, and the Message action had become an `<a>` rather than a `<button>`. The action row is now found by meaning: where a link goes, what a button does
- **The note card is back.** It was gated on a 1st-degree check reading `.dist-value`, a class that no longer exists, so the gate could never pass for anyone
- **Both land in the hero card**, next to Message, instead of the narrow bar that only appears once you scroll. The header is chosen by height now, which is the only property that reliably tells the two apart
- **The card sits below the header** rather than floating over the navigation bar. It used to be inserted into the action row itself, which is a flex container, so it rendered as a panel beside the buttons
- **Notes save again.** Every API call from the LinkedIn page was blocked by CORS; they now go through the service worker, which holds the host permission and is not subject to page CORS
- **Notes save whatever order you work in.** The connection id was looked up once when the card was placed, so a profile added to the CRM afterwards kept being told "Add to CRM first" - and the typed note was lost
- **Rolodink follows LinkedIn's own navigation.** The extension only ran on documents loaded at a `/in/` URL, so a profile reached from the feed, a search result or a "people also viewed" card never started it at all. Onboarding sends every new user to the feed, so the default path for a fresh install was precisely the one that could not work
- **Injection keeps checking after the page goes quiet.** Requests arriving during a run were dropped rather than queued, and the DOM observer was the only clock - so the last mutations of LinkedIn's render burst, the ones that add the hero card, were thrown away and never revisited. This is also what repairs an injection that LinkedIn re-renders away
- **The button and the card follow you between profiles.** Now that the script survives navigation, the previous profile's injections are torn down explicitly; without that, profile B inherited profile A's "Already added" and note

### Fixed (accounts and sign-in)
- **Signing in from the onboarding page could not sign the extension in.** The two use different storage, and nothing bridged them, so the flow it recommended was the one that did not work. Onboarding now points at the popup, which does work
- Signing out clears the cached encryption key, and a stale key can no longer be handed to the next account

### Changed
- The extension no longer sends the API token from the page; the service worker attaches it from the session it already holds
- A message to the service worker now times out after 15 seconds. An MV3 worker can die between send and reply, and the reply then never arrives

### Tests
- 93 tests now run in the extension workspace, which had no test runner at all before this work. They cover the DOM logic against two real captures of the redesigned profile header, the header choice, the injection scheduler, and the API and auth boundaries
- Source-level guards fail the build if a dead LinkedIn class name comes back, or if the observer is wired straight to the injection again. Behavioural tests cannot see either: a selector that matches nothing simply makes the feature quietly do nothing, which is the exact failure this release is about

### Note on v1.3.3
v1.3.3 was packaged but never published to the stores. Its contents ship here.

## v1.3.3 (2026-08-11) - Build Consolidation *(never published)*

No user-visible changes. This release exists so the repackaged extension ships
under a version of its own; the behaviour on LinkedIn is identical to v1.3.2.

### Changed
- The content script is now bundled from `linkedin-crm-extension/ui/src/content/main.js` with Vite instead of being copied verbatim, so it can import from `@rolodink/core` — Chrome and Edge only, Firefox still ships `content-firefox.js` unchanged
- `cleanProfileName` and the crypto helpers now live in `@rolodink/core`, replacing three and two hand-maintained copies respectively
- The popup's `vite.config.js`/`vite.config.d.ts` pair is gone; `vite.config.ts` is the only config, and it pins `minify: 'esbuild'` so the output is unchanged

### CI
- Tests now run on every push and pull request. They previously ran nowhere, which made the suites in `packages/core` and the backend decoration rather than a gate
- The extension lint can fail the build again (`continue-on-error` removed)
- `node build.js chrome` runs in pull-request CI and asserts that `content.js` in the package is the bundle, not the raw source — the failure mode that would otherwise only surface at release time
- `release.yml` gained a manual trigger and a check that the version matches both manifests, so a release can no longer be packaged under a version the extension does not report
- All nine SonarCloud findings and both Semgrep findings resolved; five dead build scripts removed

### Security
- `createDecipheriv` for the wrapped-key envelope now states `authTagLength: 16` explicitly. This was defence-in-depth, not a live vulnerability: the tag is sliced at fixed offsets and short blobs were already rejected. A fixed ciphertext vector, generated before the change, is now a test

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
