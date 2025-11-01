#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/linkedin-crm-extension"
OUT_DIR="$REPO_ROOT/.web-ext-src"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Ensure UI build exists
if [ ! -f "$SRC_DIR/ui/dist/index.html" ]; then
  (cd "$SRC_DIR/ui" && npm install && npm run build)
fi

# Copy ONLY runtime files
# 1) manifest.json (Firefox variant)
cp "$SRC_DIR/manifest-firefox.json" "$OUT_DIR/manifest.json"

# 2) content.js (Firefox variant)
cp "$SRC_DIR/content-firefox.js" "$OUT_DIR/content.js"

# 3) icon.png (action icon)
cp "$SRC_DIR/icon.png" "$OUT_DIR/icon.png"

# 4) icons/ folder (all sizes)
mkdir -p "$OUT_DIR/icons"
cp -a "$SRC_DIR/icons/." "$OUT_DIR/icons/"

# 5) ui/dist/ (built UI assets)
mkdir -p "$OUT_DIR/ui"
cp -a "$SRC_DIR/ui/dist" "$OUT_DIR/ui/"

echo "Firefox source prepared at $OUT_DIR"


