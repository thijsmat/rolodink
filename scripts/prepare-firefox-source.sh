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
echo "   Copying ui/public/..."
cp -r "$UI_SRC/public" "$EXT_OUT/ui/" 2>/dev/null || true

# 4. Build instructions, matching the layout above.
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

4. Output lands in \`linkedin-crm-extension/ui/dist\`, containing
   \`index.html\`, \`assets/\`, \`background.js\` and \`content.js\`.

5. To assemble the package, copy \`manifest-firefox.json\` into that directory
   as \`manifest.json\`, and copy \`icons/\` and \`icon.png\` alongside it.

## Environment

The build reads three optional \`VITE_\`-prefixed variables
(\`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_ANON_KEY\`, \`VITE_API_BASE_URL\`).
They are public client configuration, not secrets, and the build succeeds
without them - only the resulting build points at no backend.
EOF

echo "✅ Firefox source prepared at $OUT_DIR"
echo "   Ready to zip: cd .web-ext-src && zip -r ../rolodink-source-vX.Y.Z.zip ."
