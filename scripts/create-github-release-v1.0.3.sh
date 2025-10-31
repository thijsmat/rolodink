#!/usr/bin/env bash
set -euo pipefail

# Draft GitHub Release for v1.0.3 with artifacts
# Requires: GitHub CLI (gh) with authenticated session

REPO="thijsmat/rolodink"
TAG="v1.0.3"
TITLE="Rolodink v1.0.3 — First Official Multi‑Browser Release"
NOTES_FILE="RELEASE-NOTES-v1.0.3.md"

CHROME_ZIP="linkedin-crm-extension/rolodink-v1.0.3-chrome.zip"
EDGE_ZIP="Rolodink-Edge-v1.0.3.zip"
FIREFOX_ZIP="Rolodink-Firefox-1.0.3.zip"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install from https://cli.github.com/" >&2
  exit 1
fi

if [[ ! -f "$NOTES_FILE" ]]; then
  echo "Release notes file not found: $NOTES_FILE" >&2
  exit 1
fi

# Ensure tag exists locally
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally."
else
  echo "Creating annotated tag $TAG"
  git tag -a "$TAG" -m "Release v1.0.3 - Multi-browser support"
fi

echo "Pushing tag $TAG to origin"
git push origin "$TAG"

echo "Creating draft release $TAG on $REPO"
gh release create "$TAG" \
  --repo "$REPO" \
  --title "$TITLE" \
  --notes-file "$NOTES_FILE" \
  --draft \
  "$CHROME_ZIP" "$EDGE_ZIP" "$FIREFOX_ZIP"

echo "Draft release created. Review at: https://github.com/$REPO/releases/tag/$TAG"

