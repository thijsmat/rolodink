import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import Hero from "@/components/sections/hero";
import Explainer from "@/components/sections/explainer";
import Features from "@/components/sections/features";
import Examples from "@/components/sections/examples";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { BASE_URL, homeMetadata } from "@/lib/seo";
import { faqKeys } from "@/lib/faq-keys";
import { getExtensionUrl } from "@/lib/utils";

type Params = Promise<{ locale: string }>;

export function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return homeMetadata(params);
}

export default async function HomePage({ params }: Readonly<{ params: Params }>) {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  const faq = await getTranslations({ locale, namespace: "FAQ" });

  // No aggregateRating on purpose: only add one when it comes from real store reviews.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Rolodink",
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        sameAs: ["https://www.linkedin.com/company/rolodink/"],
      },
      {
        "@type": "SoftwareApplication",
        name: "Rolodink",
        description: meta("description"),
        url: `${BASE_URL}/${locale}`,
        applicationCategory: "BrowserApplication",
        operatingSystem: "Chrome, Edge, Firefox",
        inLanguage: locale,
        downloadUrl: getExtensionUrl(),
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: faqKeys.map((key) => ({
          "@type": "Question",
          name: faq(`items.${key}.question`),
          acceptedAnswer: { "@type": "Answer", text: faq(`items.${key}.answer`) },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <main className="flex-1 pt-16">
        <Hero />
        <Explainer />
        <Features />
        <Examples />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
