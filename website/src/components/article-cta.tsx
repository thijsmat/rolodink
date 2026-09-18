import { Button } from "@/components/ui/button";
import { getExtensionUrl } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

/** Afsluitende band onder de Over-pagina's, zelfde opzet als de CTA op /help. */
export async function ArticleCta({ locale }: Readonly<{ locale: string }>) {
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const extensionUrl = getExtensionUrl();

  return (
    <section className="bg-azure/5">
      <div className="container mx-auto max-w-4xl py-16 text-center md:py-24">
        <h2 className="font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl">
          {t("cta.title")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-grey">{t("cta.description")}</p>
        <div className="mt-8">
          <Button asChild size="lg">
            <a href={extensionUrl} target="_blank" rel="noreferrer">
              {t("cta.button")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
