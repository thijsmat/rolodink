# Styling Architecture - Rolodink Monorepo

This document describes the styling architecture for all projects in the Rolodink monorepo.

## 📋 Table of Contents

- [Overview](#overview)
- [Project-Specific Docs](#project-specific-docs)
- [Design Systems](#design-systems)
- [Technology Stack](#technology-stack)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Rolodink monorepo contains **two independent projects** with **different styling approaches**:

| Project | Styling Stack | Build Tool | Bundle Size |
|---------|---------------|------------|-------------|
| **Website** | Tailwind CSS v3.4.1 | Next.js 15 + PostCSS | ~45KB CSS |
| **Extension** | Vanilla CSS + CSS Modules | Vite 5 | ~8KB CSS |

### Why Different Approaches?

**Website (Tailwind CSS):**
- ✅ Rapid prototyping with utility classes
- ✅ Design system consistency with design-kit
- ✅ Responsive design with built-in breakpoints
- ✅ Dark mode support out of the box

**Extension (Vanilla CSS):**
- ✅ Minimal bundle size for Chrome extension
- ✅ No build-time dependencies
- ✅ Direct control over every style
- ✅ LinkedIn design system alignment
- ✅ Faster build times

---

## Project-Specific Docs

### Website
📄 **[website/STYLING.md](./website/STYLING.md)**
- Tailwind CSS v3.4.1 configuration
- Custom color system (azure, gold, grey, link-blue)
- Responsive breakpoints
- Component styling patterns

### Extension
📄 **[linkedin-crm-extension/ui/STYLING.md](./linkedin-crm-extension/ui/STYLING.md)**
- CSS custom properties architecture
- CSS Modules usage
- LinkedIn design system colors
- Component styling patterns

---

## Design Systems

### Website: Rolodink Design System

**Colors:**
```css
:root {
  --azure: 221 50% 21%;      /* #1B2951 - Primary brand */
  --gold: 43 91% 38%;        /* #B8860B - Accent */
  --grey: 0 0% 32%;          /* #525252 - Text */
  --link-blue: 211 100% 40%; /* #0066CC - LinkedIn blue */
  --background: 43 30% 96%;  /* #F7F5F0 - Background */
}
```

**Typography:**
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

**Spacing Scale:**
- Based on Tailwind's default scale (4px base unit)
- Custom extensions: 18, 88, 128

### Extension: LinkedIn Design System

**Colors:**
```css
:root {
  --linkedin-blue: #0a66c2;
  --linkedin-blue-hover: #004182;
  --text-primary: #191919;
  --text-secondary: #666666;
  --bg-surface: #ffffff;
  --bg-muted: #f3f2ef;
}
```

**Typography:**
- Font: System font stack (matches LinkedIn)
- Sizes: 11px, 14px, 16px, 18px, 20px, 24px

**Spacing Scale:**
- Custom scale: 0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

---

## Technology Stack

### Website

**Dependencies:**
```json
{
  "tailwindcss": "^3.4.1",
  "autoprefixer": "^10.4.20",
  "tailwindcss-animate": "^1.0.7",
  "postcss": "^8"
}
```

**Configuration Files:**
- `tailwind.config.ts` - Tailwind configuration with custom colors
- `postcss.config.mjs` - PostCSS with Tailwind + autoprefixer
- `src/app/globals.css` - CSS variables and base styles

**Key Features:**
- Custom color system using HSL + CSS variables
- shadcn/ui components integration
- Responsive design (mobile-first)
- Dark mode support via `class` strategy

### Extension

**Dependencies:**
```json
{
  // NO styling dependencies!
  // Pure CSS with Vite as bundler
}
```

**Structure:**
- `src/index.css` - Global styles and utilities
- `src/styles/variables.css` - CSS custom properties
- `src/components/*.module.css` - Component-scoped styles

**Key Features:**
- CSS Modules for component scoping
- Native CSS custom properties
- No build-time CSS processing
- Minimal runtime overhead

---

## Best Practices

### Website (Tailwind)

**✅ DO:**
- Use Tailwind utility classes for layout and spacing
- Use custom colors via theme extension (`bg-azure`, `text-gold`)
- Use responsive modifiers (`sm:`, `md:`, `lg:`)
- Group related utilities with consistent order
- Use shadcn/ui components for common patterns

**❌ DON'T:**
- Mix inline styles with Tailwind classes
- Use arbitrary values unless necessary
- Override Tailwind defaults without reason
- Use `!important` to fix specificity issues
- Hardcode color values (use theme colors)

**Example:**
```tsx
// ✅ Good
<button className="inline-flex h-10 px-4 rounded-lg bg-azure text-white hover:bg-azure/90">
  Click me
</button>

// ❌ Bad
<button style={{backgroundColor: '#1B2951'}} className="h-10">
  Click me
</button>
```

### Extension (CSS Modules)

**✅ DO:**
- Use CSS Modules for component-specific styles
- Use CSS custom properties for theming
- Keep specificity low (single class selectors)
- Group related properties logically
- Use meaningful class names (BEM-style)

**❌ DON'T:**
- Use inline styles
- Nest selectors deeply (max 2 levels)
- Use `!important` unless absolutely necessary
- Hardcode values (use CSS variables)
- Mix global and module styles

**Example:**
```tsx
// ✅ Good
import styles from './Button.module.css';
<button className={styles.button}>Click me</button>

// button.module.css
.button {
  padding: var(--space-3) var(--space-4);
  background: var(--linkedin-blue);
  color: white;
  border-radius: var(--radius-md);
}

// ❌ Bad
<button style={{padding: '12px 16px', background: '#0a66c2'}}>
  Click me
</button>
```

---

## Troubleshooting

### Website Issues

#### Problem: Custom colors not working (showing grey)

**Root Cause:** Tailwind v4 incompatibility or cache issues

**Solution:**
```bash
cd website
rm -rf .next node_modules/.cache
npm install
npm run dev
```

**Verify versions:**
- `tailwindcss@^3.4.1` (NOT v4!)
- `autoprefixer@^10.4.20` present
- `postcss.config.mjs` uses `tailwindcss` and `autoprefixer`

#### Problem: Styles not updating

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Hard refresh browser
# Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Extension Issues

#### Problem: Styles not applied in Chrome extension

**Root Cause:** CSP (Content Security Policy) restrictions

**Solution:**
- Ensure no inline styles in components
- Use CSS Modules for all component styles
- Verify `manifest.json` has correct `content_security_policy`

#### Problem: CSS variables not working

**Solution:**
- Verify `variables.css` is imported in `index.css`
- Check browser DevTools for CSS variable values
- Ensure `:root` selector is used correctly

---

## Migration Notes

### Website: Tailwind v4 → v3 Downgrade (2025-10-29)

**Why downgraded:**
- Tailwind v4 has breaking changes in syntax
- Design-kit reference uses v3
- Custom colors weren't compiling with v4 + v3 config mix

**Changes made:**
1. Downgraded `tailwindcss: ^4` → `tailwindcss: ^3.4.1`
2. Added `autoprefixer: ^10.4.20`
3. Updated `postcss.config.mjs` from `@tailwindcss/postcss` to `tailwindcss` + `autoprefixer`
4. Kept `globals.css` with v3 syntax (`@tailwind` directives)
5. Kept `tailwind.config.ts` with v3 color pattern

**Result:**
- ✅ Custom colors working (`bg-azure`, `bg-gold`)
- ✅ All components rendering correctly
- ✅ Build success with 0 errors
- ✅ Production deployment successful

**Lessons learned:**
- Always match package version with configuration syntax
- Don't mix v4 packages with v3 config
- Test custom colors after Tailwind upgrades
- Clear build cache after major version changes

---

## Version History

| Date | Project | Change | Reason |
|------|---------|--------|--------|
| 2025-10-29 | Website | Tailwind v4 → v3.4.1 downgrade | Fix custom color compilation |
| 2025-10-29 | Website | Add `tailwindcss-animate` plugin | Accordion animations |
| 2025-10-29 | Website | Replace shadcn Button with native buttons | Fix buttonVariants conflicts |
| 2025-10-29 | Both | Create styling documentation | Prevent future issues |

---

## Related Documentation

- [Website README](./website/README.md)
- [Extension README](./linkedin-crm-extension/README.md)
- [Tailwind CSS v3 Docs](https://v3.tailwindcss.com/)
- [CSS Modules Docs](https://github.com/css-modules/css-modules)
- [Next.js Styling Docs](https://nextjs.org/docs/app/building-your-application/styling)

---

**Last Updated:** 2025-10-29  
**Maintainer:** Matthijs Goes (@thijsmat)

