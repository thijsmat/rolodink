import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Only the '@/...' alias from tsconfig.json, so route handlers can be imported
// in tests. Everything else stays on vitest's defaults. The .mts extension
// keeps Vite off its deprecated CJS path (this package has no "type": "module").
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
