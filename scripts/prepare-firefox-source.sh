#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/linkedin-crm-extension"
OUT_DIR="$REPO_ROOT/.web-ext-src"

echo "🧹 Clearing old source..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "📦 Preparing source code for Firefox AMO..."

# 1. Root Extension Files
cp "$SRC_DIR/manifest-firefox.json" "$OUT_DIR/"
cp "$SRC_DIR/content-firefox.js" "$OUT_DIR/" 2>/dev/null || true
cp "$SRC_DIR/icon.png" "$OUT_DIR/" 2>/dev/null || true
cp -r "$SRC_DIR/icons" "$OUT_DIR/" 2>/dev/null || true
cp "$SRC_DIR/README.md" "$OUT_DIR/" 2>/dev/null || true

# 2. UI Source Code (Critical for review)
mkdir -p "$OUT_DIR/ui"

# Copy config files
cp "$SRC_DIR/ui/package.json" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/package-lock.json" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/vite.config.ts" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/vite.background.config.ts" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/tsconfig.json" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/tsconfig.app.json" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/tsconfig.node.json" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/tsconfig.background.json" "$OUT_DIR/ui/"

# Copy build scripts
cp "$SRC_DIR/ui/build-background.cjs" "$OUT_DIR/ui/"
cp "$SRC_DIR/ui/remove-block-comments.cjs" "$OUT_DIR/ui/"

# Copy Source Directories
echo "   Copying src/..."
cp -r "$SRC_DIR/ui/src" "$OUT_DIR/ui/"
echo "   Copying public/..."
cp -r "$SRC_DIR/ui/public" "$OUT_DIR/ui/"

# 3. Build Instructions for Reviewer
cat <<EOF > "$OUT_DIR/BUILD_INSTRUCTIONS.md"
# Build Instructions for Reviewer

This extension uses Vite and React. To build from source:

1. Prerequisite: Node.js (v18+) and npm.

2. Install dependencies:
   cd ui
   npm install

3. Build the extension:
   npm run build

4. The build output will be in \`ui/dist\`.
   The \`manifest-firefox.json\` at the root should be used as the manifest.
EOF

echo "✅ Firefox source prepared at $OUT_DIR"
echo "   Ready to zip: cd .web-ext-src && zip -r ../rolodink-source-vX.X.X.zip ."
