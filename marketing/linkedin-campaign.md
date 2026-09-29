# Rolodink – LinkedIn-campagne (voertaal Engels)

Status: concept, nog niets gepubliceerd. Uitleg in het Nederlands, alle posts in het Engels.
Opgesteld op 2026-09-29 op basis van de repo (video, website-teksten, `docs/SECURITY.md`, CHANGELOG).

## 0. Eerst afhandelen (vóór post 1)

| # | Punt | Waarom |
|---|---|---|
| 1 | **"End-to-end encryption" staat op de website** (FAQ `security`, `website/src/messages/en.json`) maar de architectuur is *server-tied*: de backend genereert per gebruiker een AES-256-sleutel en wrapt die met `ENCRYPTION_MASTER_KEY` (AES-256-GCM). Dat is versleuteling at rest met per-gebruiker-sleutels, **niet** end-to-end / zero-knowledge. | Een security-post die dit overdrijft is het eerste waar een kritische lezer op ingaat. De posts hieronder claimen het dus bewust niet. Pas ook de FAQ aan. |
| 2 | Hero op de site: "4.9/5 – Trusted by professionals". | Niet gebruiken in posts zolang er geen onderbouwing is. |
| 3 | Store-tekst noemt "Open source transparency", "Smart follow-up reminders" en de knop "Add to CRM", terwijl de video "Add to Rldnk" toont. | Alleen noemen wat aantoonbaar klopt; check of de repo publiek is voordat je "open source" zegt. |
| 4 | Mobiel: FAQ zegt "a mobile version is in development". | Post 3 leunt hierop. Bevestig de actuele stand met jullie. |
| 5 | Videoformaat is 16:9, 1920×1080, 19 s, geen spraak, tekst in beeld. | Prima als native upload. Het `.vtt`-bestand beschrijft alleen geluid en LinkedIn accepteert alleen `.srt`, dus geen ondertitelbestand uploaden. |
| 6 | Merknaam: post geen screenshots die LinkedIn-logo's als "partner" laten lijken. | Er is al een disclaimerpagina op de site; noem Rolodink een *onafhankelijke* extensie. |

## 1. Doel en opzet

- **Doel:** installs (Chrome / Edge / Firefox) via rolodink.app, plus vertrouwen bij de doelgroep (recruiters, sales, consultants, founders).
- **Afzender:** de founder(s) persoonlijk plaatsen, de bedrijfspagina deelt/reposten. Persoonlijke posts bereiken op LinkedIn doorgaans veel meer dan een bedrijfspagina.
- **Ritme:** 2 posts per week (di + do, ± 08:00–09:30 CET), 6 posts in 3 weken. Tussen de posts reageren op elke reactie binnen het eerste uur.
- **Link:** zet de URL in de **eerste reactie**, niet in de post zelf (LinkedIn dempt externe links in de post). Gebruik een UTM-link per post (zie §4).
- **Video:** upload het MP4-bestand native (`website/public/video/rolodink-explainer.mp4`), geen YouTube-link. Poster = eerste frame; het hooked al in de eerste 3 s ("Who was that *one again?*").

## 2. De posts

Alle teksten zijn kladversies. Hashtags maximaal 3.

### Post 1 – Launch, alleen video + tekst (dag 1, dinsdag)

Bijlage: `rolodink-explainer.mp4` (19 s).

```
You meet someone great at a conference. Two months later you're staring at their LinkedIn profile thinking: who was that again?

We built Rolodink for that moment.

It adds a private note field right on the LinkedIn profile. Where you met. What you talked about. That they restore sailboats.

Then you search "sail" and find Sanne.

19 seconds. Free for Chrome, Edge & Firefox.

What do you do today to remember the people you meet?

#networking #LinkedIn #productivity
```

Eerste reactie: `Try it (free): https://rolodink.app/?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=video`

### Post 2 – Why we built it (dag 4)

Bijlage: geen video; één beeld (screenshot van een profiel met notitie) of puur tekst. Vul de persoonlijke anekdote in, dat maakt de post.

```
I have 2,000+ LinkedIn connections. I can tell you the job title of maybe 30 of them.

The rest is a blur of names, and the details that actually matter, like "her daughter just started university" or "wants an intro to a CFO", live nowhere.

I tried spreadsheets. I tried a full CRM. Both died within a month, because they live somewhere I never am.

The conversation happens on LinkedIn. So the memory should too.

That's why we built Rolodink: not a CRM, just a notes layer on top of the profile you're already looking at.

[Add your own story here: the moment you forgot someone important.]

What's the most embarrassing "sorry, remind me who you are?" you've had?
```

*(Getal "2,000+" is een voorbeeld: vervang door de echte cijfers of haal het weg.)*

### Post 3 – Why there's no app (yet) (dag 8)

```
"Is there a Rolodink app?"

We get this question a lot. Honest answer: not yet, and here's why.

Rolodink is a browser extension because that's where the LinkedIn profile is. An extension can add a note field to the page you're already reading, without copy-pasting or switching apps. The LinkedIn mobile app doesn't allow that kind of add-on, so a phone version has to be a different product, not a port.

We'd rather make the desktop experience great first than ship a mediocre app.

A mobile version is in development. If you want it, tell us how you'd use it on your phone: after an event? Before a call? That decides what we build first.

#buildinpublic #productdevelopment
```

