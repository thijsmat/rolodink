"use client";

import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin, UserPlus } from "lucide-react";
import NextImage from "next/image";
import { useTranslations } from 'next-intl';
import { Link } from "@/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LinkedInSignInButton from "@/components/LinkedInSignInButton";
import { EmailPasswordForm } from "@/components/EmailPasswordForm";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
    const t = useTranslations('OnboardingPage');
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setIsLoading(false);
        };
        getSession();
    }, [supabase]);

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

                        {/* Step 2: Create Account / Auth */}
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

                                <div className="w-full max-w-sm space-y-6">
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-azure border-t-transparent" />
                                        </div>
                                    ) : session ? (
                                        <div className="space-y-4 py-4">
                                            <p className="text-sm text-azure font-medium">
                                                Welcome back! You are already signed in.
                                            </p>
                                            <Button asChild size="lg" className="w-full">
                                                <Link href="/onboarding/success">
                                                    Continue to next step
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Auth Mode Toggle */}
                                            <div className="flex p-1 bg-azure/5 rounded-lg mb-4">
                                                <button
                                                    onClick={() => setAuthMode('signup')}
                                                    className={cn(
                                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                        authMode === 'signup'
                                                            ? "bg-white text-azure shadow-sm border border-azure/10"
                                                            : "text-grey hover:text-azure"
                                                    )}
                                                >
                                                    {t('cta.toggleSignup')}
                                                </button>
                                                <button
                                                    onClick={() => setAuthMode('login')}
                                                    className={cn(
                                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                        authMode === 'login'
                                                            ? "bg-white text-azure shadow-sm border border-azure/10"
                                                            : "text-grey hover:text-azure"
                                                    )}
                                                >
                                                    {t('cta.toggleLogin')}
                                                </button>
                                            </div>

                                            <LinkedInSignInButton intent={authMode} next="/onboarding/success" />

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-gray-200" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase tracking-wide text-muted-foreground">
                                                    <span className="bg-white px-2">Or with email</span>
                                                </div>
                                            </div>

                                            <EmailPasswordForm mode={authMode} next="/onboarding/success" />
                                        </>
                                    )}
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
