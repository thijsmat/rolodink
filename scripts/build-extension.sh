#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/linkedin-crm-extension"
UI_DIR="$EXT_DIR/ui"
TMP_DIR="$REPO_ROOT/.dist-tmp"

# Read version from manifest.json
MANIFEST_VERSION=$(jq -r '.version' "$EXT_DIR/manifest.json")
ZIP_NAME="Rolodink-${MANIFEST_VERSION}.zip"
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


