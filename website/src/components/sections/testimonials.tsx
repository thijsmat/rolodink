import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: "Sarah van Berg",
    role: "Senior Recruiter @ TalentHub",
    initials: "SvB",
    notes: [
      { type: "quote", text: '"Ontmoet op Networking Event Amsterdam"' },
      { type: "normal", text: "Geïnteresseerd in AI voor recruitment" },
      { type: "action", text: "→ Stuur artikel over ChatGPT" },
    ],
  },
  {
    name: "Michael Peters",
    role: "CTO @ StartupX",
    initials: "MP",
    notes: [
      { type: "quote", text: '"Kennismaking via LinkedIn"' },
      { type: "normal", text: "Zoekt naar tech talent voor nieuwe project" },
      { type: "action", text: "→ Follow-up over developer posities" },
    ],
  },
  {
    name: "Linda Jansen",
    role: "Marketing Director @ BrandCo",
    initials: "LJ",
    notes: [
      { type: "quote", text: '"Gesproken over content strategie"' },
      { type: "normal", text: "Plant een rebranding voor Q2" },
      { type: "action", text: "→ Deel case study volgende week" },
    ],
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-semibold text-azure mb-4">
            Zo gebruiken professionals Rolodink
          </h2>
          <p className="text-lg text-grey max-w-[672px] mx-auto">
            Ontdek hoe anderen hun netwerk versterken met persoonlijke notities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-white border-azure/10 rounded-2xl p-8 relative transition-all duration-300 ease-out hover:shadow-lg hover:border-azure/20 hover:-translate-y-1"
            >
              {/* Quote Mark Background */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-16 w-16 text-gold" />
              </div>

              <CardContent className="p-0 relative z-10">
                {/* Header with Avatar and Stars */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-linkBlue to-linkBlue/80 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-azure truncate">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-grey truncate">
                      {testimonial.role}
                    </p>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 text-gold fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes/Content */}
                <div className="space-y-3 text-grey">
                  {testimonial.notes.map((note, noteIndex) => (
                    <p
                      key={noteIndex}
                      className={
                        note.type === "quote"
                          ? "font-playfair text-lg text-azure italic"
                          : note.type === "action"
                            ? "text-sm text-linkBlue"
                            : "text-sm"
                      }
                    >
                      {note.text}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
