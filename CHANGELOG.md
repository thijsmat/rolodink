## v1.1.5 (2026-02-10) - Hotfix

### Bug Fixes
- Fix `TypeError: Image is not a constructor` caused by `next/image` import shadowing the native `Image` constructor
- Fix missing `sizes` prop on `NextImage` with `fill` layout in onboarding page
- Replace raw `<img>` with `NextImage` in website hero section to resolve `no-img-element` lint warning

### Improvements
- Add direct email/password authentication flow to onboarding page
- Add LinkedIn sign-in option to onboarding page
- Update extension login translations for EN and NL

## v1.1.4

- Onboarding page redesign with step-by-step flow
- Centered layout with improved visual hierarchy
- i18n support for onboarding (EN/NL)

## v0.1.1 (staging)

- Point extension to staging API base URL (`linkedin-crm-staging-…vercel.app`)
- Centralize `API_BASE_URL` in `ui/src/config.ts`
- Improve packaging script to only flip `config.ts`, `content.js`, `manifest.json`
- UI fixes: scrolling, layout, LinkedIn tab navigation, toasts
