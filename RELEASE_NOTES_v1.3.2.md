# Rolodink v1.3.2 — Popup Polish

## Highlights
- **Je ziet nu wie je bewerkt.** Bij het aanpassen van een connectie stond de naam nergens in beeld; het formulier kreeg alleen de bewerkbare velden mee.
- **De update-melding blijft binnen de perken.** Een lange lijst met releasenotities vanaf de server kon de rest van de popup uit beeld duwen.

## Changes

### Interface
- De naam van de connectie staat nu in de kop van het bewerkformulier
- "Nieuwe Connectie" stond er twee keer boven; dat is er nog één
- De inhoud van de update-melding scrollt nu binnen een vaste hoogte, zodat kop en knoppen altijd zichtbaar blijven

### Website
- `/onboarding/success` gaf een 404 na het aanmelden: het pad ging zonder taalprefix de auth-redirect in, en daar kijkt de next-intl middleware niet naar

## Upgrade Notes
- Je hoeft niets te doen
- Deze release bevat geen wijzigingen aan de versleuteling; de notitie-fix uit v1.3.1 is ongewijzigd
- **Edge staat mogelijk nog op v1.3.0.** De v1.3.1-publicatie is daar wel geüpload en gevalideerd, maar kon niet gepubliceerd worden zolang de v1.3.0-inzending in review stond

## 🏪 Installeren via de stores (aanbevolen)
- **Chrome Web Store**: [Install Rolodink](https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc)
- **Microsoft Edge Add-ons**: [Install Rolodink](https://microsoftedge.microsoft.com/addons/detail/rolodink/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox Add-ons**: [Install Rolodink](https://addons.mozilla.org/en-US/firefox/addon/rolodink/)

## 📥 Manual Installation

### Google Chrome
1. Download `Rolodink-chrome-v1.3.2.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer mode** (toggle in top-right corner).
5. Click **Load unpacked** and select the unzipped folder.

### Microsoft Edge
1. Download `Rolodink-edge-v1.3.2.zip` from the Assets section below.
2. Unzip the file to a folder.
3. Open `edge://extensions` in your browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder.

### Mozilla Firefox
1. Download `Rolodink-firefox-v1.3.2.zip` from the Assets section below.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on...** and select the zip (or its `manifest.json`).
