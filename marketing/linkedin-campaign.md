# Rolodink – LinkedIn-campagne (voertaal Engels)

Status: concept, nog niets gepubliceerd. Uitleg in het Nederlands, alle posts in het Engels.
Opgesteld op 2026-09-29 op basis van de repo (video, website-teksten, `docs/SECURITY.md`, CHANGELOG).

## 0. Eerst afhandelen (vóór post 1)

| # | Punt | Waarom |
|---|---|---|
| 1 | **(Opgelost, gemerged in #96: FAQ en `/security` zijn herschreven, ook in het Engels.)** **"End-to-end encryption" stond op de website** (FAQ `security`, `website/src/messages/en.json`) maar de architectuur is *server-tied*: de backend genereert per gebruiker een AES-256-sleutel en wrapt die met `ENCRYPTION_MASTER_KEY` (AES-256-GCM). Dat is versleuteling at rest met per-gebruiker-sleutels, **niet** end-to-end / zero-knowledge. | Een security-post die dit overdrijft is het eerste waar een kritische lezer op ingaat. De posts hieronder claimen het dus bewust niet. Pas ook de FAQ aan. |
| 2 | Hero op de site: "4.9/5 – Trusted by professionals". | Niet gebruiken in posts zolang er geen onderbouwing is. |
| 3 | Store-tekst noemt "Open source transparency", "Smart follow-up reminders" en de knop "Add to CRM", terwijl de video "Add to Rldnk" toont. | Alleen noemen wat aantoonbaar klopt; check of de repo publiek is voordat je "open source" zegt. |
| 4 | Mobiel: FAQ zegt "a mobile version is in development". | Post 3 leunt hierop. **Bevestigd door de eigenaar: klopt.** |
| 5 | Videoformaat is 16:9, 1920×1080, 19 s, geen spraak, tekst in beeld. | Prima als native upload. Het `.vtt`-bestand beschrijft alleen geluid en LinkedIn accepteert alleen `.srt`, dus geen ondertitelbestand uploaden. |
| 6 | Merknaam: post geen screenshots die LinkedIn-logo's als "partner" laten lijken. | Er is al een disclaimerpagina op de site; noem Rolodink een *onafhankelijke* extensie. |

## 1. Doel en opzet

- **Doel:** installs (Chrome / Edge / Firefox) via rolodink.app, plus vertrouwen bij de doelgroep (recruiters, sales, consultants, founders).
- **Afzender (besloten):** alle posts komen van de **bedrijfspagina**; de eigenaar reposet ze zelf op zijn/haar profiel. Bedrijfspagina's bereiken doorgaans minder dan persoonlijke profielen, dus repost **met eigen intro-tekst** (zie §2b) in plaats van een kale repost, en doe dat direct na het plaatsen. Alle posts hieronder zijn daarom in de wij-vorm.
- **Budget (besloten):** alleen organisch, geen betaalde promotie.
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

### Posts 2 t/m 6

De definitieve teksten, eerste reacties, plantijden en een importbestand staan in
[`linkedin-posts-2-6.md`](linkedin-posts-2-6.md) en [`linkedin-schedule.csv`](linkedin-schedule.csv). Onderwerpen:
2 waarom we het bouwden, 3 waarom er nog geen app is, 4 beveiliging, 5 tip, 6 peiling over wat er hierna komt.

### 2b. Repost-intro's voor het eigen profiel

Repost elke post binnen 5 minuten na plaatsing en schrijf er 1–2 zinnen bij in de ik-vorm. Dit is de persoonlijke laag; vul waar nodig zelf in.

| Post | Voorstel intro (Engels) |
|---|---|
| 1 Launch | `We just launched Rolodink. I built it because I kept forgetting who I'd met and what we talked about. 19 seconds:` |
| 2 Why | `The honest origin story of Rolodink: [jouw moment waarop je iemand belangrijks vergat].` |
| 3 No app | `The most common question we get. Short answer and the reasoning below:` |
| 4 Security | `If you keep notes about people, you should ask hard questions about where they go. Here are our answers, including the limits:` |
| 5 Tip | `A habit that changed how I network:` |
| 6 Feedback | `Genuinely want your input on what we build next:` |

## 3. Tools

Kern voor een klein team; alles hieronder werkt via LinkedIn's goedgekeurde API's, tenzij anders vermeld.

| Doel | Tool | Opmerking |
|---|---|---|
| Plannen + analytics | **Buffer** | Simpel, goedkoop, ondersteunt profielen en bedrijfspagina's. Beste start. |
| Plannen + analytics + ads-rapportage | **Metricool** | Gebruikt LinkedIn's goedgekeurde API's; ook Ads-rapportage in één dashboard. |
| LinkedIn-specialist | **Taplio** | Gericht op persoonlijke profielen; alleen relevant voor het repost-profiel, niet voor de bedrijfspagina. |
| Team met goedkeuringsflow | **Planable** | Goed om samen aan teksten te werken en te laten goedkeuren. |
| Groot/enterprise | **Sprout Social** | Waarschijnlijk overkill voor nu. |
| Betaald bereik | ~~LinkedIn Campaign Manager~~ | Niet nodig: besloten om alleen organisch te draaien. Later oppakken als organisch goed werkt. |
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

## 5. Besloten en open

Besloten: afzender is de bedrijfspagina met repost door de eigenaar, alleen organisch, GDPR-claims afgezwakt op de site, mobiel klopt.

Nog open:
1. Is `/en/security` live na de deploy van #96 (vóór post 4)?
2. Kloppen de vier peilingopties van post 6 met jullie echte plannen?
