export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-white to-background/50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B2951' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex items-center min-h-screen py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/10 w-fit">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                <span className="text-sm font-medium text-gold">Gratis Chrome extensie</span>
              </div>

              {/* Headline */}
              <h1 className="font-playfair font-bold text-5xl md:text-6xl lg:text-7xl leading-tight text-azure">
                Van de achterkant van een{' '}
                <span className="relative">
                  visitekaartje
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gold/20 -rotate-1 rounded"></div>
                </span>{' '}
                naar de toekomst van netwerken
              </h1>

              {/* Description */}
              <p className="text-xl md:text-2xl text-grey leading-relaxed max-w-2xl">
                Rolodink brengt de persoonlijke touch van business cards naar LinkedIn. 
                Voeg moeiteloos persoonlijke notities toe aan elk contact en onthoud waarom jullie connectie waardevol is.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <button className="group relative bg-azure hover:bg-azure/90 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                    <path d="M10.8333 18.3333L13.3333 11.6667H20L13.3333 8.33333L10.8333 1.66667L8.33333 8.33333L1.66667 11.6667L8.33333 15L10.8333 18.3333Z" fill="currentColor"/>
                  </svg>
                  Add to Chrome - Gratis
                </button>
                <button className="group border-2 border-gold bg-transparent hover:bg-gold/5 text-gold font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="group-hover:scale-110 transition-transform duration-300">
                    <path d="M4.16667 4.16667C4.16667 3.24583 4.9375 2.5 5.83333 2.5H16.6667C17.5625 2.5 18.3333 3.24583 18.3333 4.16667V15.8333C18.3333 16.7542 17.5625 17.5 16.6667 17.5H5.83333C4.9375 17.5 4.16667 16.7542 4.16667 15.8333V4.16667Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M7.5 7.5L12.5 12.5L7.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Bekijk demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-start gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-3 border-background bg-gradient-to-br from-gold to-gold/80 shadow-md"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-grey">500+ gebruikers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-gold text-lg">
                    ★★★★★
                  </div>
                  <span className="text-sm font-medium text-grey">4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Main Card */}
                <div className="relative transform hover:scale-105 transition-transform duration-500">
                  {/* Card Shadow */}
                  <div className="absolute inset-0 bg-azure/20 rounded-3xl blur-xl"></div>
                  
                  {/* Card Content */}
                  <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-azure/10">
                    {/* Card Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-linkBlue to-linkBlue/80 flex items-center justify-center text-white font-bold text-lg">
                        JD
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-azure">Jan de Vries</h3>
                        <p className="text-sm text-grey">Product Manager @ TechCorp</p>
                      </div>
                    </div>

                    {/* Card Image */}
                    <div className="relative mb-6">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/e7ffcbf098ffe35ae50afc7e64c526af17538e04?width=896"
                        alt="Networking Event"
                        className="w-full h-48 object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-azure/20 to-transparent rounded-2xl"></div>
                    </div>

                    {/* Note Card */}
                    <div className="bg-background border border-gold/20 rounded-2xl p-4 relative">
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-gold rounded-full"></div>
                      <p className="text-sm text-grey italic leading-relaxed">
                        "Ontmoet op Networking Event Amsterdam. Geïnteresseerd in AI voor recruitment. Stuur artikel over ChatGPT."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-linkBlue/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}