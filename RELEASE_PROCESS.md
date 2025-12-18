# Extension Release Process

## Quick Reference

### Version Bump
Update version in these 3 files:
- `linkedin-crm-extension/manifest.json`
- `linkedin-crm-extension/manifest-firefox.json`
- `linkedin-crm-extension/ui/package.json`

### Build Commands
```bash
./scripts/build-extension.sh --target=chrome
./scripts/build-extension.sh --target=edge
./scripts/build-extension.sh --target=firefox
./scripts/prepare-firefox-source.sh
cd .web-ext-src && zip -r ../rolodink-source-v${VERSION}.zip . -x "*.git*" -x "node_modules/*" -x ".DS_Store"
```

### Release Creation
```bash
# Create tag
git tag ext-v${VERSION}
git push origin ext-v${VERSION}

# Create release with notes file (NOT GitHub's auto-generate)
gh release create ext-v${VERSION} \
  --title "Rolodink Extension v${VERSION} - [Brief Description]" \
  --notes-file RELEASE_NOTES_v${VERSION}.md \
  Rolodink-Chrome-${VERSION}.zip \
  Rolodink-Edge-${VERSION}.zip \
  Rolodink-Firefox-${VERSION}.zip \
  rolodink-source-v${VERSION}.zip
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: `v${VERSION}` Placeholders in Release Notes

**Problem**: GitHub's auto-generated release notes contain `${VERSION}` placeholders that don't get replaced.

**Cause**: Using GitHub's "Auto-generate release notes" feature or the `.github/RELEASE_TEMPLATE.md` template without replacing variables.

**Solution**:
1. **Always create a specific release notes file** for each version (e.g., `RELEASE_NOTES_v1.0.10.md`)
2. **Use `--notes-file` flag** when creating the release
3. **Never use `--generate-notes` flag** - it pulls from the template with unreplaced variables

**Prevention**:
- Create release notes file BEFORE running `gh release create`
- Use actual version numbers, not template variables
- Review release page immediately after creation

**Fix if it happens**:
```bash
# Edit release notes to use your custom file
gh release edit ext-v${VERSION} --notes-file RELEASE_NOTES_v${VERSION}.md
```

---

### Issue 2: Duplicate Assets with Different Names

**Problem**: Release has multiple assets for the same browser (e.g., both `Rolodink-1.0.10.zip` and `Rolodink-chrome-v1.0.10.zip`).

**Cause**: 
1. GitHub's auto-release workflow uploads assets with `-v${VERSION}` naming
2. Manual upload adds assets with standard naming
3. Using `--clobber` flag uploads duplicates instead of replacing

**Solution**:
1. **Disable auto-asset upload** in GitHub release workflows
2. **Use consistent naming**: `Rolodink-${VERSION}.zip` (Chrome), `Rolodink-Edge-${VERSION}.zip`, etc.
3. **Check assets before finalizing**: `gh release view ext-v${VERSION} --json assets`

**Prevention**:
- Don't rely on automated workflows for asset uploads
- Always manually verify asset list after creation
- Use `gh release delete-asset` to remove duplicates immediately

**Fix if it happens**:
```bash
# List all assets
gh release view ext-v${VERSION} --json assets --jq '.assets[] | .name'

# Delete duplicates
gh release delete-asset ext-v${VERSION} [duplicate-filename] --yes
```

---

## Step-by-Step Release Process

### 1. Pre-Release Checklist
- [ ] All PRs merged to `main`
- [ ] SonarQube Quality Gate passed
- [ ] Local `main` branch up to date

### 2. Version Bump
```bash
# Update version in 3 files
# - linkedin-crm-extension/manifest.json
# - linkedin-crm-extension/manifest-firefox.json  
# - linkedin-crm-extension/ui/package.json

# Update CHANGELOG.md
# Add new section for this version

# Commit
git add -A
git commit -m "chore: bump version to ${VERSION}"
git push origin main
```

### 3. Build All Variants
```bash
# Chrome
./scripts/build-extension.sh --target=chrome
# Output: Rolodink-${VERSION}.zip

# Edge
./scripts/build-extension.sh --target=edge
# Output: Rolodink-Edge-${VERSION}.zip

# Firefox
./scripts/build-extension.sh --target=firefox
# Output: Rolodink-Firefox-${VERSION}.zip

# Firefox Source (for AMO review)
./scripts/prepare-firefox-source.sh
cd .web-ext-src && zip -r ../rolodink-source-v${VERSION}.zip . -x "*.git*" -x "node_modules/*" -x ".DS_Store"
cd ..
```

### 4. Create Release Notes File
Create `RELEASE_NOTES_v${VERSION}.md` with:
- Bug fixes
- New features
- UI changes
- Download instructions
- Quality gate status

**Important**: Use actual version numbers, NOT `${VERSION}` placeholders!

### 5. Create GitHub Release
```bash
# Create and push tag
git tag ext-v${VERSION}
git push origin ext-v${VERSION}

# Create release (NOT using auto-generate)
gh release create ext-v${VERSION} \
  --title "Rolodink Extension v${VERSION} - [Brief Description]" \
  --notes-file RELEASE_NOTES_v${VERSION}.md \
  Rolodink-${VERSION}.zip \
  Rolodink-Edge-${VERSION}.zip \
  Rolodink-Firefox-${VERSION}.zip \
  rolodink-source-v${VERSION}.zip
```

### 6. Verification
```bash
# Check release was created
gh release view ext-v${VERSION}

# Verify exactly 4 assets (+ 2 auto-generated source archives)
gh release view ext-v${VERSION} --json assets --jq '.assets[] | .name'

# Expected output:
# Rolodink-${VERSION}.zip
# Rolodink-Edge-${VERSION}.zip
# Rolodink-Firefox-${VERSION}.zip
# rolodink-source-v${VERSION}.zip
```

### 7. Post-Release
- [ ] Verify release is marked as "Latest"
- [ ] Check release notes render correctly (no `${VERSION}` placeholders)
- [ ] Test download links
- [ ] Update store listings if needed

---

## Asset Naming Convention

**Standard Format**:
- Chrome: `Rolodink-Chrome-${VERSION}.zip`
- Edge: `Rolodink-Edge-${VERSION}.zip`
- Firefox: `Rolodink-Firefox-${VERSION}.zip`
- Source: `rolodink-source-v${VERSION}.zip`

**Examples for v1.0.10**:
- `Rolodink-Chrome-1.0.10.zip`
- `Rolodink-Edge-1.0.10.zip`
- `Rolodink-Firefox-1.0.10.zip`
- `rolodink-source-v1.0.10.zip`

---

## Rollback Procedure

If issues are discovered after release:

```bash
# Delete the release
gh release delete ext-v${VERSION} --yes

# Delete the tag locally and remotely
git tag -d ext-v${VERSION}
git push origin :refs/tags/ext-v${VERSION}

# Revert version bump commit if needed
git revert HEAD
git push origin main
```

---

## Notes

- **Never use GitHub's "Auto-generate release notes"** - it uses templates with unreplaced variables
- **Always create version-specific release notes files** before running `gh release create`
- **Verify assets immediately** after release creation to catch duplicates early
- **Use `--notes-file` flag** to ensure custom release notes are used
- **Test the release page** in a browser to verify formatting and links
