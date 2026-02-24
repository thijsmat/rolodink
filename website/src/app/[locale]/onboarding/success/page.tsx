"use client";

import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MousePointerClick, UserPlus, StickyNote, Search, Lock } from "lucide-react";
import Link from "next/link";

const steps = [
    {
        icon: MousePointerClick,
        color: "text-gold",
        bg: "bg-gold/10",
        number: "1",
        title: "Open een LinkedIn profiel",
        description: (
            <>
                Ga naar een LinkedIn profiel, bijvoorbeeld dat van de maker van Rolodink:{" "}
                <a
                    href="https://www.linkedin.com/in/matthijsgoes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-azure underline underline-offset-2 hover:text-azure/80 transition-colors"
                >
                    linkedin.com/in/matthijsgoes
                </a>
                . Rolodink verschijnt automatisch als zijbalk.
            </>
        ),
    },
    {
        icon: UserPlus,
        color: "text-azure",
        bg: "bg-azure/10",
        number: "2",
        title: "Voeg een connectie toe",
        description:
            'Klik op "Connectie toevoegen" in de Rolodink zijbalk. Vul in waar je iemand hebt ontmoet, bij welk bedrijf je was, en eventuele andere context.',
    },
    {
        icon: StickyNote,
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
        number: "3",
        title: "Schrijf een notitie",
        description:
            'Voeg een persoonlijke notitie toe, zoals: "Ontmoet op Tech Meetup Amsterdam. Interesse in AI en open-source. Opvolgen over samenwerking." Jouw notities zijn 100% privé.',
    },
    {
        icon: Lock,
        color: "text-purple-600",
        bg: "bg-purple-500/10",
        number: "4",
        title: "Stel je veilige kluis in (optioneel)",
        description:
            "Ga naar Instellingen → Beveiliging in de extensie en stel een wachtwoordzin in. Dit versleutelt al je notities zodat zelfs wij ze niet kunnen lezen.",
    },
    {
        icon: Search,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        number: "5",
        title: "Zoek en vind",
        description:
            'Gebruik de zoekfunctie in de extensie (klik op het lijstje-icoon) om al je connecties door te zoeken. Zo vind je direct terug wie je wanneer hebt ontmoet.',
    },
];

const tips = [
    { emoji: "🧩", text: "Zie je Rolodink niet? Klik op het puzzelstukje in je werkbalk en pin de extensie." },
    { emoji: "🔄", text: "Ververs de LinkedIn pagina na installatie als de zijbalk niet verschijnt." },
    { emoji: "📱", text: "Rolodink werkt op elk LinkedIn profiel — ook bij zoekopdrachten en netwerk-overzichten." },
];

export default function OnboardingSuccessPage() {
    return (
        <>
            <main className="flex-1 pt-16">
                {/* Hero */}
                <section className="container max-w-3xl mx-auto py-16 text-center">
                    <div className="flex justify-center mb-8">
                        <div className="rounded-full bg-green-100 p-5 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-14 h-14 text-green-600" />
                        </div>
                    </div>
                    <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
                        Je account is bevestigd! 🎉
                    </h1>
                    <p className="text-xl text-grey max-w-2xl mx-auto">
                        Welkom bij Rolodink. Volg de stappen hieronder om in 5 minuten je eerste connectie toe te voegen.
                    </p>
                </section>

                {/* Steps */}
                <section className="container max-w-3xl mx-auto pb-12">
                    <div className="flex flex-col gap-6">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={i}
                                    className="flex gap-5 p-6 rounded-2xl border border-azure/10 bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className={`flex-shrink-0 flex items-start pt-1`}>
                                        <div className={`${step.bg} rounded-xl p-3`}>
                                            <Icon className={`w-6 h-6 ${step.color}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Stap {step.number}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-azure text-lg mb-1">{step.title}</h3>
                                        <p className="text-grey text-sm leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Tips */}
                <section className="container max-w-3xl mx-auto pb-12">
                    <div className="rounded-2xl border border-azure/10 bg-azure/3 p-6">
                        <h3 className="font-semibold text-azure text-base mb-4">💡 Handige tips</h3>
                        <ul className="flex flex-col gap-3">
                            {tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-grey">
                                    <span className="text-base leading-5">{tip.emoji}</span>
                                    <span>{tip.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* CTA */}
                <section className="container max-w-3xl mx-auto pb-24 text-center">
                    <p className="text-grey mb-6 text-sm">
                        Vragen? Bekijk onze{" "}
                        <Link href="/nl/help" className="text-azure underline underline-offset-2 hover:text-azure/80">
                            Help pagina
                        </Link>{" "}
                        of neem contact op.
                    </p>
                    <Button asChild size="lg" className="bg-azure hover:bg-azure/90 text-white shadow-lg">
                        <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer">
                            Ga naar LinkedIn →
                        </a>
                    </Button>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
