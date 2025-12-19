import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Zorgt voor relatieve paden in de build output
  build: {
    minify: 'esbuild', // Use esbuild (faster and better comment removal)
    esbuild: {
      legalComments: 'none', // Remove ALL comments including @license
    },
  },
})