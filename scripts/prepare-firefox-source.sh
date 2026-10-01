#!/usr/bin/env bash
set -euo pipefail

# Source archive for the AMO reviewer.
#
# It reproduces the repository layout rather than flattening the extension
# directory into the archive root, and that is not tidiness: since the content
# script became a Vite bundle, ui/src imports @rolodink/core, and all three
# Vite configs plus tsconfig.app.json resolve that to
# `../../packages/core/src/index.ts` - above linkedin-crm-extension. An archive
# containing only that directory cannot be built by anyone, which is exactly
# what AMO asks a reviewer to try.
#
# content-firefox.js used to be copied here. It is gone: Firefox now ships the
# same bundle as Chrome and Edge.
#
# The instructions written below must reproduce what `node build.js firefox`
# (release.yml) puts in the submitted zip, file for file. Three things made
# them fall short, and all three are handled here (a trial build from the
# archive now matches dist/tmp/firefox byte for byte):
#
#  - The build stopped at tsc: the test suites under ui/src need @types/node,
#    which only the monorepo root installs. They are left out (see step 3).
#
#  - build.js runs firefox-postbuild.cjs (rewriteFirefoxBundle) on the Firefox
#    copy: block comments stripped, `.innerHTML=` rewritten. The instructions
#    never ran it, so the reviewer's JavaScript differed from the package.
#    Step 4 now runs it, on ui/dist, which in the reviewer's build holds only
#    the Firefox output.
#
#  - The VITE_ variables are not optional for reproduction. Without
#    VITE_SUPABASE_URL the Supabase client is dead code and Vite drops it, so
#    background.js shrinks from ~226 KB to ~8 KB. When the three variables
#    release.yml passes are set while this script runs, they are written to
#    ui/.env.production in the archive, where Vite reads them. They are public
#    client configuration that ships inside the bundle anyway, not secrets.
#    VITE_WEBSITE_URL is left out on purpose: release.yml does not set it.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/.web-ext-src"
EXT_OUT="$OUT_DIR/linkedin-crm-extension"

echo "🧹 Clearing old source..."
rm -rf "$OUT_DIR"
mkdir -p "$EXT_OUT/ui" "$OUT_DIR/packages"

echo "📦 Preparing source code for Firefox AMO..."

# 1. The shared package the build resolves through ../../packages/core.
echo "   Copying packages/core/..."
cp -r "$REPO_ROOT/packages/core" "$OUT_DIR/packages/"
rm -rf "$OUT_DIR/packages/core/node_modules" "$OUT_DIR/packages/core/.turbo"

# 2. Extension root files.
cp "$REPO_ROOT/linkedin-crm-extension/manifest-firefox.json" "$EXT_OUT/"
cp "$REPO_ROOT/linkedin-crm-extension/icon.png" "$EXT_OUT/" 2>/dev/null || true
cp -r "$REPO_ROOT/linkedin-crm-extension/icons" "$EXT_OUT/" 2>/dev/null || true
cp "$REPO_ROOT/linkedin-crm-extension/README.md" "$EXT_OUT/" 2>/dev/null || true

# 3. UI source and every config the build reads.
UI_SRC="$REPO_ROOT/linkedin-crm-extension/ui"
# index.html is the popup's Vite entry point. Leaving it out was the first
# thing a trial run of these instructions caught: npm ci and tsc both succeed,
# and then vite stops with "Could not resolve entry module index.html". The
# list is verified by building from the archive, not by reading it.
for FILE in package.json package-lock.json index.html \
            vite.config.ts vite.background.config.ts vite.content.config.ts \
            tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.background.json \
            build-background.cjs build-content.cjs copy-assets.cjs firefox-postbuild.cjs; do
  if [[ -f "$UI_SRC/$FILE" ]]; then
    cp "$UI_SRC/$FILE" "$EXT_OUT/ui/"
  else
    echo "   ⚠️  $FILE not found in ui/ - the reviewer's build may fail"
  fi
done

