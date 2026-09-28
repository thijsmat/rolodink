import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';
import { ExplainerVideo } from "@/components/explainer-video";
import { Link } from "@/navigation";

// "Zo werkt het": de uitlegvideo in de taal van de pagina, met de drie stappen
// eronder als tekst (voor wie de video niet afspeelt, en voor zoekmachines).
export default function Explainer() {
  const t = useTranslations('Explainer');
  const locale = useLocale();
  const steps = t.raw('steps') as Array<{ title: string; description: string }>;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-5xl text-azure mb-3 sm:mb-4">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-grey text-balance max-w-[672px] mx-auto px-4 sm:px-0">
            {t('description')}
          </p>
        </div>

        {/* Op een laptop passen kop en video samen onder de header: de kolom wordt
            smaller naarmate het scherm lager is, maar niet smaller dan 40rem. */}
        <div className="mx-auto max-w-[min(100%,max(40rem,calc((100svh-22rem)*16/9)))]">
          <ExplainerVideo
            src={t('video.src')}
            poster={t('video.poster')}
            captions={{ src: t('video.captions'), lang: locale, label: t('video.captionsLabel') }}
            labels={{
              video: t('video.label'),
              play: t('video.play'),
              pause: t('video.pause'),
              soundOn: t('video.soundOn'),
              soundOff: t('video.soundOff'),
            }}
          />

          <ol className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="w-7 shrink-0 font-playfair font-semibold text-2xl leading-none text-gold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg text-azure mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-grey leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 sm:mt-10 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-link-blue hover:underline"
            >
              {t('more')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
