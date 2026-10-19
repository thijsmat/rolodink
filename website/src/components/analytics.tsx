"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { scrubPosthogEvent, stripUrl } from "@/lib/posthog-scrub";

// Publieke projectsleutel (phc_…). Niet gezet, zoals in previews, dan meet de
// site niets.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Klikken naar buiten, vooral naar de stores: daar begint een installatie.
function trackOutboundClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.host === window.location.host) return;
    if (link.protocol !== "http:" && link.protocol !== "https:") return;
    // De query valt weg; welke knop het was staat in utm_content (zie storeUrl).
    posthog.capture("outbound_click", {
        target: stripUrl(link.href),
        placement: new URL(link.href).searchParams.get("utm_content") ?? undefined,
    });
}

export function Analytics() {
    useEffect(() => {
        if (!POSTHOG_KEY) return;

        posthog.init(POSTHOG_KEY, {
            // Via de rewrite in next.config.js, zodat adblockers de meting niet
            // wegfilteren. Het project staat in de EU-regio.
            api_host: "/ingest",
            ui_host: "https://eu.posthog.com",
            defaults: "2026-08-30",
            // Geen cookies, localStorage of sessionStorage. Unieke bezoekers
            // telt PostHog met een dagelijks wisselende hash op de server; dat
            // moet in de projectinstellingen aanstaan, anders vallen de events weg.
            cookieless_mode: "always",
            person_profiles: "never",
            capture_pageview: "history_change",
            capture_pageleave: true,
            // Alleen paginaweergaven en uitgaande klikken, niets wat op de pagina
            // getypt of aangeklikt wordt.
            autocapture: false,
            rageclick: false,
            capture_dead_clicks: false,
            capture_heatmaps: false,
            capture_exceptions: false,
            capture_performance: false,
            disable_session_recording: true,
            disable_surveys: true,
            disable_product_tours: true,
            disable_conversations: true,
            disable_web_experiments: true,
            disable_external_dependency_loading: true,
            advanced_disable_flags: true,
            mask_personal_data_properties: true,
            before_send: scrubPosthogEvent,
        });

        document.addEventListener("click", trackOutboundClick, { capture: true });
        return () => {
            document.removeEventListener("click", trackOutboundClick, { capture: true });
        };
    }, []);

    return null;
}
