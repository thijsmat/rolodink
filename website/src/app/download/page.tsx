import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { pageSEO } from "@/lib/seo";
import { getExtensionUrl } from "@/lib/utils";
import { Chrome } from "lucide-react";

export const metadata = {
  // Assuming seo config exists for download page
  title: pageSEO?.download?.title || "Download Rolodink",
  description: pageSEO?.download?.description || "Installeer de gratis Rolodink Chrome Extensie en begin met het organiseren van je LinkedIn netwerk.",
};

export default function DownloadPage() {
  const extensionUrl = getExtensionUrl();

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
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto">
              {/* Chrome - Primary */}
              <Button asChild size="lg" className="h-16 px-8 text-lg w-full">
                <a href={extensionUrl} target="_blank" rel="noreferrer">
                  <Chrome className="mr-2 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Chrome Web Store</span>
                    <span className="text-xs font-normal opacity-90">Versie 1.0.8 • Gratis</span>
                  </div>
                </a>
              </Button>

              {/* Edge - Secondary */}
              <Button asChild variant="outline" size="lg" className="h-16 px-8 text-lg w-full border-azure/20 hover:bg-azure/5">
                <a href="#" className="cursor-not-allowed opacity-70" title="Binnenkort beschikbaar">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-azure">Microsoft Edge</span>
                    <span className="text-xs font-normal text-grey">Binnenkort beschikbaar</span>
                  </div>
                </a>
              </Button>

              {/* Firefox - Secondary */}
              <Button asChild variant="outline" size="lg" className="h-16 px-8 text-lg w-full border-azure/20 hover:bg-azure/5">
                <a href="#" className="cursor-not-allowed opacity-70" title="Binnenkort beschikbaar">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-azure">Firefox Add-ons</span>
                    <span className="text-xs font-normal text-grey">Binnenkort beschikbaar</span>
                  </div>
                </a>
              </Button>

              {/* GitHub - Secondary */}
              <Button asChild variant="outline" size="lg" className="h-16 px-8 text-lg w-full border-azure/20 hover:bg-azure/5">
                <a href="https://github.com/thijsmat/rolodink/releases/latest" target="_blank" rel="noreferrer">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-azure">GitHub Release</span>
                    <span className="text-xs font-normal text-grey">Download .zip & source</span>
                  </div>
                </a>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Geen creditcard vereist • 30 seconden installatie
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}