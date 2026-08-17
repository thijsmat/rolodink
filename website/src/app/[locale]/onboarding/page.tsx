"use client";

/**
 * Onboarding voor een net geïnstalleerde extensie.
 *
 * Stap 2 bood hier tot nu toe een volwaardig inlog- en registratieformulier
 * aan. Dat werkte — maar het logde de *website* in, niet de extensie, en dat is
 * precies waar de gebruiker op dat moment vandaan komt. De twee sessies staan
 * volledig los van elkaar: de website bewaart de hare in de opslag van
 * rolodink.app, de extensie schrijft de hare via haar eigen supabase-client
 * naar chrome.storage.local. Er is geen brug — het manifest heeft geen
 * externally_connectable en niets stuurt de tokens door.
 *
 * Het resultaat was de ergste soort fout: inloggen lukte, er kwam een groen
 * vinkje, en de extensie bleef uitgelogd zonder dat iets dat vertelde.
 *
 * Deze pagina wijst nu naar de popup, waar inloggen én registreren allebei
 * bestaan (LinkedIn-OAuth, e-mail inloggen, e-mail registreren — zie
 * LoginView.tsx). Er gaat dus geen enkele mogelijkheid verloren; alleen de
 * route die niet kon werken is weg.
 *
 * LinkedInSignInButton en EmailPasswordForm blijven bestaan: auth-layout.tsx
 * gebruikt ze voor de gewone website-login, waar ze wél op hun plek zijn.
 */
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin, UserPlus, Lock, Puzzle } from "lucide-react";
import NextImage from "next/image";
import { useTranslations } from 'next-intl';
// Uit @/navigation, niet next/link: die variant zet de locale-prefix ervoor.
// Zonder prefix komt het pad niet langs de next-intl middleware en geeft het
// een 404 - dezelfde val die in de verwijderde successPath werd toegelicht.
import { Link } from "@/navigation";

export default function OnboardingPage() {
    const t = useTranslations('OnboardingPage');

    return (
        <>
            <main className="flex-1 pt-16">
                {/* Hero Section */}
                <section className="container mx-auto max-w-4xl py-16 text-center md:py-24 lg:py-32">
                    <Badge className="mb-4 bg-azure/10 text-azure hover:bg-azure/20 border-azure/20">
                        {t('title')}
                    </Badge>
                    <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
                        {t('intro')}
                    </h1>
                </section>

                {/* Steps Section */}
                <section className="container mx-auto max-w-6xl pb-16 md:pb-24 lg:pb-32">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

                        {/* Step 1: Pin Extension */}
                        <Card className="relative flex flex-col text-center border-azure/10 overflow-hidden h-full">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                            <CardHeader>
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                                    <Pin className="h-8 w-8" />
                                </div>
                                <CardTitle className="font-playfair text-2xl text-azure">
                                    {t('steps.pin.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col items-center justify-between">
                                <p className="mb-8 text-grey max-w-md mx-auto">
                                    {t('steps.pin.description')}
                                </p>
                                {/* Visual Aid */}
                                <div className="w-full aspect-video relative bg-white/50 rounded-lg overflow-hidden border border-azure/10 mb-4">
                                    <NextImage
                                        src="/images/pin-extension-instruction.png"
                                        alt="Instruction on how to pin the Rolodink extension"
                                        className="object-contain"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                                        priority
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 2: Sign in, from the extension */}
                        <Card className="relative flex flex-col text-center border-azure/10 overflow-hidden h-full">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-azure/50 to-transparent" />
                            <CardHeader>
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-azure/10 text-azure">
                                    <UserPlus className="h-8 w-8" />
                                </div>
                                <CardTitle className="font-playfair text-2xl text-azure">
                                    {t('steps.login.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col items-center">
                                <p className="mb-8 text-grey max-w-md mx-auto">
                                    {t('steps.login.description')}
                                </p>

                                <div className="w-full max-w-sm space-y-4 text-left">
                                    <ol className="space-y-3">
                                        <li className="flex gap-3 items-start">
                                            <span className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-azure/10 text-azure text-xs font-bold">
                                                1
                                            </span>
                                            <span className="text-sm text-grey leading-relaxed">
                                                {t('steps.login.instructions.open')}
                                            </span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <span className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-azure/10 text-azure text-xs font-bold">
                                                2
                                            </span>
                                            <span className="text-sm text-grey leading-relaxed">
                                                {t('steps.login.instructions.choose')}
                                            </span>
                                        </li>
                                    </ol>

                                    {/* Waarom hier geen inlogformulier staat. Zonder deze regel
                                        leest het weghalen ervan als iets dat vergeten is, en
                                        gaat iemand op de website inloggen in de veronderstelling
                                        dat de extensie dan meedoet. */}
                                    <p className="flex gap-2 items-start rounded-lg border border-azure/10 bg-azure/5 p-3 text-xs text-grey leading-relaxed">
                                        <Puzzle className="h-4 w-4 flex-shrink-0 mt-0.5 text-azure" aria-hidden="true" />
                                        <span>{t('steps.login.instructions.note')}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 3: Secure Vault */}
                        <Card className="relative flex flex-col text-center border-azure/10 overflow-hidden h-full">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                            <CardHeader>
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                                    <Lock className="h-8 w-8" />
                                </div>
                                <CardTitle className="font-playfair text-2xl text-azure">
                                    {t('steps.vault.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col items-center justify-start">
                                <p className="mb-8 text-grey max-w-md mx-auto">
                                    {t('steps.vault.description')}
                                </p>
                            </CardContent>
                        </Card>

                    </div>

                    {/* De enige link naar /onboarding/success die er nog is.
                        Die pagina werd tot nu toe bereikt als redirect ná het
                        inlogformulier hierboven; met dat formulier weg zou hij
                        nergens meer vandaan te bereiken zijn, terwijl er de
                        uitleg staat van wat je op LinkedIn kunt doen. */}
                    <div className="mt-12 text-center">
                        <Button asChild size="lg" variant="outline">
                            <Link href="/onboarding/success">
                                {t('cta.next')}
                            </Link>
                        </Button>
                    </div>
                </section>
            </main >
            <SiteFooter />
        </>
    );
}
