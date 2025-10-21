"use client"

import { useState } from "react";

const faqs = [
  {
    question: "Waarom Rolodink? Er zijn toch genoeg CRM-systemen?",
    answer:
      "Rolodink is specifiek ontworpen voor LinkedIn en focust op persoonlijke notities in plaats van complexe CRM-functies.",
  },
  {
    question: "Is Rolodink echt gratis?",
    answer: "Ja, Rolodink is volledig gratis te gebruiken als Chrome extensie.",
  },
  {
    question: "Hoe veilig zijn mijn notities?",
    answer:
      "Je notities worden veilig opgeslagen en zijn alleen voor jou zichtbaar. We hebben volledige privacy garanties.",
  },
  {
    question: "Werkt Rolodink ook op mobiel?",
    answer:
      "Momenteel is Rolodink beschikbaar als Chrome extensie. Een mobiele versie is in ontwikkeling.",
  },
  {
    question: "Kan ik mijn notities exporteren?",
    answer:
      "Ja, je kunt al je notities exporteren naar verschillende formaten voor backup en overdracht.",
  },
  {
    question: "Zien anderen mijn notities op LinkedIn?",
    answer:
      "Nee, je notities zijn volledig privé en alleen zichtbaar voor jou.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-8">
      <div className="max-w-[768px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
            Veelgestelde vragen
          </h2>
          <p className="text-xl text-grey">
            Alles wat je moet weten over Rolodink
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-azure/10 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-azure/5 transition-colors"
              >
                <span className="font-semibold text-sm text-azure pr-4">
                  {faq.question}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#525252"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-grey text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
