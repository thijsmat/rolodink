import { Users, TrendingUp, Building2, GraduationCap, Heart, ArrowLeftRight, Megaphone, Scale } from 'lucide-react';

const useCases = [
  {
    icon: Users,
    title: "Recruiters",
    description: "Track candidate details and follow-ups",
  },
  {
    icon: TrendingUp,
    title: "Sales professionals",
    description: "Remember client preferences and conversations",
  },
  {
    icon: Building2,
    title: "Business developers",
    description: "Manage partnerships and opportunities",
  },
  {
    icon: GraduationCap,
    title: "Consultants",
    description: "Keep context on all your client contacts",
  },
  {
    icon: Heart,
    title: "HR professionals",
    description: "Organize talent pipeline and connections",
  },
  {
    icon: ArrowLeftRight,
    title: "Tech founders",
    description: "Build meaningful investor relationships",
  },
  {
    icon: Megaphone,
    title: "Marketers",
    description: "Track industry contacts and collaborations",
  },
  {
    icon: Scale,
    title: "Lawyers",
    description: "Maintain client and colleague notes",
  },
];

export default function UseCases() {
  return (
    <section className="py-24 px-8 bg-gradient-to-b from-transparent to-[rgba(245,245,245,0.3)]">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
            Voor elke professional die relaties waardeert
          </h2>
          <p className="text-xl text-grey max-w-[672px] mx-auto">
            Rolodink helpt professionals in verschillende sectoren om hun netwerk effectiever te beheren.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div key={index} className="bg-white border border-azure/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-semibold text-azure mb-2">{useCase.title}</h3>
                <p className="text-sm text-grey">{useCase.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
