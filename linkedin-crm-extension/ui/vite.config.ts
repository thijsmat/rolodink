import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Config for the popup/app bundle (src/main.tsx -> dist/index.html + assets).
//
// Until now this file was never read. A stale `vite.config.js` sat next to it,
// and Vite's DEFAULT_CONFIG_FILES puts `.js` ahead of `.ts`, so the `.js` won
// and everything here was dead. That pair (plus its `vite.config.d.ts`) was an
// accidentally committed `tsc` emit; both are deleted now.
//
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './', // Zorgt voor relatieve paden in de build output

    resolve: {
      alias: {
        // `ui` is deliberately not an npm workspace member: it has its own
        // lockfile, React 18 and eslint 8, and merging those trees with the
        // root's (eslint 9) is a large change with no upside here. An alias
        // gets the same result - @rolodink/core is source-only TypeScript with
        // zero runtime dependencies, so there is nothing to install, only to
        // resolve.
        //
        // Keep in sync with `paths` in tsconfig.app.json and with the alias in
        // vite.background.config.ts.
        '@rolodink/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      },
    },

    build: {
      // Explicit, and deliberately not terser. Terser is in devDependencies and
      // this file used to ask for it, but that request never took effect
      // because of the shadowing above - every shipped build has been minified
      // by esbuild. Naming esbuild here keeps the output what it has always
      // been. Switching to terser is a real change to the shipped bundle and
      // belongs in its own commit with its own verification.
      minify: 'esbuild',
    },

    define: {
      // Redundant with Vite's own handling - loadEnv already pulls
      // VITE_-prefixed keys out of process.env, which is how release.yml passes
      // them. Kept because vite.background.config.ts does the same, and the two
      // configs should not disagree about where env values come from.
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
  }
})
