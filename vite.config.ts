import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The Fastify API runs on :3001 in development (see server/dev.ts). Vite
// proxies /api to it so the browser talks to a single origin — no CORS in dev,
// and the same relative /api paths work unchanged once deployed to Vercel.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo-full.png'],
      manifest: {
        name: 'Flutterby — butterfly logger',
        short_name: 'Flutterby',
        description:
          'Log the butterflies you see with an automatic UK grid reference — built for field recorders.',
        theme_color: '#2f6f4f',
        background_color: '#f6f4ec',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell is precached; these handle the data the app needs offline.
        runtimeCaching: [
          {
            // The species list changes rarely — serve cached instantly, refresh
            // in the background. Works fully offline once visited once.
            urlPattern: /\/api\/butterflies$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-butterflies',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // A recorder's own reports/top-species: fine to show stale offline.
            urlPattern: /\/api\/(reports|butterflies\/top)\?/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-own-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            // Species photos from Wikimedia — immutable, cache hard.
            urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikimedia-images',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Never let the SW swallow auth or mutating API calls.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
