# Figma naar React Import Handleiding

Deze gids helpt je om je Figma designs handmatig om te zetten naar React componenten.

## 📁 Project Structuur

```
website/src/
├── components/
│   ├── ui/                      # Basis UI componenten
│   │   ├── button.tsx          ✅ Bestaat al
│   │   ├── card-enhanced.tsx   ✅ Bestaat al
│   │   ├── text.tsx            ✅ Bestaat al
│   │   ├── accordion.tsx       ✅ Bestaat al
│   │   ├── testimonial-card.tsx ✅ Bestaat al
│   │   ├── badge.tsx           ✅ Bestaat al
│   │   └── [nieuwe-component].tsx  ← Voeg hier nieuwe componenten toe
│   │
│   ├── layout/                 # Layout componenten
│   │   ├── page-container.tsx  ✅ Bestaat al
│   │   ├── page-section.tsx    ✅ Bestaat al
│   │   ├── page-header.tsx     ✅ Bestaat al
│   │   ├── page-content.tsx    ✅ Bestaat al
│   │   ├── cta-section.tsx     ✅ Bestaat al
│   │   └── grid.tsx            ✅ Bestaat al
│   │
│   ├── site-header.tsx         ✅ Bestaat al
│   └── site-footer.tsx         ✅ Bestaat al
│
├── app/                        # Next.js App Router
│   ├── page.tsx               ✅ Hoofdpagina
│   ├── features/page.tsx
│   ├── help/page.tsx
│   └── [andere-paginas]/page.tsx
│
├── styles/
│   ├── design-tokens.ts       ✅ Net aangemaakt
│   └── globals.css            ✅ Bestaat al
│
└── lib/
    └── utils.ts               ✅ cn() helper functie
```

## 🎨 Stap 1: Inspecteer je Figma Design

