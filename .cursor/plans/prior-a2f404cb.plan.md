<!-- a2f404cb-1cd1-48e0-a5ad-f7c1ba62aa20 8c412b4b-4305-4825-85ec-530598bc5743 -->
# Rollout plan: English first, then multi-browser

## Recommendation

- Prioritize an English website + extension (i18n) to unlock global reach and store approval assets. Then ship Edge (quick win) and Firefox (minor MV3 nuances) builds.

## Why this order

- English boosts landing conversions and Chrome Web Store reach immediately.
- Edge (Chromium) is near-zero code delta; bundle/sign quickly after Chrome.
- Firefox needs specific manifest and API checks; better after site copy/assets are ready.

## Scope

- Website: add EN locale, language switch, canonical/SEO, update privacy & help in EN.
- Extension: EN strings (content.js/UI), store listing in EN, keep NL as secondary.
- Stores: Chrome (EN first), Edge Add-ons (package reuse), Firefox AMO (MV3 adjustments).

## Key files

- Website: `website/src/app` pages; introduce i18n wrapper (simple `en` routes or next-intl).
- Extension: `linkedin-crm-extension/ui/src/**/*`, `linkedin-crm-extension/content.js`, `manifest.json` locales.

## Deliverables

- English website at `rolodink.app/en` (or automatic detection), updated OG/meta.
- Chrome Web Store listing in EN; screenshots EN.
- Edge package signed & submitted.
- Firefox package built & submitted.

## Risks / Notes

- Firefox: `host_permissions`, `scripting`, MV3 support; verify `chrome.*` vs `browser.*` (use `webextension-polyfill`).
- CORS for api.rolodink.app: include `moz-extension://*` origins if needed.
- Analytics remain website-only; ensure cookie banners comply per locale if required.

### To-dos

- [ ] Add English locale and EN versions of pages
- [ ] Localize extension UI/strings to EN
- [ ] Prepare EN store listing (text, screenshots)
- [ ] Package and submit Edge build (Chromium)
- [ ] Adapt manifest/APIs and submit Firefox build
- [ ] Add hreflang/canonical for EN/NL and sitemap update
- [ ] Translate and publish EN privacy & help