echo "   Copying ui/src/..."
cp -r "$UI_SRC/src" "$EXT_OUT/ui/"
# Test suites and their LinkedIn captures are not part of the package, and
# they break the reviewer's build: `npm run build` starts with tsc over all of
# src, and navigation.test.ts imports node:fs. In the monorepo @types/node
# resolves from the root node_modules; ui's own lockfile does not install it,
# so in this archive tsc stops there. The tests run in the repository's CI.
find "$EXT_OUT/ui/src" \( -name '*.test.ts' -o -name '*.test.tsx' \) -type f -delete
find "$EXT_OUT/ui/src" -name '__fixtures__' -type d -prune -exec rm -rf {} +
echo "   Copying ui/public/..."
cp -r "$UI_SRC/public" "$EXT_OUT/ui/" 2>/dev/null || true

# 4. The build-time configuration release.yml passes to build.js.
ENV_VARS=(VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_API_BASE_URL)
missing_env=()
for VAR in "${ENV_VARS[@]}"; do
  [[ -n "${!VAR:-}" ]] || missing_env+=("$VAR")
done
if [[ ${#missing_env[@]} -eq 0 ]]; then
  echo "   Writing ui/.env.production (${ENV_VARS[*]})..."
  for VAR in "${ENV_VARS[@]}"; do
    printf '%s=%s\n' "$VAR" "${!VAR}"
  done > "$EXT_OUT/ui/.env.production"
else
  echo "   ⚠️  Not set: ${missing_env[*]}"
  echo "      Without the release values the reviewer's build will NOT match the"
  echo "      submitted package (the Supabase client is dropped from background.js)."
  echo "      Export the values release.yml uses and run this script again."
fi

# 5. Build instructions, matching the layout above.
cat <<EOF > "$OUT_DIR/BUILD_INSTRUCTIONS.md"
# Build Instructions for Reviewer

This extension is built with Vite and React from TypeScript and JavaScript
sources. No minified or generated code is committed; everything here is source.

## Layout

    packages/core/                  shared logic (URL handling, encryption, names)
    linkedin-crm-extension/
      manifest-firefox.json         the manifest to ship
      icons/, icon.png
      ui/                           the build lives here

\`ui\` resolves \`@rolodink/core\` to \`../../packages/core/src\`, so the two
directories must keep their relative positions. Building from inside
\`linkedin-crm-extension\` alone will not work.

## Steps

1. Prerequisites: Node.js v20 or newer, and npm.

2. Install dependencies:

       cd linkedin-crm-extension/ui
       npm ci

3. Build:

       npm run build

   This runs \`tsc\`, then Vite three times: the popup, the background script,
   and the content script.

   The last step of the build (\`copy-assets.cjs\`) prints a warning that
   \`manifest.json\` was not found. That is expected: this archive carries the
   Firefox manifest under its own name, and step 5 puts it in place. The
   warning does not fail the build.

   Output lands in \`linkedin-crm-extension/ui/dist\`, containing
   \`index.html\`, \`assets/\`, \`background.js\`, \`content.js\`, \`icons/\`
   and \`icon.png\`.

4. Apply the Firefox post-build step, still in \`linkedin-crm-extension/ui\`:

       node firefox-postbuild.cjs

   This is the step the release build applies to the Firefox package only. It
   rewrites the \`.js\` files in \`dist\` for the add-ons linter: block comments
   are removed, and \`.innerHTML=\` assignments in the minified React code are
   written as \`["innerHTML"]=\`. Nothing else changes. Without it the
   JavaScript will not match the submitted package.

5. Assemble the package: copy \`../manifest-firefox.json\` into \`dist\` as
   \`manifest.json\`:

       cp ../manifest-firefox.json dist/manifest.json

   \`dist\` now has the same files and contents as the submitted package.

## Environment

The build reads three \`VITE_\`-prefixed variables (\`VITE_SUPABASE_URL\`,
\`VITE_SUPABASE_ANON_KEY\`, \`VITE_API_BASE_URL\`). They are public client
configuration, not secrets: their values are visible in the shipped
\`background.js\`. They are provided in
\`linkedin-crm-extension/ui/.env.production\`, which Vite reads automatically
during \`npm run build\`.

They matter for reproduction. Without \`VITE_SUPABASE_URL\` the Supabase client
is unreachable code, Vite removes it, and \`background.js\` comes out at a few
KB instead of the shipped size. If that file is missing from this archive,
the values were not supplied when it was prepared; please ask for them.
EOF

echo "✅ Firefox source prepared at $OUT_DIR"
echo "   Ready to zip: cd .web-ext-src && zip -r ../rolodink-source-vX.Y.Z.zip ."
