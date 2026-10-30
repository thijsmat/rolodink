import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'nl'],
    defaultLocale: 'nl',
    // The keys are the folders under src/app/[locale]. Only /over is translated: the
    // Dutch word in an English URL reads as a typo, so en serves it as /about. Every
    // route has to be listed here, because Link and getPathname only accept these keys.
    pathnames: {
        '/': '/',
        '/features': '/features',
        '/how-it-works': '/how-it-works',
        '/linkedin-notes-extension': '/linkedin-notes-extension',
        '/use-cases/recruiters': '/use-cases/recruiters',
        '/use-cases/sales': '/use-cases/sales',
        '/use-cases/networking-events': '/use-cases/networking-events',
        '/download': '/download',
        '/help': '/help',
        '/over': { nl: '/over', en: '/about' },
        '/over/[slug]': { nl: '/over/[slug]', en: '/about/[slug]' },
        '/changelog': '/changelog',
        '/privacy': '/privacy',
        '/terms': '/terms',
        '/security': '/security',
        '/disclaimer': '/disclaimer',
        '/login': '/login',
        '/signup': '/signup',
        '/forgot-password': '/forgot-password',
        '/reset-password': '/reset-password',
        '/onboarding': '/onboarding',
        '/onboarding/success': '/onboarding/success',
    },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
