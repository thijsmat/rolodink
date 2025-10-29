#!/bin/bash

# Rolodink Chrome Extension - Local Testing Script
# Tests the extension before Chrome Web Store submission

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🧪 Rolodink Extension - Local Testing${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found${NC}"
    echo -e "${YELLOW}   Run this script from: linkedin-crm-extension/${NC}"
    exit 1
fi

# Function to print test header
test_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

# Function to print failure
fail() {
    echo -e "${RED}❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print info
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to ask yes/no question
ask_question() {
    local question=$1
    local response
    
    echo ""
    echo -e "${YELLOW}❓ $question${NC}"
    echo -e "${CYAN}   [Y]es / [N]o / [S]kip${NC}"
    read -r -p "   > " response
    
    case "$response" in
        [yY]|[yY][eE][sS])
            return 0
            ;;
        [nN]|[nN][oO])
            return 1
            ;;
        [sS]|[sS][kK][iI][pP])
            return 2
            ;;
        *)
            echo -e "${YELLOW}   Invalid response, treating as 'No'${NC}"
            return 1
            ;;
    esac
}

# SECTION 1: Pre-flight checks
test_section "📋 PRE-FLIGHT CHECKS"

# Check if Chrome is installed
if command -v google-chrome &> /dev/null || command -v chrome &> /dev/null || command -v chromium &> /dev/null; then
    success "Chrome/Chromium is installed"
else
    fail "Chrome/Chromium not found"
    echo -e "${YELLOW}   Install Chrome: https://www.google.com/chrome/${NC}"
fi

# Check if dist folder exists
if [ -d "dist" ]; then
    success "dist/ folder exists"
else
    fail "dist/ folder not found"
    echo -e "${YELLOW}   Run: npm run build:production${NC}"
    exit 1
fi

# Check if ZIP exists
if [ -f "rolodink-v1.0.3-chrome.zip" ]; then
    success "rolodink-v1.0.3-chrome.zip exists"
    
    # Check ZIP size
    SIZE=$(du -h "rolodink-v1.0.3-chrome.zip" | cut -f1)
    info "ZIP size: $SIZE"
    
    # Warn if too large
    SIZE_BYTES=$(stat -f%z "rolodink-v1.0.3-chrome.zip" 2>/dev/null || stat -c%s "rolodink-v1.0.3-chrome.zip" 2>/dev/null)
    if [ "$SIZE_BYTES" -gt 10485760 ]; then
        warning "ZIP is larger than 10MB (Chrome Web Store limit)"
    fi
else
    fail "rolodink-v1.0.3-chrome.zip not found"
    echo -e "${YELLOW}   Run: npm run build:production${NC}"
    exit 1
fi

# Check manifest version
MANIFEST_VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
if [ "$MANIFEST_VERSION" = "1.0.3" ]; then
    success "Manifest version is 1.0.3"
else
    fail "Manifest version is $MANIFEST_VERSION (should be 1.0.3)"
fi

# Check for scripting permission (should NOT exist)
if grep -q '"scripting"' manifest.json; then
    fail "'scripting' permission still in manifest"
else
    success "'scripting' permission removed"
fi

# SECTION 2: Build validation
test_section "🔍 BUILD VALIDATION"

echo -e "${YELLOW}Running validation script...${NC}"
if npm run validate > /dev/null 2>&1; then
    success "Validation passed"
else
    fail "Validation failed"
    echo -e "${YELLOW}   Run: npm run validate${NC}"
fi

# Check required files in dist
REQUIRED_FILES=(
    "dist/manifest.json"
    "dist/icon.png"
    "dist/icons/icon16.png"
    "dist/icons/icon32.png"
    "dist/icons/icon48.png"
    "dist/icons/icon128.png"
    "dist/content.js"
    "dist/ui/dist/index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$(basename $file) exists"
    else
        fail "$file missing"
    fi
done

# SECTION 3: Manual testing instructions
test_section "🧪 MANUAL TESTING"

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  MANUAL TESTING REQUIRED - Please follow these steps      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}STEP 1: Load Extension in Chrome${NC}"
echo "  1. Open Chrome browser"
echo "  2. Navigate to: chrome://extensions/"
echo "  3. Enable 'Developer mode' (toggle in top right)"
echo "  4. Click 'Load unpacked'"
echo "  5. Select folder: $(pwd)/dist/"
echo ""

# Wait for user to load extension
if ask_question "Have you loaded the extension in Chrome?"; then
    success "Extension loaded in Chrome"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Extension loading"
    else
        fail "Extension not loaded - testing incomplete"
    fi
fi

echo ""
echo -e "${CYAN}STEP 2: Check Extension Popup${NC}"
echo "  1. Look for Rolodink icon in Chrome toolbar"
echo "  2. Click the Rolodink icon"
echo "  3. Popup should open (380px wide)"
echo "  4. Should show login view (if not logged in)"
echo ""

if ask_question "Does the popup open correctly?"; then
    success "Popup opens correctly"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Popup test"
    else
        fail "Popup does not open"
    fi
fi

echo ""
echo -e "${CYAN}STEP 3: Test on LinkedIn Profile${NC}"
echo "  1. Go to: https://www.linkedin.com/in/any-profile/"
echo "  2. Look for 'Add to CRM' button in profile header"
echo "  3. Button should appear near Message/Connect buttons"
echo "  4. Button should match LinkedIn styling"
echo ""

if ask_question "Does the 'Add to CRM' button appear on LinkedIn?"; then
    success "'Add to CRM' button appears"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: LinkedIn button test"
    else
        fail "'Add to CRM' button missing"
    fi
fi

