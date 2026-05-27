import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // In dev: proxy /api calls to the local dev server (dev-server.js on port 3001).
    // In production on Vercel: the api/ functions are served directly — no proxy needed.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
