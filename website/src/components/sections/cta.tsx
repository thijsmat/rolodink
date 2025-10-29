import { Button } from "@/components/ui/button";
import { Chrome, ArrowRight, Check } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-azure to-azure/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-gold/10 blur-2xl sm:blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-linkBlue/10 blur-2xl sm:blur-3xl"></div>

      <div className="max-w-[896px] mx-auto relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-5xl text-white mb-3 sm:mb-4">
            Klaar om je netwerk te versterken?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-[672px] mx-auto px-4 sm:px-0">
            Voeg vandaag nog Rolodink toe aan Chrome en begin met het opbouwen
            van betekenisvolle, persoonlijke professionele relaties.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button className="h-10 px-3 sm:px-4 rounded-lg bg-white text-azure text-xs sm:text-sm font-medium shadow-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
            <Chrome className="h-4 w-4" />
            Add to Chrome - Gratis
          </Button>
          <Button className="h-10 px-3 sm:px-4 rounded-lg border-2 border-white/30 text-white text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            Bekijk demo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-white/70 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-gold" />
            <span>Gratis te gebruiken</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-gold" />
            <span>Privacy gegarandeerd</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-gold" />
            <span>Installatie in 30 seconden</span>
          </div>
        </div>
      </div>
    </section>
  );
}
