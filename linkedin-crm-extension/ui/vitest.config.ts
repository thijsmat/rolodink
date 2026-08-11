import { defineConfig } from 'vitest/config';

// Tests for the content script's DOM logic.
//
// Standalone rather than merged with vite.config.ts. Vitest documents
// `mergeConfig(viteConfig, …)` for sharing a config, but ours exports a
// function (`defineConfig(({ mode }) => …)`) and mergeConfig takes objects.
// Nothing here needs the @rolodink/core alias either — anchors.ts deliberately
// touches no imports beyond the DOM — so inheriting it would be config we
// cannot justify. A test that does need core is the moment to revisit this.
//
// No `globals: true`: the tests import describe/it/expect from 'vitest'
// explicitly, the same way packages/core does. That keeps tsconfig.app.json
// from needing vitest's types, which it warns about wanting to avoid.
export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
    },
});
