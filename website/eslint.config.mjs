// Flat config voor ESLint 9. `next lint` bestaat niet meer in Next 16; het
// lint-script draait eslint rechtstreeks en eslint-config-next v16 exporteert
// zelf al flat config.
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "next-sitemap.config.js"],
  },
  ...coreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      // Nieuw en streng in eslint-plugin-react-hooks v7. Slaat aan op het
      // bewuste hydratiepatroon (setMounted(true) in een effect) in
      // site-header, cookie-banner, analytics en use-mobile. Dat herschrijven
      // (useSyncExternalStore) is een gedragswijziging en hoort in een eigen
      // PR; tot die tijd zichtbaar houden als waarschuwing, niet blokkerend.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
