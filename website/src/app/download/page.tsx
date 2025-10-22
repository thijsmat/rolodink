import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { pageSEO } from "@/lib/seo";
import { Chrome } from "lucide-react";

export const metadata = {
  // Assuming seo config exists for download page
  title: pageSEO?.download?.title || "Download Rolodink",
  description: pageSEO?.download?.description || "Installeer de gratis Rolodink Chrome Extensie en begin met het organiseren van je LinkedIn netwerk.",
};

export default function DownloadPage() {
  const extensionUrl = process.env.NEXT_PUBLIC_EXTENSION_URL || "#";

  return (
    <>
      <main className="flex flex-1 items-center justify-center pt-16">
        <section className="container py-16 text-center md:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
              Begin Vandaag Nog
            </h1>
            <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
              Installeer de gratis Chrome Extensie en transformeer hoe je je
              LinkedIn netwerk beheert. Breng de persoonlijke touch van
              visitekaartjes terug naar je digitale netwerk.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className="h-14 px-8 text-lg">
                <a href={extensionUrl} target="_blank" rel="noreferrer">
                  <Chrome className="mr-2 h-5 w-5" />
                  Add to Chrome - Gratis
                </a>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Geen creditcard vereist • 30 seconden installatie
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}