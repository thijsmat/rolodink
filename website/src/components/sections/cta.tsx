export default function CTA() {
  return (
    <section className="relative py-24 px-8 bg-gradient-to-br from-azure via-azure/90 to-azure/80 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm font-medium text-white">Klaar om te beginnen?</span>
          </div>

          {/* Headline */}
          <h2 className="font-playfair font-bold text-5xl md:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            Start vandaag nog met{' '}
            <span className="relative">
              betere networking
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gold/30 -rotate-1 rounded"></div>
            </span>
          </h2>

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-12">
            Voeg Rolodink toe aan Chrome en transformeer je LinkedIn ervaring. 
            Bouw betekenisvolle professionele relaties met persoonlijke notities en context.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <a
              href="https://chrome.google.com/webstore/detail/rolodink"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white hover:bg-gold text-azure font-bold px-10 py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center gap-4 text-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                <path d="M2 17L12 22L22 17" fill="currentColor"/>
                <path d="M2 12L12 17L22 12" fill="currentColor"/>
              </svg>
              Add to Chrome - Gratis
            </a>
            <a
              href="/how-it-works"
              className="group border-2 border-white bg-transparent hover:bg-white/10 text-white font-semibold px-10 py-5 rounded-xl transition-all duration-300 flex items-center gap-4 text-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform duration-300">
                <path d="M14.828 14.828L21 21M21 21L16.5 21M21 21V16.5M21 21V21M21 21H16.5M21 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3H21M3 3V21M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bekijk hoe het werkt
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-3 border-white bg-gradient-to-br from-gold to-gold/80 shadow-md"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">500+ actieve gebruikers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-gold text-lg">
                ★★★★★
              </div>
              <span className="text-sm font-medium">4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L10.472 5.528L16 8L10.472 10.472L8 16L5.528 10.472L0 8L5.528 5.528L8 0Z" fill="currentColor"/>
              </svg>
              <span className="text-sm font-medium">100% gratis</span>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/>
                </svg>
                <span>Privacy-first design</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/>
                </svg>
                <span>Geen account vereist</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/>
                </svg>
                <span>Direct te gebruiken</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}