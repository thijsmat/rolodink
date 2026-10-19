import type { CaptureResult } from "posthog-js";

// Supabase zet na inloggen tokens in de URL (?code=… of #access_token=…), en
// de wachtwoordreset doet hetzelfde. Een URL gaat daarom alleen zonder query
// en fragment naar PostHog. Campagnes blijven zichtbaar: PostHog leest de
// utm_*-parameters vóór deze stap uit en zet ze in eigen properties.
export function stripUrl(value: string): string {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") return value;
        return `${url.origin}${url.pathname}`;
    } catch {
        return value;
    }
}

function scrubProps(props: Record<string, unknown> | undefined): void {
    if (!props) return;
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === "string" && /^https?:\/\//i.test(value)) {
            props[key] = stripUrl(value);
        }
    }
}

export function scrubPosthogEvent(event: CaptureResult | null): CaptureResult | null {
    if (!event) return event;
    scrubProps(event.properties);
    scrubProps(event.$set);
    scrubProps(event.$set_once);
    return event;
}
