# Figma to React Component Generator

Interactive CLI tool om Figma designs om te zetten naar React componenten.

## 🚀 Gebruik

```bash
cd website
node scripts/figma-to-component.js
```

## 📋 Wat het doet

Het script vraagt je stap voor stap naar de properties van je Figma component:

1. **Component naam** - bijv. "FeatureCard", "HeroSection"
2. **Component type** - component (ui) of page
3. **Design properties**:
   - Width, height
   - Background color
   - Padding
   - Border radius
4. **Typografie**:
   - Heading (size, weight, text)
   - Description text
5. **Interactieve elementen**:
   - Buttons (text, variant)

## 💡 Voorbeeld Sessie

```
🎨 Figma to React Component Generator

Component name: ProductCard
Component type: component
Brief description: Card voor product showcase

📏 Design Properties:
Width: full
Height: auto
Background color: cream
Padding: 24px
Border radius: 16px

🎯 Typography:
Has heading? y
Heading size: 2xl
Heading weight: bold
Heading text: Product Naam

Has description text? y
Description text: Product beschrijving komt hier

Has button? y
Button text: Bekijk Product
Button variant: vintage

✅ Component saved to /src/components/ui/product-card.tsx
```

## 🎨 Ondersteunde Kleuren

Het script herkent automatisch Rolodink kleuren:

- `#1B2951` → `navy`
- `#F7F5F0` → `cream`
- `#B8860B` → `gold`
- `#0066CC` → `linkedin`
- `#2D3748` → `charcoal`
- etc.

## 📐 Spacing Conversie

Automatische px naar Tailwind conversie:

- `4px` → `p-1`
- `8px` → `p-2`
- `16px` → `p-4`
- `24px` → `p-6`
- `32px` → `p-8`
- `48px` → `p-12`

## 🔧 Handmatige Aanpassingen

Na het genereren:

1. **Review de code** - Pas aan waar nodig
2. **Voeg props toe** - Extra functionaliteit
3. **Test de component** - In je pagina
4. **Verfijn styling** - Tweaks en polish

## 📚 Meer Informatie

Zie de hoofdgids voor gedetailleerde instructies:
- `/docs/archive/FIGMA_IMPORT_GUIDE.md`

