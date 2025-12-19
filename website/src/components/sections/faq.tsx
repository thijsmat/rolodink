"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from 'next-intl';

const faqKeys = [
  'why',
  'free',
  'security',
  'mobile',
  'export',
  'visibility',
  'legal',
  'support'
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations('FAQ');

  const faqs = faqKeys.map(key => ({
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`)
  }));

  return (
    <section id="faq" className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[768px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-playfair font-semibold text-3xl sm:text-4xl lg:text-5xl text-azure mb-3 sm:mb-4">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-grey">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-azure/10 rounded-lg sm:rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-azure/5 transition-colors gap-3"
              >
                <span className="font-semibold text-xs sm:text-sm text-azure">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 transition-transform text-neutral-500 ${openIndex === index ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-azure/10">
                  <p className="text-grey text-xs sm:text-sm leading-relaxed pt-4">
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
