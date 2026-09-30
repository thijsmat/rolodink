/**
 * The "Send feedback" link in the settings.
 *
 * The address is the one the website lists as its contact address (footer,
 * terms, security page). The mail carries only what helps to reproduce a
 * problem: the extension version and the browser. No page URLs, no profile,
 * no account details.
 */
export const SUPPORT_EMAIL = 'hallo@rolodink.app';

export type BrowserName = 'Chrome' | 'Edge' | 'Firefox';

/** Same test as LoginView's Edge check: Edge's user agent carries "Edg/". */
export function detectBrowserName(userAgent: string): BrowserName {
    if (/\bEdg\//i.test(userAgent)) return 'Edge';
    if (/\bFirefox\//i.test(userAgent)) return 'Firefox';
    return 'Chrome';
}

export function buildFeedbackMailto(subject: string, body: string): string {
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
