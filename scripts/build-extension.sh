#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/linkedin-crm-extension"
UI_DIR="$EXT_DIR/ui"
TMP_DIR="$REPO_ROOT/.dist-tmp"

TARGET="chrome"
if [[ ${1:-} == --target=* ]]; then
  TARGET="${1#--target=}"
fi

# Determine manifest and content script per target
MANIFEST_SRC="$EXT_DIR/manifest.json"
CONTENT_SRC="$EXT_DIR/content.js"
ZIP_PREFIX="Rolodink"
case "$TARGET" in
  chrome)
    ZIP_PREFIX="Rolodink";;
  edge)
    ZIP_PREFIX="Rolodink-Edge";;
  firefox)
    MANIFEST_SRC="$EXT_DIR/manifest-firefox.json"
    CONTENT_SRC="$EXT_DIR/content-firefox.js"
    ZIP_PREFIX="Rolodink-Firefox";;
  *) echo "Unknown target: $TARGET" >&2; exit 1;;
esac

# Read version from source manifest
MANIFEST_VERSION=$(jq -r '.version' "$MANIFEST_SRC")
ZIP_NAME="${ZIP_PREFIX}-${MANIFEST_VERSION}.zip"
ZIP_PATH="$REPO_ROOT/$ZIP_NAME"

echo "==> Building UI (vite)"
if [ -f "$UI_DIR/package.json" ]; then
  (cd "$UI_DIR" && npm run build)
else
  echo "UI package.json not found in $UI_DIR" >&2
  exit 1
fi

echo "==> Preparing clean dist folder"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# Copy minimal runtime files - only include essential files
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '*.map' \
  --exclude '*.ts' \
  --exclude '*.tsx' \
  --exclude 'ui/src' \
  --exclude 'ui/package*.json' \
  --exclude 'ui/.env*' \
  --exclude 'ui/.gitignore' \
  --exclude 'ui/*.config.*' \
  --exclude 'ui/tsconfig*.json' \
  --exclude 'ui/*.tsbuildinfo' \
  --exclude 'ui/index.html' \
  --exclude 'ui/public' \
  --exclude '.DS_Store' \
  --exclude '/dist' \
  --exclude '*.md' \
  --exclude '*.sh' \
  --exclude '*.zip' \
  --exclude '.github' \
  --exclude 'manifest-firefox.json' \
  --exclude 'content-firefox.js' \
  --exclude 'build-production.js' \
  --exclude 'package.json' \
  --exclude 'validate.js' \
  --exclude '*content.js' \
  "$EXT_DIR/" "$TMP_DIR/"

# Copy only the correct content script for this target
cp "$CONTENT_SRC" "$TMP_DIR/content.js"
# Overwrite manifest for target
cp "$MANIFEST_SRC" "$TMP_DIR/manifest.json"

# Remove development-only and redundant items
rm -rf "$TMP_DIR/ui/src" || true
rm -rf "$TMP_DIR/ui/node_modules" || true
find "$TMP_DIR" -name '*.map' -delete || true

echo "==> Verifying key files exist"
test -f "$TMP_DIR/manifest.json"
test -f "$TMP_DIR/content.js"
test -f "$TMP_DIR/ui/dist/index.html"

echo "==> Creating ZIP: $ZIP_PATH"
rm -f "$ZIP_PATH"
(cd "$TMP_DIR" && zip -rq "$ZIP_PATH" .)

echo "==> Package created: $ZIP_PATH"


