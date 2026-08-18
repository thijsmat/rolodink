# Rolodink v1.3.4 — LinkedIn's August 2026 Redesign

LinkedIn heeft zijn profielpagina's opnieuw gebouwd, en elke selector waarmee de
extensie de weg vond werkte daarna niet meer. De knop en het notitieveld waren
weg. Daar zaten negen losse fouten achter; deze release repareert ze allemaal.

## Highlights
- **"Add to Rldnk" staat weer naast Message** — in de grote profielkaart, niet in het smalle balkje dat pas bij scrollen verschijnt
- **Het notitieveld is terug**, direct onder die kaart
- **Notities worden weer opgeslagen.** Elke API-aanroep vanaf de LinkedIn-pagina werd door CORS geblokkeerd
- **Rolodink volgt LinkedIn's eigen navigatie.** Een profiel dat je bereikte via je feed of een zoekresultaat startte de extensie helemaal niet — precies de route waar nieuwe gebruikers na de onboarding op uitkomen

## Changes

### Op de LinkedIn-pagina
- De actierij wordt nu op betekenis gevonden (waar een link heen gaat, wat een knop doet) in plaats van op klassenamen. `.pv-top-card`, `.artdeco-button--primary`, `.entry-point` en de Message-knop op `aria-label` gaven na de herbouw allemaal nul treffers
- De 1e-graads-controle op `.dist-value` is vervallen. Die klasse bestaat niet meer, dus de controle kon voor niemand slagen — en zonder die controle verscheen het notitieveld nooit
- De profielkaart wordt op hoogte gekozen. Dat is de enige eigenschap die de grote kaart betrouwbaar onderscheidt van de sticky balk; `position: sticky` staat op geen van beide
- Het notitieveld staat onder de kaart in plaats van erin. De actierij is een flex-container, dus een kaartje daarbinnen werd een paneel naast de knoppen, over de navigatiebalk heen
- De injectie blijft controleren nadat de pagina stil valt. Verzoeken tijdens een lopende ronde werden weggegooid in plaats van onthouden, en de DOM-observer was de enige klok — dus de laatste mutaties van LinkedIn's opbouw, juist die de grote kaart toevoegen, verdwenen ongezien
- Knop en notitieveld verhuizen mee als je binnen LinkedIn doorklikt, en het vorige profiel wordt opgeruimd. Zonder dat erfde profiel B de "Already added" en de notitie van profiel A

### Opslaan en aanmelden
- API-aanroepen lopen via de service worker, die het host-recht heeft en niet onder pagina-CORS valt. Het token gaat niet langer via de pagina; de worker plakt het er zelf op uit de sessie die hij al heeft
- De connectie wordt bij het opslaan opnieuw opgezocht. Voegde je een profiel pas ná het openen van het notitieveld toe aan je CRM, dan bleef het veld "Add to CRM first" zeggen en was je tekst weg
- Aanmelden via de onboardingpagina meldde de extensie zelf niet aan — die twee gebruiken verschillende opslag. Onboarding wijst nu naar de popup, die het wél doet
- Afmelden wist de gecachete encryptiesleutel, zodat een oude sleutel niet aan een volgend account gegeven kan worden
- Een bericht aan de service worker verloopt na 15 seconden. Een MV3-worker kan sterven tussen verzenden en antwoorden, en dan komt het antwoord nooit

### Onder de motorkap
- 93 tests draaien nu in de extensie-workspace, waar voorheen geen testrunner stond. Ze dekken de DOM-logica tegen twee echte opnames van de herbouwde profielkop, de kaartkeuze, de injectieplanner en de API- en auth-grenzen
- Broncode-wachten laten de build falen als een dode LinkedIn-klassenaam terugkomt, of als de observer weer rechtstreeks aan de injectie geknoopt wordt. Gedragstests zien geen van beide: een selector die niets matcht laat de functie gewoon stil niets doen — precies de fout waar deze release over gaat

## Upgrade Notes
- Je hoeft niets te doen; de stores werken bij
- Geen wijzigingen aan de versleuteling. Bestaande notities blijven leesbaar
- **v1.3.3 is nooit gepubliceerd.** De inhoud daarvan zit in deze release

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

> Firefox loopt op de LinkedIn-pagina achter: die build gebruikt nog het oude,
> losse content script en heeft dus geen inline notitieveld. Het samenvoegen van
> die twee staat gepland.

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.4.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.4.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.4.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
