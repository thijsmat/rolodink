# Rolodink Extension v1.1.5 - Hotfix

## Bug Fixes

- **Fix `Image is not a constructor` error**: Resolved a namespace conflict where the `next/image` import was shadowing the native browser `Image` constructor. Renamed import to `NextImage` in both the website onboarding page and the backend landing page.
- **Fix missing `sizes` prop warning**: Added proper `sizes` attribute to the `NextImage` component with `fill` layout on the onboarding page.
- **Fix `no-img-element` lint warning**: Replaced raw `<img>` tag in the website hero section with `NextImage` for proper image optimization.

## Improvements

- **Direct authentication on onboarding**: Users can now sign up or log in with email/password directly from the onboarding page, without being redirected to a separate page.
- **LinkedIn sign-in on onboarding**: Added LinkedIn OAuth sign-in option to the onboarding authentication step.
- **Extension login translations**: Updated EN and NL translations for the extension login view.

## Download

- **Chrome/Brave**: Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/rolodink/YOUR_ID)
- **Edge**: Install from the [Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/ihcocnphebdemiipmoedinojihpbcmmf)
- **Firefox**: Install from [Firefox Add-ons](https://addons.mozilla.org/addon/rolodink/)
