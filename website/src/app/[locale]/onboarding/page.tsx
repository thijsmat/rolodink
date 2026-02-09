"use client";

import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin, UserPlus } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from "@/navigation";
import Image from 'next/image';

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
                <section className="container mx-auto max-w-5xl pb-16 md:pb-24 lg:pb-32">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

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
                                    <Image
                                        src="/images/pin-extension-instruction.png"
                                        alt="Instruction on how to pin the Rolodink extension"
                                        className="object-contain"
                                        fill
                                        priority
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 2: Create Account */}
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
                            <CardContent className="flex flex-1 flex-col items-center justify-between">
                                <p className="mb-8 text-grey max-w-md mx-auto">
                                    {t('steps.login.description')}
                                </p>
                                <div className="flex flex-col gap-4 w-full max-w-xs">
                                    <Button asChild size="lg" className="w-full">
                                        <Link href="/signup?next=/onboarding/success">
                                            {t('cta.signup')}
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild size="sm" className="w-full text-grey hover:text-azure">
                                        <Link href="/login?next=/onboarding/success">
                                            {t('cta.login')}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
