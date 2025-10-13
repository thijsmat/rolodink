import { NextSeoProps } from "next-seo"

export const defaultSEO: NextSeoProps = {
  title: "Rolodink – Je notitielaag bovenop LinkedIn",
  titleTemplate: "%s | Rolodink",
  description: "Rolodink is je moderne rolodex: bewaar notities en volg slimmer op, direct vanuit LinkedIn. Organiseer je netwerk met gemak.",
  canonical: "https://rolodink.app",
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
    handle: "@rolodink",
    site: "@rolodink",
    cardType: "summary_large_image",
  },
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/apple-touch-icon.png",
    },
  ],
}

export const pageSEO = {
  features: {
    title: "Features",
    description: "Ontdek alle mogelijkheden van Rolodink: notities, opvolging, en netwerkbeheer direct op LinkedIn.",
  },
  howItWorks: {
    title: "Hoe werkt het?",
    description: "Leer in 3 eenvoudige stappen hoe je Rolodink gebruikt om je LinkedIn netwerk te organiseren.",
  },
  download: {
    title: "Download",
    description: "Installeer Rolodink in je browser en begin met het organiseren van je LinkedIn netwerk.",
  },
  privacy: {
    title: "Privacy",
    description: "Privacybeleid van Rolodink - hoe we je gegevens beschermen.",
  },
  terms: {
    title: "Voorwaarden",
    description: "Algemene voorwaarden voor het gebruik van Rolodink.",
  },
}
