import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Chrome, Play, Star, Users } from 'lucide-react'

export default function Hero() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-[1136px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="max-w-full lg:max-w-[536px] flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/10 self-start">
              <div className="w-2 h-2 rounded-full bg-gold"></div>
              <span className="text-sm text-gold">Gratis Chrome extensie</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-semibold text-azure leading-tight">
              Van de achterkant van een visitekaartje naar de toekomst van
              netwerken
            </h1>

            <p className="text-lg text-grey leading-relaxed">
              Rolodink brengt de persoonlijke touch van business cards naar
              LinkedIn. Voeg moeiteloos persoonlijke notities toe aan elk
              contact en onthoud waarom jullie connectie waardevol is.
            </p>

            <div className="flex items-center gap-3">
              <Button className="bg-azure hover:bg-azure/90 text-white">
                <Chrome className="h-4 w-4" />
                Add to Chrome - Gratis
              </Button>
              <Button variant="outline" className="border-gold text-gold hover:bg-gold/5">
                <Play className="h-4 w-4" />
                Bekijk demo
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background bg-gold"
                    ></div>
                  ))}
                </div>
                <span className="text-sm text-grey">500+ gebruikers</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 text-gold fill-current" />
                ))}
                <span className="text-sm text-grey ml-1">4.9/5</span>
              </div>
            </div>
          </div>

          <div className="max-w-full lg:max-w-[536px] flex items-center justify-center">
            <div className="relative">
              <div className="w-[512px] rotate-2 bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/5 to-gold/0"></div>
                <Image
                  src="/images/business-card-networking.jpg"
                  alt="Business Card Networking"
                  width={512}
                  height={256}
                  priority
                  className="w-full h-64 object-cover rounded-2xl relative z-10"
                />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-linkBlue flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-azure">Jan de Vries</h3>
                    <p className="text-sm text-grey">
                      Product Manager @ TechCorp
                    </p>
                  </div>
                </div>
                <div className="bg-background border border-gold/20 rounded-xl p-4 relative z-10">
                  <p className="text-sm text-grey italic">
                    "Ontmoet op Networking Event Amsterdam. Geïnteresseerd in
                    <br />
                    AI voor recruitment. Stuur artikel over ChatGPT."
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
