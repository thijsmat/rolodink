<!-- f76e22ae-fbd6-4fab-8bfe-41e903d447b0 950f6c51-f52e-4331-b6fe-6229cc0c6666 -->
# Implementation Plan — Website ↔ Design Kit (1:1 Alignment, No Workarounds)

## Non‑negotiable constraints

- Exact 1:1 visual and structural match with `rolodink-design-kit`.
- No workarounds, no simplified alternatives, no inline ad‑hoc styles.
- Only use design tokens, Tailwind utilities, and shadcn/ui components (no custom CSS unless added to the design system).
- No inline SVG icons or emoji; only `lucide-react` icons per the design kit.

## Scope of changes (files to touch)

- Typography/spacing/layout: `website/src/app/globals.css`, `website/tailwind.config.ts`
- Global structure: `website/src/app/layout.tsx`
- Header/Footer: `website/src/components/site-header.tsx`, `website/src/components/site-footer.tsx`
- Sections: `website/src/components/sections/hero.tsx`, `features.tsx`, `testimonials.tsx`, `faq.tsx`, `cta.tsx`
- UI components (usage only): `website/src/components/ui/*` (e.g., `button.tsx`, `card.tsx`, `navigation-menu.tsx`, `sheet.tsx`, `tooltip.tsx`)

## Tasks

### 1) Buttons — replace custom buttons with shadcn/ui Button

- Replace all `<button className="...">` usages with `<Button />` variants.
- Use only variants/sizes defined by `buttonVariants`.
- Example replacement (Hero primary):
- From: `<button className="h-10 px-4 rounded-lg bg-azure ...">`
- To: `<Button variant="default" size="sm" className="bg-azure hover:bg-azure/90">Add to Chrome – Gratis</Button>`
- Example replacement (Secondary/outline): use `variant="outline"` with `border-gold text-gold hover:bg-gold/5`.
- Files: `hero.tsx`, `cta.tsx`, `site-header.tsx`, any section with custom buttons.

### 2) Icons — unify on lucide-react (no emoji, no inline SVG)

- Replace all emoji stars, custom SVGs, and decorative circles with lucide icons.
- Enforce consistent sizing: `h-4 w-4` (or `h-5 w-5` if specified by design kit).
- Examples:
- Stars in `testimonials.tsx`: `<Star className="h-4 w-4 text-gold fill-current" />`.
- CTA/Hero icons: `<Chrome className="h-4 w-4" />`, `<ArrowRight className="h-4 w-4" />`.
- Files: `hero.tsx`, `features.tsx`, `testimonials.tsx`, `cta.tsx`, `faq.tsx`, `site-header.tsx`.

### 3) Typography — remove custom pixel sizes/line-heights, use Tailwind scale

- Replace `text-[60px]`, `leading-[75px]`, `leading-[32.5px]` with responsive scale:
- H1: `text-4xl sm:text-5xl lg:text-6xl` + `leading-tight` (per design kit visual match)
- H2: `text-4xl md:text-5xl`
- H3: `text-xl`
- Body: `text-base` or `text-lg` where specified
- Keep brand fonts: `font-playfair` for headings, `font-inter` for body.
- Files: `hero.tsx`, `features.tsx`, `testimonials.tsx`, `faq.tsx`, `cta.tsx`.

### 4) Spacing/Layout — normalize section spacing and gaps (mobile‑first)

- Sections: use `py-16 md:py-24 px-4 md:px-8` consistently.
- Containers: use `max-w-[1136px] mx-auto` or `max-w-[896px]` where specified by design kit.
- Gaps:
- Rows/controls: `gap-3`
- Card grids: `gap-8`
- Vertical stacks: `space-y-4`
- Convert desktop‑first flex layouts to mobile‑first grid patterns:
- Example (Hero): `grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16`.
- Files: all sections + header/footer blocks.

### 5) Cards — replace ad‑hoc card styles with shadcn/ui Card

- Use `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`.
- Migrate testimonial/feature cards to Card; remove custom borders/shadows beyond design kit tokens.
- Files: `features.tsx`, `testimonials.tsx`.

### 6) Animation & transitions — unify tokens

- Standardize durations/easing:
- Hover: `transition-colors duration-200 ease-out`
- Card hover: `transition-all duration-300 ease-out`
- Menus/drawers: `transition-all duration-300 ease-in-out`
- Replace `animate-in fade-in slide-in-from-top-*` with Tailwind `animation` tokens from `tailwind.config.ts` (or add named keyframes if design kit specifies).
- Files: all sections using transitions, `site-header.tsx` mobile menu.

### 7) Header & Navigation — align with design kit components

- Desktop: use `NavigationMenu` for the center links; spacing `gap-4` or per design kit.
- CTA: `Button` (no custom classes beside palette tokens).
- Mobile: use `Sheet` for the drawer; `Button` for toggler with lucide `Menu`/`X` icons.
- Files: `site-header.tsx`.

### 8) Footer — align columns, link styles, spacing

- Use consistent `grid` with `gap-12`, headings `text-sm font-semibold`, links `text-sm text-grey hover:text-azure`.
- Ensure social buttons use consistent `w-9 h-9 rounded-full` with icon size `h-4 w-4`.
- Files: `site-footer.tsx`.

### 9) Globals — design tokens only

- Keep CSS variables as defined; remove any ad-hoc non‑token colors.
- Ensure `dark` tokens are used only via `class` dark mode.
- Files: `globals.css`, `tailwind.config.ts`.

## Acceptance criteria

- Visual parity: side‑by‑side comparison with `rolodink-design-kit` is pixel‑equivalent at key breakpoints (mobile ≤768px, tablet, desktop ≥1280px).
- No inline SVG icons or emoji remain; only `lucide-react` with consistent sizes.
- All buttons are shadcn/ui `<Button>` with `buttonVariants`.
- No custom pixel font sizes/line-heights remain; only Tailwind scale.
- Section spacing and grid layouts adhere to the specified tokens.
- Cards implemented with shadcn/ui `<Card>` and subcomponents.
- Transitions/animations use the standardized tokens only.
- Lint/typecheck/build all pass with zero warnings related to the refactor.

### To-dos

- [ ] Check environment versions and create feature branch
- [ ] Replace Tailwind config and global CSS, configure Playfair/Inter fonts
- [ ] Copy all shadcn/ui components and install Radix dependencies
- [ ] Migrate Hero, Features, Testimonials, FAQ, CTA to sections
- [ ] Replace header and footer with design-kit variants
- [ ] Rebuild homepage (NL/EN) using new sections and verify integrations
- [ ] Redesign all subpages to new design system (NL/EN)
- [ ] Cleanup unused files, build, performance baseline/analyze, a11y checks
- [ ] Finalize SEO, performance polish, and commit for PR