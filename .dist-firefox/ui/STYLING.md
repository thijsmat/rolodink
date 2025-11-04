# Extension Styling Guide

> **Note:** This document covers extension-specific styling details. For an overview of the entire monorepo's styling architecture, see [../../STYLING.md](../../STYLING.md).

## 📋 Quick Reference

- **Approach:** Vanilla CSS + CSS Modules
- **Build Tool:** Vite 5
- **No Dependencies:** Pure CSS (no Tailwind, no preprocessors)
- **Design System:** LinkedIn-inspired
- **Bundle Size:** ~8KB CSS (minified)

---

## Architecture

### File Structure

```
ui/src/
├── index.css                    # Global styles & utilities
├── styles/
│   └── variables.css           # CSS custom properties (design tokens)
└── components/
    ├── LoginView.module.css    # Component-scoped styles
    ├── ConnectionView.module.css
    └── ...
```

### Why CSS Modules?

✅ **Scoped Styles:** No class name conflicts  
✅ **Co-located:** Styles next to components  
✅ **Tree-shakeable:** Unused styles removed  
✅ **Type-safe:** TypeScript support via Vite  
✅ **Small Bundle:** No framework overhead

---

## CSS Custom Properties

### Design Tokens

**File:** `src/styles/variables.css`

```css
:root {
  /* Colors */
  --linkedin-blue: #0a66c2;
  --linkedin-blue-hover: #004182;
  --text-primary: #191919;
  --text-secondary: #666666;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  /* ... */
  
  /* Typography */
  --font-size-xs: 11px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  /* ... */
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  /* ... */
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  /* ... */
}
```

### Usage

```css
.button {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  background: var(--linkedin-blue);
  color: white;
}

.button:hover {
  background: var(--linkedin-blue-hover);
}
```

---

## Global Styles

### Utilities

**File:** `src/index.css`

```css
/* Global utility classes */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.buttonPrimary {
  background: var(--linkedin-blue);
  color: white;
}

.buttonPrimary:hover {
  background: var(--linkedin-blue-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--bg-surface);
}

.input:focus {
  outline: none;
  border-color: var(--linkedin-blue);
  box-shadow: 0 0 0 3px var(--linkedin-blue-subtle);
}
```

### When to Use Global vs Module Styles

**Use Global Utilities (`index.css`):**
- ✅ Reusable patterns (buttons, inputs, badges)
- ✅ Layout helpers (flex, grid utilities)
- ✅ Typography styles
- ✅ Base element styles

**Use CSS Modules (`*.module.css`):**
- ✅ Component-specific styles
- ✅ Unique layout patterns
- ✅ State-specific styles
- ✅ Complex nested structures

---

## CSS Modules Pattern

### Basic Usage

```tsx
// LoginView.tsx
import styles from './LoginView.module.css';

export function LoginView() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>
      <form className={styles.form}>
        <input className={styles.input} />
        <button className={styles.button}>Submit</button>
      </form>
    </div>
  );
}
```

```css
/* LoginView.module.css */
.container {
  padding: var(--space-6);
  background: var(--bg-surface);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.button {
  padding: var(--space-3) var(--space-4);
  background: var(--linkedin-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.button:hover {
  background: var(--linkedin-blue-hover);
}
```

### Combining Classes

```tsx
// Combine module classes with global utilities
<button className={`${styles.customButton} button buttonPrimary`}>
  Click me
</button>

// Or use array join
<div className={[styles.card, styles.elevated].join(' ')}>
  Card content
</div>
```

### Conditional Classes

```tsx
<button 
  className={`${styles.button} ${isActive ? styles.active : ''}`}
>
  Toggle
</button>
```

---

## Component Styling Patterns

### Card Component

```css
/* Card.module.css */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.cardTitle {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.cardContent {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}
```

### Form Component

```css
/* Form.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--linkedin-blue);
  box-shadow: 0 0 0 3px var(--linkedin-blue-subtle);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.error {
  color: var(--danger);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}
```

---

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--linkedin-blue` | `#0a66c2` | Primary actions, links |
| `--linkedin-blue-hover` | `#004182` | Hover states |
| `--linkedin-blue-subtle` | `#eaf3ff` | Backgrounds, focus rings |
| `--text-primary` | `#191919` | Main content |
| `--text-secondary` | `#666666` | Secondary content |
| `--text-tertiary` | `#8e8e8e` | Placeholder, disabled |
| `--bg-surface` | `#ffffff` | Card backgrounds |
| `--bg-muted` | `#f3f2ef` | Page background |
| `--border-color` | `#e0e0e0` | Default borders |
| `--success` | `#0b8f6a` | Success states |
| `--danger` | `#b24020` | Error states, destructive actions |

