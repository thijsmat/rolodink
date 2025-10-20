<!-- f76e22ae-fbd6-4fab-8bfe-41e903d447b0 40b3def1-5d4c-43c7-ae91-daa1d5133f3e -->
# Rolodink Website Complete Redesign & Migration

## Fase 0: Git Branch Setup

### 0.1 Create Feature Branch

```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM
git checkout -b redesign/design-kit-integration
```

## Fase 1: Styling Foundation (Tailwind & Fonts)

### 1.1 Tailwind Config Vervangen

- Kopieer `/tmp/rolodink-design-kit/tailwind.config.ts` → `/home/matthijsgoes/Projecten/LinkedinCRM/website/tailwind.config.ts`
- Nieuwe kleuren uit design-kit:
  - `azure: #1B2951` (primary navy)
  - `gold: #B8860B` (accent)
  - `linkBlue: #0066CC` (LinkedIn blue)
  - `background: #F7F5F0` (warm cream)
  - `grey: #525252` (text secondary)

### 1.2 Global CSS & Fonts

- Vervang `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/globals.css` met design-kit versie
- Update `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/layout.tsx`:
  - Importeer Google Fonts: `Playfair Display` (headings) en `Inter` (body)
  - Configureer font-families in `<html>` tag

## Fase 2: Shadcn/UI Componenten Migreren

### 2.1 Backup & Cleanup

- Verwijder bestaande custom components:
  - `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/layout/*` (old layout helpers)
  - `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/vintage-hero.tsx`
  - `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/ui/card-enhanced.tsx`
  - `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/ui/text.tsx`
  - `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/ui/vintage-button.tsx`

### 2.2 Kopieer Alle Shadcn/UI Componenten

Kopieer alle 47 componenten van `/tmp/rolodink-design-kit/client/components/ui/*` naar `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/ui/`:

- accordion.tsx, alert-dialog.tsx, alert.tsx, avatar.tsx, badge.tsx
- button.tsx, card.tsx, checkbox.tsx, dialog.tsx, input.tsx
- select.tsx, separator.tsx, sheet.tsx, table.tsx, tabs.tsx
- ... (alle 47 componenten)

### 2.3 Installeer Missing Dependencies

Controleer en installeer ontbrekende Radix UI packages voor nieuwe componenten:

```bash
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip
```

## Fase 3: Section Components Migreren

### 3.1 Kopieer Design-Kit Section Components

Van `/tmp/rolodink-design-kit/client/components/` naar `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/sections/`:

- `Hero.tsx` → `hero.tsx`
- `Features.tsx` → `features.tsx`
- `Testimonials.tsx` → `testimonials.tsx`
- `FAQ.tsx` → `faq.tsx`
- `CTA.tsx` → `cta.tsx`

### 3.2 Update Import Paths

Pas alle import paths aan in section components:

- `import { Badge } from "@/components/ui/badge"` (blijft gelijk)
- `import { Card } from "@/components/ui/card"` (blijft gelijk)

### 3.3 Converteer naar Client Components Waar Nodig

- `faq.tsx`: Voeg `"use client"` toe (gebruikt useState)
- Andere sections kunnen server components blijven

## Fase 4: Navigation & Footer Vervangen

### 4.1 Navigation Component

- Vervang `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/site-header.tsx`
- Kopieer structuur uit `/tmp/rolodink-design-kit/client/components/Navigation.tsx`
- Behoud bestaande Next.js `<Link>` componenten (vervang gewone `<a>` tags)
- Update kleuren naar nieuwe design-kit palette

### 4.2 Footer Component

- Vervang `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/components/site-footer.tsx`
- Kopieer structuur uit `/tmp/rolodink-design-kit/client/components/Footer.tsx`
- Behoud bestaande links naar `/privacy`, `/terms`, etc.

## Fase 5: Homepage Herschrijven

### 5.1 Update `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/page.tsx`

Vervang volledige inhoud met nieuwe structuur:

```tsx
import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import Testimonials from "@/components/sections/testimonials"
import FAQ from "@/components/sections/faq"
import CTA from "@/components/sections/cta"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  )
}
```

### 5.2 Update `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/en/page.tsx`

Dupliceer structuur voor Engelse versie met vertaalde content

## Fase 6: Subpagina's Redesignen

Pas alle subpagina's aan naar nieuwe design system:

