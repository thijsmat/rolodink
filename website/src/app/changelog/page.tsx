import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Changelog - Rolodink",
    description: "Bekijk de laatste updates en verbeteringen aan Rolodink.",
};

export default function ChangelogPage() {
    return (
        <>
            <main className="flex flex-1 flex-col pt-16">
                <section className="container py-16 md:py-24 lg:py-32">
                    <div className="mx-auto max-w-3xl">
                        <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
                            Changelog
                        </h1>
                        <p className="text-lg text-grey mb-16">
                            Blijf op de hoogte van de laatste ontwikkelingen en updates.
                        </p>

                        <div className="space-y-16">
                            {/* v1.0.8 */}
                            <div className="relative pl-8 border-l border-azure/20">
                                <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-azure" />
                                <div className="flex items-center gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-azure">v1.0.8</h2>
                                    <Badge variant="secondary" className="bg-azure/10 text-azure hover:bg-azure/20">
                                        25 November 2025
                                    </Badge>
                                </div>

                                <div className="space-y-6 text-grey">
                                    <div>
                                        <h3 className="font-semibold text-azure mb-2">Cross-Browser Support</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Volledige ondersteuning voor Firefox (Manifest V2).</li>
                                            <li>Volledige ondersteuning voor Microsoft Edge.</li>
                                            <li>Uniform buildsysteem voor Chrome, Firefox en Edge.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-azure mb-2">Background Authentication</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Authenticatie verplaatst naar persistent background service worker.</li>
                                            <li>Opgelost: Authenticatie faalde als popup werd gesloten.</li>
                                            <li>Verbeterde sessiedetectie voor naadloze login.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-azure mb-2">Bug Fixes</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Opgelost: Infinite reload loop in bepaalde situaties.</li>
                                            <li>Verbeterde stabiliteit van het buildsysteem.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* v1.0.3 */}
                            <div className="relative pl-8 border-l border-azure/20">
                                <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-azure/40" />
                                <div className="flex items-center gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-azure/80">v1.0.3</h2>
                                    <Badge variant="outline" className="text-grey border-grey/20">
                                        29 Oktober 2025
                                    </Badge>
                                </div>

                                <div className="space-y-6 text-grey">
                                    <div>
                                        <h3 className="font-semibold text-azure/80 mb-2">Chrome Web Store Release</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Succesvolle publicatie in de Chrome Web Store.</li>
                                            <li>Geoptimaliseerde permissies (alleen strikt noodzakelijke).</li>
                                            <li>Verbeterde validatie tijdens het buildproces.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* v1.0.0 */}
                            <div className="relative pl-8 border-l border-azure/20">
                                <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-azure/20" />
                                <div className="flex items-center gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-azure/60">v1.0.0</h2>
                                    <Badge variant="outline" className="text-grey border-grey/20">
                                        September 2025
                                    </Badge>
                                </div>

                                <div className="space-y-6 text-grey">
                                    <div>
                                        <h3 className="font-semibold text-azure/60 mb-2">Initial Release</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Eerste publieke versie van Rolodink.</li>
                                            <li>Notities toevoegen aan LinkedIn profielen.</li>
                                            <li>End-to-end encryptie voor notities.</li>
                                            <li>Veilige data-opslag met Supabase.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
