---
name: rolodink-release
description: Release- en operationele kennis voor de Rolodink-monorepo (extensie, backend, website). Gebruik deze skill ALTIJD bij het voorbereiden of uitvoeren van een release, het debuggen van CI/store-publish-workflows, Vercel-deployproblemen, Supabase-storingen, of vragen over de encryptie-architectuur. Trigger op woorden als release, versie-bump, store-upload, Chrome Web Store, Edge Add-ons, AMO, Trivy, keep-alive, ENCRYPTION_MASTER_KEY.
---

# Rolodink release & operations

## Releaseproces (volledig geautomatiseerd sinds juli 2026)

1. `./scripts/bump-version.sh X.Y.Z` — bumpt 5 bestanden (beide manifests, extension package.json's, website package.json). Werk daarna `CHANGELOG.md`, `RELEASE_NOTES_vX.Y.Z.md` én de website-changelog (`website/src/messages/{nl,en}.json` → `ChangelogPage.releases` + `DownloadPage.version`) bij. Alles via PR naar `main`.
2. Tag `ext-vX.Y.Z` op `main` → `release.yml` bouwt drie zips (`Rolodink-{chrome,edge,firefox}-vX.Y.Z.zip`) en maakt een **draft**-release met notes uit `.github/RELEASE_TEMPLATE.md`.
3. Release publiceren (GitHub UI) → `publish-{chrome,edge,firefox}.yml` uploaden automatisch naar de drie stores. Ze wachten met retries (10×30s) op de assets, dus publiceren vóórdat de build klaar is kan — maar netter is wachten op de draft.
4. Volledige procesdocumentatie: `RELEASE_PROCESS.md`.

Let op vanuit een Claude Code Remote-sessie: de git-proxy staat alleen pushes naar de eigen werkbranch toe — **tags pushen kan niet** en er is geen MCP-tool voor releases/tags. De gebruiker maakt de tag/release via github.com/thijsmat/rolodink/releases/new ("Create new tag on publish").

## Store-publishing

- Alle drie de listings zijn live:
  - Chrome: https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc
  - Edge: https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf
  - Firefox: https://addons.mozilla.org/en-US/firefox/addon/rolodink/
- Secrets (repo → Settings → Secrets → Actions): `CHROME_CLIENT_ID/SECRET/REFRESH_TOKEN/EXTENSION_ID`, `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY` (Partner Center API-key-flow, edge-addon@v2), `FIREFOX_JWT_ISSUER/SECRET`, plus `VITE_SUPABASE_URL/ANON_KEY` en `VITE_API_BASE_URL` voor de builds.
- Chrome OAuth consent screen staat op "In production" → refresh token verloopt niet.
- Valideer credentials zonder te publiceren met de handmatige workflow **"Store Credentials Check"** (Actions → Run workflow).
- Workflows pinnen third-party actions op commit-SHA's (Sonar-eis: muteerbare tags zijn een security-finding) en interpoleren nooit `${{ }}` direct in run-scripts (expression injection).

## CI-valkuilen

- SonarCloud Quality Gate faalt op "Security Rating on New Code" bij: `${{ }}` in run-blokken, niet-gepinde actions, of secrets als CLI-argumenten. De SonarCloud-API is vanuit de sessie-proxy niet bereikbaar; vraag de gebruiker om het dashboard.
- GitHub Actions-logs verlopen na ~90 dagen; job-metadata (stappen + timing) blijft wel opvraagbaar.
- Trivy draait als `security`-job en voedt de code-scanning-alerts; die zijn vrijwel allemaal npm-dependency-CVE's en te reproduceren met `npm audit` per lockfile (root + `linkedin-crm-extension/ui`).
- npm `overrides` in de root-package.json forceren gepatchte transitieve versies (sharp/postcss in next, shell-quote in web-ext, e.d.) — bij dependency-updates checken of upstream ze inmiddels zelf bumpt.

## Vercel & Supabase

- Vercel-team: `matthijs-goes-projects`. Projecten: `linkedin-crm-backend` (`prj_FhtIDw3iBul95oL06e4bdc7NDgis`, rootDirectory `linkedin-crm-backend`) en `website` (`prj_vF1utasz46KFrUCkUzLo7ETk9HWw`).
- Deployfout **"Resource provisioning failed"** binnen seconden = het gekoppelde Supabase-project (`linkedin-crm`, ref `adacfwaslbcimqgvbpqd`) is gepauzeerd (free tier, ~1 week zonder API-activiteit). Fix: project herstellen; structureel voorkomt `GET /api/cron/keep-alive` (dagelijkse Vercel Cron, 04:23 UTC) dit — die doet één Supabase REST-query, want directe Postgres-verbindingen (Prisma) tellen niet als activiteit.
- Free tier: max 2 actieve Supabase-projecten; `linkedin-crm-staging` staat gepauzeerd.
- Backend-runtime vereist `ENCRYPTION_MASTER_KEY` (base64, exact 32 bytes) in de Vercel-env. **Nooit roteren of verliezen** — alle versleutelde data wordt dan onleesbaar. Niet nodig voor de build, wel voor `/api/user/key`.

## Encryptie-architectuur (sinds v1.3.0)

- Server-tied: backend genereert per gebruiker een AES-256-datasleutel, wrapt die met `ENCRYPTION_MASTER_KEY` (AES-256-GCM envelope, marker `envelope-v1` in het salt-veld) en levert de raw key via `GET /api/user/key` aan ingelogde gebruikers.
- De extensie importeert de sleutel als non-extractable CryptoKey; de cache (memory + `chrome.storage.session`) is gebonden aan het user-id en wordt gewist bij logout (`CLEAR_KEY_CACHE`-message).
- Er is bewust géén `POST /api/user/key` (zou de wrapped key kunnen overschrijven → dataverlies). Encryptiefouten breken opslaan af; geen stille plaintext-fallback.
- Versleutelde velden: `notes`, `meetingPlace`, `userCompanyAtTheTime`, `email`, `phone` (zie `SENSITIVE_FIELDS`), prefix `rolodink-enc:`.