### 6.1 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/features/page.tsx`

- Herstructureer met nieuwe container: `<div className="max-w-[1136px] mx-auto px-8">`
- Gebruik nieuwe `<Card>` component uit shadcn/ui
- Update kleuren: `text-azure`, `bg-background`, `border-azure/10`
- Gebruik `font-playfair` voor headings, standaard Inter voor body text

### 6.2 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/how-it-works/page.tsx`

- Hero section met `py-24`, centered text met `text-center mb-16`
- Update stap-voor-stap sectie naar card-based layout
- Gebruik nieuwe `<Badge>` component voor step numbers

### 6.3 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/help/page.tsx`

- FAQ-stijl accordion gebruiken uit nieuwe component
- Update tekstkleuren en spacing naar design-kit

### 6.4 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/privacy/page.tsx`

- Prose container: `<div className="max-w-[768px] mx-auto">`
- Typography: headings in `text-azure font-playfair`, body in `text-grey`

### 6.5 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/terms/page.tsx`

- Identieke behandeling als privacy page

### 6.6 `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/download/page.tsx`

- Hero-stijl met CTA button naar Chrome Web Store
- Gebruik nieuwe `<Button>` styling uit design-kit

### 6.7 English Pages (`/en/...`)

- Dupliceer alle updates naar Engelse vertalingen

## Fase 7: Cleanup & Testing

### 7.1 Verwijder Unused Files

- `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/app/vintage-demo/` (demo page)
- `/home/matthijsgoes/Projecten/LinkedinCRM/website/src/styles/design-tokens.ts` (oude tokens)
- `/home/matthijsgoes/Projecten/LinkedinCRM/website/scripts/figma-to-component.js` (niet meer nodig)

### 7.2 TypeScript & Build Check

```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM/website
npm run build
```

Los eventuele TypeScript errors op

### 7.3 Responsive Testing

- Test alle pagina's op mobile breakpoints (`sm`, `md`, `lg`)
- Verifieer navigation hamburger menu werkt
- Check CTA buttons zijn touch-friendly

### 7.4 Accessibility Check

- Controleer alt-texts op decorative elements
- Verifieer keyboard navigation in accordions/dropdowns
- Test focus states op interactieve elementen

## Fase 8: Final Polish

### 8.1 SEO & Metadata

- Update page titles en descriptions naar nieuwe messaging
- Check OpenGraph images en meta tags

### 8.2 Performance

- Optimaliseer font loading (font-display: swap)
- Check bundle size na toevoegen alle shadcn components

### 8.3 Git Commit

```bash
git add .
git commit -m "feat: complete website redesign with design-kit integration"
```

---

## Key Design Tokens uit Design-Kit

**Kleuren:**

- Primary: `azure: #1B2951`
- Background: `background: #F7F5F0`
- Accent: `gold: #B8860B`
- LinkedIn: `linkBlue: #0066CC`
- Text: `grey: #525252`

**Typography:**

- Headings: `font-playfair font-semibold`
- Body: Inter (default sans-serif)
- Sizes: `text-5xl` (headings), `text-xl` (subheadings), `text-sm` (body)

**Spacing:**

- Section padding: `py-24 px-8`
- Container: `max-w-[1136px] mx-auto` (large), `max-w-[768px] mx-auto` (prose)
- Gap tussen elementen: `space-y-16` (sections), `space-y-4` (within sections)

**Borders & Shadows:**

- Card borders: `border-azure/10`
- Rounded corners: `rounded-2xl` (cards), `rounded-lg` (buttons)
- Shadows: `shadow-sm` (subtle), `shadow-xl` (elevated)

### To-dos

- [ ] Replace Tailwind config and global CSS with design-kit versions, configure Playfair Display and Inter fonts
- [ ] Copy all 47 shadcn/ui components from design-kit and install missing Radix UI dependencies
- [ ] Migrate Hero, Features, Testimonials, FAQ, and CTA section components to new sections directory
- [ ] Replace site-header and site-footer with design-kit Navigation and Footer components
- [ ] Rewrite homepage (NL and EN) using new section components
- [ ] Redesign all subpages (features, how-it-works, help, privacy, terms, download) with new design system
- [ ] Remove unused files, run build check, test responsive design and accessibility
- [ ] Update SEO metadata, optimize performance, commit changes to git