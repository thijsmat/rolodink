# Extension Release Process

Het releaseproces is geautomatiseerd. De normale flow is: **versie bumpen → tag pushen → draft-release controleren → publiceren**. De workflows doen de rest (bouwen, assets uploaden, naar de stores publiceren).

## Quick Reference

```bash
# 1. Versie bumpen (5 bestanden) + changelog
./scripts/bump-version.sh X.Y.Z
# CHANGELOG.md aanvullen
git add -A && git commit -m "chore: bump version to X.Y.Z" && git push origin main

# 2. Tag pushen → release.yml bouwt Chrome/Edge/Firefox-zips en maakt een DRAFT-release
git tag ext-vX.Y.Z
git push origin ext-vX.Y.Z

# 3. Wacht tot de "Release Rolodink Extension"-workflow groen is, controleer de
#    draft-release (notes + 3 assets), en klik dan pas op "Publish release".

# 4. Publiceren triggert publish-chrome/edge/firefox.yml die de zips naar de stores sturen.
```

## Wat de automatisering doet

| Stap | Workflow | Trigger |
|---|---|---|
| Bouwen + draft-release met assets | `release.yml` | push van tag `ext-v*` |
| Upload naar Chrome Web Store | `publish-chrome.yml` | release **published** |
| Upload naar Edge Add-ons | `publish-edge.yml` | release **published** |
| Signing/upload naar Mozilla Add-ons | `publish-firefox.yml` | release **published** |

De publish-workflows wachten met retries (max ~5 min) tot de release-assets bestaan, en falen met een duidelijke foutmelding als de benodigde secrets ontbreken.

### Asset-naamgeving (door `build.js`)
- `Rolodink-chrome-vX.Y.Z.zip`
- `Rolodink-edge-vX.Y.Z.zip`
- `Rolodink-firefox-vX.Y.Z.zip`

Gebruik exact deze namen (kleine letters, met `v`) — de publish-workflows zoeken op deze patronen.

## Vereiste repository secrets

Instellen onder **Settings → Secrets and variables → Actions**.

### Build (release.yml)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`

### Firefox (werkt ✅)
- `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` — API-credentials van https://addons.mozilla.org/developers/addon/api/key/

### Chrome (vereist eenmalige setup)
1. De extensie moet al **handmatig** in de Chrome Web Store zijn ingediend (de API kan alleen bestaande listings updaten).
2. Maak in Google Cloud Console een OAuth-client aan met de Chrome Web Store API en genereer een refresh token.
3. Secrets: `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`, `CHROME_EXTENSION_ID`

### Edge (vereist eenmalige setup)
1. Het product moet al **handmatig** in Partner Center zijn aangemaakt.
2. Genereer in Partner Center → Publish API een client-id en API-key (de nieuwe API-key-flow; de oude access-token-url-flow is door Microsoft uitgefaseerd).
3. Secrets: `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`

## Versie bumpen

`./scripts/bump-version.sh X.Y.Z` werkt deze 5 bestanden bij:
- `linkedin-crm-extension/manifest.json`
- `linkedin-crm-extension/manifest-firefox.json`
- `linkedin-crm-extension/package.json`
- `linkedin-crm-extension/ui/package.json`
- `website/package.json`

## Belangrijke regels

1. **Publiceer de draft-release nooit voordat `release.yml` klaar is.** Handmatig publiceren terwijl de workflow nog bouwt veroorzaakte bij v1.2.0 een race waardoor store-uploads faalden en de Chrome-zip ontbrak.
2. **Upload geen handmatige assets naast de workflow-assets** — dubbele bestandsnamen breken de download-patronen van de publish-workflows.
3. **Controleer de draft vóór publicatie**: 3 zips aanwezig, release notes zonder `${VERSION}`-placeholders.
4. Firefox-source voor AMO-review (indien AMO erom vraagt): `./scripts/prepare-firefox-source.sh` en de zip handmatig als asset toevoegen.

## Handmatige fallback

Alleen als de automatisering stuk is:

```bash
./scripts/build-extension.sh --target=chrome
./scripts/build-extension.sh --target=edge
./scripts/build-extension.sh --target=firefox

git tag ext-vX.Y.Z && git push origin ext-vX.Y.Z
gh release create ext-vX.Y.Z \
  --title "Rolodink vX.Y.Z" \
  --notes-file RELEASE_NOTES_vX.Y.Z.md \
  Rolodink-chrome-vX.Y.Z.zip \
  Rolodink-edge-vX.Y.Z.zip \
  Rolodink-firefox-vX.Y.Z.zip
```

Gebruik `--notes-file` met een versie-specifiek bestand; vermijd GitHubs "Auto-generate release notes" (geeft `${VERSION}`-placeholders uit het template).

## Rollback

```bash
gh release delete ext-vX.Y.Z --yes
git tag -d ext-vX.Y.Z
git push origin :refs/tags/ext-vX.Y.Z
# evt. versie-bump-commit reverten
```