*(Alleen posten als "in development" nog klopt. Zo niet: "on the roadmap" of weglaten.)*

### Post 4 – What we do about security (dag 11)

```
Notes about people are sensitive. Here is what we do to protect yours, and what we don't claim.

What we do:
→ Notes, meeting place, email and phone are encrypted before they are stored (AES-256-GCM)
→ Every user gets their own encryption key
→ Row-level security in the database: your rows are only readable by your account
→ Rate limiting on the API against abuse
→ Automated secret scanning and dependency checks in our CI
→ No tracking inside the extension

What we don't claim: end-to-end encryption. Our servers manage the keys so your notes work across devices, which means this is encryption at rest, not zero-knowledge. We'd rather tell you that than a buzzword.

Your notes are never visible to the people you write about.

Full details on the security page of our site. Questions welcome, especially hard ones.

#security #privacy #GDPR
```

*(Elke regel is gecontroleerd tegen `docs/SECURITY.md` en de encryptie-sectie in CHANGELOG/`SENSITIVE_FIELDS`; vraag de developer om "no tracking in the extension" en "secret scanning in CI" nog eens te bevestigen voordat je post. De security-pagina is nu alleen in het Nederlands, zet een Engelse versie live of link naar het NL-origineel.)*

### Post 5 – Use case / tip (dag 15)

```
3 things worth writing down right after a conversation:

1. Where you met (event, intro, cold message)
2. One personal detail, not work-related
3. The follow-up you promised

Takes 20 seconds. Saves you the awkward "so, remind me…" for years.

That's the whole idea behind Rolodink: write it on the profile, find it by any word later.

Which of these do you forget most often?
```

Optioneel: carrousel met dezelfde drie punten.

### Post 6 – Feedback / community (dag 18)

```
Rolodink is 3 weeks into people using it. What we've learned:

[2–3 echte inzichten of aantallen invullen, alleen wat je kunt onderbouwen]

Next up: [volgende feature]. What should we build first?

→ Follow-up reminders
→ Export
→ Mobile
→ Something else (tell us)
```

## 3. Tools

Kern voor een klein team; alles hieronder werkt via LinkedIn's goedgekeurde API's, tenzij anders vermeld.

| Doel | Tool | Opmerking |
|---|---|---|
| Plannen + analytics | **Buffer** | Simpel, goedkoop, ondersteunt profielen en bedrijfspagina's. Beste start. |
| Plannen + analytics + ads-rapportage | **Metricool** | Gebruikt LinkedIn's goedgekeurde API's; ook Ads-rapportage in één dashboard. |
| LinkedIn-specialist | **Taplio** | Gericht op persoonlijke profielen, ideeën- en analysefuncties. Handig voor founder-posts. |
| Team met goedkeuringsflow | **Planable** | Goed om samen aan teksten te werken en te laten goedkeuren. |
| Groot/enterprise | **Sprout Social** | Waarschijnlijk overkill voor nu. |
| Betaald bereik | **LinkedIn Campaign Manager** (+ Insight Tag) | Nodig voor ads en conversie-tracking. Doelgroep bijv. op functietitel (recruiter, sales, consultant). |
| Doorklik-tracking | **UTM-links + Plausible/GA** | Gebruik een aparte `utm_content` per post. Jullie site gebruikt "privacy-friendly analytics"; check dat UTM daarin zichtbaar is. |
| Video-aanpassingen | **CapCut / DaVinci / ffmpeg** | Voor een vierkante of 4:5-variant (meer ruimte in de feed) of een 6 s-teaser. De video is een HTML-render (`video/`); een aparte export is beter dan croppen. |

**Niet doen:** LinkedIn-automatiseringstools (Expandi, Dux-Soup, Meet Alfred e.d.) voor connectieverzoeken of DM's. Dit schendt LinkedIn's voorwaarden en kan accounts blokkeren. Voor een product dat op LinkedIn leeft en betrouwbaar wil overkomen is dat een onnodig risico. Engagement-pods idem.

Bronnen:
- [Planable – Best LinkedIn tools](https://planable.io/blog/linkedin-tools/)
- [Sprout Social – LinkedIn marketing tools](https://sproutsocial.com/insights/linkedin-marketing-tools/)
- [Expandi – LinkedIn marketing tools](https://expandi.io/blog/linkedin-marketing-tools/)
- [Planable – LinkedIn analytics tools](https://planable.io/blog/linkedin-analytics-tools/)
- [ligosocial – LinkedIn video best practices](https://ligosocial.com/blog/linkedin-video-post-best-practices)
- [ContentIn – LinkedIn video format](https://contentin.io/blog/linkedin-video-format/)

## 4. Meten

Per post noteren (spreadsheet of Notion): impressies, video views + gemiddelde kijktijd, reacties, klikken, UTM-bezoeken, installs (Chrome Web Store / AMO / Edge dashboards). Vergelijk na 3 weken welk onderwerp de meeste installs opleverde en pas de vervolgposts aan.

UTM-patroon: `?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=<post-1..6>`

## 5. Open vragen

1. Wie plaatst er (naam, persoonlijk profiel of bedrijfspagina)?
2. Is er budget voor betaalde promotie (bijv. de launch-post boosten)?
3. Staat de Engelse security-pagina voor post 4 live?
4. Zijn er echte gebruikerscijfers of quotes voor post 6?