echo ""
echo -e "${CYAN}STEP 4: Test Login Flow${NC}"
echo "  1. Click Rolodink icon to open popup"
echo "  2. Enter test credentials (or your Supabase account)"
echo "  3. Click 'Login'"
echo "  4. Should stay logged in after closing popup"
echo ""

if ask_question "Does login work correctly?"; then
    success "Login flow works"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Login test"
    else
        fail "Login flow broken"
    fi
fi

echo ""
echo -e "${CYAN}STEP 5: Test Add Note${NC}"
echo "  1. On any LinkedIn profile, click 'Add to CRM'"
echo "  2. Popup should open with profile info pre-filled"
echo "  3. Add a test note"
echo "  4. Click 'Save'"
echo "  5. Should see success message"
echo ""

if ask_question "Can you add a note successfully?"; then
    success "Add note works"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Add note test"
    else
        fail "Add note broken"
    fi
fi

echo ""
echo -e "${CYAN}STEP 6: Test All Connections View${NC}"
echo "  1. Open popup"
echo "  2. Click 'All Connections' button/link"
echo "  3. Should see list of saved connections"
echo "  4. Click on a connection to view details"
echo ""

if ask_question "Does the All Connections view work?"; then
    success "All Connections view works"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: All Connections test"
    else
        fail "All Connections view broken"
    fi
fi

echo ""
echo -e "${CYAN}STEP 7: Test Edit/Delete${NC}"
echo "  1. Open a connection detail view"
echo "  2. Edit the note"
echo "  3. Save changes"
echo "  4. Try deleting a note"
echo ""

if ask_question "Do edit and delete work?"; then
    success "Edit/Delete works"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Edit/Delete test"
    else
        fail "Edit/Delete broken"
    fi
fi

echo ""
echo -e "${CYAN}STEP 8: Check Console for Errors${NC}"
echo "  1. Open Chrome DevTools (F12)"
echo "  2. Go to Console tab"
echo "  3. Look for any red errors"
echo "  4. Test all features while watching console"
echo ""

if ask_question "Are there NO console errors?"; then
    success "No console errors"
else
    if [ $? -eq 2 ]; then
        warning "Skipped: Console check"
    else
        fail "Console errors found"
        echo -e "${YELLOW}   Please fix console errors before submitting${NC}"
    fi
fi

# SECTION 4: ZIP Testing
test_section "📦 ZIP TESTING"

echo ""
echo -e "${YELLOW}Now test the ZIP file (simulates Chrome Web Store install)${NC}"
echo ""
echo -e "${CYAN}STEP 1: Extract ZIP${NC}"
echo "  Run these commands:"
echo "  $ mkdir test-zip"
echo "  $ cd test-zip"
echo "  $ unzip ../rolodink-v1.0.3-chrome.zip"
echo ""

if ask_question "Have you extracted the ZIP?"; then
    success "ZIP extracted"
    
    echo ""
    echo -e "${CYAN}STEP 2: Load ZIP in Chrome${NC}"
    echo "  1. Go to chrome://extensions/"
    echo "  2. Remove the previous unpacked extension"
    echo "  3. Click 'Load unpacked'"
    echo "  4. Select the test-zip/ folder"
    echo ""
    
    if ask_question "Does the ZIP version load correctly?"; then
        success "ZIP version loads"
        
        echo ""
        echo -e "${CYAN}STEP 3: Quick Test${NC}"
        echo "  Quickly test:"
        echo "  - Popup opens"
        echo "  - LinkedIn button appears"
        echo "  - Basic functionality works"
        echo ""
        
        if ask_question "Does everything work with ZIP version?"; then
            success "ZIP version works correctly"
        else
            if [ $? -eq 2 ]; then
                warning "Skipped: ZIP functionality test"
            else
                fail "ZIP version has issues"
            fi
        fi
    else
        if [ $? -eq 2 ]; then
            warning "Skipped: ZIP loading"
        else
            fail "ZIP version does not load"
        fi
    fi
else
    if [ $? -eq 2 ]; then
        warning "Skipped: ZIP testing"
    else
        warning "ZIP not tested - strongly recommended before submission"
    fi
fi

# SECTION 5: Final checks
test_section "✅ FINAL CHECKS"

echo ""
echo -e "${CYAN}Pre-Submission Checklist:${NC}"
echo ""

CHECKLIST=(
    "All features tested and working"
    "No console errors or warnings"
    "Extension works on multiple LinkedIn profiles"
    "Login/logout works correctly"
    "Notes are saved and synced"
    "ZIP version tested and works"
    "Screenshots prepared (5 total, 1280×800)"
    "Privacy policy live at rolodink.app/privacy"
    "Terms of service live at rolodink.app/terms"
    "Store listing content prepared"
)

for item in "${CHECKLIST[@]}"; do
    if ask_question "$item?"; then
        success "$item"
    else
        if [ $? -eq 2 ]; then
            warning "Skipped: $item"
        else
            fail "Missing: $item"
        fi
    fi
done

# SECTION 6: Test summary
test_section "📊 TEST SUMMARY"

echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}✨ Extension is ready for Chrome Web Store submission!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "  1. Take screenshots (see README-SCREENSHOTS.md)"
    echo "  2. Prepare store listing (see STORE-LISTING.md)"
    echo "  3. Review SUBMISSION-CHECKLIST.md"
    echo "  4. Upload to Chrome Web Store"
    echo ""
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  TESTS PASSED WITH WARNINGS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Review warnings above before submission.${NC}"
    echo ""
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Fix the failed tests before submission!${NC}"
    echo ""
    exit 1
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Testing complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

