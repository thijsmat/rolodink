import { NextSeoProps } from "next-seo"

export const defaultSEO: NextSeoProps = {
  title: "Rolodink – Van visitekaartje naar de toekomst van netwerken",
  titleTemplate: "%s | Rolodink",
  description: "Rolodink brengt de persoonlijke touch van het visitekaartje terug naar je LinkedIn connecties: onthoud details en volg natuurlijk op.",
  canonical: "https://rolodink.app",
  openGraph: {
    type: "website",
    url: "https://rolodink.app",
    title: "Rolodink – Van visitekaartje naar de toekomst van netwerken",
    description: "Brengt de persoonlijke noot van visitekaartjes terug op LinkedIn.",
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