### A. Open de Figma file
[Rolodink UI Kit Design](https://www.figma.com/make/3RIZiWPTMRkB2Y1AZakEoK/Rolodink-UI-Kit-Design?node-id=0-4&t=KLp7UZ02HMtN7cmb-1)

### B. Identificeer de hoofdcomponenten

Klik op elk frame/component en noteer:

**Voor elk component:**
- Naam (bijv. "Primary Button", "Hero Section")
- Afmetingen (width, height)
- Kleuren (fill, stroke)
- Typografie (font family, size, weight, line height)
- Spacing (padding, margins)
- Border radius
- Shadows
- States (hover, active, disabled)

**Voorbeeld notities:**

```
Component: Primary Button
- Height: 40px (h-10)
- Padding: 16px horizontal (px-4)
- Background: Linear gradient gold
- Text: Inter 14px semibold
- Border radius: 8px (rounded-lg)
- Shadow: 0 4px 6px rgba(0,0,0,0.1)

Hover State:
- Shadow: 0 10px 15px rgba(0,0,0,0.1)
- Transform: scale(1.02)
```

## 🔧 Stap 2: Exporteer Assets

### Iconen en Afbeeldingen

1. **Selecteer een icoon/image in Figma**
2. **Rechterklik → Export → Settings:**
   - Voor iconen: SVG (schaalbaar)
   - Voor foto's: PNG 2x of WebP (geoptimaliseerd)
3. **Download naar:**
   - `/website/public/images/` voor images
   - `/website/public/icons/` voor iconen

### Alternatief: Gebruik Lucide React

We gebruiken al `lucide-react` voor iconen. Check of je icoon bestaat:
- Bezoek: https://lucide.dev/icons
- Zoek je icoon
- Importeer: `import { IconName } from 'lucide-react'`

## 💻 Stap 3: Converteer naar React Componenten

### Template voor een nieuwe component:

```tsx
// website/src/components/ui/[component-name].tsx
"use client" // Alleen als je hooks gebruikt (useState, useEffect, etc.)

import * as React from "react"
import { cn } from "@/lib/utils"
import { VariantProps, cva } from "class-variance-authority"

// 1. Definieer variants met cva
const componentVariants = cva(
  // Base classes - altijd toegepast
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all",
  {
    variants: {
      variant: {
        default: "bg-navy text-cream hover:bg-navy/90",
        vintage: "bg-gradient-to-r from-gold to-vintage-gold text-navy",
        outline: "border-2 border-navy text-navy hover:bg-navy hover:text-cream",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

// 2. TypeScript interface
interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Voeg custom props toe
  asChild?: boolean
}

// 3. Component definitie
export function Component({
  className,
  variant,
  size,
  children,
  ...props
}: ComponentProps) {
  return (
    <div
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Voorbeeld: Converteer een Figma Button

**Figma specs:**
- Background: #B8860B (gold)
- Height: 48px
- Padding: 24px horizontal
- Font: Inter 16px semibold
- Border radius: 12px
- Shadow: 0 8px 16px rgba(0,0,0,0.15)

**React component:**

```tsx
// website/src/components/ui/cta-button.tsx
import { Button } from "@/components/ui/button"

export function CtaButton({ children, ...props }) {
  return (
    <Button
      variant="vintage"
      size="xl"
      className="shadow-lg hover:shadow-xl"
      {...props}
    >
      {children}
    </Button>
  )
}
```

## 🎯 Stap 4: Converteer Figma Kleuren naar Tailwind

### Figma Color → Tailwind Class

| Figma Hex | Design Token | Tailwind Class |
|-----------|--------------|----------------|
| #1B2951   | Navy         | `bg-navy` `text-navy` |
| #F7F5F0   | Cream        | `bg-cream` `text-cream` |
| #B8860B   | Gold         | `bg-gold` `text-gold` |
| #0066CC   | LinkedIn     | `bg-linkedin` `text-linkedin` |
| #2D3748   | Charcoal     | `bg-charcoal` `text-charcoal` |

### Spacing conversie

| Figma px | Tailwind | Class |
|----------|----------|-------|
| 4px      | 1        | `p-1`, `m-1` |
| 8px      | 2        | `p-2`, `m-2` |
| 12px     | 3        | `p-3`, `m-3` |
| 16px     | 4        | `p-4`, `m-4` |
| 24px     | 6        | `p-6`, `m-6` |
| 32px     | 8        | `p-8`, `m-8` |
| 48px     | 12       | `p-12`, `m-12` |
| 64px     | 16       | `p-16`, `m-16` |

## 📱 Stap 5: Maak Pagina's

### Template voor een nieuwe pagina:

```tsx
// website/src/app/[page-name]/page.tsx
import { PageSection } from '@/components/layout/page-section'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { PageContent } from '@/components/layout/page-content'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function PageName() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <PageSection background="paper" padding="lg">
          <PageContainer>
            <PageHeader spacing="lg">
              <Text variant="heading" size="6xl" weight="bold" className="text-navy">
                Jouw Titel
              </Text>
              <PageContent maxWidth="2xl">
                <Text variant="lead" className="text-charcoal leading-relaxed">
                  Jouw subtitel of beschrijving hier.
                </Text>
              </PageContent>
            </PageHeader>
          </PageContainer>
        </PageSection>

        {/* Meer secties... */}
      </main>
      
      <SiteFooter />
    </div>
  )
}
```

## 🔍 Stap 6: Veelgebruikte Patronen

### Grid Layout (zoals features)

```tsx
<Grid cols={3} gap="lg">
  <Card variant="elevated" hover>
    <CardHeader>
      <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mb-6">
        <IconName className="h-8 w-8 text-cream" />
      </div>
      <CardTitle>Feature Titel</CardTitle>
      <CardDescription>Feature beschrijving</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
  {/* Meer cards... */}
</Grid>
```

### Split Layout (zoals hero)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
  {/* Links: Content */}
  <div className="space-y-8">
    <Text variant="heading" size="6xl">Titel</Text>
    <Text variant="lead">Beschrijving</Text>
    <CtaSection>
      <Button variant="vintage" size="xl">CTA</Button>
    </CtaSection>
  </div>
  
  {/* Rechts: Visual */}
  <div className="relative">
    {/* Illustratie of afbeelding */}
  </div>
</div>
```

## ✅ Checklist per Component

Voor elk component uit Figma:

- [ ] Component naam geïdentificeerd
- [ ] Alle states gedocumenteerd (default, hover, active, disabled)
- [ ] Kleuren omgezet naar Tailwind classes
- [ ] Spacing/padding omgezet naar Tailwind
- [ ] Typografie omgezet (font, size, weight)
- [ ] Assets geëxporteerd (indien nodig)
- [ ] React component aangemaakt
- [ ] Variants gedefinieerd met cva
- [ ] TypeScript types toegevoegd
- [ ] Component getest in browser
- [ ] Responsive gedrag gecontroleerd

