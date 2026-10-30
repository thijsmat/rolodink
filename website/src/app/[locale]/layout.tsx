import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import { routing } from '@/navigation'
import localFont from 'next/font/local'
import '../globals.css'
import { Analytics } from "@vercel/analytics/next"
import { SiteHeader } from "@/components/site-header"
import { Analytics as PostHogAnalytics } from "@/components/analytics"
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, getMessages } from 'next-intl/server';

// Self-hosted (src/fonts, SIL OFL 1.1, latin subset from Fontsource) instead of next/font/google:
// the Google loader fetches the CSS at build time and failed CI and Vercel builds whenever
// fonts.googleapis.com answered oddly. One variable file per family covers every weight we use.
const inter = localFont({
  src: '../../fonts/inter-latin-wght.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-next-inter',
})
const playfair = localFont({
  src: '../../fonts/playfair-display-latin-wght.woff2',
  weight: '400 900',
  display: 'swap',
  variable: '--font-next-playfair',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1B2951',
}

export async function generateMetadata({
  params
}: {
  readonly params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: {
      default: t('title'),
      template: "%s | Rolodink",
    },
    description: t('description'),
    metadataBase: new URL('https://rolodink.app'),
    // Geen canonical of hreflang hier: die zijn per pagina (src/lib/seo.ts), anders
    // erven pagina's zonder eigen metadata de canonical van de homepage.
    openGraph: {
      type: "website",
      title: t('title'),
      description: t('description'),
      siteName: "Rolodink",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t('imageAlt'),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  readonly children: React.ReactNode,
  readonly params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  // Zonder deze check pakt [locale] elk eerste padsegment ("/features", "/foo") als taal en
  // rendert de homepage onder die URL. Onbekende talen horen een 404 te geven.
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${playfair.variable} font-inter bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <PostHogAnalytics />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
