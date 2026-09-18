import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { ArticleList } from "@/components/article-list";
import { ArticleCta } from "@/components/article-cta";
import { getArticles, type Locale } from "@/lib/cms";

type Params = Promise<{ locale: string }>;

function asLocale(locale: string): Locale {
  return locale === "en" ? "en" : "nl";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/over`,
      languages: { nl: "/nl/over", en: "/en/over" },
    },
    openGraph: {
      type: "website",
      siteName: "Rolodink",
      url: `https://rolodink.app/${locale}/over`,
      title: t("title"),
      description: t("description"),
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Rolodink" }],
    },
  };
}

export default async function AboutPage({ params }: Readonly<{ params: Params }>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const articles = await getArticles(asLocale(locale));

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="container mx-auto max-w-4xl py-16 text-center md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-grey">
            {t("description")}
          </p>
        </section>

        <section className="container mx-auto max-w-3xl pb-16 md:pb-24">
          <ArticleList articles={articles} locale={locale} />
        </section>

        <ArticleCta locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
