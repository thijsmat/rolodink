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

echo "Version bump complete."
echo "Don't forget to update CHANGELOG.md and commit your changes!"
