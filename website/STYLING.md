# Website Styling Guide

> **Note:** This document covers website-specific styling details. For an overview of the entire monorepo's styling architecture, see [../STYLING.md](../STYLING.md).

## 📋 Quick Reference

- **Framework:** Tailwind CSS v4 (CSS-first configuratie)
- **Build Tool:** Next.js 16 + PostCSS (`@tailwindcss/postcss`)
- **Config:** `src/app/globals.css` (`@theme`, `@plugin`, `@custom-variant`) + `postcss.config.mjs`; er is geen `tailwind.config.ts`
- **Global Styles:** `src/app/globals.css`
- **Design System:** Rolodink (azure, gold, grey, link-blue)

---

## Configuration

### PostCSS Config

**File:** `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

Geen autoprefixer nodig: Tailwind v4 doet vendor-prefixing zelf.

### Global CSS (Tailwind-configuratie)

**File:** `src/app/globals.css`

```css
@import 'tailwindcss' source('../');   /* scant src/ */
@import 'tw-animate-css';              /* animate-in/out, fade-in, slide-in-from-* */

@plugin '@tailwindcss/typography';

@custom-variant dark (&:where(.dark, .dark *));   /* .dark op <html> */

@theme inline {
  --color-azure: hsl(var(--azure));
  --color-gold: hsl(var(--gold));
  /* ... shadcn-kleuren, fonts, radius */
}

@theme {
  /* shadows, animaties + keyframes, standaardkleuren vastgezet op v3-waarden */
}

@layer base {
  :root {
    --azure: 221 50% 21%;      /* #1B2951 */
    --gold: 43 91% 38%;        /* #B8860B */
    --grey: 0 0% 32%;          /* #525252 */
    --link-blue: 211 100% 40%; /* #0066CC */
    --background: 43 30% 96%;  /* #F7F5F0 */
    /* ... more variables, plus .dark-variant */
  }
}
```

- Kleuren staan in `@theme inline` zodat utilities `hsl(var(--azure))` direct gebruiken en
  dark mode via de variabelen meeloopt.
- De prose-kleuren (lange teksten) zijn overrides van de `--tw-prose-*`-variabelen in een
  `@layer utilities`-blok in hetzelfde bestand.
- De fonts komen van `next/font/local` in `src/app/[locale]/layout.tsx` als `--font-next-inter` en
  `--font-next-playfair`; `font-inter`/`font-playfair` verwijzen daarnaar. De bestanden staan in
  `src/fonts` (variabele woff2, latin, van Fontsource; SIL OFL 1.1, licenties ernaast). Niet
  terug naar `next/font/google`: die haalt de fonts bij elke build op en liet CI- en
  Vercel-builds falen als Google afwijkend antwoordde. Een ander gewicht of een extra
  tekenset (bijvoorbeeld `latin-ext`) vraagt een ander bestand uit `@fontsource-variable/*`.

### Tailwind v4-gedrag om op te letten

- `space-x-*`/`space-y-*` overschrijven geen eigen marges van kinderen meer; gebruik `gap-*`
  in flex/grid.
- Een responsieve `text-*` laat een `leading-*` staan. Wil je de standaard regelhoogte van
  de nieuwe maat, schrijf `sm:text-base/6`.
- `hover:` geldt alleen op apparaten met hover (geen "plakkende" hover op touch).
- Variants lees je van links naar rechts: `prose-a:hover:text-link-blue/80`.

---

## Custom Colors

### Usage

```tsx
// Background colors
<div className="bg-azure">Azure background</div>
<div className="bg-gold">Gold background</div>
<div className="bg-background">Background color</div>

// Text colors
<h1 className="text-azure">Azure text</h1>
<p className="text-grey">Grey text</p>
<a className="text-link-blue">Link blue</a>

// Border colors
<div className="border border-gold">Gold border</div>
<div className="border-azure/10">Azure with 10% opacity</div>

// With opacity modifiers
<div className="bg-azure/90">90% opacity azure</div>
<div className="text-gold/50">50% opacity gold</div>
```

### Color Palette

| Color | Variable | HSL Value | Hex | Usage |
|-------|----------|-----------|-----|-------|
| **Azure** | `--azure` | `221 50% 21%` | `#1B2951` | Primary brand, headings, CTAs |
| **Gold** | `--gold` | `43 91% 38%` | `#B8860B` | Accents, borders, highlights |
| **Grey** | `--grey` | `0 0% 32%` | `#525252` | Body text, secondary content |
| **Link Blue** | `--link-blue` | `211 100% 40%` | `#0066CC` | LinkedIn integration, links |
| **Background** | `--background` | `43 30% 96%` | `#F7F5F0` | Page background |

---

## Typography

### Font Families

```tsx
// Headings (Playfair Display)
<h1 className="font-playfair font-semibold">Heading</h1>

// Body text (Inter)
<p className="font-inter">Body text</p>

// Default is Inter (set in layout.tsx)
<p>This uses Inter by default</p>
```

### Font Sizes

```tsx
<h1 className="text-5xl lg:text-6xl">Hero heading</h1>
<h2 className="text-4xl lg:text-5xl">Section heading</h2>
<h3 className="text-xl lg:text-2xl">Subsection</h3>
<p className="text-base lg:text-lg">Body text</p>
<span className="text-sm">Small text</span>
<span className="text-xs">Extra small</span>
```

---

## Responsive Design

### Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| `sm` | 640px | Tablets (portrait) |
| `md` | 768px | Tablets (landscape) |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large desktops |

### Mobile-First Pattern

```tsx
// Mobile (default): stacked, small text
// Tablet: 2 columns, medium text
// Desktop: 3 columns, large text
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  gap-4 
  sm:gap-6 
  lg:gap-8
  text-sm 
  sm:text-base 
  lg:text-lg
">
  {/* Content */}
