# LinkedIn posts 2 t/m 6: definitieve teksten om te plannen

Plaatsen als **bedrijfspagina** (wij-vorm); de eigenaar reposet met de intro uit `linkedin-campaign.md` §2b.
Tijden zijn Europe/Amsterdam (CEST tot en met 25 okt). De datums gaan ervan uit dat **post 1 op donderdag 1 oktober 2026**
staat. Schuift post 1, schuif dan alles met dezelfde afstand op (steeds di + do, 08:30).

| Post | Datum en tijd | Onderwerp | Bijlage | Let op vóór plannen |
|---|---|---|---|---|
| 2 | di 6 okt 2026, 08:30 | Waarom we het bouwden | geen (alleen tekst) | Niets open. |
| 3 | do 8 okt 2026, 08:30 | Waarom er nog geen app is | geen | Alleen plaatsen zolang "mobiel in ontwikkeling" klopt (bevestigd op 29 sep). |
| 4 | di 13 okt 2026, 08:30 | Beveiliging | geen | Controleer dat `https://rolodink.app/en/security` live staat (de eerste reactie linkt ernaar). |
| 5 | do 15 okt 2026, 08:30 | Tip: drie dingen om op te schrijven | optioneel: carrousel met dezelfde drie punten | Niets open. |
| 6 | di 20 okt 2026, 08:30 | Peiling: wat bouwen we hierna | LinkedIn-peiling (4 opties) | Controleer de peilingopties tegen jullie echte plannen. |

Regels voor elke post: link **niet** in de post zelf maar in de eerste reactie, max. 3 hashtags, reageer op elke reactie
in het eerste uur, en repost binnen 5 minuten met eigen intro.

---

## Post 2: waarom we het bouwden

Plaats: di 6 okt 2026, 08:30. Hashtags: #networking #LinkedIn

```
Most of us have hundreds or thousands of LinkedIn connections. We can name the job title of a handful.

The details that actually matter, like "her daughter just started university" or "wants an intro to a CFO", live nowhere.

A spreadsheet or a full CRM rarely fixes that. Not because they are bad tools, but because they live somewhere you never are.

The conversation happens on LinkedIn. So the memory should too.

That is why we built Rolodink: not a CRM, just a private notes layer on top of the profile you are already looking at.

What is the most embarrassing "sorry, remind me who you are?" moment you have had?

#networking #LinkedIn
```

Eerste reactie:
```
See how it works (free for Chrome, Edge & Firefox): https://rolodink.app/en?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=post-2
```

## Post 3: waarom er nog geen app is

Plaats: do 8 okt 2026, 08:30. Hashtags: #buildinpublic #productdevelopment

```
"Is there a Rolodink app?"

We get this question a lot. The honest answer: not yet, and here is why.

Rolodink is a browser extension because that is where the LinkedIn profile is. An extension can add a note field to the page you are already reading, without copy-pasting or switching apps. The LinkedIn mobile app does not allow that kind of add-on, so a phone version would not be a port. It would be a different product.

We would rather make the desktop experience great first than ship a mediocre app.

A mobile version is in development. If you would use it, tell us how: after an event? Right before a call? That decides what we build first.

#buildinpublic #productdevelopment
```

Eerste reactie:
```
Rolodink is free for Chrome, Edge & Firefox: https://rolodink.app/en/download?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=post-3
```

## Post 4: beveiliging

Plaats: di 13 okt 2026, 08:30. Hashtags: #security #privacy #buildinpublic

Elke regel hieronder komt overeen met `docs/SECURITY.md`, de encryptie-architectuur en de tekst van de `/en/security`-pagina in de repo.
"No tracking in the extension" staat er bewust niet in, omdat dat niet is geverifieerd.

```
Notes about people are sensitive. Here is how we protect yours, and what we do not claim.

What we do:
→ Notes, meeting place, company, email and phone number are encrypted (AES-256-GCM) in the extension before they are stored
→ Every account has its own encryption key
→ Row-level security in the database: an account can only read its own rows
→ Rate limiting on the API, and an allowlist of approved origins
→ Every commit is scanned for leaked secrets, and dependencies are checked for known vulnerabilities

What we do not claim: end-to-end encryption. We manage the keys so your notes work on every device you sign in on. That makes this encryption at rest, not zero-knowledge. We would rather say that plainly than use a buzzword.

The people you write about cannot see your notes, and you can export or delete your data at any time.

Details in the first comment. Hard questions welcome.

#security #privacy #buildinpublic
```

Eerste reactie:
```
Full details on our security page: https://rolodink.app/en/security?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=post-4
```

## Post 5: tip

Plaats: do 15 okt 2026, 08:30. Hashtags: #networking #productivity #LinkedIn

```
3 things worth writing down right after a conversation:

1. Where you met (event, intro, cold message)
2. One personal detail that is not about work
3. The follow-up you promised

It takes 20 seconds. It saves you the awkward "so, remind me…" for years.

That is the whole idea behind Rolodink: write it on the profile, find it by any word later.

Which of these do you forget most often?

#networking #productivity #LinkedIn
```

Eerste reactie:
```
Try it, free for Chrome, Edge & Firefox: https://rolodink.app/en?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=post-5
```

Optioneel: maak er een carrousel van (3 slides, 1 punt per slide) voor extra bereik.

## Post 6: peiling

Plaats: di 20 okt 2026, 08:30. Hashtags: #buildinpublic #productdevelopment

Maak dit als **LinkedIn-peiling** (kan op een bedrijfspagina). Bij een peiling is het maximum 4 opties van elk max. 30 tekens; de looptijd zet je op 1 week.
De tekst bevat geen verzonnen cijfers of resultaten.

```
We are building Rolodink in the open, so you get a say in what comes next.

If you use it, or would like to: which of these would help you most?

We cannot promise an order, but your votes decide what we look at first. Tell us in the comments what we missed.

#buildinpublic #productdevelopment
```

Peilingopties (controleer tegen jullie echte plannen; vervang wat al bestaat of niet gepland is):
1. Follow-up reminders
2. Tags and lists
3. Mobile version
4. Something else (comment)

Eerste reactie:
```
Not using it yet? Free for Chrome, Edge & Firefox: https://rolodink.app/en?utm_source=linkedin&utm_medium=organic&utm_campaign=launch&utm_content=post-6
```
