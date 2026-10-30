import { NoteCard } from "@/components/note-card";
import { Link } from "@/navigation";
import { useTranslations } from 'next-intl';

// Verzonnen situaties, gelijk aan de video's van LinkedIn-campagne 2
// (marketing/linkedin-campaign-2.md). Bewust zonder namen: dit zijn
// voorbeelden van een notitie, geen ervaringen van gebruikers.
const EXAMPLE_KEYS = ["event", "recruiter", "sales", "coffee"] as const;

// De landingspagina's die bij deze voorbeelden horen (zie lib/landing.ts).
const MORE_PAGES = [
  { key: "recruiters", href: "/use-cases/recruiters" },
  { key: "sales", href: "/use-cases/sales" },
  { key: "events", href: "/use-cases/networking-events" },
] as const;

export default function Examples() {
  const t = useTranslations('Examples');
  const landing = useTranslations('Landing.common');

  return (
    <section
      id="examples"
      className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-5xl text-azure mb-3 sm:mb-4">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-grey max-w-[672px] mx-auto px-4 sm:px-0">
            {t('subtitle')}
          </p>
          <p className="mt-3 text-xs sm:text-sm uppercase tracking-wide text-grey/80">
            {t('label')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {EXAMPLE_KEYS.map((key) => (
            <NoteCard
              key={key}
              situation={t(`items.${key}.situation`)}
              role={t(`items.${key}.role`)}
              notes={t.raw(`items.${key}.notes`) as string[]}
              findWith={t('findWith')}
              query={t(`items.${key}.query`)}
            />
          ))}
        </div>

        <nav
          aria-label={landing('relatedTitle')}
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base"
        >
          <span className="text-grey">{landing('relatedTitle')}:</span>
          {MORE_PAGES.map(({ key, href }) => (
            <Link key={key} href={href} className="font-medium text-link-blue hover:underline">
              {landing(`related.${key}.title`)}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
