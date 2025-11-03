#!/usr/bin/env bash
set -euo pipefail

# Markdown report generator for Rolodink extension artifacts
# Verifies Chrome, Edge, and Firefox v1.0.3 ZIPs

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Expected artifacts
CHROME_ZIP="linkedin-crm-extension/rolodink-v1.0.3-chrome.zip"
EDGE_ZIP="Rolodink-Edge-v1.0.3.zip"
FIREFOX_ZIP="Rolodink-Firefox-1.0.3.zip"

ARTIFACTS=(
  "$CHROME_ZIP|Chrome|MV3"
  "$EDGE_ZIP|Edge|MV3"
  "$FIREFOX_ZIP|Firefox|MV2"
)

echo "## Rolodink Extension Artifacts Verification (v1.0.3)"
echo

# Table header
echo "| Filename | Size | Manifest version | Browser target | Key differences |"
echo "|---|---:|---:|---|---|"

for entry in "${ARTIFACTS[@]}"; do
  IFS='|' read -r zip browser mv <<<"$entry"

  if [[ ! -f "$zip" ]]; then
    echo "| $zip | MISSING | - | $browser | File not found |"
    continue
  fi

  size_human=$(ls -lh "$zip" | awk '{print $5}')

  # Extract manifest fields
  version=$(unzip -p "$zip" manifest.json 2>/dev/null | jq -r '.version' || echo "-")
  mver=$(unzip -p "$zip" manifest.json 2>/dev/null | jq -r '.manifest_version' || echo "-")

  # Determine key differences descriptor
  key_diff=""
  if [[ "$browser" == "Chrome" || "$browser" == "Edge" ]]; then
    key_diff="Uses MV3 action + host_permissions"
  else
    # Firefox
    has_ba=$(unzip -p "$zip" manifest.json | jq 'has("browser_action")')
    has_data=$(unzip -p "$zip" manifest.json | jq '(.browser_specific_settings.data_collection_permissions.collects_data // false)')
    key_diff="MV2 browser_action; AMO data collection block: collects_data=$has_data"
    if [[ "$has_ba" != "true" ]]; then
      key_diff="${key_diff}; WARNING: browser_action missing"
    fi
  fi

  echo "| $zip | $size_human | $mver | $browser | $key_diff |"
done

echo
echo "### Per-artifact details"
echo

for entry in "${ARTIFACTS[@]}"; do
  IFS='|' read -r zip browser mv <<<"$entry"
  echo "#### $browser - \`$zip\`"
  if [[ ! -f "$zip" ]]; then
    echo "File not found."
    echo
    continue
  fi

  size_human=$(ls -lh "$zip" | awk '{print $5}')
  version=$(unzip -p "$zip" manifest.json 2>/dev/null | jq -r '.version' || echo "-")
  mver=$(unzip -p "$zip" manifest.json 2>/dev/null | jq -r '.manifest_version' || echo "-")

  echo
  echo "- **Size**: $size_human"
  echo "- **Manifest version**: $mver"
  echo "- **Version**: $version"
  if [[ "$browser" == "Firefox" ]]; then
    collects=$(unzip -p "$zip" manifest.json | jq -r '.browser_specific_settings.data_collection_permissions.collects_data // false')
    dtype=$(unzip -p "$zip" manifest.json | jq -r '.browser_specific_settings.data_collection_permissions.data_types // [] | join(", ")')
    purpose=$(unzip -p "$zip" manifest.json | jq -r '.browser_specific_settings.data_collection_permissions.purpose // ""')
    echo "- **Data collection**: collects_data=$collects; types=[$dtype]; purpose=\"$purpose\""
  fi

  echo
  echo "- **Included files**:"
  echo ""
  echo '```'
  unzip -l "$zip"
  echo '```'

  echo
  echo "- **Development artifacts check**:"
  echo '```'
  # Fail-list any dev files present
  unzip -l "$zip" | awk '{print $4}' | grep -E '\\.map$|/src/|\\.ts$|\\.tsx$|node_modules/|tsconfig\\.json|tsconfig\\.app\\.json|tsconfig\\.node\\.json|eslint\\.config|vite\\.config' || echo "No dev files detected"
  echo '```'

  echo
done

echo "\n> Note: Chrome and Edge reuse the same MV3 codebase; Firefox uses MV2 with AMO-required fields."

