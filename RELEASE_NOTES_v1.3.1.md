# Rolodink v1.3.1 — Note Encryption Fix

## Highlights
- **Notities worden weer correct opgeslagen.** Het notitieveld dat Rolodink in een LinkedIn-profielpagina prikt, las en schreef je notitie onversleuteld, terwijl de popup hetzelfde veld wél versleutelde. Daardoor kon het veld letterlijk `rolodink-enc:...` tonen, en werd die tekst bij het typen onversleuteld teruggeschreven — waarna de notitie niet meer te ontsleutelen was.
- **Geen stille schade meer.** Kan een notitie niet ontsleuteld worden, dan wordt het veld geblokkeerd met een uitleg in plaats van overschreven.

## Changes

### Fixed
- Het inline notitiekaartje loopt nu via dezelfde `ENCRYPT_TEXT` / `DECRYPT_TEXT`-afhandeling als de popup, dus lezen en schrijven gebruiken één en dezelfde versleuteling
- Notities uit oudere versies (opgeslagen zonder prefix) blijven leesbaar en worden bij de eerstvolgende bewerking versleuteld
- Versleutelen dat mislukt breekt het opslaan af in plaats van terug te vallen op platte tekst

### Interface
- Bij het bewerken van een connectie zie je nu wiens gegevens je aanpast — de naam stond nergens in beeld
- "Nieuwe Connectie" stond er twee keer boven; dat is er nog één
- De update-melding kan de rest van de popup niet meer uit beeld duwen

### Website
- `/onboarding/success` gaf een 404 na het aanmelden; het pad kreeg geen taalprefix mee

### Backend
- Het envelope-formaat voor de verpakte datasleutel staat nu één keer in `src/lib/envelope.ts`, gedeeld door `GET /api/user/key` en de onderhoudsscripts
- Nieuw: `npm run audit:notes`, een read-only script dat elk versleuteld veld indeelt als leeg, oude platte tekst, ontsleutelbaar of beschadigd

## Upgrade Notes
- Je hoeft niets te doen: na het bijwerken toont het notitieveld je notitie weer als leesbare tekst
- **Firefox is niet geraakt** — die build bevat het inline notitiekaartje niet
- **Deze update repareert niet wat al stuk is.** Waar platte tekst achter versleutelde tekst is geplakt, is de oorspronkelijke notitie verloren; die velden blijven geblokkeerd tot je ze leegmaakt en opnieuw invult. Met `npm run audit:notes` is te zien om hoeveel het gaat

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.1.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.1.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.1.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
