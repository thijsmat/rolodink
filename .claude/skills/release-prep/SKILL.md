---
name: release-prep
description: Maakt de release-PR voor extensieversie X.Y.Z. Die bevat de versie-bump, RELEASE_NOTES_vX.Y.Z.md, CHANGELOG.md, de website-changelog in nl en en, en een testchecklist voor Chrome, Edge en Firefox. Na de merge brengt /release X.Y.Z de versie uit. Gebruik deze skill met /release-prep X.Y.Z, of als de gebruiker vraagt om een release voor te bereiden.
argument-hint: X.Y.Z
---

# Release-PR voor $ARGUMENTS

Deze skill publiceert niets. Hij maakt één PR, en het uitbrengen zelf gebeurt daarna met `/release X.Y.Z`. De achtergrond staat in `.claude/skills/rolodink-release/SKILL.md`, de browsercontroles staan in `.claude/skills/rolodink-extension/SKILL.md`. Lees allebei eerst.

## 0. Versie

- Is `$ARGUMENTS` leeg of geen `X.Y.Z`, vraag dan om de versie en stop.
- Haal de tags op met `git fetch origin main --tags`. De vorige versie is de hoogste `ext-v*` (`git tag -l 'ext-v*' --sort=-v:refname | head -1`). X.Y.Z moet daar boven liggen, en `RELEASE_NOTES_vX.Y.Z.md` mag nog niet bestaan.

## 1. Wat gaat er mee?

```bash
git log --no-merges --format='%h %s' ext-v<vorige>..origin/main -- linkedin-crm-extension packages/core
```

Lees van elke PR in die lijst (het nummer staat als `(#NNN)` in het onderwerp) de beschrijving met `mcp__github__pull_request_read`. Daarin staat wat de gebruiker merkt, en dat zie je niet aan de commit. Neem ook backend- en websitewijzigingen sinds de vorige tag mee die de extensie raken of die de gebruiker ziet. Die komen in de CHANGELOG, niet in de release notes.

Een lijst zonder één wijziging die de gebruiker merkt, is een reden om de gebruiker te vragen of deze release wel nodig is.

## 2. Versie bumpen

Werk op de branch die de sessie voorschrijft, anders op `release/X.Y.Z`, vanaf `origin/main`.

```bash
./scripts/bump-version.sh X.Y.Z
```

`git diff --stat` toont nu precies zeven bestanden: twee manifests, vier `package.json`'s en `linkedin-crm-backend/src/lib/version.ts`. Is dat niet zo, stop dan en zoek uit waarom.

## 3. Teksten

Gebruik de vorige release als voorbeeld van vorm en toon (`git show <commit van chore(release): vorige> --stat` en de bestanden zelf). Beschrijf alleen wat in de diff zit. Belooft een tekst iets wat de code niet doet, dan is de tekst fout.

- **`RELEASE_NOTES_vX.Y.Z.md`**, in het Nederlands, voor gebruikers. Titel `# Rolodink vX.Y.Z — <kop>`, één regel inleiding, per thema een `##`, en techniek onder "Onder de motorkap". Geen PR-nummers, bestandsnamen of interne termen. `release.yml` zet deze tekst letterlijk in de GitHub-release.
- **`CHANGELOG.md`**, in het Engels, voor ontwikkelaars, bovenaan: `## vX.Y.Z (YYYY-MM-DD) - <Title>`, een inleiding, en `### Added`, `### Fixed`, `### Changed`, met `(#NNN)` per regel.
- **Website**, in `website/src/messages/nl.json` en `en.json`:
  - `DownloadPage.version`: `Versie X.Y.Z • Gratis` en `Version X.Y.Z • Free`.
  - `ChangelogPage.releases`: een nieuw eerste element met `version`, `date` (`12 oktober 2026` en `October 12, 2026`) en `sections`, korter dan de release notes, in beide talen dezelfde punten.

De datum is de geplande releasedag. Weet je die niet, neem dan vandaag en zet in de PR dat hij bij het uitbrengen moet kloppen.

Controleer daarna of `nl` en `en` dezelfde sleutels en dezelfde versielijst hebben:

```bash
node -e '
const k=(o,p="")=>Object.entries(o).flatMap(([a,v])=>v&&typeof v==="object"&&!Array.isArray(v)?k(v,p+a+"."):[p+a]);
const n=require("./website/src/messages/nl.json"),e=require("./website/src/messages/en.json");
const N=new Set(k(n)),E=new Set(k(e)),v=m=>m.ChangelogPage.releases.map(r=>r.version+":"+r.sections.map(s=>s.items.length).join("/")).join(",");
const d=[...N].filter(x=>!E.has(x)).map(x=>"alleen nl: "+x).concat([...E].filter(x=>!N.has(x)).map(x=>"alleen en: "+x));
if(v(n)!==v(e))d.push("changelog verschilt:\n nl "+v(n)+"\n en "+v(e));
console.log(d.length?d.join("\n"):"nl/en gelijk");process.exit(d.length?1:0)'
```

## 4. Testchecklist

CI heeft geen browser (zie de extensie-skill). Maak daarom uit de diff van stap 1 een lijst van wat iemand met de hand moet proberen, met de uitgepakte build in Chrome, Edge en Firefox:

- Per wijziging die de gebruiker merkt één regel: wat je doet en wat je moet zien. Bijvoorbeeld: "Inlogscherm → klik 'Wachtwoord vergeten?' → er opent een tabblad op `rolodink.app/nl/forgot-password`."
- Raakt een wijziging `browser-api.ts`, de background, de manifests of iets wat in Firefox anders werkt, zet er dan **Firefox** expliciet bij.
- Altijd, onderaan:
  - inloggen in elke browser;
  - op een LinkedIn-profiel een notitie typen en die in de popup terugzien (dat is het enige pad door `sendMessage` → background → API → versleuteling);
  - in Chrome de LinkedIn-login (alleen daar klopt het extensie-ID).

De checklist komt in de PR onder "🧪 How to Test", als afvinklijst.

## 5. Controles

```bash
npm test
(cd linkedin-crm-extension/ui && npm run typecheck && npm run lint && npm test)
(cd linkedin-crm-extension && rm -rf ../dist && node build.js chrome edge firefox && sha256sum ../dist/tmp/*/content.js && grep -c '"version": "X.Y.Z"' ../dist/tmp/*/manifest.json; rm -rf ../dist)
(cd website && npm run lint && npm run build)
```

- De drie `content.js`-checksums zijn gelijk, en elk manifest heeft X.Y.Z.
- `version.test.ts` in `npm test` bewaakt dat `version.ts` en de manifests overeenkomen.
- Schrijf naar een logbestand en lees `$?` apart; `| tail` maskeert de exitcode.

## 6. PR

- Commit met `chore(release): X.Y.Z`. In de body komt welke PR's meegaan.
- Open een draft-PR volgens `.github/pull_request_template.md`, met de titel `chore(release): X.Y.Z`, de PR-lijst, de testchecklist en de datum.
- Volg de PR tot CI groen is.

Meld de gebruiker dan:

1. de checklist doorlopen;
2. de datum laten kloppen;
3. mergen;
4. daarna `/release X.Y.Z`.
