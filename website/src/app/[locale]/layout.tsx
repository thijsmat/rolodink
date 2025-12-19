import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import '../globals.css'
import { Analytics } from "@vercel/analytics/next"
import { SiteHeader } from "@/components/site-header"

import { CookieBanner } from "@/components/cookie-banner"
import { Analytics as GoogleAnalytics } from "@/components/analytics"

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter', weight: ['400', '500', '600', '700'] })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair', weight: ['600', '700'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1B2951',
}

import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
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
    alternates: {
      canonical: locale === 'nl' ? '/' : `/${locale}`,
      languages: {
        'nl': '/',
        'en': '/en',
      },
    },
    openGraph: {
      type: "website",
      url: "https://rolodink.app",
      title: t('title'),
      description: t('description'),
      siteName: "Rolodink",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Rolodink - LinkedIn notitielaag",
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

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* Plausible Analytics */}
        <script
          defer
          data-domain="rolodink.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-inter bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <CookieBanner />
          <GoogleAnalytics />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
