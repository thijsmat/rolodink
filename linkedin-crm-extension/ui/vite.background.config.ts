import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        resolve: {
            alias: {
                // Keep in sync with vite.config.ts and tsconfig.app.json.
                // See the note there for why this is an alias rather than a
                // workspace dependency.
                '@rolodink/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
            },
        },
        build: {
            emptyOutDir: false,
            outDir: 'dist',
            target: 'esnext',
            minify: 'esbuild', // Use esbuild (faster and better comment removal)
            esbuild: {
                legalComments: 'none', // Remove ALL comments including @license
            },
            lib: {
                entry: path.resolve(__dirname, 'src/background/main.ts'),
                name: 'background',
                fileName: () => 'background.js',
                formats: ['iife'],
            },
            rollupOptions: {
                output: {
                    entryFileNames: 'background.js',
                    extend: true,
                },
            },
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        },
    };
});
