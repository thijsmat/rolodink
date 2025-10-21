import { Button } from '@/components/ui/button'
import { Chrome, Play, Check } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-br from-azure to-azure/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-linkBlue/10 blur-3xl"></div>

      <div className="max-w-[896px] mx-auto relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-playfair font-semibold text-white mb-4">
            Klaar om je netwerk te versterken?
          </h2>
          <p className="text-lg text-white/80 max-w-[672px] mx-auto">
            Voeg vandaag nog Rolodink toe aan Chrome en begin met het opbouwen
            van betekenisvolle, persoonlijke professionele relaties.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Button className="bg-white text-azure hover:bg-white/90">
            <Chrome className="h-4 w-4" />
            Add to Chrome - Gratis
          </Button>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
            Bekijk demo
            <Play className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-gold" />
            <span>Gratis te gebruiken</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-gold" />
            <span>Privacy gegarandeerd</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-gold" />
            <span>Installatie in 30 seconden</span>
          </div>
        </div>
      </div>
    </section>
  );
}
