# Uitlegvideo Rolodink

`rolodink-uitleg.mp4` legt in 19 seconden uit hoe Rolodink werkt: 1920×1080, 60 fps, H.264, zonder geluid.
Zonder geluid omdat de video vooral automatisch en gedempt afspeelt, op de website en in de LinkedIn-feed.

De video is een HTML-compositie (`index.html`, `style.css`, `main.js`) die `render.mjs` frame voor frame in
headless Chromium opneemt en met ffmpeg tot MP4 samenvoegt. Er lopen geen CSS-animaties: `main.js` berekent
elke eigenschap uit de tijd `t`, dus elke render levert hetzelfde beeld op.

## Draaiboek

| tijd | scène | overgang naar de volgende |
|---|---|---|
| 0,0 – 3,1 s | **De vraag.** "Wie was dat *ook alweer?*" tussen visitekaartjes waarvan de namen vervagen tot grijze balkjes. | De binnenruimte van de **o** loopt vol met navy; de camera vliegt erdoorheen. |
| 2,4 – 6,0 s | **Het merk.** "Rolodink" rolt letter voor letter in, als kaartjes in een rolodex. "Jouw notities, *direct op LinkedIn.*" | Het logo schuift naar linksboven terwijl het navy doek schuin wegvalt. Waar het doek langs het logo gaat, wisselt het logo van kleur. |
| 5,4 – 9,0 s | **01 Open een *profiel.*** De knop *Add to Rldnk* verschijnt naast *Bericht* en wordt aangeklikt. | Titel, onderregel en stapnummer draaien door als kaartjes op een rolodex-trommel. |
| 9,0 – 12,5 s | **02 Schrijf een *notitie.*** De notitie wordt getypt en opgeslagen; het label *Versleuteld opgeslagen* verschijnt. | Idem. De cursor opent de extensie via het icoon in de werkbalk. |
| 12,5 – 15,3 s | **03 Vind alles *terug.*** In de popup levert zoeken op "zeil" Sanne op, via een detail uit haar notitie. | Het zoekresultaat klapt om als een rolodexkaart en de blauwe achterkant vult het beeld. |
| 15,3 – 19,0 s | **Slot.** "Van connectie *naar relatie.*", het logo, "Gratis voor Chrome, Edge & Firefox" en rolodink.app. | — |

Elk cijfer van het stapnummer loopt vol als een druppel, net als de druppel in het app-icoon.

## Typografie en kleur

- **Inter Tight** (700/800, strak gespatieerd) voor de koppen en het woordmerk.
- **Instrument Serif cursief** voor het accentwoord in elke kop. Het contrast tussen de strakke grotesk en de
  cursieve schreef is de kern van de typografie; het sluit aan op het schreef-plus-schreefloos-paar van de
  website (Playfair Display en Inter), maar voelt eigentijdser.
- **Inter** voor de UI-mocks, zoals op de website. **JetBrains Mono** alleen voor rolodink.app.
- Kleuren: papier `#F7F5F0`, navy `#1B2951` en goud `#B8860B` uit de huisstijl, plus elektrisch blauw
  `#1263FE` en mint `#3BFDCB` uit het app-icoon.

De lettertypen komen via npm binnen (Fontsource, allemaal SIL Open Font License) en staan niet in de repo.

## Opnieuw renderen

```bash
cd video
npm install
npx playwright install chromium   # eenmalig
npm run render                     # → rolodink-uitleg.mp4 (duurt een paar minuten)
```

Handig tijdens het aanpassen:

```bash
npm run preview                         # lokale server; open de URL, spatie = pauze, pijltjes = frame voor frame
node render.mjs --still 7.4,12.2        # losse frames als PNG in ./stills
node render.mjs --from 5 --to 9 --out stuk.mp4
```

Teksten staan in `index.html`. Timing en inhoud van de mocks (notitie, zoekterm, kaartjes) staan als constanten
bovenaan de scènes in `main.js`. Met `CHROME_PATH` kun je een eigen Chrome of Chromium gebruiken.

## Verantwoording

De LinkedIn-pagina en de extensie in de video zijn vereenvoudigde mocks. De labels van de extensie zelf
(*Add to Rldnk*, *Added*, *Rolodink Note*, *Typing...*, *Saving...*, *Saved*, de popup) komen uit de code. Het label
*Versleuteld opgeslagen* is een annotatie van de video, geen onderdeel van de UI. Alle personen zijn verzonnen.
