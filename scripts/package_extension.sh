#!/usr/bin/env bash
set -euo pipefail

# This script temporarily switches the extension API domain to production,
# builds the UI, creates a zip of the whole extension directory, and then
# reverts the files back to the staging domain.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/linkedin-crm-extension"
UI_DIR="$EXT_DIR/ui"
ZIP_PATH="$REPO_ROOT/linkedin-crm-extension.zip"

# Domains
STAGING_URL="https://linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app"
PROD_URL="https://linkedin-crm-backend-matthijs-goes-projects.vercel.app"

# Files to update
FILES=(
  "$EXT_DIR/content.js"
  "$EXT_DIR/manifest.json"
  "$UI_DIR/src/config.ts"
)

restore_changes() {
  # Revert back to STAGING
  for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
      sed -i "s|$PROD_URL|$STAGING_URL|g" "$f" || true
    fi
  done
}

trap 'restore_changes' EXIT

echo "Switching extension to PRODUCTION backend: $PROD_URL"
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    sed -i "s|$STAGING_URL|$PROD_URL|g" "$f"
  fi
done

echo "Building UI..."
cd "$UI_DIR"
npm run build

echo "Creating zip: $ZIP_PATH"
cd "$REPO_ROOT"
rm -f "$ZIP_PATH"
zip -r "$ZIP_PATH" linkedin-crm-extension -x "**/.git/**" "**/node_modules/**" "**/.DS_Store" "**/*.map"

echo "Reverting extension back to STAGING backend: $STAGING_URL"
# Handled by trap restore_changes

echo "Done. Zip created at: $ZIP_PATH"


