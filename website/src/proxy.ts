import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

// Next 16 renamed the `middleware` file convention to `proxy`. It runs on the
// Node.js runtime now instead of Edge; nothing here depends on either.

// Fouten van een OAuth-provider komen niet bij /auth/callback aan: Supabase
// stuurt ze naar zijn eigen Site URL, dus ze landen op de homepage waar niets
// ze leest. Dit is de enige plek waar élke landing langskomt.

// Afbreken is een keuze van de gebruiker, geen storing. Wel terugbrengen naar
// het inlogscherm, geen foutmelding erbij.
const CANCELLED = new Set([
    'access_denied',
    'user_cancelled_login',
    'user_cancelled_authorize',
]);

const GENERIC_ERROR = 'Inloggen is niet gelukt. Probeer het opnieuw.';

function localeFromPath(pathname: string): string {
    const first = pathname.split('/')[1];
    return (routing.locales as readonly string[]).includes(first)
        ? first
        : routing.defaultLocale;
}

export function proxy(request: NextRequest) {
    // next.config.js heeft skipTrailingSlashRedirect aan (PostHog-endpoints eindigen op een
    // slash), dus Next stuurt /nl/download/ niet zelf naar /nl/download. Zonder deze
    // redirect bestaan beide URL's naast elkaar, terwijl canonical, sitemap en hreflang de
    // versie zonder slash gebruiken. De matcher hieronder laat /ingest buiten schot.
    const { pathname } = request.nextUrl;
    if (pathname.length > 1 && pathname.endsWith('/')) {
        // Zonder regex: /\/+$/ geeft SonarCloud een backtracking-melding (S8786).
        let trimmed = pathname;
        while (trimmed.length > 1 && trimmed.endsWith('/')) {
            trimmed = trimmed.slice(0, -1);
        }
        // Een gewone URL: NextURL zet de slash bij het serialiseren weer terug.
        const url = new URL(request.url);
        url.pathname = trimmed;
        return NextResponse.redirect(url, 308);
    }

    const error = request.nextUrl.searchParams.get('error');

    if (error) {
        const locale = localeFromPath(request.nextUrl.pathname);
        const destination = new URL(`/${locale}/login`, request.nextUrl.origin);

        if (!CANCELLED.has(error)) {
            // Bewust niet error_description: die tekst komt uit de URL en zou
            // door een aanvaller opgesteld kunnen zijn.
            destination.searchParams.set('oauth_error', GENERIC_ERROR);
        }

        return NextResponse.redirect(destination);
    }

    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(nl|en)/:path*']
};
