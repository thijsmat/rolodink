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
    <section id="testimonials" className="py-24 px-8">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
            Zo gebruiken professionals Rolodink
          </h2>
          <p className="text-xl text-grey max-w-[672px] mx-auto">
            Ontdek hoe anderen hun netwerk versterken met persoonlijke notities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white border border-azure/10 rounded-2xl p-8 relative"
            >
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
                      <span key={i} className="text-gold text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute top-6 right-6 opacity-10">
                <svg
                  width="73"
                  height="73"
                  viewBox="0 0 73 73"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M53.3333 3C51.5652 3 49.8695 3.70238 48.6193 4.95262C47.3691 6.20286 46.6667 7.89856 46.6667 9.66667V29.6667C46.6667 31.4348 47.3691 33.1305 48.6193 34.3807C49.8695 35.631 51.5652 36.3333 53.3333 36.3333C54.2174 36.3333 55.0652 36.6845 55.6904 37.3096C56.3155 37.9348 56.6667 38.7826 56.6667 39.6667V43C56.6667 44.7681 55.9643 46.4638 54.714 47.714C53.4638 48.9643 51.7681 49.6667 50 49.6667C49.116 49.6667 48.2681 50.0179 47.643 50.643C47.0179 51.2681 46.6667 52.1159 46.6667 53V59.6667C46.6667 60.5507 47.0179 61.3986 47.643 62.0237C48.2681 62.6488 49.116 63 50 63C55.3043 63 60.3914 60.8929 64.1421 57.1421C67.8929 53.3914 70 48.3043 70 43V9.66667C70 7.89856 69.2976 6.20286 68.0474 4.95262C66.7971 3.70238 65.1014 3 63.3333 3H53.3333Z"
                    stroke="#B8860B"
                    strokeWidth="6.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.6667 3C14.8986 3 13.2029 3.70238 11.9526 4.95262C10.7024 6.20286 10 7.89856 10 9.66667V29.6667C10 31.4348 10.7024 33.1305 11.9526 34.3807C13.2029 35.631 14.8986 36.3333 16.6667 36.3333C17.5507 36.3333 18.3986 36.6845 19.0237 37.3096C19.6488 37.9348 20 38.7826 20 39.6667V43C20 44.7681 19.2976 46.4638 18.0474 47.714C16.7971 48.9643 15.1014 49.6667 13.3333 49.6667C12.4493 49.6667 11.6014 50.0179 10.9763 50.643C10.3512 51.2681 10 52.1159 10 53V59.6667C10 60.5507 10.3512 61.3986 10.9763 62.0237C11.6014 62.6488 12.4493 63 13.3333 63C18.6377 63 23.7247 60.8929 27.4755 57.1421C31.2262 53.3914 33.3333 48.3043 33.3333 43V9.66667C33.3333 7.89856 32.631 6.20286 31.3807 4.95262C30.1305 3.70238 28.4348 3 26.6667 3H16.6667Z"
                    stroke="#B8860B"
                    strokeWidth="6.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="bg-background border border-gold/20 rounded-xl p-4 shadow-sm space-y-3 relative z-10">
                {testimonial.notes.map((note, noteIndex) => (
                  <div key={noteIndex} className="flex items-start gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${
                        note.type === "quote"
                          ? "bg-gold"
                          : note.type === "action"
                            ? "bg-azure"
                            : "bg-linkBlue"
                      }`}
                    ></div>
                    <p
                      className={`text-sm ${
                        note.type === "quote"
                          ? "text-grey italic"
                          : note.type === "action"
                            ? "text-azure font-medium"
                            : "text-grey"
                      }`}
                    >
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
