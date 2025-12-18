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
    ZIP_PREFIX="Rolodink-Chrome";;
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

# Copy minimal runtime files
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '*.map' \
  --exclude '*.ts' \
  --exclude '*.tsx' \
  --exclude 'ui/src' \
  --exclude '.DS_Store' \
  "$EXT_DIR/" "$TMP_DIR/"

# Overwrite manifest and content script for target
cp "$MANIFEST_SRC" "$TMP_DIR/manifest.json"
cp "$CONTENT_SRC" "$TMP_DIR/content.js"

# Remove development-only and redundant items
rm -rf "$TMP_DIR/ui/src" || true
rm -rf "$TMP_DIR/ui/node_modules" || true
find "$TMP_DIR" -name '*.map' -delete || true

# CRITICAL: Remove any manifest files from ui/dist to prevent Chrome Web Store errors
rm -f "$TMP_DIR/ui/dist/manifest.json" || true
rm -f "$TMP_DIR/ui/dist/manifest-firefox.json" || true

# Copy _locales folder to root for i18n support (required by default_locale field)
if [ -d "$TMP_DIR/ui/dist/_locales" ]; then
  cp -r "$TMP_DIR/ui/dist/_locales" "$TMP_DIR/_locales"
fi

# Remove Firefox manifest from Chrome/Edge builds
if [ "$TARGET" = "chrome" ] || [ "$TARGET" = "edge" ]; then
  rm -f "$TMP_DIR/manifest-firefox.json" || true
fi

echo "==> Verifying key files exist"
test -f "$TMP_DIR/manifest.json"
test -f "$TMP_DIR/content.js"
test -f "$TMP_DIR/ui/dist/index.html"

echo "==> Creating ZIP: $ZIP_PATH"
rm -f "$ZIP_PATH"
(cd "$TMP_DIR" && zip -rq "$ZIP_PATH" .)

echo "==> Package created: $ZIP_PATH"


