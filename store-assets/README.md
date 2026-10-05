# Store-afbeeldingen

Screenshots, promotegels en het Edge-logo voor de Chrome Web Store, Edge Add-ons en Firefox Add-ons (AMO). De
beelden staan klaar in `screenshots/`; `render.mjs` maakt ze opnieuw als de popup of de teksten veranderen.

## Eisen per store

| | Chrome Web Store | Edge Add-ons | Firefox (AMO) |
|---|---|---|---|
| Screenshots | 1 tot 5; 1280×800 of 640×400; vierkante hoeken, geen marge (full bleed) | hoogstens 6; 1280×800 of 640×480 | 1280×800 aanbevolen (grootste weergave), anders 1,6:1 |
| Per taal | ja | ja (met *Duplicate* naar andere talen) | nee: één set voor alle talen, de bijschriften wel per taal |
| Kleine promotegel | 440×280, verplicht | 440×280, optioneel | — |
| Grote promotegel | marquee 1400×560, optioneel (nodig voor uitgelichte plekken) | 1400×560 PNG, optioneel | — |
| Logo | — | 300×300 aanbevolen (1:1, minimaal 128×128), verplicht per taal | — |
| Inhoud | screenshots tonen de echte gebruikerservaring; promotegels liefst zonder tekst, verzadigde kleuren, ook leesbaar op halve grootte | — | geen tekst in de afbeelding; uitleg hoort in het bijschrift |

Bronnen: [Chrome: Supplying images](https://developer.chrome.com/docs/webstore/images),
[Edge: Publish a Microsoft Edge extension, stap 7](https://learn.microsoft.com/microsoft-edge/extensions/publish/publish-extension#step-7-enter-store-listing-details-for-each-language),
[Firefox: Create an appealing listing](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/).

Alle beelden hier zijn 24-bit PNG zonder alfakanaal en kleiner dan 250 kB. `render.mjs` controleert maat en kleurtype
bij elke render en stopt als een beeld afwijkt.

## Wat waar

| Bestand | Chrome Web Store | Edge Add-ons | Firefox |
|---|---|---|---|
| `screenshots/chrome-edge/nl/1…5` | screenshots, taal Nederlands | screenshots, *Details for Dutch* | — |
| `screenshots/chrome-edge/en/1…5` | screenshots, taal English | screenshots, *Details for English* | — |
| `screenshots/firefox/1…5` | — | — | screenshots, met de bijschriften hieronder |
| `screenshots/promo/small-tile-440x280.png` | small promo tile | small promotional tile | — |
| `screenshots/promo/marquee-1400x560.png` | marquee promo tile | large promotional tile | — |
| `screenshots/promo/logo-300x300.png` | — | extension logo, per taal (of met *Duplicate*) | — |

Upload ze in de volgorde 1 tot en met 5: de eerste is het grootst te zien en vertelt het hele idee.

## Bijschriften

De Chrome- en Edge-screenshots hebben hun kop in beeld. Firefox toont één set aan iedereen, dus daar staat de uitleg
in het bijschrift (de Nederlandse in de Nederlandse vertaling van de listing).

| | Nederlands | English |
|---|---|---|
| 1 | Schrijf een notitie direct op iemands LinkedIn-profiel. Hij wordt vanzelf bewaard. | Write a note right on someone's LinkedIn profile. It saves automatically. |
| 2 | Voeg iemand toe en leg vast waar jullie elkaar ontmoetten. | Add someone and record where you met. |
| 3 | Zoek op naam, bedrijf of een detail uit je notities. | Search by name, company or any detail in your notes. |
| 4 | Al je connecties, met hun context, in één overzicht. | All your connections, with their context, in one overview. |
| 5 | Je notities zijn alleen voor jou zichtbaar en worden versleuteld opgeslagen. | Your notes are visible only to you and stored encrypted. |

## Opnieuw renderen

```bash
cd linkedin-crm-extension/ui && npm ci   # eenmalig: de popup wordt daaruit gebouwd
cd store-assets && npm install
npm run render                           # alles, in een paar seconden
node render.mjs --only nl --shot 3       # één screenshot; sets: nl, en, firefox, promo
node render.mjs --skip-build             # de popup-build van de vorige keer hergebruiken
```

## Hoe het werkt

- **De popup is echt.** `render.mjs` bouwt hem uit `linkedin-crm-extension/ui` met demo-instellingen en zet hem in een
  iframe. `chrome.*` is een stub met een ingelogde sessie en de vertalingen uit `_locales`, en elke aanroep naar de
  API of Supabase krijgt de fictieve connecties uit `copy/<taal>.json`. Verandert de popup, dan veranderen de
  screenshots mee bij de volgende render.
- **De LinkedIn-pagina is nagebouwd**, met fictieve personen (dezelfde als in de uitlegvideo). De knop *Add to Rldnk*
  en de *Rolodink Note*-kaart volgen `linkedin-crm-extension/ui/src/content/main.js`, met dezelfde inline stijlen. Eén
  afwijking: daar staat de systeemletter van het besturingssysteem, hier Inter, die daar het dichtst bij komt. De
  popup krijgt om dezelfde reden Inter onder de naam `Segoe UI`.
- **Teksten** staan in `copy/nl.json` en `copy/en.json`; `shots.json` bepaalt per screenshot het profiel, de stand van
  de knop en de notitiekaart, en welke weergave van de popup open staat.
- **Letters**: Inter Tight en Instrument Serif voor de koppen, zoals in de uitlegvideo; Inter voor de interface.

De detailweergave van een connectie zit er bewust niet bij: de kop *Connectie Details* staat vast in het Nederlands
(ook in de Engelse popup) en loopt op 380 px breedte onder de knoppen door.
