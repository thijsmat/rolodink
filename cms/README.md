# Rolodink CMS (Cockpit) op site.nl

De artikelen onder **rolodink.app/over** komen uit een [Cockpit CMS](https://github.com/Cockpit-HQ/Cockpit)
dat als headless schrijfomgeving draait op het site.nl-webhostingpakket, bereikbaar op
`https://cms.rolodink.app`. De website haalt de gepubliceerde artikelen server-side op via
de REST-API en rendert ze zelf in de Rolodink-huisstijl. Deze map bevat alleen de
Rolodink-specifieke configuratie; Cockpit zelf staat niet in deze repo.

## 1. Hosting voorbereiden (site.nl)

1. Zet de PHP-versie van het pakket op **8.3 of hoger** (Cockpit vereist dit). Extensies:
   PDO + pdo_sqlite, GD, curl, fileinfo, mbstring. Meestal standaard aanwezig.
2. Maak het subdomein `cms.rolodink.app` aan (of laat een subdomein bij site.nl naar de
   map wijzen) en zet HTTPS aan. Zet in de DNS van rolodink.app een record `cms` naar het
   IP/CNAME dat site.nl opgeeft.
3. Er is **geen MySQL-database nodig**: Cockpit gebruikt standaard SQLite in `storage/data`.

## 2. Cockpit installeren

Er zijn twee routes. Route A is het snelst; route B beschrijft dezelfde inrichting met de hand.

### Route A: kant-en-klaar pakket (aanbevolen)

1. Download de laatste Cockpit-broncode (zip van
   [Cockpit-HQ/Cockpit](https://github.com/Cockpit-HQ/Cockpit)) en pak die lokaal uit.
2. Kopieer `cms/config/config.sample.php`, `cms/config/bootstrap.php`, `cms/robots.txt` en
   `cms/setup/seed.php` uit deze repo in de uitgepakte map (config-bestanden in `config/`,
   `robots.txt` en `seed.php` in de root).
3. Draai het seed-script lokaal (PHP 8.3+ met pdo_sqlite):

   ```bash
   php seed.php --user=matthijs --name="Matthijs Goes" --email=jij@voorbeeld.nl
   ```

   Het script maakt de admin-gebruiker, locale `en`, collection `over`, rol `website`, een
   API-key en `config/config.php` met een revalidate-secret aan, en print de geheimen.
   Verwijder daarna `seed.php` en de map `install/`.
4. Upload de hele map naar de webroot van `cms.rolodink.app` (FTP of de bestandsbeheerder
   van site.nl). Zorg dat `storage/` en alle submappen schrijfbaar zijn voor PHP.
5. Log in op `https://cms.rolodink.app` met het tijdelijke wachtwoord uit stap 3 en wijzig
   het meteen (klik rechtsboven op je initialen).

### Route B: handmatig via de installer en de admin

1. Upload Cockpit naar de webroot, zorg dat `storage/` schrijfbaar is en vervang `robots.txt`
   door `cms/robots.txt`.
2. Open `https://cms.rolodink.app/install`, maak het admin-account aan en verwijder daarna
   de map `install/`.
3. Kopieer `cms/config/config.sample.php` naar `config/config.php` en vul de placeholders in;
   kopieer `cms/config/bootstrap.php` naar `config/bootstrap.php`.
4. Richt in de admin het onderstaande in.

## 3. Inrichting (wat het seed-script aanmaakt, of wat je met de hand doet)

### Taal
System → Locales: locale **`en`** (English). De standaardtaal is Nederlands.

### Collection `over`
Content → Add model → **Collection**, naam **`over`** (label "Over Rolodink"). Velden:

| Veld       | Type      | Opties                                                           |
|------------|-----------|------------------------------------------------------------------|
| `title`    | text      | required, **localize (i18n)** aan                                |
| `slug`     | text      | required; help: "kleine letters, cijfers en streepjes, uniek"    |
| `date`     | date      | required; publicatiedatum, bepaalt de volgorde                   |
| `intro`    | text      | multiline aan, **i18n** aan; korte lede boven het artikel        |
| `content`  | wysiwyg   | **i18n** aan; de artikeltekst (WYSIWYG-editor)                   |
| `image`    | asset     | optioneel; filter op afbeeldingen                                |
| `imageAlt` | text      | **i18n** aan; alt-tekst van de afbeelding                        |

Content-preview-URL's: `https://rolodink.app/nl/over/{slug}` en `https://rolodink.app/en/over/{slug}`.
Een artikel is pas zichtbaar op rolodink.app als de status **Published** is.

Engels is optioneel: laat je de EN-velden leeg, dan toont `/en/over/...` de Nederlandse
tekst met een klein label "alleen in het Nederlands".

### Rol en API-key
1. System → Roles: rol **`website`** met alleen `content/over/read`.
2. System → API & Access: API-key met rol `website`. Deze waarde wordt in Vercel
   `CMS_API_KEY` voor het project `website`.

### Directe verversing (revalidatie)
`config/bootstrap.php` stuurt bij opslaan/verwijderen van een `over`-item een `POST` naar
`https://rolodink.app/api/revalidate` met de header `x-cms-secret`. Het secret staat in
`config/config.php` (`rolodink.revalidate_secret`) en moet gelijk zijn aan
`CMS_REVALIDATE_SECRET` in Vercel. Zonder deze hook verschijnen wijzigingen na maximaal
10 minuten (Data Cache van Next.js).

## 4. Vercel (project `website`)

| Variabele               | Waarde                                  |
|-------------------------|-----------------------------------------|
| `CMS_BASE_URL`          | `https://cms.rolodink.app` (standaard)  |
| `CMS_API_KEY`           | de API-key uit stap 3                   |
| `CMS_REVALIDATE_SECRET` | hetzelfde secret als in `config.php`    |

## 5. Controleren

```bash
curl -H "api-key: <CMS_API_KEY>" "https://cms.rolodink.app/api/content/items/over?locale=default"
curl -H "api-key: <CMS_API_KEY>" "https://cms.rolodink.app/api/content/items/over?locale=en"
```

Beide moeten een JSON-array met de gepubliceerde artikelen geven. Daarna:
`https://rolodink.app/nl/over`.

## Updaten van Cockpit

Nieuwe release over de bestaande bestanden uploaden; `config/` en `storage/` blijven staan.
Controleer daarna `robots.txt` (opnieuw vervangen) en of `config/bootstrap.php` er nog is.
