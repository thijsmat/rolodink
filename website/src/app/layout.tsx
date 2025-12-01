import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
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

export const metadata: Metadata = {
  title: {
    default: "Rolodink - Nooit meer vergeten wie je kent op LinkedIn",
    template: "%s | Rolodink",
  },
  description: "Stop met vergeten wie je connecties zijn. Rolodink legt een slimme notitielaag over LinkedIn zodat je altijd direct context hebt bij elk gesprek.",
  metadataBase: new URL('https://rolodink.app'),
  alternates: {
    canonical: '/',
    languages: {
      'nl': '/',
      'en': '/en',
    },
  },
  openGraph: {
    type: "website",
    url: "https://rolodink.app",
    title: "Rolodink - Nooit meer vergeten wie je kent op LinkedIn",
    description: "Stop met vergeten wie je connecties zijn. Rolodink legt een slimme notitielaag over LinkedIn zodat je altijd direct context hebt bij elk gesprek.",
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
    title: "Rolodink - Nooit meer vergeten wie je kent op LinkedIn",
    description: "Stop met vergeten wie je connecties zijn. Rolodink legt een slimme notitielaag over LinkedIn zodat je altijd direct context hebt bij elk gesprek.",
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        {/* Plausible Analytics */}
        <script
          defer
          data-domain="rolodink.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-inter bg-background text-foreground`}>
        <SiteHeader />
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <CookieBanner />
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