## 🚀 Quick Start Voorbeeld

Stel je hebt dit in Figma: **"Download CTA Card"**

### 1. Analyseer in Figma:
```
Frame: Download CTA Card
- Width: 600px (max-w-2xl)
- Background: Linear gradient cream → warm-gray
- Padding: 48px (p-12)
- Border radius: 16px (rounded-2xl)
- Border: 1px gold/20
- Shadow: xl

Content:
- Icon: Download, 48px, gold background circle
- Title: "Download nu", Playfair 32px bold, navy
- Description: "Start vandaag...", Inter 18px, charcoal
- Button: "Download Chrome Extension", vintage style
```

### 2. Maak Component:

```tsx
// website/src/components/ui/download-cta-card.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card-enhanced'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function DownloadCtaCard() {
  return (
    <Card 
      variant="elevated" 
      className="max-w-2xl mx-auto bg-gradient-to-br from-cream to-warm-gray border-gold/20 shadow-xl"
    >
      <CardHeader className="text-center pb-8">
        <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Download className="w-8 h-8 text-navy" />
        </div>
        <Text variant="heading" size="4xl" weight="bold" className="text-navy mb-4">
          Download nu
        </Text>
        <Text variant="lead" className="text-charcoal leading-relaxed">
          Start vandaag nog met het beheren van je LinkedIn netwerk.
        </Text>
      </CardHeader>
      
      <CardContent className="flex justify-center">
        <Button variant="vintage" size="xl">
          Download Chrome Extension
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 3. Gebruik in pagina:

```tsx
// website/src/app/download/page.tsx
import { DownloadCtaCard } from '@/components/ui/download-cta-card'

export default function DownloadPage() {
  return (
    <PageSection background="white" padding="lg">
      <PageContainer>
        <DownloadCtaCard />
      </PageContainer>
    </PageSection>
  )
}
```

## 🎨 Bestaande Componenten die je kunt hergebruiken

Je hoeft niet alles opnieuw te maken! We hebben al:

### UI Componenten
- ✅ `Button` - Met vintage, outline, ghost variants
- ✅ `Card` - Met elevated, vintage variants
- ✅ `Text` - Voor alle typografie
- ✅ `Badge` - Voor labels
- ✅ `Accordion` - Voor FAQ's
- ✅ `TestimonialCard` - Voor quotes

### Layout Componenten
- ✅ `PageContainer` - Voor max-width en padding
- ✅ `PageSection` - Voor vertical rhythm
- ✅ `PageHeader` - Voor section headers
- ✅ `PageContent` - Voor body content
- ✅ `CtaSection` - Voor button alignment
- ✅ `Grid` - Voor responsive grids

### Navigatie
- ✅ `SiteHeader` - Met logo en menu
- ✅ `SiteFooter` - Met links en social

## 💡 Tips

1. **Start klein**: Begin met één component, test het, ga dan verder
2. **Hergebruik**: Check eerst of een bestaand component voldoet
3. **Consistentie**: Gebruik altijd de design tokens
4. **Responsive**: Test op mobiel (360px), tablet (768px), desktop (1024px+)
5. **Accessibility**: Gebruik semantic HTML en aria-labels
6. **Performance**: Optimaliseer images met Next.js Image component

## 🐛 Troubleshooting

**Component rendert niet:**
- Check of je `"use client"` hebt toegevoegd (als je useState/useEffect gebruikt)
- Controleer import paths (`@/` moet werken)

**Styling werkt niet:**
- Run `npm run dev` opnieuw
- Check of Tailwind classes correct zijn gespeld
- Bekijk of custom classes in `globals.css` staan

**TypeScript errors:**
- Check of alle imports correct zijn
- Zorg dat interfaces compleet zijn
- Run `npm run build` om types te checken

## 📚 Nuttige Links

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [Next.js Docs](https://nextjs.org/docs)
- [Class Variance Authority](https://cva.style/docs)

---

**Klaar om te beginnen?** Open je Figma file, kies één component, en volg de stappen hierboven! 🚀

