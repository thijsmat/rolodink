import Image from "next/image";
import { Link } from "@/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Article } from "@/lib/cms";

interface ArticleListProps {
  readonly articles: Article[];
  readonly locale: string;
}

/**
 * Redactionele lijst in één kolom: meta-regel in goud, Playfair-titel, excerpt en op
 * grotere schermen een thumbnail. Het hele item is één link.
 */
export async function ArticleList({ articles, locale }: ArticleListProps) {
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const format = await getFormatter({ locale });

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-azure/20 px-6 py-12 text-center">
        <p className="text-base text-grey">{t("empty")}</p>
        <a
          href="https://www.linkedin.com/company/rolodink/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-azure underline-offset-4 hover:underline"
        >
          {t("emptyLink")}
        </a>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-azure/10 border-t border-azure/10">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={`/over/${article.slug}`}
            className="group grid gap-6 py-10 md:grid-cols-[1fr_200px] md:items-start"
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                <time dateTime={article.date.toISOString().slice(0, 10)}>
                  {format.dateTime(article.date, { dateStyle: "long", timeZone: "UTC" })}
                </time>
                <span aria-hidden="true"> · </span>
                {t("readingTime", { minutes: article.readingMinutes })}
              </p>
              <h2 className="font-playfair text-2xl font-semibold text-azure transition-colors duration-200 ease-out group-hover:text-azure/80 sm:text-3xl">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-base leading-relaxed text-grey">{article.excerpt}</p>
              )}
              <span className="mt-1 text-sm font-medium text-azure">
                {t("readMore")} <span aria-hidden="true">→</span>
              </span>
            </div>
            {article.image && (
              <div className="relative hidden aspect-video overflow-hidden rounded-xl border border-azure/10 bg-azure/5 md:block">
                <Image
                  src={article.image.url}
                  alt={article.image.alt}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
