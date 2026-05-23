import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Use absolute paths so deep-linked routes (e.g. /programs, /admin) work
  // when Express serves the built app in production (single-service mode).
  base: '/',

  server: {
    // In dev: proxy /api calls to the Express server running on port 3001.
    // This means the frontend makes the exact same relative /api URLs
    // in development as it does in production — no VITE_API_BASE_URL needed.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
