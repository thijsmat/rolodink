"use client";

import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

export default function ChangelogPage() {
    const t = useTranslations('ChangelogPage');

    return (
        <>
            <main className="flex flex-1 flex-col pt-16">
                <section className="container py-16 md:py-24 lg:py-32">
                    <div className="mx-auto max-w-3xl">
                        <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-grey mb-16">
                            {t('description')}
                        </p>

                        <div className="space-y-16">
                            {/* @ts-ignore - nested translation objects */}
                            {t.raw('releases').map((release: any, index: number) => (
                                <div key={release.version} className="relative pl-8 border-l border-azure/20">
                                    <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ${index === 0 ? 'bg-azure' : index === 1 ? 'bg-azure/80' : 'bg-azure/40'}`} />
                                    <div className="flex items-center gap-4 mb-4">
                                        <h2 className={`text-2xl font-bold ${index === 0 ? 'text-azure' : 'text-azure/80'}`}>v{release.version}</h2>
                                        <Badge variant={index === 0 ? "secondary" : "outline"} className={index === 0 ? "bg-azure/10 text-azure hover:bg-azure/20" : "text-grey border-grey/20"}>
                                            {release.date}
                                        </Badge>
                                    </div>

                                    <div className="space-y-6 text-grey">
                                        {release.sections.map((section: any, sectionIndex: number) => (
                                            <div key={sectionIndex}>
                                                <h3 className={`font-semibold ${index === 0 ? 'text-azure' : 'text-azure/80'} mb-2`}>{section.title}</h3>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {section.items.map((item: string, itemIndex: number) => (
                                                        <li key={itemIndex}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
