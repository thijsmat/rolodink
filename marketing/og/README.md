# Deelafbeelding (Open Graph / Twitter)

De afbeelding die LinkedIn, X, Slack en WhatsApp tonen bij een link naar rolodink.app. Eén per taal,
1200×630: `website/public/og-image-nl.png` en `og-image-en.png`. `ogImage()` in `website/src/lib/seo.ts`
kiest de juiste per pagina; artikelen met een eigen afbeelding uit het CMS gebruiken die.

## Maken

```bash
(cd video && npm ci --ignore-scripts)   # Playwright
CHROME_PATH=/opt/pw-browsers/chromium node marketing/og/render.mjs
```

`og-image.html` bevat beide versies en gebruikt dezelfde lettertypen en kleuren als de website. De notitie
is het fictieve voorbeeld van de homepage (`Examples.items.event`). Geen echte personen, geen LinkedIn-logo
of -interface: een deelafbeelding staat overal, en Rolodink is niet aan LinkedIn verbonden.

Pas je de tekst aan, houd dan `Metadata.imageAlt` in `website/src/messages/{nl,en}.json` in lijn; dat is
de alt-tekst van de afbeelding.

Platforms bewaren een deelafbeelding een tijd. Na een wijziging ververs je hem op LinkedIn met de
[Post Inspector](https://www.linkedin.com/post-inspector/).
