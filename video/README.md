# Uitlegvideo Rolodink

`rolodink-uitleg.mp4` legt in 19 seconden uit hoe Rolodink werkt; `rolodink-explainer.mp4` is dezelfde video in
het Engels. Beide zijn 1920×1080, 60 fps, H.264, met stereogeluid (AAC, 48 kHz). Het geluid is een extra: op de
website en in de LinkedIn-feed speelt de video automatisch en gedempt af, dus het beeld vertelt het verhaal ook
zonder geluid.

`rolodink-uitleg-poster.jpg` en `rolodink-explainer-poster.jpg` zijn het slotbeeld, voor wie de video ergens insluit:

```html
<video src="rolodink-uitleg.mp4" poster="rolodink-uitleg-poster.jpg" autoplay muted loop playsinline></video>
```

De video is een HTML-compositie (`index.html`, `style.css`, `main.js`) die `render.mjs` frame voor frame in
headless Chromium opneemt en met ffmpeg tot MP4 samenvoegt. Er lopen geen CSS-animaties: `main.js` berekent
elke eigenschap uit de tijd `t`, dus elke render levert hetzelfde beeld op. De teksten staan per taal in
`copy/nl.json` en `copy/en.json`.
De soundtrack wordt daarna in `soundtrack.mjs` gesynthetiseerd en onder het beeld gezet.

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

## Engelse versie

Zelfde beeld, geluid en timing; alleen de teksten verschillen (`copy/en.json`).

| Nederlands | Engels |
|---|---|
| Wie was dat *ook alweer?* | Who was that *one again?* |
| Jouw notities, *direct op LinkedIn.* | Your notes, *right on LinkedIn.* |
| Open een *profiel.* · Schrijf een *notitie.* · Vind alles *terug.* | Open a *profile.* · Write a *note.* · Find them *again.* |
| Van connectie *naar relatie.* | From connection *to relationship.* |
| Gratis voor Chrome, Edge & Firefox | Free for Chrome, Edge & Firefox |

- De tweede regel van de hook moet een o hebben, want daar vliegt de camera doorheen. Vandaar *one again?*
- *From connection to relationship* volgt de Engelse website ("Turn every LinkedIn connection into a meaningful
  relationship").
- De notitie wordt "Met at DDW. Looking for a CTO. Restores sailboats." en de zoekterm `sail`, net als `zeil` vier
  letters.
- De labels van de popup komen uit de Engelse vertaling van de extensie (*Show All Connections*, *Search
  connections...*); LinkedIn heet in het Engels *Message*, *More* en *About*.
- De streep onder het slot springt over de staart van de p in *relationship* heen (skip-ink), zoals bij een nette
  onderstreping.

## Typografie en kleur

- **Inter Tight** (700/800, strak gespatieerd) voor de koppen en het woordmerk.
- **Instrument Serif cursief** voor het accentwoord in elke kop. Het contrast tussen de strakke grotesk en de
  cursieve schreef is de kern van de typografie; het sluit aan op het schreef-plus-schreefloos-paar van de
  website (Playfair Display en Inter), maar voelt eigentijdser.
- **Inter** voor de UI-mocks, zoals op de website. **JetBrains Mono** alleen voor rolodink.app.
- Kleuren: papier `#F7F5F0`, navy `#1B2951` en goud `#B8860B` uit de huisstijl, plus elektrisch blauw
  `#1263FE` en mint `#3BFDCB` uit het app-icoon.

De lettertypen komen via npm binnen (Fontsource, allemaal SIL Open Font License) en staan niet in de repo.

## Geluid

Muziek en geluidseffecten zijn volledig gesynthetiseerd in JavaScript: `synth.mjs` bevat de instrumenten,
`soundtrack.mjs` de partituur. Er zitten geen samples of loops van anderen in, dus er zijn geen rechten of
licenties om rekening mee te houden.

- **Muziek.** 122 BPM in D groot. Een zwevende intro (Gmaj9 naar A7sus4) lost op de eerste tel, als de camera door
  de o is, op naar D. Daarna een lichte groove (D, A/C#, Bm7, Gmaj7, D/F#, G6) met kick, klap, shaker, bas, een
  getokkeld arpeggio en een pad. Terwijl de kaart omklapt valt de groove stil; het slotakkoord Dmaj9 valt als de
  kaart het beeld vult, met het muzikale logo F#, A, D terwijl het woordmerk inschuift.
- **Effecten.** Bij elke handeling in beeld: twinkelende kaartjes, verwelkende namen, een inktdruppel, aanzwellende
  ruis door de o, rolodextikjes bij het woordmerk en de stapwissels, muisklikken, toetsaanslagen, klokjes bij
  *Added*, *Saved* en het zoekresultaat, een slotje bij *Versleuteld opgeslagen*, en zoefs die de overgangen volgen.
- **Timing.** De effecten hangen aan de cues uit `main.js` (`soundCues`): verschuif je daar een moment, dan schuift
  het geluid mee. De muziek staat op een vast grid met de eerste tel op 3,11 s; ook de stapwissels (9,0 en 12,45 s)
  en het slotakkoord (16,39 s) vallen op een tel. Verschuif je die, pas dan `ONE` of `BPM` in `soundtrack.mjs` aan.
- **Mastering.** −16 LUFS geïntegreerd, true peak onder −1 dBTP, met een lichte EQ voor kleine speakers.

## Opnieuw renderen

```bash
cd video
npm install
npx playwright install chromium   # eenmalig
npm run render                     # → rolodink-uitleg.mp4 en -poster.jpg, met geluid (duurt een paar minuten)
npm run render:en                  # → rolodink-explainer.mp4 en -poster.jpg, de Engelse versie
npm run audio                      # alleen de soundtrack opnieuw; het beeld blijft staan (een paar seconden)
npm run audio:en                   # idem voor de Engelse versie
```

Handig tijdens het aanpassen:

```bash
npm run preview                         # lokale server; open de URL (Engels: ?lang=en), spatie = pauze, pijltjes = frame voor frame
node render.mjs --still 7.4,12.2        # losse frames als PNG in ./stills
node render.mjs --from 5 --to 9 --out stuk.mp4
node render.mjs --audio-only --wav soundtrack.wav   # de soundtrack ook als WAV, om te beluisteren of te bewerken
node render.mjs --no-audio              # zonder geluid
```

Teksten staan per taal in `copy/<taal>.json`, ook de notitie, de zoekterm en de kaartjes. `index.html` verwijst
ernaar met `data-copy="pad"`; met `data-html` is de tekst HTML. Twee dingen hangen aan de animatie: de tweede regel
van de hook heeft een o (daar vliegt de camera doorheen), en de zoekterm heeft vier letters, één per aanslag, en
staat in de notitie van Sanne tussen `<mark class="hl">…</mark>`. Timing staat als constanten bovenaan de scènes in
`main.js`; niveaus, noten en klankkleuren van het geluid in `soundtrack.mjs`. Elke optie van `render.mjs` werkt ook
met `--lang en`. Met `CHROME_PATH` kun je een eigen Chrome of Chromium gebruiken.

## Verantwoording

De LinkedIn-pagina en de extensie in de video zijn vereenvoudigde mocks. De labels van de extensie zelf
(*Add to Rldnk*, *Added*, *Rolodink Note*, *Typing...*, *Saving...*, *Saved*, de popup) komen uit de code. Het label
*Versleuteld opgeslagen* is een annotatie van de video, geen onderdeel van de UI. Alle personen zijn verzonnen. Het
geluid is gesynthetiseerd; er zijn geen opnames van anderen gebruikt.
