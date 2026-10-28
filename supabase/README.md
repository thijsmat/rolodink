# Supabase Auth-config als code

`config.toml` en `templates/` beschrijven de Auth-instellingen van het hosted project `linkedin-crm` (ref `adacfwaslbcimqgvbpqd`): Site URL, redirect-URL's, e-mailbevestiging, SMTP (Resend), Sign in with LinkedIn, MFA, rate limits en alle e-mailtemplates. Wijzig ze hier, via een PR, en niet meer in het dashboard.

Alleen `[auth]` staat in het bestand, en dat is bewust. `config push` schrijft niets wat het bestand niet declareert, dus de API-, database- en storage-instellingen blijven zoals ze in het dashboard staan. Zet daarom geen `[api]`-, `[db]`- of `[storage]`-blok terug uit een `supabase init`-template. Die standaardwaarden horen bij een lokale stack. Bij een push overschrijven ze de echte instellingen; `[api] enabled = false` zet zelfs de Data API uit, en daarmee de keep-alive.

## CLI-versie

Gebruik `npx supabase@2.122.0` of nieuwer. Deze versie stuurt bij een push alleen gewijzigde, gedeclareerde velden. Oudere (Go-)versies zetten niet-gedeclareerde velden terug op hun standaardwaarde.

## Wijzigen en uitrollen

1. Pas `config.toml` of een template aan en open een PR.
2. Na de merge, lokaal in de repo:

   ```bash
   npx supabase@2.122.0 login
   npx supabase@2.122.0 config push --project-ref adacfwaslbcimqgvbpqd
   ```

   `push` laat per service zien wat er verandert en vraagt dan pas om bevestiging. Lees die lijst voordat je "y" antwoordt. Staat er iets in wat niet in je PR zat, antwoord dan "n" en zoek eerst uit waar het verschil vandaan komt.

## Controleren of repo en dashboard gelijk zijn

- `config push` meldt **"Nothing to push"** als alles overeenkomt, ook de inhoud van de templates. Hij vraagt bevestiging voordat hij iets schrijft, dus als controle is hij veilig: antwoord "n" als hij toch iets wil wijzigen.
- `config diff --project-ref adacfwaslbcimqgvbpqd` is alleen-lezen, maar **vergelijkt de inhoud van de templates niet**, alleen de subjects. Hij meldt ook `remote_only` voor `api`, `db.pooler` en `storage`. Dat is verwacht, want die staan bewust niet in het bestand.

Op 2026-10-28 is dit bestand gemaakt uit een export van `GET /v1/projects/adacfwaslbcimqgvbpqd/config/auth`. Tegen die export gaf `config push` "Nothing to push", en een gewijzigde template werd wel gezien. Een `push` tegen het echte project moet hetzelfde geven.

## Secrets

Het SMTP-wachtwoord en het LinkedIn-clientsecret staan niet in de repo. `config.toml` verwijst naar:

- `SUPABASE_AUTH_SMTP_PASS` (API-key van Resend)
- `SUPABASE_AUTH_EXTERNAL_LINKEDIN_OIDC_SECRET`

Zonder die variabelen laat `push` beide secrets ongemoeid ("credential values were not pushed"). Zet ze alleen bij een rotatie, in `supabase/.env` (gitignored) of in je shell, en haal ze daarna weer weg.

## Valkuilen

- **Paden.** `content_path` van de e-mailtemplates (`[auth.email.template.*]`) is relatief aan de root van de repo (`./supabase/templates/…`). Die van de meldingen (`[auth.email.notification.*]`) is relatief aan deze map (`./templates/…`). Dat is een eigenaardigheid van de CLI; maak ze niet gelijk.
- **Regeleinden.** De templates hebben LF-regeleinden en eindigen zonder newline, precies zoals Supabase ze bewaart. `supabase/.gitattributes` dwingt LF af, ook op Windows met `core.autocrlf=true`. Een editor die CRLF of een newline aan het eind toevoegt, maakt een (onschuldige) wijziging die `push` wil uitrollen. Meldt `push` dat *alle* templates verschillen, dan zijn het vrijwel zeker de regeleinden.
- **Wijziging in het dashboard.** `config pull` haalt gewone instellingen terug in `config.toml`, maar geen inhoud van templates. Pas templates daarom alleen hier aan.
