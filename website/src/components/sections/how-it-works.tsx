import { PenTool, Save, Link2 } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-8 bg-white">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
            Zie hoe het werkt
          </h2>
          <p className="text-xl text-grey max-w-[672px] mx-auto">
            Een klik op elk LinkedIn profiel om je persoonlijke notities toe te voegen en te beheren.
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: LinkedIn Profile Mockup */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm bg-white border border-azure/10 rounded-2xl shadow-xl overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-linkBlue to-blue-600 h-24"></div>

              {/* Profile Content */}
              <div className="p-6">
                {/* Avatar + Name */}
                <div className="flex items-start gap-4 -mt-12 mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-linkBlue to-linkBlue/80 border-4 border-white flex items-center justify-center text-white font-semibold text-lg">
                    SvB
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-semibold text-lg text-azure">Sarah van Berg</h3>
                    <p className="text-sm text-grey">Senior Recruiter @ TalentHub</p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-2 text-sm text-grey mb-6">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1Z" stroke="#525252" strokeWidth="1.2"/>
                  </svg>
                  <span>500+ connecties</span>
                  <span>•</span>
                  <span>Amsterdam, Nederland</span>
                </div>

                {/* Rolodink Notes Section */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-4 border border-gold/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center text-white text-xs font-semibold">
                        R
                      </div>
                      <h4 className="font-semibold text-sm text-azure">Rolodink Notities</h4>
                    </div>
                    <button className="text-xs px-3 py-1 rounded-lg bg-white text-azure font-medium hover:bg-azure/5 transition-colors flex items-center gap-1">
                      <PenTool size={14} />
                      Bewerk
                    </button>
                  </div>
                  <p className="text-sm text-grey mb-2">
                    Ontmoet op Networking Event Amsterdam. Geïnteresseerd in AI voor recruitment.
                  </p>
                  <p className="text-xs text-gold font-medium">
                    💡 Tip: Gebruik notities voor follow-ups, gespreksonderwerpen, of persoonlijke details
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                    Networking Event Amsterdam
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-linkBlue/10 text-linkBlue border border-linkBlue/20">
                    AI & Recruitment
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                    Follow-up gepland
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Benefits */}
          <div className="space-y-6">
            {[
              {
                icon: PenTool,
                title: "Eenvoudig bewerken",
                description: "Voeg notities toe met één klik"
              },
              {
                icon: Save,
                title: "Automatisch opslaan",
                description: "Je notities zijn altijd veilig"
              },
              {
                icon: Link2,
                title: "LinkedIn integratie",
                description: "Werkt naadloos in LinkedIn"
              }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-azure mb-1">{benefit.title}</h5>
                    <p className="text-sm text-grey">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
