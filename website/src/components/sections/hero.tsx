import { Button } from "@/components/ui/button";
import { Chrome, Play, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-20 sm:pt-24 pb-12 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1136px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          <div className="flex-1 max-w-[536px] flex flex-col gap-4 sm:gap-6 lg:gap-8 w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gold/20 bg-gold/10 self-start">
              <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gold">
                Gratis Chrome extensie
              </span>
            </div>

            <h1 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-[60px] leading-tight sm:leading-[1.2] lg:leading-[75px] text-azure">
              Van de achterkant van een visitekaartje naar de toekomst van
              netwerken
            </h1>

            <p className="text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-[1.6] lg:leading-[32.5px] text-grey">
              Rolodink brengt de persoonlijke touch van business cards naar
              LinkedIn. Voeg moeiteloos persoonlijke notities toe aan elk
              contact en onthoud waarom jullie connectie waardevol is.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button className="h-10 px-3 sm:px-4 rounded-lg bg-azure text-white text-xs sm:text-sm font-medium shadow-lg hover:bg-azure/90 transition-colors flex items-center justify-center gap-2">
                <Chrome className="h-4 w-4" />
                Add to Chrome - Gratis
              </Button>
              <Button className="h-10 px-3 sm:px-4 rounded-lg border-2 border-gold bg-background text-gold text-xs sm:text-sm font-medium hover:bg-gold/5 transition-colors flex items-center justify-center gap-2">
                <Play className="h-4 w-4" />
                Bekijk demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pt-2 sm:pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 border-background bg-gold flex-shrink-0"
                    ></div>
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-grey">
                  500+ gebruikers
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 text-gold fill-current" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-grey ml-1">4.9/5</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-[536px] flex items-center justify-center w-full lg:w-auto">
            <div className="relative w-full">
              <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-8 flex flex-col gap-4 sm:gap-6 relative rotate-1 sm:rotate-2">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/5 to-gold/0"></div>
                <img
                  src="/images/business-card-networking.jpg"
                  alt="Business Card Networking"
                  className="w-full h-40 sm:h-48 lg:h-64 object-cover rounded-lg sm:rounded-2xl relative z-10"
                />
                <div className="flex items-start gap-2 sm:gap-3 relative z-10">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-linkBlue flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-azure text-sm sm:text-base truncate">
                      Jan de Vries
                    </h3>
                    <p className="text-xs sm:text-sm text-grey truncate">
                      Product Manager @ TechCorp
                    </p>
                  </div>
                </div>
                <div className="bg-background border border-gold/20 rounded-lg sm:rounded-xl p-3 sm:p-4 relative z-10">
                  <p className="text-xs sm:text-sm text-grey italic leading-relaxed">
                    "Ontmoet op Networking Event Amsterdam. Geïnteresseerd in AI
                    voor recruitment. Stuur artikel over ChatGPT."
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-linkBlue/10 blur-2xl"></div>
              <div className="absolute -top-2 -right-4 w-24 h-24 rounded-full bg-gold/10 blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
