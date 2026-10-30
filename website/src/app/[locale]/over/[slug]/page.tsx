import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCta } from "@/components/article-cta";
import { Prose } from "@/components/prose";
import { getArticle, isValidSlug, type Locale } from "@/lib/cms";
import { BASE_URL, localeAlternates, withBrand, type AppLocale } from "@/lib/seo";

type Params = Promise<{ locale: string; slug: string }>;

function asLocale(locale: string): Locale {
  return locale === "en" ? "en" : "nl";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, ...rest } = await params;
  const locale = rest.locale as AppLocale;
  if (!isValidSlug(slug)) return {};

  const article = await getArticle(slug, asLocale(locale));
  if (!article) return {};

  // An article without an English text is shown in Dutch under /en/about too. That page
  // repeats the Dutch one, so it canonicals to the Dutch URL and has no hreflang pair.
  const english = locale === "en" ? article : await getArticle(slug, "en");
  const available: AppLocale[] = english && !english.isFallback ? ["nl", "en"] : ["nl"];
  const href = { pathname: "/over/[slug]", params: { slug } } as const;
  const alternates = localeAlternates(locale, href, available);
  const canonicalUrl = `${BASE_URL}${alternates.canonical}`;

  const description = article.excerpt || article.title;
  const image = article.image
    ? { url: article.image.url, alt: article.image.alt || article.title }
    : { url: "/og-image.png", width: 1200, height: 630, alt: "Rolodink" };

  return {
    title: { absolute: withBrand(article.title) },
    description,
    alternates,
    openGraph: {
      type: "article",
      siteName: "Rolodink",
      url: canonicalUrl,
      title: article.title,
      description,
      publishedTime: article.date.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image.url],
    },
  };
}

export default async function ArticlePage({ params }: Readonly<{ params: Params }>) {
  const { locale, slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const article = await getArticle(slug, asLocale(locale));
  if (!article) notFound();

  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const format = await getFormatter({ locale });
  const dateLabel = format.dateTime(article.date, { dateStyle: "long", timeZone: "UTC" });

  return (
    <>
      <main className="flex-1 pt-16">
        <article className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/over"
              className="inline-flex items-center gap-1 text-sm text-grey transition-colors duration-200 ease-out hover:text-azure"
            >
              <span aria-hidden="true">←</span> {t("back")}
            </Link>

            <header className="mt-8" lang={article.isFallback ? "nl" : undefined}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                <time dateTime={article.date.toISOString().slice(0, 10)}>{dateLabel}</time>
                <span aria-hidden="true"> · </span>
                {t("readingTime", { minutes: article.readingMinutes })}
              </p>
              <h1 className="mt-4 font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl">
                {article.title}
              </h1>
              {article.intro && (
                <p className="mt-6 text-lg leading-8 text-grey sm:text-xl/7">{article.intro}</p>
              )}
            </header>

            {article.image && (
              <figure className="mt-10">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-azure/10 bg-azure/5">
                  <Image
                    src={article.image.url}
                    alt={article.image.alt}
                    fill
                    priority
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            )}

            {article.isFallback && (
              <p className="mt-10 border-l-4 border-gold bg-gold/10 px-4 py-3 text-sm text-azure">
                {t("onlyInDutch")}
              </p>
            )}

            <Prose html={article.body} lang={article.isFallback ? "nl" : undefined} className="mt-10" />

            <div className="mt-16 border-t border-azure/10 pt-8">
              <Link
                href="/over"
                className="inline-flex items-center gap-1 text-sm font-medium text-azure transition-colors duration-200 ease-out hover:text-azure/80"
              >
                <span aria-hidden="true">←</span> {t("backToAll")}
              </Link>
            </div>
          </div>
        </article>

        <ArticleCta locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
