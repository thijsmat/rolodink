# @rolodink/core

Platform-agnostic Rolodink domain logic, shared by every client.

## Why this exists

All of Rolodink's logic currently lives inside the extension, fused into a React
hook that calls `chrome.*` APIs (`linkedin-crm-extension/ui/src/hooks/useConnectionLogic.ts`
does API calls, crypto, caching and `chrome.tabs.query` in one file). URL
normalization alone is duplicated **five** times across the repo, and
`content-firefox.js` has already drifted into a stale fork of `content.js`.

Adding a second client without a shared layer would have produced a sixth copy.
This package is where that logic lives instead.

It depends on nothing but `fetch`, WebCrypto and standard JS — no React, no
`chrome.*`, no Node built-ins — so it runs in a browser tab, in an extension,
and (with a WebCrypto polyfill) in React Native.

## What's in it

| Module | Purpose |
|---|---|
| `crypto.ts` | AES-GCM helpers. The extension imports these directly (its own copy, `ui/src/utils/cryptoHelper.ts`, was deleted in #41). |
| `fields.ts` | Which fields are encrypted, plus the `FieldCipher` port. |
| `url.ts` | LinkedIn profile URL normalization, slug extraction, share-payload parsing. |
| `client.ts` | `RolodinkClient` for the `api.rolodink.app` REST API. |
| `types.ts` | `Connection` and the request shapes. |

## Things that will bite you

**The ciphertext format is frozen.** `'rolodink-enc:' + base64(iv[12] || ciphertext || gcmTag[16])`.
Every note already in the database is stored this way. `crypto.test.ts` pins it
with a fixed ciphertext produced by the extension's own helper — if that test
fails, the format has drifted and existing data has become unreadable. A round
trip alone would not catch this, since it passes just as happily when both sides
are wrong together.

**Two URL normalizers, on purpose.** `GET /api/connections?url=` is an exact
string match that the server does *not* normalize, while `POST` *does* normalize
before storing — and its normalizer keeps the host. So rows can exist under
`nl.linkedin.com`. `legacyNormalizeLinkedInUrl` reproduces what is stored today;
`normalizeLinkedInUrl` produces the canonical form we want going forward.
`buildLookupCandidates` returns both. When both miss, fall back to matching on
`getProfileSlug` against the locally cached list.

**Never send `null` in a PATCH.** The server validates with
`z.string().optional()`, which rejects `null` outright — clearing a field means
sending `''`. `RolodinkClient.updateConnection` already handles this.

**Never overwrite `linkedInUrl`.** It is the extension's only lookup key and half
of the `[ownerId, linkedInUrl]` unique constraint. `ConnectionPatch` deliberately
has no `url` field.

**This package reads no environment variables.** Vite only exposes `VITE_*` and
Next only exposes `NEXT_PUBLIC_*`, so a shared package cannot straddle both. The
host injects `baseUrl` and `getAccessToken`.

## Migrating the extension onto this

Not done yet, and deliberately a separate change: `linkedin-crm-extension/ui` is
**not** a workspace member — it has its own `package-lock.json` and a separate
`npm ci` step in CI. Adopting this package there also means promoting `ui` into
the root workspaces, merging lockfiles, and verifying the IIFE background build
still resolves a symlinked dependency. That is a whole PR of risk against the
shipping product, so it is not bundled with new-client work.

When it happens, the extension implements `FieldCipher` on top of its existing
`chrome.runtime.sendMessage({type: 'ENCRYPT_TEXT'})` handlers, and the remaining
inline URL normalizers can be deleted. (The first step landed in #41: the
extension resolves this package through a Vite alias, and its `cryptoHelper.ts`
copy is gone.)

## Commands

```bash
npm test --workspace @rolodink/core        # vitest
npm run typecheck --workspace @rolodink/core
```
