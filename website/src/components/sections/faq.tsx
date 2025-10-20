"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Hoe werkt Rolodink precies?",
    answer: "Rolodink is een Chrome extensie die naadloos integreert met LinkedIn incl. het LinkedIn logo. Je kunt persoonlijke notities toevoegen aan elk LinkedIn profiel dat je bezoekt. Deze notities worden veilig opgeslagen en zijn alleen voor jou zichtbaar. Wanneer je het profiel opnieuw bezoekt, zie je direct je eerdere notities en context."
  },
  {
    question: "Zijn mijn notities privé en veilig?",
    answer: "Absoluut! Privacy staat voorop bij Rolodink. Al je notities worden lokaal opgeslagen in je browser en zijn alleen voor jou toegankelijk. We slaan geen persoonlijke data op onze servers op, dus je hebt volledige controle over je informatie."
  },
  {
    question: "Kost Rolodink geld?",
    answer: "Rolodink is volledig gratis te gebruiken. Er zijn geen verborgen kosten, abonnementen of premium features. We geloven dat iedereen toegang moet hebben tot betere networking tools."
  },
  {
    question: "Werkt Rolodink op alle apparaten?",
    answer: "Rolodink is momenteel beschikbaar als Chrome extensie voor desktop en laptop computers. We werken aan uitbreiding naar andere browsers en mobiele versies in de toekomst."
  },
  {
    question: "Kan ik mijn notities exporteren?",
    answer: "Ja, je kunt al je notities exporteren in verschillende formaten (CSV, JSON) voor backup doeleinden of om ze te gebruiken in andere tools. Dit geeft je volledige controle over je data."
  },
  {
    question: "Wat als ik problemen ondervind?",
    answer: "Ons support team staat altijd klaar om te helpen. Je kunt contact opnemen via onze help pagina of direct een email sturen. We streven ernaar om binnen 24 uur te reageren op alle vragen."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-8 bg-gradient-to-b from-white to-background/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-gold"></div>
            <span className="text-sm font-medium text-gold">FAQ</span>
          </div>
          <h2 className="font-playfair font-bold text-5xl md:text-6xl text-azure mb-6 leading-tight">
            Veelgestelde vragen
          </h2>
          <p className="text-xl md:text-2xl text-grey leading-relaxed">
            Alles wat je moet weten over Rolodink
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-azure/10 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-background/50 transition-colors duration-200"
              >
                <h3 className="font-semibold text-xl text-azure pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transform transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#1B2951"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-8 pb-6">
                  <p className="text-grey leading-relaxed text-lg">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-grey mb-6 text-lg">
            Nog vragen? We helpen je graag verder!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/help"
              className="bg-azure hover:bg-azure/90 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Bekijk help center
            </a>
            <a
              href="mailto:support@rolodink.app"
              className="border-2 border-gold bg-transparent hover:bg-gold/5 text-gold font-semibold px-8 py-4 rounded-xl transition-all duration-300"
            >
              Contact opnemen
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}