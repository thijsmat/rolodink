"use client";

import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Puzzle } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function OnboardingSuccessPage() {
    const t = useTranslations('OnboardingSuccessPage');

    return (
        <>
            <main className="flex-1 pt-16 flex items-center justify-center min-h-[80vh]">
                <section className="container max-w-2xl text-center">
                    <div className="flex justify-center mb-8">
                        <div className="rounded-full bg-green-100 p-6 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                    </div>

                    <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-6">
                        {t('title')}
                    </h1>

                    <p className="text-xl text-grey mb-12 max-w-lg mx-auto">
                        {t('description')}
                    </p>

                    <Card className="max-w-md mx-auto relative overflow-hidden border-azure/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                        <CardContent className="pt-8 pb-8 flex flex-col items-center">
                            <Puzzle className="w-12 h-12 text-gold mb-4" />
                            <p className="font-medium text-azure mb-2">
                                {t('instruction.title')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('instruction.step')}
                            </p>
                            <div className="mt-6 p-4 bg-azure/5 rounded-lg border border-azure/10 text-sm text-azure/80">
                                💡 {t('instruction.tip')}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
