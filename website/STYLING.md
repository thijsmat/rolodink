# Website Styling Guide

> **Note:** This document covers website-specific styling details. For an overview of the entire monorepo's styling architecture, see [../STYLING.md](../STYLING.md).

## 📋 Quick Reference

- **Framework:** Tailwind CSS v3.4.1
- **Build Tool:** Next.js 15 + PostCSS
- **Config:** `tailwind.config.ts` + `postcss.config.mjs`
- **Global Styles:** `src/app/globals.css`
- **Design System:** Rolodink (azure, gold, grey, link-blue)

---

## Configuration

### Tailwind Config

**File:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rolodink Design System
        azure: 'hsl(var(--azure))',
        gold: 'hsl(var(--gold))',
        grey: 'hsl(var(--grey))',
        'link-blue': 'hsl(var(--link-blue))',
        // ... shadcn/ui colors
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### PostCSS Config

**File:** `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

### Global CSS

**File:** `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --azure: 221 50% 21%;      /* #1B2951 */
    --gold: 43 91% 38%;        /* #B8860B */
    --grey: 0 0% 32%;          /* #525252 */
    --link-blue: 211 100% 40%; /* #0066CC */
    --background: 43 30% 96%;  /* #F7F5F0 */
    /* ... more variables */
  }
}
```

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
Colors are properly typed via `tailwind.config.ts`. If you still see errors, restart TypeScript server in VS Code:
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

2. Add to `tailwind.config.ts`:
```typescript
colors: {
  'new-color': 'hsl(var(--new-color))',
}
```

3. Use in components:
```tsx
<div className="bg-new-color text-white">
  Content
</div>
```

### Adding custom utilities

Use `@layer utilities` in `globals.css`:

```css
@layer utilities {
  .paper-texture {
    background-image: url("data:image/svg+xml,...");
  }
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

- `tailwind.config.ts` - Tailwind configuration
- `postcss.config.mjs` - PostCSS configuration
- `src/app/globals.css` - Global styles & CSS variables
- `src/app/layout.tsx` - Root layout with font imports
- `src/components/ui/` - shadcn/ui components

---

## Resources

- [Tailwind CSS v3 Docs](https://v3.tailwindcss.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Styling](https://nextjs.org/docs/app/building-your-application/styling)
- [Main Styling Docs](../STYLING.md)

---

**Last Updated:** 2025-10-29  
**Maintainer:** Matthijs Goes (@thijsmat)

