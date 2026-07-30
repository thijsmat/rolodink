// Flat config voor ESLint 9. `next lint` bestaat niet meer in Next 16; het
// lint-script draait eslint rechtstreeks en eslint-config-next v16 exporteert
// zelf al flat config.
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/**", "scripts/clean-profile-names.js"],
  },
  ...coreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;
