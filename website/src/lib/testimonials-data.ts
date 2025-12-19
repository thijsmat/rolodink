export type NoteType = 'quote' | 'normal' | 'action';

export interface TestimonialNote {
    type: NoteType;
    text: string;
}

export interface Testimonial {
    name: string;
    role: string;
    initials: string;
    notes: TestimonialNote[];
}

export const testimonials: Testimonial[] = [
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
    {
        name: "David de Vries",
        role: "Sales Manager @ CloudSolutions",
        initials: "DV",
        notes: [
            { type: "quote", text: '"Lead via webinar"' },
            { type: "normal", text: "Heeft interesse in enterprise plan" },
            { type: "action", text: "→ Plan demo in voor volgende week" },
        ],
    },
    {
        name: "Emma Bakker",
        role: "Freelance Designer",
        initials: "EB",
        notes: [
            { type: "quote", text: '"Oud-collega van DesignAgency"' },
            { type: "normal", text: "Beschikbaar voor nieuwe projecten vanaf mei" },
            { type: "action", text: "→ Introductie bij Marketing team" },
        ],
    },
    {
        name: "Tom Wouters",
        role: "Investment Banker",
        initials: "TW",
        notes: [
            { type: "quote", text: '"Ontmoet tijdens golf toernooi"' },
            { type: "normal", text: "Zoekt investeringsmogelijkheden in SaaS" },
            { type: "action", text: "→ Stuur pitch deck" },
        ],
    },
];

export function getNoteColorClass(type: NoteType): string {
    switch (type) {
        case "quote": return "bg-gold";
        case "action": return "bg-azure";
        default: return "bg-link-blue";
    }
}

export function getNoteTextClass(type: NoteType): string {
    switch (type) {
        case "quote": return "text-grey italic";
        case "action": return "text-azure font-medium";
        default: return "text-grey";
    }
}
