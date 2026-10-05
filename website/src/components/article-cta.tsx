import { getTranslations } from "next-intl/server";
import { StoreCtaBand } from "@/components/store-cta-band";

/** Afsluitende band onder de Over-pagina's, zelfde opzet als de CTA op /help. */
export async function ArticleCta({ locale }: Readonly<{ locale: string }>) {
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  return (
    <StoreCtaBand
      title={t("cta.title")}
      description={t("cta.description")}
      button={t("cta.button")}
      placement="article"
    />
  );
}
