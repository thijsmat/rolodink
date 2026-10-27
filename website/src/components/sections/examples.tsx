import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useTranslations } from 'next-intl';

// Verzonnen situaties, gelijk aan de video's van LinkedIn-campagne 2
// (marketing/linkedin-campaign-2.md). Bewust zonder namen: dit zijn
// voorbeelden van een notitie, geen ervaringen van gebruikers.
const EXAMPLE_KEYS = ["event", "recruiter", "sales", "coffee"] as const;

// Een notitie heeft drie regels: waar je elkaar zag, een detail, en wat je
// nog moet doen.
const NOTE_STYLES = [
  { dot: "bg-gold", text: "text-grey italic" },
  { dot: "bg-link-blue", text: "text-grey" },
  { dot: "bg-azure", text: "text-azure font-medium" },
];

export default function Examples() {
  const t = useTranslations('Examples');

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
            <Card
              key={key}
              className="bg-white border border-azure/10 rounded-lg sm:rounded-2xl p-4 sm:p-8"
            >
              <CardHeader className="mb-4 sm:mb-6 p-0">
                <h3 className="font-semibold text-azure text-sm sm:text-base">
                  {t(`items.${key}.situation`)}
                </h3>
                <p className="text-xs sm:text-sm text-grey">
                  {t(`items.${key}.role`)}
                </p>
              </CardHeader>

              <CardContent className="p-0">
                <div className="bg-background border border-gold/20 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
                  {NOTE_STYLES.map((style, noteIndex) => (
                    <div key={noteIndex} className="flex items-start gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${style.dot}`}
                      ></div>
                      <p className={`text-xs sm:text-sm ${style.text}`}>
                        {t(`items.${key}.notes.${noteIndex}`)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-grey">
                  <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t('findWith')}{" "}
                    <span className="font-medium text-azure">&ldquo;{t(`items.${key}.query`)}&rdquo;</span>
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
