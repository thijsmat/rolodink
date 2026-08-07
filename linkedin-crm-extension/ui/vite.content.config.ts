import { defineConfig } from 'vite';
import path from 'node:path';

// Bundles the content script (src/content/main.js) into dist/content.js.
//
// Mirrors vite.background.config.ts: IIFE because it runs as a classic content
// script (no module loader on LinkedIn's pages), esbuild-minified, and
// emptyOutDir MUST stay false — this build runs after the popup build and
// would otherwise wipe index.html and assets/ out of dist.
//
// The output name is load-bearing: manifest.json declares "content.js"
// literally, for Chrome/Edge and Firefox alike.
//
// No `define` block: unlike the background script, this file reads its API
// base URL from chrome.storage at runtime and touches no import.meta.env.
export default defineConfig({
    resolve: {
        alias: {
            // Keep in sync with vite.config.ts, vite.background.config.ts and
            // tsconfig.app.json. See vite.config.ts for why this is an alias
            // rather than a workspace dependency.
            '@rolodink/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
        },
    },
    build: {
        emptyOutDir: false,
        outDir: 'dist',
        target: 'esnext',
        minify: 'esbuild',
        lib: {
            entry: path.resolve(__dirname, 'src/content/main.js'),
            name: 'rolodinkContent',
            fileName: () => 'content.js',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                entryFileNames: 'content.js',
                extend: true,
            },
        },
    },
    esbuild: {
        legalComments: 'none',
    },
});
