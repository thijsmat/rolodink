export default function Hero() {
  return (
    <section className="pt-24 pb-24 px-8">
      <div className="max-w-[1136px] mx-auto">
        <div className="flex items-center justify-center gap-16">
          <div className="flex-1 max-w-[536px] flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/10 self-start">
              <div className="w-2 h-2 rounded-full bg-gold"></div>
              <span className="text-sm text-gold">Gratis Chrome extensie</span>
            </div>

            <h1 className="font-playfair font-semibold text-[60px] leading-[75px] text-azure">
              Van de achterkant van een visitekaartje naar de toekomst van
              netwerken
            </h1>

            <p className="text-xl leading-[32.5px] text-grey">
              Rolodink brengt de persoonlijke touch van business cards naar
              LinkedIn. Voeg moeiteloos persoonlijke notities toe aan elk
              contact en onthoud waarom jullie connectie waardevol is.
            </p>

            <div className="flex items-center gap-4">
              <button className="h-10 px-4 rounded-lg bg-azure text-white text-sm font-medium shadow-lg hover:bg-azure/90 transition-colors flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.25333 14.6267L10.3067 9.33337"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.1133 5.33337H8"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.63333 4.04004L5.69333 9.33337"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.00001 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8.00004C14.6667 4.31814 11.6819 1.33337 8.00001 1.33337C4.31811 1.33337 1.33334 4.31814 1.33334 8.00004C1.33334 11.6819 4.31811 14.6667 8.00001 14.6667Z"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.00001 10.6667C9.47277 10.6667 10.6667 9.4728 10.6667 8.00004C10.6667 6.52728 9.47277 5.33337 8.00001 5.33337C6.52725 5.33337 5.33334 6.52728 5.33334 8.00004C5.33334 9.4728 6.52725 10.6667 8.00001 10.6667Z"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Add to Chrome - Gratis
              </button>
              <button className="h-10 px-4 rounded-lg border-2 border-gold bg-background text-gold text-sm font-medium hover:bg-gold/5 transition-colors flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33333 3.33336C3.33326 3.09876 3.39509 2.86829 3.51258 2.66522C3.63008 2.46216 3.79907 2.29369 4.0025 2.17683C4.20592 2.05996 4.43658 1.99885 4.67119 1.99964C4.90579 2.00044 5.13603 2.06312 5.33866 2.18136L13.3367 6.8467C13.5385 6.96382 13.7061 7.13186 13.8226 7.33403C13.9392 7.53621 14.0006 7.76543 14.0008 7.99879C14.001 8.23215 13.94 8.46148 13.8238 8.66385C13.7076 8.86623 13.5403 9.03456 13.3387 9.15203L5.33866 13.8187C5.13603 13.9369 4.90579 13.9996 4.67119 14.0004C4.43658 14.0012 4.20592 13.9401 4.0025 13.8232C3.79907 13.7064 3.63008 13.5379 3.51258 13.3348C3.39509 13.1318 3.33326 12.9013 3.33333 12.6667V3.33336Z"
                    stroke="#B8860B"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Bekijk demo
              </button>
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
                <span className="text-gold">★★★★★</span>
                <span className="text-sm text-grey ml-1">4.9/5</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-[536px] flex items-center justify-center">
            <div className="relative">
              <div className="w-[512px] rotate-2 bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/5 to-gold/0"></div>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e7ffcbf098ffe35ae50afc7e64c526af17538e04?width=896"
                  alt="Business Card Networking"
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
