import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Fastify API runs on :3001 in development (see api/dev.ts). Vite proxies
// /api to it so the browser talks to a single origin — no CORS in dev, and the
// same relative /api paths work unchanged once deployed to Vercel.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
