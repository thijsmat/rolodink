/**
 * The "Send feedback" link in the settings.
 *
 * The website lists hallo@rolodink.app as its contact address; the English
 * texts use hello@rolodink.app. Both reach the same inbox, so the link uses the
 * one that matches the language the extension shows. The mail carries only
 * what helps to reproduce a problem: the extension version and the browser.
 * No page URLs, no profile, no account details.
 */
export function supportEmailFor(uiLanguage: string): string {
    return uiLanguage.toLowerCase().startsWith('nl') ? 'hallo@rolodink.app' : 'hello@rolodink.app';
}

export type BrowserName = 'Chrome' | 'Edge' | 'Firefox';

/** Same test as LoginView's Edge check: Edge's user agent carries "Edg/". */
export function detectBrowserName(userAgent: string): BrowserName {
    if (/\bEdg\//i.test(userAgent)) return 'Edge';
    if (/\bFirefox\//i.test(userAgent)) return 'Firefox';
    return 'Chrome';
}

export function buildFeedbackMailto(address: string, subject: string, body: string): string {
    return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
