"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA_MEASUREMENT_ID = "G-E0PMCJB2C4";

export function Analytics() {
    const [consentGranted, setConsentGranted] = useState(false);

    useEffect(() => {
        // Check initial consent
        const consent = localStorage.getItem("cookie-consent");
        if (consent === "granted") {
            setConsentGranted(true);
        }

        // Listen for consent updates from CookieBanner
        const handleConsentUpdate = (event: CustomEvent) => {
            if (event.detail === "granted") {
                setConsentGranted(true);
            }
        };

        window.addEventListener("cookie-consent-update" as any, handleConsentUpdate);

        return () => {
            window.removeEventListener("cookie-consent-update" as any, handleConsentUpdate);
        };
    }, []);

    if (!consentGranted) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
            </Script>
        </>
    );
}
