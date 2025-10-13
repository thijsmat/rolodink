import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Rolodink – Je notitielaag bovenop LinkedIn",
  description: "Rolodink is je moderne rolodex: bewaar notities en volg slimmer op, direct vanuit LinkedIn. Organiseer je netwerk met gemak.",
  metadataBase: new URL('https://rolodink.app'),
  openGraph: {
    type: "website",
    url: "https://rolodink.app",
    title: "Rolodink – Je notitielaag bovenop LinkedIn",
    description: "Je moderne rolodex: notities en opvolging rechtstreeks op LinkedIn.",
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
    title: "Rolodink – Je notitielaag bovenop LinkedIn",
    description: "Je moderne rolodex: notities en opvolging rechtstreeks op LinkedIn.",
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
