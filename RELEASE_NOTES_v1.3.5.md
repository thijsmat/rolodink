# Rolodink v1.3.5 — Herstelrelease

Aan de extensie zelf verandert niets. Deze release bestaat omdat v1.3.4 maar
één van de drie stores bereikte.

**Gebruik je Chrome of Edge? Dan is dit de release die je alles uit v1.3.4
brengt** — de negen fixes voor LinkedIn's herbouw van augustus 2026. Firefox
heeft die al.

## Wat er in v1.3.4 zat, en dus nu pas bij Chrome en Edge aankomt
- **"Add to Rldnk" staat weer naast Message** — in de grote profielkaart, niet in het smalle balkje dat pas bij scrollen verschijnt
- **Het notitieveld is terug**, direct onder die kaart
- **Notities worden weer opgeslagen.** Elke API-aanroep vanaf de LinkedIn-pagina werd door CORS geblokkeerd
- **Rolodink volgt LinkedIn's eigen navigatie**, dus een profiel dat je opent vanuit je feed of een zoekresultaat werkt ook
- De volledige lijst staat in [CHANGELOG.md](https://github.com/thijsmat/rolodink/blob/main/CHANGELOG.md) onder v1.3.4

## Wat er in deze release zelf is gerepareerd

Alle drie zaten in het uitbrengproces, niet in de extensie.

- **Het Edge-pakket droeg een `key` in het manifest.** Partner Center weigert zo'n pakket botweg — *"The manifest shouldn't contain the key field"* — dus de v1.3.4-inzending haalde de review niet eens. Chrome accepteert datzelfde veld en houdt het
- **Gepubliceerde releases dragen voortaan de notities die ervoor geschreven zijn.** `release.yml` draaide onvoorwaardelijk een sjabloon en las `RELEASE_NOTES_vX.Y.Z.md` nooit, dus v1.3.4 vertelde gebruikers "Brief summary of what's new in this release." terwijl de echte tekst ongelezen in de repo stond
- **Een mislukte store-upload kan opnieuw.** De publish-workflows vuurden alleen op een nieuwe publicatie, dus herstellen betekende de release depubliceren en opnieuw publiceren

Plus het hek eromheen: pull-request-CI pakketteert nu ook het Edge-target en
faalt als het manifest een key draagt. Voorheen werd alleen Chrome
gepakketteerd — daarom kon een kapot Edge-pakket een gepubliceerde release
halen.

## Upgrade Notes
- Je hoeft niets te doen; de stores werken bij
- Geen wijzigingen aan de versleuteling. Bestaande notities blijven leesbaar
- **v1.3.4 staat alleen op Firefox.** De Chrome-upload strandde op een verlopen store-credential, los van het pakket

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

> Firefox loopt op de LinkedIn-pagina achter: die build gebruikt nog het oude,
> losse content script en heeft dus geen inline notitieveld. Het samenvoegen van
> die twee staat gepland.

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.5.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.5.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

> Anders dan het Chrome-pakket draagt het Edge-pakket geen extensiesleutel,
> omdat de store die weigert. Een uitgepakt geladen Edge-build krijgt daardoor
> een ander extensie-ID dan de store-versie, en aanmelden werkt daar niet.
> Gebruik Chrome voor het uitgepakt testen van de inlogflow.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.5.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
