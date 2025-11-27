import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        build: {
            emptyOutDir: false, // Don't empty, we want to keep the UI build
            outDir: 'dist',
            lib: {
                entry: path.resolve(__dirname, 'src/background/main.ts'),
                name: 'background',
                fileName: () => 'background.js',
                formats: ['iife'], // IIFE is best for simple scripts, or 'es' if we use type="module"
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
