#!/bin/bash
# Rolodink v1.0.3 - GitHub Release Commands
# Run these commands to create and publish the v1.0.3 release

echo "🚀 Rolodink v1.0.3 - GitHub Release Process"
echo "==========================================="
echo ""

# Step 1: Add and commit release files
echo "📝 STEP 1: Commit release documentation"
echo ""
echo "Running git add..."
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension

git add README.md \
        RELEASE_NOTES.md \
        CHANGELOG.md \
        .github/RELEASE_TEMPLATE.md

echo "Running git commit..."
git commit -m "docs(release): prepare v1.0.3 release documentation

- Add comprehensive README.md with badges and installation instructions
- Add RELEASE_NOTES.md with detailed v1.0.3 changes
- Add CHANGELOG.md following Keep a Changelog format
- Add .github/RELEASE_TEMPLATE.md for future releases

Includes:
- Version badges (v1.0.3, pending Chrome Web Store review)
- Installation instructions (Chrome Web Store + manual)
- Quick start guide
- Full documentation index
- Technical changes documentation
- Release metadata

Ready for GitHub release creation."

echo "✅ Commit created"
echo ""

# Step 2: Push commits to GitHub
echo "📤 STEP 2: Push commits to GitHub"
echo ""
echo "Running git push..."
git push origin main

echo "✅ Commits pushed"
echo ""

# Step 3: Create annotated Git tag
echo "🏷️  STEP 3: Create Git tag v1.0.3"
echo ""
echo "Running git tag..."
git tag -a v1.0.3 -m "Release v1.0.3 - Chrome Web Store Resubmission

Fixes:
- Icon loading error in Chrome Web Store submission
- Removed unused 'scripting' permission

Added:
- Automated validation script (validate.js)
- Production build system (build-production.js)
- Interactive testing script (test-local.sh)
- Comprehensive submission documentation (6 guides)

Changed:
- manifest.json version bumped to 1.0.3
- Extension permissions reduced to minimal set
- Build output optimized for Chrome Web Store

Status: Submitted to Chrome Web Store (pending review)
Package: rolodink-v1.0.3-chrome.zip (0.14 MB)
"

echo "✅ Tag v1.0.3 created"
echo ""

# Step 4: Push tag to GitHub
echo "📤 STEP 4: Push tag to GitHub"
echo ""
echo "Running git push tag..."
git push origin v1.0.3

echo "✅ Tag pushed to GitHub"
echo ""

# Step 5: Verify tag
echo "✅ STEP 5: Verify tag"
echo ""
echo "Listing recent tags..."
git tag -l | tail -5
echo ""
echo "Show tag details:"
git show v1.0.3 --quiet

echo ""
echo "==========================================="
echo "✨ Git tag v1.0.3 created successfully!"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. CREATE GITHUB RELEASE:"
echo "   Go to: https://github.com/thijsmat/rolodink/releases/new"
echo ""
echo "2. SELECT TAG:"
echo "   Choose tag: v1.0.3"
echo ""
echo "3. RELEASE TITLE:"
echo "   Rolodink v1.0.3 - Chrome Web Store Resubmission"
echo ""
echo "4. RELEASE DESCRIPTION:"
echo "   Copy content from: RELEASE_NOTES.md"
echo ""
echo "5. UPLOAD ASSETS:"
echo "   Upload file: rolodink-v1.0.3-chrome.zip"
echo "   Location: /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/"
echo ""
echo "6. PUBLISH:"
echo "   - Set as: ✅ Latest release"
echo "   - Check: 🟡 This is a pre-release (optional, if still pending Chrome Web Store)"
echo "   - Click: 'Publish release'"
echo ""
echo "==========================================="
echo "📦 Release package location:"
echo "   /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/rolodink-v1.0.3-chrome.zip"
echo ""
echo "🔗 Useful links:"
echo "   - GitHub Releases: https://github.com/thijsmat/rolodink/releases"
echo "   - Create Release: https://github.com/thijsmat/rolodink/releases/new?tag=v1.0.3"
echo "   - Tags: https://github.com/thijsmat/rolodink/tags"
echo ""
echo "🎉 Done!"

