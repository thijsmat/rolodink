import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Zorgt voor relatieve paden in de build output
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false, // Remove all comments for Firefox AMO validation
      },
    },
  },
})