const testimonials = [
  {
    name: "Sarah van der Berg",
    role: "Marketing Manager",
    company: "TechStart Amsterdam",
    content: "Rolodink heeft mijn networking game volledig veranderd. Ik onthoud nu perfect waar ik iedereen heb ontmoet en wat we hebben besproken. Mijn follow-ups zijn veel persoonlijker geworden!",
    rating: 5,
    avatar: "SV"
  },
  {
    name: "Michael Chen",
    role: "Sales Director",
    company: "Growth Solutions BV",
    content: "Als iemand die dagelijks tientallen nieuwe connecties maakt, was het onmogelijk om alles bij te houden. Rolodink maakt het super eenvoudig om persoonlijke notities toe te voegen aan elk LinkedIn contact.",
    rating: 5,
    avatar: "MC"
  },
  {
    name: "Emma Thompson",
    role: "Business Developer",
    company: "InnovateLab",
    content: "De privacy-first aanpak van Rolodink is precies wat ik zocht. Mijn notities blijven privé en ik heb volledige controle over mijn data. Perfect voor professioneel gebruik.",
    rating: 5,
    avatar: "ET"
  },
  {
    name: "David Rodriguez",
    role: "Entrepreneur",
    company: "StartupHub",
    content: "Rolodink helpt me om betekenisvolle relaties op te bouwen in plaats van alleen maar connecties te verzamelen. De context die ik kan toevoegen maakt elk gesprek waardevoller.",
    rating: 5,
    avatar: "DR"
  },
  {
    name: "Lisa van Dijk",
    role: "HR Consultant",
    company: "PeopleFirst",
    content: "Als recruiter is het cruciaal om de juiste mensen te onthouden. Rolodink helpt me om gedetailleerde notities bij te houden over kandidaten en hun achtergrond.",
    rating: 5,
    avatar: "LV"
  },
  {
    name: "Alex Johnson",
    role: "Account Manager",
    company: "Enterprise Solutions",
    content: "De eenvoud van Rolodink is geweldig. Met één klik voeg ik notities toe aan LinkedIn profielen. Het heeft mijn klantrelaties aanzienlijk verbeterd.",
    rating: 5,
    avatar: "AJ"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-8 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-gold"></div>
            <span className="text-sm font-medium text-gold">Testimonials</span>
          </div>
          <h2 className="font-playfair font-bold text-5xl md:text-6xl text-azure mb-6 leading-tight">
            Wat onze gebruikers zeggen
          </h2>
          <p className="text-xl md:text-2xl text-grey max-w-3xl mx-auto leading-relaxed">
            Ontdek hoe Rolodink professionals helpt om betere netwerkrelaties op te bouwen en contacten effectief te beheren.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group bg-background border border-azure/10 rounded-3xl p-8 flex flex-col gap-6 hover:shadow-xl hover:border-gold/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Rating */}
              <div className="flex text-gold text-lg">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-grey leading-relaxed text-lg italic">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-azure/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-azure to-azure/80 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-azure">{testimonial.name}</h4>
                  <p className="text-sm text-grey">
                    {testimonial.role} @ {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-background border border-azure/10 rounded-2xl px-8 py-6">
            <div className="flex text-gold text-2xl">
              ★★★★★
            </div>
            <div className="text-left">
              <div className="font-semibold text-azure">4.9/5 rating</div>
              <div className="text-sm text-grey">500+ tevreden gebruikers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}