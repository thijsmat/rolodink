<!-- a2f404cb-1cd1-48e0-a5ad-f7c1ba62aa20 115ec461-ccc3-478c-9e1e-3c581137b9f1 -->
# Rolodink Website Messaging Refresh

## Scope

Apply new messaging to NL + EN. Add testimonial and FAQ sections. Update hero, a new "Waarom Rolodink?" section, features copy, footer disclaimer, and add a legal page at `/disclaimer`.

## Files to Update/Add

- Update NL homepage: `website/src/app/page.tsx`
- Add/Update EN homepage: `website/src/app/en/page.tsx` (create if missing)
- Update NL features: `website/src/app/features/page.tsx`
- Update EN features: `website/src/app/en/features/page.tsx`
- Footer disclaimer/link: `website/src/components/site-footer.tsx`
- Add legal pages: `website/src/app/disclaimer/page.tsx`, `website/src/app/en/disclaimer/page.tsx`
- Optional SEO tweaks: `website/src/lib/seo.ts`

## Content Changes

1) Homepage hero (both locales)

- Headline: "Van de achterkant van een visitekaartje naar de toekomst van netwerken"
- Subheadline: "Vroeger schreef je op de achterkant ... Rolodink brengt die persoonlijke touch terug ..."
- Keep existing CTA component

2) New section after hero (both locales)

- Title: "Herinner je je nog visitekaartjes?"
- Paragraph: "Voorheen schreef je op de achterkant: 'Ontmoet op Networking Event Amsterdam ...'"
- Subtitle: "Moderne netwerken, klassieke wijsheid"
- Bullets:
  - "Bewaar die cruciale details: ..."
  - "Onthoud de context: ..."
  - "Maak opvolging persoonlijk: ..."

3) Features pages (both locales)

- Rename and rewrite three features to emotional benefits:
  - "Netwerkbeheer" → "Onthoud wat telt" with new copy
  - "Gespreksnotities" → "De details die het verschil maken" with new copy
  - "Opvolging" → "Natuurlijke follow-up" with new copy
- Keep other three features (Gestructureerde data, Privacy-first, Snelle integratie) but make copy more conversational.

4) Testimonials (both locales)

- New section on homepages with three quotes:
  - "Precies wat ik miste ..." — Marie, HR Director
  - "Ik vergat altijd ..." — David, Sales Manager
  - "Eindelijk kan ik weer ..." — Lisa, Consultant

5) FAQ (both locales)

- Add one item to homepages (or features page bottom):
  - Q: "Waarom Rolodink? Er zijn toch genoeg CRM-systemen?"
  - A: "CRM-systemen zijn voor verkoop ... in LinkedIn."

6) Legal disclaimers

- Footer: add line and link to `/disclaimer`.
- New pages at `/disclaimer` and `/en/disclaimer` with provided legal text.

## Implementation Notes

- Reuse existing layout components: `SiteHeader`, `SiteFooter`, `Card`.
- Keep styling with existing tailwind utility classes; match spacing to adjacent sections.
- For EN pages, provide faithful English translations of the same copy.
- Update `pageSEO` titles/descriptions minimally to reflect the new positioning.

## Minimal Snippets (illustrative only)

- In home page after hero, append:
```23:41:website/src/app/page.tsx
<section className="container py-8 md:py-12">
  <div className="mx-auto max-w-3xl space-y-4">
    <h2 className="text-2xl md:text-4xl font-semibold">Herinner je je nog visitekaartjes?</h2>
    <p className="text-muted-foreground">Voorheen schreef je op de achterkant: ...</p>
    <h3 className="text-xl font-semibold">Moderne netwerken, klassieke wijsheid</h3>
    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
      <li>Bewaar die cruciale details: ...</li>
      <li>Onthoud de context: ...</li>
      <li>Maak opvolging persoonlijk: ...</li>
    </ul>
  </div>
</section>
```

- Footer disclaimer link addition:
```45:63:website/src/components/site-footer.tsx
<p className="text-xs text-muted-foreground">
  Rolodink is onafhankelijk en niet gelieerd aan LinkedIn of Rolodex.
  <Link href="/disclaimer" className="ml-2 underline hover:no-underline">Lees meer</Link>
</p>
```


## Rollout

- Implement NL first, mirror to EN.
- Verify mobile responsiveness and spacing.
- Sanity-check internal links and SEO metadata.

### To-dos

- [ ] Add GitHub Actions release workflow on tags v*.*.*
- [ ] Add build script to package production ZIP
- [ ] Add Node script to validate manifest and bundle
- [ ] Update README with sideloading and troubleshooting
- [ ] Add .github/RELEASE_TEMPLATE.md
- [ ] Add INSTALL.md with detailed flow and warnings