</div>
```

---

## Component Patterns

### Buttons

```tsx
// Primary button
<button className="
  inline-flex 
  h-10 
  px-4 
  rounded-lg 
  bg-azure 
  text-white 
  hover:bg-azure/90 
  transition-colors
  items-center 
  justify-center 
  gap-2
">
  <Icon className="h-4 w-4" />
  Button Text
</button>

// Secondary button
<button className="
  inline-flex 
  h-10 
  px-4 
  rounded-lg 
  border-2 
  border-gold 
  bg-background 
  text-gold 
  hover:bg-gold/5 
  transition-colors
  items-center 
  justify-center 
  gap-2
">
  Button Text
</button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card className="
  bg-white 
  border 
  border-azure/10 
  rounded-2xl 
  p-8
">
  <CardHeader className="p-0">
    <CardTitle className="text-xl text-azure">
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <p className="text-grey">Card content</p>
  </CardContent>
</Card>
```

### Sections

```tsx
<section className="
  py-12 
  sm:py-20 
  lg:py-24 
  px-4 
  sm:px-6 
  lg:px-8
">
  <div className="max-w-[1136px] mx-auto">
    {/* Content */}
  </div>
</section>
```

---

## shadcn/ui Integration

### Components Used

- `Button` - ⚠️ Not used (using native buttons for custom colors)
- `Card` - ✅ Used for testimonials, features
- `Accordion` - ✅ Used for FAQ
- `NavigationMenu` - ✅ Used for header
- `Sheet` - ✅ Used for mobile menu

### Custom Styling

```tsx
// Override shadcn/ui component styles
<Card className="bg-white border border-azure/10 rounded-2xl p-8">
  {/* Custom classes override defaults */}
</Card>
```

---

## Common Issues & Solutions

### Issue: Custom colors showing grey

**Cause:** Tailwind not compiling custom color classes

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev

# Hard refresh browser (Ctrl+Shift+R)
```

### Issue: Styles not updating

**Cause:** Browser cache or build cache

**Solution:**
```bash
# Clear all caches
rm -rf .next node_modules/.cache

# Reinstall if needed
npm install

# Restart dev server
npm run dev
```

### Issue: TypeScript errors with theme colors

**Cause:** TypeScript doesn't recognize extended theme colors

**Solution:**
Tailwind-klassen zijn strings; TypeScript controleert ze niet. Zie je fouten in de editor, herstart dan de TypeScript-server in VS Code:
- `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

---

## Development Workflow

### Adding a new color

1. Add to `src/app/globals.css`:
```css
:root {
  --new-color: 200 100% 50%; /* HSL values */
}
```

2. Add to the `@theme inline` block in `src/app/globals.css`:
```css
--color-new-color: hsl(var(--new-color));
```

3. Use in components:
```tsx
<div className="bg-new-color text-white">
  Content
</div>
```

### Adding custom utilities

Use `@utility` in `globals.css` (then variants like `hover:` and `md:` work too):

```css
@utility paper-texture {
  background-image: url("data:image/svg+xml,...");
}
```

---

## Build & Deploy

### Local Development

```bash
npm run dev  # Start dev server on http://localhost:3000
```

### Production Build

```bash
npm run build  # Build for production
npm run start  # Start production server
```

### Verify Build

```bash
# Check bundle size
npm run build

# Look for:
# - First Load JS: ~100KB
# - CSS: ~45KB
```

---

## Related Files

- `src/app/globals.css` - Tailwind configuration, global styles & CSS variables
- `postcss.config.mjs` - PostCSS configuration
- `src/app/layout.tsx` - Root layout with font imports
- `src/components/ui/` - shadcn/ui components

---

## Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Tailwind v4 upgradegids](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Styling](https://nextjs.org/docs/app/building-your-application/styling)
- [Main Styling Docs](../STYLING.md)

---

**Last Updated:** 2026-10-22  
**Maintainer:** Matthijs Goes (@thijsmat)

