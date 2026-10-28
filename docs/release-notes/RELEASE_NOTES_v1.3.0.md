# Rolodink v1.3.0 — Server-tied Encryption

## Highlights
- **Encryptie zonder gedoe**: de aparte wachtwoordzin is verdwenen. Je gegevens (notities, e-mail, telefoon, ontmoetingsplek, bedrijf) worden nu automatisch versleuteld zodra je bent ingelogd — met een sleutel die per account door de server wordt beheerd en die de browser als niet-exporteerbare sleutel importeert.
- **Belangrijke beveiligingsfix**: opslaan kan niet langer stilletjes terugvallen op onversleutelde data; als versleutelen mislukt, wordt de actie afgebroken.

## Changes

### Security
- Passphrase-encryptie (PBKDF2) vervangen door server-tied account­encryptie: per gebruiker een AES-256 datasleutel, verpakt met een master key via AES-256-GCM envelope encryption
- Stille plaintext-fallback verholpen — encryptiefouten breken de opslag af
- Sleutelcache gebonden aan het ingelogde account en gewist bij uitloggen (voorkomt versleutelen met de sleutel van een vorige gebruiker na accountwissel)
- Ongebruikt `POST /api/user/key`-endpoint verwijderd
- Zwakke PBKDF2-parameters en het known-plaintext-verificatiepatroon zijn hiermee volledig uit de codebase

### Changed
- Volledige passphrase-flow verwijderd uit de instellingen; nieuwe uitleg bij registratie ("Je privégegevens worden automatisch versleuteld")

### Backend
- Dagelijkse keep-alive cron die het Supabase-project actief houdt

## Upgrade Notes
- Bestaande gebruikers hoeven niets te doen: na inloggen wordt de serversleutel automatisch opgehaald; plaintext-data wordt bij de eerstvolgende bewerking versleuteld opgeslagen
- Data die met een oude wachtwoordzin was versleuteld kan door v1.3.0 niet worden ontsleuteld — verwijder die records of voer de gegevens opnieuw in

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.0.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.0.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.0.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
