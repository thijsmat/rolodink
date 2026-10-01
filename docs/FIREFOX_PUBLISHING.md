# Firefox Publishing

Firefox ships the same UI bundle as Chrome and Edge. The only differences are
the manifest (`linkedin-crm-extension/manifest-firefox.json`) and a post-build
rewrite of the JavaScript for AMO's linter. Building and publishing both run
in CI; this page explains what they do and how to repeat them locally.

## How a release reaches AMO

1. **`release.yml`** (on an `ext-v*` tag push, or run by hand) builds the
   packages with `node build.js chrome`, `node build.js edge` and
   `node build.js firefox`, with the `VITE_*` secrets set, and attaches
   `dist/Rolodink-firefox-vX.Y.Z.zip` to the GitHub release.
2. **`publish-firefox.yml`** (on `release: published`, or run by hand with
   the tag, e.g. `ext-v1.3.7`) downloads that zip, unpacks it, installs
   web-ext from `tools/firefox-sign` and runs
   `web-ext sign --channel listed --source-dir firefox-source`. The repository
   secrets `FIREFOX_JWT_ISSUER` and `FIREFOX_JWT_SECRET` reach web-ext as
   `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` through the environment, never
   as CLI arguments.

So AMO gets exactly the zip attached to the release. There is no separate
Firefox build path.

## Building the Firefox package

From `linkedin-crm-extension/`, after `npm ci` at the repo root (build.js gets
`fs-extra` and `archiver` from the workspace install) and
`npm ci --ignore-scripts` in `linkedin-crm-extension/ui`:

```bash
cd linkedin-crm-extension
node build.js firefox                 # Firefox only
node build.js chrome edge firefox     # all three, UI built once (what CI runs)
```

What build.js does for Firefox:

1. Runs `npm run build` in `ui/` **once** for all targets given. The UI build
   does not depend on the target.
2. Copies `ui/dist` to the target's own folder, `dist/tmp/firefox` at the
   repo root.
3. Runs the Firefox post-build on that copy only:
   `require('ui/firefox-postbuild.cjs').rewriteFirefoxBundle(dir)`. It strips
   block comments and rewrites `.innerHTML=` as `["innerHTML"]=` in every
   `.js` file, to quiet linter false positives in minified React. `ui/dist`
   is shared by every target in the same run, so it stays unmodified and
   Chrome and Edge keep the original bundle.
4. Adds `icons/`, `icon.png` and `manifest-firefox.json` (as `manifest.json`).
   Firefox gets no manifest `key`; that is only for Chrome.
5. Zips it to `dist/Rolodink-firefox-vX.Y.Z.zip`.

Set the `VITE_*` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_API_BASE_URL`) for a real build. Without `VITE_SUPABASE_URL`, Vite
drops the Supabase client as dead code and `background.js` shrinks from about
226 KB to about 8 KB. CI checks for exactly that.

There are no `build:firefox`, `sign:firefox` or `watch:firefox` npm scripts,
and web-ext is not a root dependency any more.

## web-ext (lint, run, sign)

web-ext is pinned exactly in `tools/firefox-sign` (own `package.json` and
lockfile, deliberately not a workspace member). Use the same binary locally
as CI does:

```bash
(cd tools/firefox-sign && npm ci --ignore-scripts)
WEB_EXT=tools/firefox-sign/node_modules/.bin/web-ext

$WEB_EXT lint --source-dir dist/tmp/firefox    # AMO's linter
$WEB_EXT run  --source-dir dist/tmp/firefox    # try it in a temporary Firefox profile
```

No `npx web-ext`: npx downloads whatever version is current when the package
is missing. To upgrade web-ext, change the version in
`tools/firefox-sign/package.json`, run
`npm install --package-lock-only --ignore-scripts` there and commit both
files.

### Signing locally (rarely needed)

`publish-firefox.yml` is the normal path; to retry a failed publish, run it by
hand with the release tag. To sign locally anyway:

1. Get AMO API credentials: https://addons.mozilla.org/developers/addon/api/key/
   (Developer Hub > Tools > Manage API Keys > Generate new API key). The
   **JWT issuer** (e.g. `user:12345678:999`) is `WEB_EXT_API_KEY`, the **JWT
   secret** is `WEB_EXT_API_SECRET`. The secret is shown only once.
2. Copy `.env.example` to `.env` at the repo root and fill in both values.
   web-ext does not read `.env` itself, so export them:
   ```bash
   set -a; . ./.env; set +a
   ```
3. Sign. `--channel listed` submits a new version to the public listing, just
   as CI does; `--channel unlisted` only produces a signed `.xpi` for
   self-distribution:
   ```bash
   $WEB_EXT sign --channel unlisted --source-dir dist/tmp/firefox
   ```
   Signed files land in `web-ext-artifacts/`.

## Source code for AMO review

AMO can ask for the source, because the package is a Vite bundle. Create the
archive with:

```bash
export VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_API_BASE_URL=...   # the release values
./scripts/prepare-firefox-source.sh            # -> .web-ext-src/
cd .web-ext-src && zip -r ../rolodink-source-vX.Y.Z.zip .
```

The archive keeps the repository layout (`packages/core` next to
`linkedin-crm-extension`, because `ui` resolves `@rolodink/core` to
`../../packages/core/src`). It contains a `BUILD_INSTRUCTIONS.md` that
reproduces the submitted package: `npm ci`, `npm run build`,
`node firefox-postbuild.cjs` (the same rewrite build.js applies), then
`manifest-firefox.json` as `dist/manifest.json`. The three `VITE_*` values go
into `ui/.env.production` in the archive. They are public client
configuration, already visible in the shipped bundle. Without them the script
warns, and the reviewer's `background.js` will not match.

## Troubleshooting

- **401 Unauthorized when signing**: check `WEB_EXT_API_KEY` /
  `WEB_EXT_API_SECRET` locally, or the `FIREFOX_JWT_ISSUER` /
  `FIREFOX_JWT_SECRET` repository secrets in CI.
- **`publish-firefox.yml` finds no asset**: the release has no
  `Rolodink-firefox-*.zip`. Run `release.yml` for that version first.
- **`UI build output not found`**: the Vite build in `ui/` failed; scroll up
  for the actual error.
- **Linter warnings about `innerHTML` or comments**: you are linting `ui/dist`
  instead of `dist/tmp/firefox`. Only the Firefox copy is post-processed.
- **Wrong manifest**: `dist/tmp/firefox/manifest.json` must come from
  `manifest-firefox.json` (it has `browser_specific_settings.gecko.id`). CI's
  extension job checks this.
