import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Tests for the content script's DOM logic and the popup's connection hook.
//
// Standalone rather than merged with vite.config.ts. Vitest documents
// `mergeConfig(viteConfig, …)` for sharing a config, but ours exports a
// function (`defineConfig(({ mode }) => …)`) and mergeConfig takes objects.
//
// The @rolodink/core alias is here because useConnectionLogic.test.ts runs
// the real hook, which takes SENSITIVE_FIELDS from core. Keep it in sync with
// vite.config.ts, vite.background.config.ts and `paths` in tsconfig.app.json.
//
// No `globals: true`: the tests import describe/it/expect from 'vitest'
// explicitly, the same way packages/core does. That keeps tsconfig.app.json
// from needing vitest's types, which it warns about wanting to avoid.
export default defineConfig({
    resolve: {
        alias: {
            '@rolodink/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
    },
});
