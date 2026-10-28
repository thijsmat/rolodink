/**
 * Links from the extension to pages on rolodink.app.
 *
 * The website only has the locales nl and en; any other UI language would
 * land on a 404, so it gets the English page.
 */
export const WEBSITE_URL = 'https://rolodink.app';

export type WebsiteLocale = 'nl' | 'en';

export function websiteLocaleFor(uiLanguage: string): WebsiteLocale {
    return uiLanguage.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}

/** The reset flow from thijsmat/rolodink#174: request a link by email. */
export function forgotPasswordUrl(uiLanguage: string): string {
    return `${WEBSITE_URL}/${websiteLocaleFor(uiLanguage)}/forgot-password`;
}
