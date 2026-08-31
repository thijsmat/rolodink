---
name: rolodink-extension
description: Werken aan de code van de Rolodink-browserextensie (content script, background worker, popup) met de drie browsers in het achterhoofd. Gebruik deze skill ALTIJD bij een wijziging in linkedin-crm-extension/, en zeker wanneer je iets aanpast dat op een LinkedIn-pagina draait, aan de manifests raakt, of aan build.js. Trigger op content script, injectie, notitieveld, Add to Rldnk, manifest, browser-api, Chrome, Edge, Firefox, browser.*, chrome.*, uitgepakt laden, web-ext.
---

# Rolodink-extensie: één codebase, drie browsers

## De regel

**Verander je iets aan de extensie, controleer dan meteen of het in alle drie
de browsers gebeurt én kan werken.** Niet aan het eind, niet bij de release —
meteen, in dezelfde wijziging.

Dit is geen procedureel netjesheidje. Firefox draaide tot v1.3.6 een eigen
`content-firefox.js` van 353 regels tegen 900, zonder `injectContextField`.
Firefox-gebruikers hebben het notitieveld nooit gehad, en elke fix voor
LinkedIn's herbouw van augustus 2026 stopte bij Chrome en Edge. Niemand kreeg
een foutmelding; de fork bestond gewoon en het gat werd stil groter. Dat is de
kostbare variant van deze regel overslaan.

## Wat gedeeld is en wat niet

Sinds v1.3.6 delen alle drie de targets één content script. Dat betekent dat de
meeste wijzigingen automatisch overal landen — maar niet alles.

| | chrome | edge | firefox |
|---|---|---|---|
| `ui/src/content/**` → `content.js` | ✅ zelfde bytes | ✅ | ✅ |
| `ui/src/background/**` → `background.js` | ✅ | ✅ | ✅ |
| popup (`index.html` + `assets/`) | ✅ | ✅ | ✅ |
| `packages/core` | ✅ | ✅ | ✅ |
| manifest | `manifest.json` | `manifest.json` | **`manifest-firefox.json`** |
| `key` in het manifest | **ja** | nee (store weigert) | nee (geen entry) |
| post-build | — | — | **`firefox-postbuild.cjs`** |
| API-stijl in `browser-api.ts` | callback | callback | **promise** |

Raak je iets uit de bovenste helft, dan gaat het vanzelf mee. Raak je iets uit
de onderste helft, dan is het een **bewuste keuze per target** en moet je hem
per target maken.

Twee dingen die makkelijk vergeten worden:
- `manifest-firefox.json` is een tweede bestand. Een permissie, een match-patroon of een `web_accessible_resources`-regel toevoegen aan de één en niet aan de ander is stil.
- Firefox gebruikt `background.scripts`, niet `service_worker`, en heeft `browser_specific_settings.gecko`. Een verandering aan de background-declaratie is dus nooit één regel.

## De controle

Na elke wijziging aan de extensie:

```bash
cd linkedin-crm-extension && rm -rf ../dist
for t in chrome edge firefox; do node build.js $t || echo "FAIL $t"; done
sha256sum ../dist/tmp/*/content.js
```

De drie checksums horen **gelijk** te zijn. Zijn ze dat niet, dan is er een
target dat iets anders krijgt en dat moet je kunnen uitleggen.

Zoek daarna je eigen wijziging op in alle drie de pakketten, niet alleen in
chrome:

```bash
for t in chrome edge firefox; do printf "%-8s " "$t"; grep -c "JOUW_STRING" ../dist/tmp/$t/content.js; done
```

En vergelijk de manifests als je daaraan gezeten hebt:

```bash
diff <(jq -S . ../dist/tmp/chrome/manifest.json) <(jq -S . ../dist/tmp/firefox/manifest.json)
```

Vergeet niet `rm -rf dist` als je klaar bent; die map hoort niet in een commit.

## Wat CI al bewaakt

De `extension`-job pakketteert alle drie de targets en faalt op:

- **chrome**: `content.js` is de bundle (niet de ruwe bron), bevat de encryptieprefix, heeft geen onopgeloste import, en het manifest draagt de sleutel die naar het juiste store-ID herleidt
- **edge**: het manifest draagt **géén** `key` (Partner Center weigert dat) en verschilt verder in niets van chrome
- **firefox**: `content.js` bevat de notitiekaart en is niet veel kleiner dan de chrome-bundle — de wacht die een teruggekeerde fork zou vangen

Daarnaast: `navigation.test.ts` eist dat beide manifests dezelfde matches én
dezelfde versie hebben, en `version.test.ts` in de backend eist dat
`LATEST_EXTENSION_VERSION` met allebei overeenkomt.

## Wat CI níet kan bewijzen

Er is hier geen browser. Deze dingen komen alleen uit een echte:

| vraag | waar je het controleert |
|---|---|
| Krijg je op dit platform promises of callbacks? | **Firefox** — dat is de enige tak die hier nooit gedraaid heeft |
| Werkt de inlogflow uitgepakt? | **Chrome** — alleen daar draagt het pakket de sleutel, dus alleen daar klopt het extensie-ID en dus de OAuth-redirect |
| Accepteert de store het pakket? | Pas bij de upload |

Concreet voor de notitiekaart: **typ een notitie en kijk of hij in de popup
terugkomt.** Dat is het enige pad dat door `sendMessage` → background → API →
versleuteling loopt, en dus het enige dat de adapter echt uitoefent. Statussen
onderweg (`Typing…`, `Saving…`) bewijzen niets — die worden gezet vóór de API
wordt aangeroepen.

## Valkuilen die al een keer geld gekost hebben

- **Een selector die niets matcht gooit geen fout.** Hij geeft leeg terug en de functie weigert stil dienst. Daarom staan de selectorlijsten in geteste modules (`anchors.ts`, `profile.ts`) en niet inline, en daarom bewaakt `selector-invariants.test.ts` dat er geen tweede kopie ontstaat.
- **Een kale `chrome.*`-aanroep werkt in Chrome en faalt stil in Firefox.** `await chrome.storage.local.get()` levert daar `undefined` op. Alles gaat via `browser-api.ts`; `selector-invariants.test.ts` faalt op `\bchrome\.\w` in `main.js`.
- **`copy-assets.cjs` mag `content.js` niet kopiëren.** Die regel overschreef ooit de bundle met de ruwe bron ná het bouwen: build groen, zip geldig, verkeerd content script.
- **`| tail` in een controlecommando maskeert de exitcode.** `npm test | tail -4` geeft de status van `tail`, altijd 0. Schrijf naar een logbestand en lees `$?` apart, anders lijkt een kapotte toolchain te slagen.

## Uitbrengen

Zie de skill `rolodink-release` voor versie-bumps, tags, de draft-release en de
store-workflows.
