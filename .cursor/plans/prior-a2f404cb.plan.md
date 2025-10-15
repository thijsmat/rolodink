<!-- a2f404cb-1cd1-48e0-a5ad-f7c1ba62aa20 115ec461-ccc3-478c-9e1e-3c581137b9f1 -->
# GitHub Releases for Rolodink Extension (with Context7)

## What I’ll add

- `.github/workflows/release.yml`: Build, validate, package, and auto-release on tags `v*.*.*`.
- `scripts/build-extension.sh`: Clean, validate, and produce a production ZIP.
- `scripts/validate-extension.mjs`: Validate `manifest.json` and bundle layout.
- `.github/RELEASE_TEMPLATE.md`: Standardized release notes template.
- `INSTALL.md`: User guide for sideloading with warnings, verification, updates, uninstall.
- README updates: Quick start for manual install + link to releases + troubleshooting.
- Context7-assisted research step to ensure MV3 packaging, Actions, and documentation follow latest guidance.

## Workflow details (release.yml)

- on: tag push (pattern `v*.*.*`)
- jobs:
- checkout with full history
- setup Node LTS (for validation script) and system zip
- optional: build `ui/dist/` if missing (documented inputs); otherwise fail with message
- run `scripts/build-extension.sh` (produces `Rolodink-v${VERSION}.zip`)
- run `scripts/validate-extension.mjs` (schema checks; required keys; icon presence; Context7-backed ruleset)
- auto-generate release notes from conventional commits using `softprops/action-gh-release`
- attach ZIP; use `.github/RELEASE_TEMPLATE.md` as fallback body if commits parsing yields empty notes
- guardrails: only run on tags; fail if validation fails

## Build script details

- Inputs: extension root `linkedin-crm-extension/`
- Steps:
- ensure `ui/dist/` is built; fail with helpful message if missing
- copy minimal runtime files to `dist-tmp/`:
  - `content.js`, `manifest.json`, `icons/**`, `ui/dist/**`, `icon.png`
- strip dev-only files: `ui/src`, `node_modules`, `.map`, `.DS_Store`, `.git*`, `README*`, `*.ts`, config files
- confirm `manifest_version: 3`; required `action.default_popup` exists if popup is used
- zip to `Rolodink-v${VERSION}.zip` in repo root; also expose as artifact

## Validation script

- Node (ESM) using fs + JSON parse (no external deps):
- Read `manifest.json`; check: `name`, `version`, `manifest_version=3`, `action.default_popup` (or `service_worker`), `icons`
- Verify referenced files exist (icon paths, popup `ui/dist/index.html`, `content.js`/`service_worker`)
- Verify `host_permissions` and `permissions` align with declared files
- Enforce Chrome MV3 constraints pulled via Context7 (e.g., background `service_worker` only, no remote code)
- Ensure no forbidden files included (scan final ZIP entries)

## README updates

- Add section: "Install via GitHub Releases"
- Download ZIP from Releases
- Unzip → open `chrome://extensions` → Enable Developer Mode → Load Unpacked → select folder
- Troubleshooting (checked against latest Chrome docs via Context7)
- "Manifest v3 not supported" → update Chrome
- "Manifest is invalid" → re-download/unzip cleanly
- Button not visible → refresh LinkedIn; disable blockers
- Update procedure
- Remove folder → Load Unpacked of new version (or use "Update" if same folder)
- Compare Chrome Web Store vs GitHub
- Web Store: auto-updates, reviews; GitHub: immediate access, manual updates

## Release template

- Title: `Rolodink v{{version}}`
- Sections: Highlights, Changes (bulleted from commits), Install from GitHub, Chrome Web Store link (placeholder), Known Issues

## INSTALL.md

- Step-by-step with screenshots placeholders and detailed flows:
- Enable Developer Mode
- Load Unpacked flow
- Security warnings explanation
- Verification checklist (button visible, version in popup)
- Uninstall and manual update instructions

## Context7-assisted research and validation

- Fetch latest guidance and examples:
- Chrome Extension MV3 packaging/validation rules
- Example GitHub Actions for extension build/release
- Sideloading instructions and security warning language
- Use these sources to confirm validation checks and tighten README/INSTALL guidance.

## Assumptions / Notes

- Tag names follow semver `vX.Y.Z`
- `ui/dist` exists before build (or we can build it if requested)
- GitHub token permissions default are sufficient for releases

Once approved, I’ll add the files and wire everything up.

### To-dos

- [ ] Add GitHub Actions release workflow on tags v*.*.*
- [ ] Add build script to package production ZIP
- [ ] Add Node script to validate manifest and bundle
- [ ] Update README with sideloading and troubleshooting
- [ ] Add .github/RELEASE_TEMPLATE.md
- [ ] Add INSTALL.md with detailed flow and warnings