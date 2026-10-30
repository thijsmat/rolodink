import type { Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import '../globals.css'
import { Analytics } from "@vercel/analytics/next"
import { SiteHeader } from "@/components/site-header"
import { Analytics as PostHogAnalytics } from "@/components/analytics"
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-next-inter', weight: ['400', '500', '600', '700'] })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-next-playfair', weight: ['600', '700'] })

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
