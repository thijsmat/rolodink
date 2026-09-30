---
name: rolodink-release
description: Release- en operationele kennis voor de Rolodink-monorepo (extensie, backend, website). Gebruik deze skill ALTIJD bij het voorbereiden of uitvoeren van een release, het debuggen van CI/store-publish-workflows, Vercel-deployproblemen, Supabase-storingen, of vragen over de encryptie-architectuur. Trigger op woorden als release, versie-bump, store-upload, Chrome Web Store, Edge Add-ons, AMO, Trivy, keep-alive, ENCRYPTION_MASTER_KEY.
---

# Rolodink release & operations

> Werk je aan de **code** van de extensie in plaats van aan het uitbrengen
> ervan? Gebruik dan `rolodink-extension`. Daar staat de regel dat een
> wijziging in één browserversie meteen tegen de andere twee gecontroleerd
> wordt, met de commando's ervoor.

## Releaseproces (volledig geautomatiseerd sinds juli 2026)

1. `./scripts/bump-version.sh X.Y.Z` — bumpt 6 JSON-bestanden (beide manifests, extension package.json's, backend- en website-package.json) én `linkedin-crm-backend/src/lib/version.ts`, de versie die `/api/version` aan de update-melding in de extensie meldt. Die laatste stond lang los van het script en dreef weg: bij 1.3.5 stond hij nog op 1.3.3, en bij een eerdere release op 1.0.10 terwijl 1.3.0 live was — ouder dan de uitgebrachte versie, dus de melding ging helemaal nooit af. `version.test.ts` faalt nu de build als hij niet meer met beide manifests overeenkomt. Werk daarna `CHANGELOG.md`, `RELEASE_NOTES_vX.Y.Z.md` én de website-changelog (`website/src/messages/{nl,en}.json` → `ChangelogPage.releases` + `DownloadPage.version`) bij. Alles via PR naar `main`.
2. Tag `ext-vX.Y.Z` op `main` → `release.yml` bouwt drie zips (`Rolodink-{chrome,edge,firefox}-vX.Y.Z.zip`) en maakt een **draft**-release. (Of `release.yml` handmatig starten met `version` en eventueel `publish: true`, zie "Release vanuit een Claude Code-sessie" hieronder.) De tekst komt uit `RELEASE_NOTES_vX.Y.Z.md`; ontbreekt dat bestand, dan valt hij terug op `.github/RELEASE_TEMPLATE.md` en zegt de release dat zelf. (Tot 2026-08-18 werd de template altijd gebruikt en gingen v1.3.4's echte notes ongelezen mee de repo in.)
3. Release publiceren (GitHub UI) → `publish-{chrome,edge,firefox}.yml` uploaden automatisch naar de drie stores. Ze wachten met retries (10×30s) op de assets, dus publiceren vóórdat de build klaar is kan — maar netter is wachten op de draft.
   - **`release.yml` opnieuw draaien werkt de tekst van een bestaande draft NIET bij.** De assets wél. `softprops/action-gh-release` maakt eerst een nieuwe draft met de verse notities, ziet dan de bestaande draft voor dezelfde tag, kiest die en gooit de nieuwe weg:

     ```
     ↪️ Using release 378044718 for tag ext-v1.3.6 instead of duplicate draft 379597208
     🧹 Removing duplicate draft release 379597208 for tag ext-v1.3.6...
     ```

     Je houdt dan nieuwe zips met oude releasenotities over — en niets in de run wijst erop, want hij slaagt. Wil je de tekst verversen: **verwijder eerst de bestaande draft** in de GitHub-UI en draai `release.yml` daarna opnieuw. Controleer na afloop altijd de body van de draft, niet alleen de exitcode van de run.
   - **Chrome: `Publish condition not met: Homepage URL is not reachable. Timeout while connecting.`** (1.3.7, 2026-09-30). De upload slaagt (`uploadState: SUCCESS`), maar het indienen weigert, ook bij een herhaling, terwijl rolodink.app gewoon 200 geeft. Oorzaak: de listing in het dashboard had een verouderde tekst en homepage, en het domein stond niet in Google Search Console. Oplossing: in het Chrome-dashboard de listing bijwerken (Homepage URL exact `https://rolodink.app`), het domein verifiëren in Search Console met hetzelfde Google-account, en daarna in het dashboard handmatig "Submit for review" doen; het pakket staat er dan al. Let op: de listing-tekst wordt nooit door een workflow bijgewerkt; `chrome-store-listing-en.md` is alleen de bron.
   - **Chrome "later publiceren"**: staat dat aan, dan gaat een goedgekeurde versie niet vanzelf live, en vervalt hij 30 dagen na goedkeuring als niemand op Publish klikt.
   - **Chrome weigert een tweede upload zolang de vorige in review staat**: `ITEM_NOT_UPDATABLE — The item cannot be updated now because it is in pending review, ready to publish, or deleted status.` Geen fout in het pakket; wachten tot de review klaar is en dan `publish-chrome.yml` handmatig draaien op de nieuwere tag. Publiceer dus niet twee versies vlak achter elkaar naar Chrome.
   - **Eén store mislukt?** De drie publish-workflows hebben sinds 2026-08-18 een `workflow_dispatch` met een `tag`-input, dus je kunt er één los opnieuw draaien zonder de release te depubliceren. Dat werkt alléén als de oorzaak buiten het pakket lag (verlopen token, store in review). Zat de fout in het pakket zelf, dan hangen de kapotte zips nog aan de tag: **cut dan een nieuwe versie.** `release.yml` opnieuw draaien op een al gepubliceerde release is geen optie — `softprops/action-gh-release` krijgt `draft: true` mee en zet hem dan terug op draft.
4. Volledige procesdocumentatie: `RELEASE_PROCESS.md`.

### Release vanuit een Claude Code-sessie (zonder GitHub-UI)

De git-proxy staat alleen pushes naar de eigen werkbranch toe, dus **tags pushen kan niet**. Een draft publiceren kan ook niet: er is geen MCP-tool die een release bewerkt. **Workflows starten kan wél**, met `mcp__github__actions_run_trigger` (method `run_workflow`, `ref: main`). Sinds 1.3.7 gaat een release daarmee helemaal zonder de gebruiker:

1. **Store Credentials Check** (`store-credentials-check.yml`, geen inputs). Die publiceert niets. Is hij rood, stop dan; een verlopen Chrome-token kost anders een halve release.
2. **Release** (`release.yml`) met `version: "X.Y.Z"` en `publish: true`. De release gaat direct live en de tag `ext-vX.Y.Z` komt op de gebouwde commit.
3. Een release die `GITHUB_TOKEN` publiceert, start **geen** andere workflows. Dat is een GitHub-regel; alleen `workflow_dispatch` en `repository_dispatch` vormen een uitzondering. Start daarom zelf `publish-chrome.yml`, `publish-edge.yml` en `publish-firefox.yml`, elk met `tag: "ext-vX.Y.Z"`.
4. Controleer daarna het volgende. Een run die slaagt zegt niets over de inhoud (zie de valkuil hierboven).
   - Het "List Artifacts"-log van de release-run toont drie zips.
   - De release-body is de tekst uit `RELEASE_NOTES_vX.Y.Z.md`; bekijk hem met `mcp__github__get_release_by_tag`.
   - Alle drie de publish-runs zijn groen.

Zonder `publish` (of bij een tag-push) blijft het oude pad bestaan: `release.yml` maakt een draft, de gebruiker publiceert die in de UI, en de publish-workflows starten dan vanzelf.

## Store-publishing

- Alle drie de listings zijn live:
  - Chrome: https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc
  - Edge: https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf
  - Firefox: https://addons.mozilla.org/en-US/firefox/addon/rolodink/
- Secrets (repo → Settings → Secrets → Actions): `CHROME_CLIENT_ID/SECRET/REFRESH_TOKEN/EXTENSION_ID`, `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY` (Partner Center API-key-flow, edge-addon@v2), `FIREFOX_JWT_ISSUER/SECRET`, plus `VITE_SUPABASE_URL/ANON_KEY` en `VITE_API_BASE_URL` voor de builds.
- **Chrome-refreshtoken verloopt wél.** Op 2026-08-18 gaf de token-exchange `invalid_grant – Token has been expired or revoked`, terwijl dezelfde credentials op 2026-07-30 nog werkten. Een eerdere notitie hier beweerde dat een consent screen op "In production" betekent dat de token nooit verloopt; die aanname klopt niet en heeft één release gekost. Herstellen: nieuwe refresh token halen via de OAuth-playground/`oauth2.googleapis.com/token` en `CHROME_REFRESH_TOKEN` bijwerken. Controleer daarna met **Store Credentials Check**.
- **Edge weigert een `key` in het manifest.** Partner Center: "The manifest shouldn't contain the key field." `build.js` slaat de key daarom over voor het edge-target (`TARGETS_REJECTING_MANIFEST_KEY`); Chrome accepteert hem wél en houdt hem. Een CI-stap pakketteert beide targets en faalt als dat omdraait.
- Valideer credentials zonder te publiceren met de handmatige workflow **"Store Credentials Check"** (Actions → Run workflow).
- Workflows pinnen third-party actions op commit-SHA's (Sonar-eis: muteerbare tags zijn een security-finding) en interpoleren nooit `${{ }}` direct in run-scripts (expression injection).

## CI-valkuilen

- SonarCloud Quality Gate faalt op "Security Rating on New Code" bij: `${{ }}` in run-blokken, niet-gepinde actions, of secrets als CLI-argumenten. De SonarCloud-API is vanuit de sessie-proxy niet bereikbaar; vraag de gebruiker om het dashboard.
- GitHub Actions-logs verlopen na ~90 dagen; job-metadata (stappen + timing) blijft wel opvraagbaar.
- Trivy draait als `security`-job en voedt de code-scanning-alerts; die zijn vrijwel allemaal npm-dependency-CVE's en te reproduceren met `npm audit` per lockfile (root + `linkedin-crm-extension/ui`).
- npm `overrides` in de root-package.json forceren gepatchte transitieve versies (sharp/postcss in next, shell-quote in web-ext, e.d.) — bij dependency-updates checken of upstream ze inmiddels zelf bumpt.

## Vercel & Supabase

- Vercel-team: `matthijs-goes-projects`. DNS van rolodink.app staat níet bij Vercel maar bij externe nameservers (`ns1.site.eu`, `ns2.site.nl`, …); records wijzig je daar. Projecten: `linkedin-crm-backend` (`prj_FhtIDw3iBul95oL06e4bdc7NDgis`, rootDirectory `linkedin-crm-backend`) en `website` (`prj_vF1utasz46KFrUCkUzLo7ETk9HWw`).
- Deployfout **"Resource provisioning failed"** binnen seconden = het gekoppelde Supabase-project (`linkedin-crm`, ref `adacfwaslbcimqgvbpqd`) is gepauzeerd (free tier, ~1 week zonder API-activiteit). Fix: project herstellen; structureel voorkomt `GET /api/cron/keep-alive` (dagelijkse Vercel Cron, 04:23 UTC) dit — die doet één Supabase REST-query, want directe Postgres-verbindingen (Prisma) tellen niet als activiteit.
- Free tier: max 2 actieve Supabase-projecten; `linkedin-crm-staging` staat gepauzeerd.
- Backend-runtime vereist `ENCRYPTION_MASTER_KEY` (base64, exact 32 bytes) in de Vercel-env. **Nooit roteren of verliezen** — alle versleutelde data wordt dan onleesbaar. Niet nodig voor de build, wel voor `/api/user/key`.

## Encryptie-architectuur (sinds v1.3.0)

- Server-tied: backend genereert per gebruiker een AES-256-datasleutel, wrapt die met `ENCRYPTION_MASTER_KEY` (AES-256-GCM envelope, marker `envelope-v1` in het salt-veld) en levert de raw key via `GET /api/user/key` aan ingelogde gebruikers.
- De extensie importeert de sleutel als non-extractable CryptoKey; de cache (memory + `chrome.storage.session`) is gebonden aan het user-id en wordt gewist bij logout (`CLEAR_KEY_CACHE`-message).
- Er is bewust géén `POST /api/user/key` (zou de wrapped key kunnen overschrijven → dataverlies). Encryptiefouten breken opslaan af; geen stille plaintext-fallback.
- Versleutelde velden: `notes`, `meetingPlace`, `userCompanyAtTheTime`, `email`, `phone` (zie `SENSITIVE_FIELDS`), prefix `rolodink-enc:`.