### Spacing Scale

```css
--space-0: 0px;
--space-1: 4px;   /* Tight spacing */
--space-2: 8px;   /* Small gaps */
--space-3: 12px;  /* Default gaps */
--space-4: 16px;  /* Medium spacing */
--space-5: 20px;  /* Large spacing */
--space-6: 24px;  /* Section padding */
--space-8: 32px;  /* Large sections */
```

### Typography Scale

```css
--font-size-xs: 11px;   /* Captions, metadata */
--font-size-sm: 14px;   /* Body text, buttons */
--font-size-md: 16px;   /* Emphasized text */
--font-size-lg: 18px;   /* Subheadings */
--font-size-xl: 20px;   /* Headings */
--font-size-2xl: 24px;  /* Large headings */
```

---

## Best Practices

### ✅ DO

```css
/* Use CSS variables for all values */
.button {
  padding: var(--space-3) var(--space-4);
  background: var(--linkedin-blue);
}

/* Keep selectors flat (low specificity) */
.cardTitle { /* ... */ }

/* Group related properties */
.button {
  /* Layout */
  display: inline-flex;
  padding: var(--space-3);
  
  /* Visual */
  background: var(--linkedin-blue);
  border-radius: var(--radius-md);
  
  /* Typography */
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Use meaningful class names */
.connectionCard { /* ... */ }
.profileHeader { /* ... */ }
```

### ❌ DON'T

```css
/* Don't hardcode values */
.button {
  padding: 12px 16px; /* ❌ */
  background: #0a66c2; /* ❌ */
}

/* Don't nest deeply */
.card .header .title .icon { /* ❌ */ }

/* Don't use inline styles in components */
<div style={{padding: '12px'}}> {/* ❌ */}

/* Don't mix global and module specificity */
.container div.customClass { /* ❌ */ }
```

---

## Performance

### Bundle Size

Current CSS bundle: **~8KB minified**

**Breakdown:**
- `variables.css`: ~2KB
- `index.css`: ~3KB
- Component modules: ~3KB combined

### Optimization Tips

1. **Remove unused styles:** Vite automatically tree-shakes unused CSS Modules
2. **Use CSS variables:** Better compression than repeated values
3. **Avoid deep nesting:** Simpler selectors = smaller bundle
4. **Reuse patterns:** Use global utilities for common patterns

---

## Troubleshooting

### Issue: Styles not applying

**Cause:** CSS Module not imported

**Solution:**
```tsx
// ✅ Correct
import styles from './Component.module.css';
<div className={styles.container}>

// ❌ Wrong
import './Component.module.css';
<div className="container">
```

### Issue: Class name conflicts

**Cause:** Using global class names that conflict

**Solution:** Always use CSS Modules for component styles:
```tsx
// Instead of global classes
<div className="card"> {/* ❌ */}

// Use module classes
<div className={styles.card}> {/* ✅ */}
```

### Issue: CSS variables not working

**Cause:** `variables.css` not imported

**Solution:** Ensure import in `index.css`:
```css
/* src/index.css */
@import './styles/variables.css'; /* Must be first! */
```

---

## Development Workflow

### Adding a new color

1. Add to `src/styles/variables.css`:
```css
:root {
  --new-color: #ff5733;
  --new-color-hover: #cc4529;
}
```

2. Use in components:
```css
.element {
  background: var(--new-color);
}

.element:hover {
  background: var(--new-color-hover);
}
```

### Creating a new component

1. Create component file:
```tsx
// src/components/NewComponent.tsx
import styles from './NewComponent.module.css';

export function NewComponent() {
  return (
    <div className={styles.container}>
      {/* Content */}
    </div>
  );
}
```

2. Create module CSS:
```css
/* src/components/NewComponent.module.css */
.container {
  padding: var(--space-4);
  background: var(--bg-surface);
}
```

---

## Build & Deploy

### Development

```bash
npm run dev  # Vite dev server with HMR
```

### Production Build

```bash
npm run build  # Outputs to dist/
```

CSS is automatically:
- Minified
- Tree-shaken (unused styles removed)
- Source maps generated (for debugging)

---

## Related Files

- `src/index.css` - Global styles
- `src/styles/variables.css` - Design tokens
- `src/components/*.module.css` - Component styles
- `vite.config.ts` - Vite configuration

---

## Resources

- [CSS Modules Spec](https://github.com/css-modules/css-modules)
- [Vite CSS Docs](https://vitejs.dev/guide/features.html#css)
- [MDN CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Main Styling Docs](../../STYLING.md)

---

**Last Updated:** 2025-10-29  
**Maintainer:** Matthijs Goes (@thijsmat)

