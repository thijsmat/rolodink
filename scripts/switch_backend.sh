#!/bin/bash

# Script to switch between staging and production backends
# Usage: ./switch_backend.sh [staging|production]

# Define paths
EXT_DIR="linkedin-crm-extension"
UI_CONFIG_FILE="$EXT_DIR/ui/src/config.ts"
CONTENT_JS_FILE="$EXT_DIR/content.js"
MANIFEST_JSON_FILE="$EXT_DIR/manifest.json"

# Define URLs
STAGING_API_URL="https://linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app"
PRODUCTION_API_URL="https://linkedin-crm-backend-matthijs-goes-projects.vercel.app"

# Function to replace URL in a file
replace_url() {
    local file=$1
    local old_url=$2
    local new_url=$3
    # Use | as delimiter for sed to avoid issues with / in URLs
    sed -i "s|${old_url}|${new_url}|g" "$file"
}

# Function to update all relevant files to a target URL
update_extension_urls() {
    local target_url=$1
    local current_url=$2 # The URL currently in the files
    
    echo "Switching extension to $target_url backend..."
    replace_url "$UI_CONFIG_FILE" "$current_url" "$target_url"
    replace_url "$CONTENT_JS_FILE" "$current_url" "$target_url"
    replace_url "$MANIFEST_JSON_FILE" "$current_url" "$target_url"
}

# Get current API_BASE_URL from config.ts (assuming it's the source of truth for current state)
CURRENT_API_URL=$(grep "export const API_BASE_URL" "$UI_CONFIG_FILE" | cut -d "'" -f 2)

# Determine target URL
if [ "$1" = "staging" ]; then
    TARGET_URL="$STAGING_API_URL"
    echo "⚠️  WARNING: Staging backend may not be properly configured!"
    echo "Switching to STAGING backend..."
elif [ "$1" = "production" ]; then
    TARGET_URL="$PRODUCTION_API_URL"
    echo "Switching to PRODUCTION backend..."
else
    echo "Usage: $0 [staging|production]"
    echo "Current backend: $CURRENT_API_URL"
    exit 1
fi

# Update all files
update_extension_urls "$TARGET_URL" "$CURRENT_API_URL"

echo "✅ Backend switched to: $TARGET_URL"
echo "📝 Remember to rebuild the UI: cd $EXT_DIR/ui && npm run build"
echo ""
echo "🔍 Current configuration:"
echo "  UI Config: $(grep "export const API_BASE_URL" "$UI_CONFIG_FILE")"
echo "  Content.js: $(grep "const API_BASE_URL" "$CONTENT_JS_FILE")"
echo "  Manifest: $(grep "https://" "$MANIFEST_JSON_FILE")"