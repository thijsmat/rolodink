"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "granted");
        setIsVisible(false);
        // Dispatch event for Analytics component
        window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: "granted" }));
    };

    const handleDecline = () => {
        localStorage.setItem("cookie-consent", "denied");
        setIsVisible(false);
        // Dispatch event for Analytics component (optional, but good for completeness)
        window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: "denied" }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-azure/10 p-4 shadow-lg animate-slide-up">
            <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-grey text-center sm:text-left">
                    Wij gebruiken cookies om de site goed te laten werken en voor anonieme statistieken.
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={handleDecline}
                        variant="ghost"
                        className="text-grey hover:text-azure hover:bg-azure/5"
                        size="sm"
                    >
                        Weigeren
                    </Button>
                    <Button
                        onClick={handleAccept}
                        className="bg-azure hover:bg-azure/90 text-white whitespace-nowrap"
                        size="sm"
                    >
                        Accepteren
                    </Button>
                </div>
            </div>
        </div>
    );
}
