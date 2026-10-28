---
name: release
description: Brengt extensieversie X.Y.Z uit naar Chrome, Edge en Firefox via release.yml en de drie publish-workflows. Alleen te starten door de gebruiker met /release X.Y.Z.
disable-model-invocation: true
argument-hint: X.Y.Z
---

# Release $ARGUMENTS

Dit publiceert naar drie stores en is niet terug te draaien. De achtergrond en
de valkuilen staan in `.claude/skills/rolodink-release/SKILL.md`. Lees die
eerst; deze skill is alleen de volgorde.

Is `$ARGUMENTS` leeg of geen `X.Y.Z`, vraag dan om de versie en stop.

## 0. Wat gaat er mee?

- `git fetch origin main --tags` en `git log ext-v<vorige>..origin/main -- linkedin-crm-extension packages/core`.
- Open PR's die de extensie of `packages/core` raken.
- De **testchecklist** uit de release-PR (`chore(release): X.Y.Z`, sectie "🧪 How to Test"). Ontbreekt die, maak hem dan volgens stap 4 van `.claude/skills/release-prep/SKILL.md`.
- Meld de gebruiker wat er in deze release zit, wat nog openstaat en de checklist. Vraag of die in Chrome, Edge en Firefox is doorlopen, en **wacht op een akkoord** voordat je verder gaat. Een punt dat niet getest is, is geen akkoord: noem het en laat de gebruiker kiezen.

## 1. Klaar om uit te brengen?

- De release-PR is gemerged in `main` (`/release-prep X.Y.Z` maakt hem: `./scripts/bump-version.sh X.Y.Z`, `CHANGELOG.md`, `docs/release-notes/RELEASE_NOTES_vX.Y.Z.md`, website-changelog). Controleer dat `docs/release-notes/RELEASE_NOTES_vX.Y.Z.md` op `main` staat.
- Er staat geen vorige versie meer in review bij Chrome of Edge.

## 2. Store Credentials Check

Start `store-credentials-check.yml` met `mcp__github__actions_run_trigger` (`run_workflow`, `ref: main`, geen inputs) en wacht op het resultaat.

- Alles groen: door naar stap 3.
- Chrome of Firefox rood: **stop** en meld welke. Herstel staat in de rolodink-release-skill.
- Alleen Edge rood (401): Chrome en Firefox kunnen door. Meld dat Edge later los moet.

## 3. Release

Start `release.yml` met `version: "X.Y.Z"` en `publish: true` en wacht tot de run klaar is.

## 4. Publiceren

Een release die `GITHUB_TOKEN` publiceert, start zelf geen workflows. Start daarom `publish-chrome.yml`, `publish-edge.yml` en `publish-firefox.yml`, elk met `tag: "ext-vX.Y.Z"` (Edge niet als die in stap 2 rood was).

## 5. Controleren

Een groene run zegt niets over de inhoud. Controleer:

- Het "List Artifacts"-log van de release-run toont drie zips.
- De release-body (`mcp__github__get_release_by_tag`) is de tekst uit `docs/release-notes/RELEASE_NOTES_vX.Y.Z.md`, niet de template.
- De publish-runs zijn groen. Bij Chrome: `uploadState: SUCCESS` én geen "Publish condition not met".

Meld per store wat er gebeurd is en wat er nog moet (een handmatige "Submit for review", of Edge later).
