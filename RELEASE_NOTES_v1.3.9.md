# Rolodink v1.3.9 — Kleine reparaties

Een onderhoudsrelease: niets nieuws, wel drie dingen die beter werken.

## De updatemelding is weer te gebruiken

Kwam er een nieuwe versie uit, dan verscheen bovenin de popup een melding
waarvan alleen de kop zichtbaar was. De knoppen **Download Update** en
**Later** vielen eronder weg, dus je kon de melding alleen wegklikken. De
melding toont nu weer haar knoppen, en de downloadknop leidt naar
rolodink.app/download, met de juiste store voor je browser.

## In de popup

- **Je lijst werkt met het toetsenbord.** Met Tab ga je langs je connecties,
  met Enter of spatie open je er een. De LinkedIn-knop in een rij opent nog
  steeds het profiel.
- Ging er iets mis bij **Esc** (terug naar de lijst) of **Alt+L**
  (uitloggen), dan verdween die fout ongemerkt. Hij wordt nu gelogd.

## Onder de motorkap

- De inlogbibliotheek (`@supabase/auth-js`) is bijgewerkt naar 2.117.2.
