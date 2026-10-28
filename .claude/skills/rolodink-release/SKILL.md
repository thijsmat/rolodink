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

1. `./scripts/bump-version.sh X.Y.Z` — bumpt 6 JSON-bestanden (beide manifests, extension package.json's, backend- en website-package.json) én `linkedin-crm-backend/src/lib/version.ts`, de versie die `/api/version` aan de update-melding in de extensie meldt. Die laatste stond lang los van het script en dreef weg: bij 1.3.5 stond hij nog op 1.3.3, en bij een eerdere release op 1.0.10 terwijl 1.3.0 live was — ouder dan de uitgebrachte versie, dus de melding ging helemaal nooit af. `version.test.ts` faalt nu de build als hij niet meer met beide manifests overeenkomt. Werk daarna `CHANGELOG.md`, `RELEASE_NOTES_vX.Y.Z.md` én de website-changelog (`website/src/messages/{nl,en}.json` → `ChangelogPage.releases` + `DownloadPage.version`) bij. Alles via PR naar `main`. `/release-prep X.Y.Z` doet deze hele stap, inclusief een testchecklist voor de drie browsers.
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

0. **Wat gaat er mee?** `git log ext-v<vorige>..origin/main -- linkedin-crm-extension packages/core` en de open PR's die de extensie raken: meld de gebruiker vóór de release wat er klaarstaat en nog niet in een release zit. Bij 1.3.8 kwamen #134 en #138 pas een half uur na de release ter sprake.
1. **Store Credentials Check** (`store-credentials-check.yml`, geen inputs). Die publiceert niets. Is hij rood, stop dan; een verlopen Chrome-token kost anders een halve release. Is alleen Edge rood (401), zie "Edge-API-key verloopt ook" hieronder: Chrome en Firefox kunnen door, Edge later los.
   - **`/api/version` gaat mee met de merge.** De release-PR zet `version.ts` op de nieuwe versie, en de backend meldt die na de Vercel-deploy meteen als nieuwste. Merge de release-PR dus pas als je direct daarna uitbrengt, en niet terwijl een vorige versie nog in review staat bij Chrome of Edge.
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
- **Edge-API-key verloopt ook.** Op 2026-10-12 gaf zowel de Store Credentials Check als de echte upload `HTTP 401` voor Edge ("Microsoft Edge Add-ons API server (v1) responses with error code: 401"), terwijl dezelfde secrets op 2026-10-05 nog 1.3.8 hadden gepubliceerd. Chrome en Firefox werkten gewoon. Herstellen (alleen de eigenaar kan dit): Partner Center (partner.microsoft.com) → Microsoft Edge → **Publish API** → nieuwe API-credentials aanmaken, dan in GitHub → Settings → Secrets and variables → Actions **`EDGE_API_KEY`** bijwerken, en **`EDGE_CLIENT_ID`** ook als die op die pagina veranderd is. Daarna **Store Credentials Check** (moet groen zijn) en `publish-edge.yml` met `tag: "ext-vX.Y.Z"`; een nieuwe release is niet nodig. Een 401 op Edge blokkeert Chrome en Firefox niet: breng die gewoon uit en draai Edge los na zodra de sleutel vernieuwd is. Hoe vaak de sleutel verloopt is niet vastgesteld; draai de credentials-check daarom altijd vóór een release.
- **Edge weigert een `key` in het manifest.** Partner Center: "The manifest shouldn't contain the key field." `build.js` slaat de key daarom over voor het edge-target (`TARGETS_REJECTING_MANIFEST_KEY`); Chrome accepteert hem wél en houdt hem. Een CI-stap pakketteert beide targets en faalt als dat omdraait.
- Valideer credentials zonder te publiceren met de handmatige workflow **"Store Credentials Check"** (Actions → Run workflow).
- Workflows pinnen third-party actions op commit-SHA's (Sonar-eis: muteerbare tags zijn een security-finding) en interpoleren nooit `${{ }}` direct in run-scripts (expression injection).

## CI-valkuilen

- SonarCloud Quality Gate faalt op "Security Rating on New Code" bij: `${{ }}` in run-blokken, niet-gepinde actions, of secrets als CLI-argumenten. De SonarCloud-API is vanuit de sessie-proxy niet bereikbaar; vraag de gebruiker om het dashboard.
- GitHub Actions-logs verlopen na ~90 dagen; job-metadata (stappen + timing) blijft wel opvraagbaar.
- Trivy draait als `security`-job en voedt de code-scanning-alerts; die zijn vrijwel allemaal npm-dependency-CVE's en te reproduceren met `npm audit` per lockfile (root, `linkedin-crm-extension/ui` en `tools/firefox-sign`).
- npm `overrides` in de root-package.json forceren gepatchte transitieve versies (sharp/postcss in next, e.d.) — bij dependency-updates checken of upstream ze inmiddels zelf bumpt.
  - Een nieuwe override raakt een bestaande lock-entry niet altijd: `npm install --package-lock-only` laat de oude versie dan staan en `npm ls` meldt hem als `invalid`. Los dat op via npm, niet met de hand: de ouder-dependency uninstallen en opnieuw installeren (`-w <workspace> --package-lock-only --ignore-scripts`), en daarna de `package.json` van die workspace terugzetten als npm de volgorde heeft herschikt. Controleer altijd met `npm ls <pakket> --all` en `npm audit`.
- web-ext zit niet meer in de root-workspace maar in `tools/firefox-sign/` (exact gepind, eigen lockfile; `publish-firefox.yml` installeert daaruit met `npm ci --ignore-scripts`). Die lockfile is een derde om met `npm audit` te controleren. Bijwerken: versie in `tools/firefox-sign/package.json` aanpassen en daar `npm install --package-lock-only --ignore-scripts` draaien.

## Vercel & Supabase

- Vercel-team: `matthijs-goes-projects`. DNS van rolodink.app staat níet bij Vercel maar bij externe nameservers (`ns1.site.eu`, `ns2.site.nl`, …); records wijzig je daar. Projecten: `linkedin-crm-backend` (`prj_FhtIDw3iBul95oL06e4bdc7NDgis`, rootDirectory `linkedin-crm-backend`) en `website` (`prj_vF1utasz46KFrUCkUzLo7ETk9HWw`).
- Deployfout **"Resource provisioning failed"** binnen seconden = het gekoppelde Supabase-project (`linkedin-crm`, ref `adacfwaslbcimqgvbpqd`) is gepauzeerd (free tier, ~1 week zonder API-activiteit). Fix: project herstellen; structureel voorkomt `GET /api/cron/keep-alive` (dagelijkse Vercel Cron, 04:23 UTC) dit — die doet één Supabase REST-query, want directe Postgres-verbindingen (Prisma) tellen niet als activiteit.
- Free tier: max 2 actieve Supabase-projecten; `linkedin-crm-staging` staat gepauzeerd.
- **Auth-config staat sinds 2026-10-28 in `supabase/`** (`config.toml` + `templates/`): redirect-URL's, SMTP, LinkedIn, MFA, rate limits en alle e-mailtemplates. Wijzigen gaat via een PR en daarna `npx supabase@2.122.0 config push --project-ref adacfwaslbcimqgvbpqd`, niet meer in het dashboard. Het bestand declareert bewust alleen `[auth]`; zie `supabase/README.md` voor waarom, voor de secrets en voor de valkuilen.
- **Wachtwoord resetten** loopt via de website: `/[locale]/forgot-password` vraagt de mail aan, `/auth/callback` herkent `type=recovery` en stuurt door naar `/[locale]/reset-password`, waar het nieuwe wachtwoord wordt ingesteld. Tot 2026-10-28 bestond die flow niet en kwam elke resetlink op de homepage uit. Twee dingen in het Supabase-dashboard horen erbij:
  - Authentication → URL Configuration → **Redirect URLs** bevat `https://rolodink.app/auth/callback`. Ontbreekt die, dan negeert Supabase de `redirectTo` en valt hij terug op de Site URL (de homepage).
  - Authentication → Email Templates → **Reset Password** linkt naar `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`. Die vorm werkt ook als de link in een andere browser wordt geopend, en voor een reset die je zelf vanuit het dashboard verstuurt (*Send password recovery*). Die geeft namelijk geen `redirectTo` mee.
- Backend-runtime vereist `ENCRYPTION_MASTER_KEY` (base64, exact 32 bytes) in de Vercel-env. **Nooit verliezen of zomaar vervangen**: alle versleutelde data wordt dan onleesbaar. Roteren kan alleen via het stappenplan in "De master key roteren" hieronder. Niet nodig voor de build, wel voor `/api/user/key`.

## Encryptie-architectuur (sinds v1.3.0)

- Server-tied: backend genereert per gebruiker een AES-256-datasleutel, wrapt die met `ENCRYPTION_MASTER_KEY` (AES-256-GCM envelope, marker `envelope-v1` in het salt-veld) en levert de raw key via `GET /api/user/key` aan ingelogde gebruikers.
- De extensie importeert de sleutel als non-extractable CryptoKey; de cache (memory + `chrome.storage.session`) is gebonden aan het user-id en wordt gewist bij logout (`CLEAR_KEY_CACHE`-message).
- Er is bewust géén `POST /api/user/key` (zou de wrapped key kunnen overschrijven → dataverlies). Encryptiefouten breken opslaan af; geen stille plaintext-fallback.
- Versleutelde velden: `notes`, `meetingPlace`, `userCompanyAtTheTime`, `email`, `phone` (zie `SENSITIVE_FIELDS`), prefix `rolodink-enc:`.
- `ENCRYPTION_MASTER_KEY` staat in Vercel als **Sensitive** (alleen Production): niemand kan hem uitlezen, ook `vercel env pull` niet. Bewaar de waarde dus in de wachtwoordmanager; zonder die kopie is het Vercel-project de enige plek waar de sleutel bestaat.

## De master key roteren

Alleen de wrapping van de rijen in `user_keys` verandert; de datasleutels en dus alle notities blijven hetzelfde. De oude sleutel is niet uit te lezen, dus hij kan niet als "vorige sleutel" worden bewaard. Daarom komt de nieuwe sleutel er eerst bij als `ENCRYPTION_MASTER_KEY_NEXT`:

- `/api/user/key` unwrapt met `ENCRYPTION_MASTER_KEY` en daarna met `_NEXT` (`getMasterKeys` in `src/lib/envelope.ts`).
- Pas als `ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT` klopt, worden nieuwe user keys met `_NEXT` gewrapt en zet de dagelijkse cron (`GET /api/cron/keep-alive`, `src/lib/key-rotation.ts`) de bestaande rijen om. Per rij controleert die eerst of de nieuwe wrapping terug unwrapt naar dezelfde datasleutel, en schrijft hij met een compare-and-set op de oude `encrypted_key`.
- De vingerafdruk wordt berekend van de kopie **uit de wachtwoordmanager**. Klopt hij, dan is bewezen dat die kopie en de waarde in Vercel dezelfde sleutel zijn, nog vóór er iets van afhangt. Een plakfout wordt zo opgevangen zonder dat er data aan vastzit. De backend logt de verwachte vingerafdruk nooit: overnemen uit een log zou de controle zinloos maken.

Stappen (PowerShell, vanuit `linkedin-crm-backend/`):

1. `npm run master-key -- generate`. Zet de uitvoer **eerst** in de wachtwoordmanager en sluit dan de terminal.
2. `npm run master-key -- fingerprint` en plak de sleutel uit de wachtwoordmanager (of `Get-Clipboard | npm run master-key -- fingerprint`). Je krijgt 16 hextekens terug.
3. Vercel → `linkedin-crm-backend` → Settings → Environment Variables, alleen Production:
   - `ENCRYPTION_MASTER_KEY_NEXT` = de sleutel uit de wachtwoordmanager, **Sensitive**;
   - `ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT` = de vingerafdruk (niet geheim).

   Daarna Production redeployen. **Vanaf het moment dat deze deploy live staat met een kloppende vingerafdruk is er geen weg terug**: nieuwe gebruikers krijgen meteen een sleutel onder `_NEXT`, nog vóór de cron draait. Begin hier dus pas aan als je de rotatie ook afmaakt.
4. Draai de cron: Settings → Cron Jobs → **Run** bij `/api/cron/keep-alive`, of wacht tot 04:23 UTC. In de functielog staat dan `Key rotation: N user keys, … 0 failed. Every user key opens with ENCRYPTION_MASTER_KEY_NEXT.`
   - `fingerprint-mismatch` of `fingerprint-missing`: de kopie in de wachtwoordmanager is niet wat er in Vercel staat. Er is niets met `_NEXT` gewrapt, dus je kunt `_NEXT` hier nog veilig opnieuw zetten vanuit de wachtwoordmanager, of verwijderen en bij stap 1 beginnen.
   - `failed` groter dan 0: stop. De log noemt de user ids. Die rijen openen met geen van beide sleutels of hebben een ander formaat; ze zijn ongewijzigd.
5. Lokaal bewijzen dat elke rij met de nieuwe sleutel opent: `vercel env pull .env.local --environment=production`, zet daarin `ENCRYPTION_MASTER_KEY=<nieuwe sleutel uit de wachtwoordmanager>`, en draai `npx tsx --env-file=.env.local scripts/encrypt-legacy-fields.ts --dry-run`. Je moet zien: "Master key unwraps every stored user key". Verwijder `.env.local` daarna, tenzij je meteen doorgaat met de migratie hieronder.
6. Wissel in twee deploys, zodat ook een plakfout in `ENCRYPTION_MASTER_KEY` niemand kan raken:
   - **6a.** Overschrijf in Vercel `ENCRYPTION_MASTER_KEY` met de sleutel uit de wachtwoordmanager. Laat `_NEXT` en `_NEXT_FINGERPRINT` **staan**. Redeploy en draai de cron opnieuw. Zolang `_NEXT` er staat, wrapt de backend nieuwe sleutels met de bevestigde `_NEXT` en opent hij alles daarmee, ook als er een typfout in `ENCRYPTION_MASTER_KEY` zit. In de log moet `ENCRYPTION_MASTER_KEY is the same key as ENCRYPTION_MASTER_KEY_NEXT.` staan, en `done` moet `true` zijn. Staat er `still a different key`, plak dan opnieuw en herhaal 6a.
   - **6b.** Pas daarna: verwijder `_NEXT` en `_NEXT_FINGERPRINT` en redeploy. Controleer in de extensie: uitloggen, inloggen (de datasleutel zit anders nog in de sessiecache), en een notitie openen in de popup en op de notitiekaart.

Terugdraaien kan alleen tot en met stap 2, en in stap 4 bij een vingerafdruk die niet klopt. Daarna is de enige weg vooruit: afmaken. Concreet:
- Verwijder `_NEXT` nooit, en kies nooit een andere `_NEXT`, zolang de deploy uit stap 3 met een kloppende vingerafdruk live is geweest, behalve via 6b.
- Rol in Vercel nooit terug naar een deployment van vóór stap 3. Die kent `_NEXT` niet, kan omgezette sleutels niet openen, en wrapt nieuwe sleutels met de oude master key, die na stap 6 nergens meer bestaat.
- Een databaseback-up van vóór de cron-run in stap 4 bevat sleutels die alleen met de oude master key openen. Na stap 6 is zo'n back-up dus niet meer te gebruiken. Dat is onvermijdelijk zolang de oude sleutel niet uitleesbaar is; houd er rekening mee als je ooit een herstel overweegt.

## Oude plaintext-velden versleutelen (`npm run encrypt:legacy`)

Clients van vóór 1.3.0 schreven de gevoelige velden in plaintext. `scripts/encrypt-legacy-fields.ts` versleutelt ze; de regels staan in `scripts/lib/legacy-fields.ts`, de gebruiksaanwijzing bovenin het script. Het weigert te schrijven als de geladen master key niet élke rij in `user_keys` unwrapt, dus draai het pas na een rotatie met de nieuwe sleutel, of met een sleutel die je anderszins zeker weet. Volgorde: `--dry-run`, daarna een canary per testaccount met `--only-owner=<uuid> --confirm=<project ref>`. Controleer per account de popup en de notitiekaart, draai nog een run (die moet 0 wijzigingen geven), test `--restore` en migreer opnieuw. Daarna de rest. Verwijder `.env.local` direct na afloop en het pre-image-bestand na 48 uur.
