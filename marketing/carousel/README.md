# LinkedIn-carrousels

Een carrousel is op LinkedIn een documentpost: je uploadt een PDF en lezers bladeren door de pagina's. Volgens het
onderzoek in `../linkedin-research-campaign-3.md` is dat nu het best presterende formaat; 9 à 12 slides werkt het
best.

## Maken

```bash
(cd video && npm ci --ignore-scripts)   # lettertypen en Playwright
CHROME_PATH=/opt/pw-browsers/chromium node marketing/carousel/render.mjs vibecoding-lessen [--png <map>]
```

`CHROME_PATH` is alleen nodig waar Playwright zijn eigen Chromium niet vindt, zoals in een cloudsessie. Met `--png`
krijg je per slide een PNG om te controleren.

## vibecoding-lessen.pdf

"5 dingen die ik leerde van vibecoden", 9 slides, 1080×1350, Nederlands, voor je eigen profiel.

Plaatsen: LinkedIn → Start een post → het documenticoon (of "Meer" → "Document toevoegen") → kies de PDF → geef het
document de titel "5 dingen die ik leerde van vibecoden".

Posttekst:

```
Ik ben geen developer. Toch bouw ik met AI een browserextensie die in drie stores staat.

Vijf dingen die ik daarvan leerde, met wat er misging en wat ik nu anders doe. Swipe door.

[Eén zin over welke les jou het meest verraste.]

Vibecode jij ook? Wat is jouw belangrijkste les?

#vibecoding #buildinpublic
```

Geen link in de post. Wil je naar rolodink.app verwijzen, zet dat dan in de eerste reactie of laat het aan de laatste
slide over.
