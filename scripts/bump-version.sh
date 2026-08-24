#!/bin/bash

# Automation script for bumping version across the Rolodink monorepo
# Usage: ./scripts/bump-version.sh <version>

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: No version provided."
  echo "Usage: $0 <version>"
  exit 1
fi

FILES=(
  "linkedin-crm-extension/manifest.json"
  "linkedin-crm-extension/manifest-firefox.json"
  "linkedin-crm-extension/package.json"
  "linkedin-crm-extension/ui/package.json"
  "linkedin-crm-backend/package.json"
  "website/package.json"
)

echo "Bumping version to $VERSION..."

for FILE in "${FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "Warning: $FILE not found, skipping."
    continue
  fi

  echo "Updating $FILE..."
  
  # Handle manifest.json and manifest-firefox.json (search for "version": "...")
  if [[ $FILE == *.json ]]; then
    # Using sed to replace the version field. Works for both manifest and package.json
    # This regex is specific to "version": "..." format
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$FILE"
  fi
done

# The extension version that /api/version reports to the update notice. Not a
# JSON file, so it needs its own line - and it needs one, because for a long
# time it had none: the value drifted two releases behind the manifests and the
# notice started telling people an old build was the newest there was.
# version.test.ts fails the build if this stops matching.
VERSION_MODULE="linkedin-crm-backend/src/lib/version.ts"
if [ -f "$VERSION_MODULE" ]; then
  echo "Updating $VERSION_MODULE..."
  sed -i "s/^export const LATEST_EXTENSION_VERSION = '[^']*';/export const LATEST_EXTENSION_VERSION = '$VERSION';/" "$VERSION_MODULE"
else
  echo "Warning: $VERSION_MODULE not found, skipping."
fi

echo "Version bump complete."
echo "Don't forget to update CHANGELOG.md, RELEASE_NOTES_v$VERSION.md and the website changelog!"
