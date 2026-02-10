## v1.1.6 (2026-02-10) - Auth Hardening

### Security
- Clean up access token from storage on sign-out to prevent stale token leakage
- Increase minimum password length from 6 to 8 characters (OWASP compliance)
- Add warning log when OAuth redirect lacks a refresh token

### Improvements
- Remove unnecessary `syncConfig()` that wrote build-time constants to mutable storage
- Add TODO for persistent rate limiter (Upstash Redis / Vercel KV) on serverless

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
