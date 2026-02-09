---
name: versioning_and_releases
description: Standards and tools for handling version bumps and releases across the Rolodink monorepo.
---

# Versioning and Release Skill

This skill provides the standard procedure for bumping versions and managing releases in the Rolodink monorepo. It ensures that all distributed components (Extension variants and Website) are synchronized and follow semantic versioning.

## Version Locations

When bumping the **Extension** version (e.g., from `1.1.4` to `1.1.5`), you MUST update all of the following files:

1.  `linkedin-crm-extension/manifest.json` (Chrome/Edge base)
2.  `linkedin-crm-extension/manifest-firefox.json` (Firefox-specific)
3.  `linkedin-crm-extension/package.json` (Root extension package)
4.  `linkedin-crm-extension/ui/package.json` (Extension UI package)
5.  `website/package.json` (Website package, if related to a release)
6.  `CHANGELOG.md` (Root level)

## Automation

Use the `scripts/bump-version.sh` script to automate this process and avoid missing files.

```bash
# Example usage
./scripts/bump-version.sh 1.1.5
```

## Release Tag Convention

- **Extension**: `ext-vX.Y.Z` (e.g., `ext-v1.1.4`)
- **Website**: `web-vX.Y.Z` (e.g., `web-v1.2.0`)

> [!IMPORTANT]
> Always verify the `CHANGELOG.md` is updated before tagging a release. The tag should correspond to the version defined in the manifests.

## Common Failures to Avoid

- **Mismatched Manifests**: Firefox validation will fail if `manifest-firefox.json` does not match the tagged version.
- **Authentication Secrets**: Ensure `CHROME_CLIENT_SECRET` and `EDGE_CLIENT_SECRET` are up to date in GitHub Secrets.
- **Release Notes**: Never use GitHub's auto-generate feature without review; it often misses variable replacements. Use a dedicated `RELEASE_NOTES_vX.Y.Z.md` file.

## Verification Checklist

- [ ] Run `grep -r "X.Y.Z" .` to ensure no old version strings remain in key manifest/package files.
- [ ] Verify `git tag` presence.
- [ ] Check GitHub Actions logs for "Authentication failed" or "Version conflict" errors.
