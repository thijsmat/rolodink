# Rolodink v1.3.6 — Eén extensie, drie browsers

**Firefox krijgt het notitieveld.** Dat heeft het nooit gehad: Firefox draaide
een apart content script, `content-firefox.js`, 353 regels tegen 900, zonder
ook maar één `injectContextField`. Elke fix voor LinkedIn's herbouw van
augustus 2026 stopte bij Chrome en Edge. Alle drie de browsers krijgen nu
dezelfde bundle.

## Voor Firefox-gebruikers
Dit is een grote release. Wat erbij komt:

- **Het "Rolodink Note"-veld op profielpagina's**, met dezelfde versleuteling als de andere browsers
- **"Add to Rldnk" in de grote profielkaart** naast Message, niet in het smalle balkje dat pas bij scrollen verschijnt
- **Rolodink volgt je klikken binnen LinkedIn**: een profiel dat je opent vanuit je feed of een zoekresultaat werkt nu ook
- **Knop en notitieveld verhuizen mee** naar het volgende profiel, met de juiste gegevens
- Alles wat het gedeelde content script verder heeft gekregen sinds de fork bevroren raakte

## Voor iedereen: typen is voortaan opslaan

Typte je een notitie op een profiel dat nog niet in je CRM stond, dan zei het
kaartje "Add to CRM first" en was je tekst weg. Je moest eerst een knop zoeken
die een paar pixels hoger stond.

Dat doet hij nu zelf: `Typing…` → `Saving…` → `Adding to Rldnk…` → `Saved`. Het
profiel wordt toegevoegd, de knop springt op "Already added ✔️", en je notitie
staat erin.

Meteen ook consistente naamgeving: het kaartje zei "CRM" waar de knop "Rldnk"
zegt. Dat is nu overal Rldnk.

## Voor Chrome- en Edge-gebruikers
Behalve het bovenstaande niets. De rest van deze release gaat over Firefox.

## Onder de motorkap

Het platformverschil waar de fork voor bestond zit nu in één module. Firefox'
`browser.*` werkt met promises; Chrome's `chrome.*` neemt een callback en meldt
fouten via `runtime.lastError`. Welke stijl gebruikt wordt volgt uit wélke
global bestaat, vóór enige aanroep — proberen-en-kijken is voor `sendMessage`
niet veilig te maken, want die aanroep heeft het bericht dan al verstuurd.

Twee dingen die door het opruimen boven water kwamen:

- **Er was een derde manifest.** `ui/public/manifest.json` stond op versie 1.1.1 met de oude `/in/*`-matches. Vite kopieert `public/` integraal, dus het landde bij elke build in `dist/` en werd één stap later overschreven — een val die alleen dicht bleef door de volgorde van de stappen
- **Het bronarchief voor de AMO-reviewer was niet te bouwen.** Het reproduceert nu de repo-indeling, gecontroleerd door de instructies te vólgen in plaats van te lezen

143 tests in de extensie-workspace, tegen 93 eerder. 21 daarvan draaien tegen
een nagemaakte versie van elk platform, en 20 tegen de selectorketen die de
naam van de pagina leest - die stond tot nu toe inline en was nooit getest.

## Upgrade Notes
- Je hoeft niets te doen; de stores werken bij
- Geen wijzigingen aan de versleuteling. Bestaande notities blijven leesbaar
- **Firefox-gebruikers**: het notitieveld verschijnt na deze update voor het eerst. Staat een profiel nog niet in je CRM, dan zegt het veld "Add to CRM first" — klik dan eerst op "Add to Rldnk"

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.6.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.6.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

> Anders dan het Chrome-pakket draagt het Edge-pakket geen extensiesleutel,
> omdat de store die weigert. Een uitgepakt geladen Edge-build krijgt daardoor
> een ander extensie-ID dan de store-versie, en aanmelden werkt daar niet.
> Gebruik Chrome voor het uitgepakt testen van de inlogflow.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.6.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
3. Note that a temporary add-on is removed when you restart Firefox.
