import { Users, Brain, Heart, Shield, Zap, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: <Users className="h-6 w-6 text-azure" />,
    title: "Network management",
    description: "Organiseer al je LinkedIn connecties met persoonlijke notities en context. Nooit meer vergeten wie iemand is of waarom je contact hebt.",
    color: "azure",
  },
  {
    icon: <Brain className="h-6 w-6 text-gold" />,
    title: "Memory aids",
    description: "Onthoud belangrijke details over gesprekken, interesses en afspraken. Perfect voor het bijhouden van follow-ups en networking.",
    color: "gold",
  },
  {
    icon: <Heart className="h-6 w-6 text-linkBlue" />,
    title: "Human follow-up",
    description: "Maak elke interactie persoonlijk door relevante details bij de hand te hebben. Bouw sterkere, authentiekere professionele relaties op.",
    color: "linkBlue",
  },
  {
    icon: <Shield className="h-6 w-6 text-azure" />,
    title: "Privacy first",
    description: "Al je notities worden veilig opgeslagen en zijn alleen voor jou zichtbaar. Volledige controle over je eigen data.",
    color: "azure",
  },
  {
    icon: <Zap className="h-6 w-6 text-gold" />,
    title: "Instant access",
    description: "Voeg notities toe met één klik vanuit elk LinkedIn profiel. Snelle toegang tot al je contactinformatie wanneer je het nodig hebt.",
    color: "gold",
  },
  {
    icon: <Target className="h-6 w-6 text-linkBlue" />,
    title: "Focus on what matters",
    description: "Filter en zoek door je notities om snel te vinden wat belangrijk is. Slimme organisatie voor effectief netwerkbeheer.",
    color: "linkBlue",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-5xl text-azure mb-3 sm:mb-4">
            De kracht van persoonlijke notities
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-grey max-w-[672px] mx-auto px-4 sm:px-0">
            Alles wat je nodig hebt om je professionele netwerk effectief te beheren en betekenisvolle relaties op te bouwen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white border-azure/10 rounded-xl sm:rounded-2xl p-5 sm:p-8 flex flex-col gap-3 sm:gap-4 transition-all duration-300 ease-out hover:shadow-lg hover:border-azure/20 hover:-translate-y-1 cursor-default"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-2xl flex-shrink-0">
                {feature.icon}
              </div>
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base sm:text-lg lg:text-xl text-azure">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                <p className="text-xs sm:text-sm lg:text-base text-grey leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
