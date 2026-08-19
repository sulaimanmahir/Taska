import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Pin the Vite root to the frontend directory so Windows builds don't resolve
// index.html through a relative drive-path and break HTML asset emission.
const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root: rootDir,
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'robots.txt'],
      manifest: {
        name: 'Taska - Business Operating System',
        short_name: 'Taska',
        description: 'Business Operating System by Result Seekers Ltd',
        theme_color: '#6D28D9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Adds push/notificationclick handling to the generated service
        // worker without switching PWA strategy away from generateSW - see
        // public/push-handler.js.
        importScripts: ['push-handler.js'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/127\.0\.0\.1:8000\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (serving a real dist/ build, needed to exercise the
  // actual generated service worker - `vite dev` doesn't register one
  // unless devOptions.enabled is set) has its own proxy config separate
  // from `server`, so it had no working API proxy at all until this.
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
