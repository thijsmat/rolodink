# Rolodink v1.3.10 — Sterkere wachtwoorden

Een kleine release rond je wachtwoord: makkelijker terug te zetten en beter beschermd.

## Wachtwoord vergeten?

Op het inlogscherm van de extensie staat nu de link **Wachtwoord vergeten?**. Die opent rolodink.app in een nieuw tabblad. Daar vraag je een link aan om een nieuw wachtwoord te kiezen.

## Veiligere wachtwoorden

- **Geen wachtwoorden uit datalekken meer.** Kies je bij het aanmaken van een account of bij het wijzigen van je wachtwoord een wachtwoord dat in een bekend datalek voorkomt, dan krijg je een melding en kies je een ander. Je wachtwoord verlaat je computer daarbij niet: alleen de eerste vijf tekens van een vingerafdruk (hash) ervan worden opgevraagd. Is de controle even niet bereikbaar, dan kun je gewoon verder.
- **Minimaal 8 tekens, overal.** Bij het wijzigen van je wachtwoord in de extensie was 6 tekens nog genoeg, terwijl je bij het aanmelden 8 nodig had. Nu geldt overal 8. Inloggen met een bestaand, korter wachtwoord blijft werken.

## Onder de motorkap

- De inlogbibliotheek (`@supabase/auth-js`) is bijgewerkt naar 2.118.0.
- De ontwikkelgereedschappen zijn bijgewerkt (Vite, Vitest, ESLint).
