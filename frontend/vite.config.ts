import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const apiTarget = process.env.VITE_API_PROXY || 'http://localhost:8080'
const isGhPages = process.env.GH_PAGES === 'true'

export default defineConfig({
  base: isGhPages ? '/TOTP-VeschiyKey/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'key-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: {
        name: 'Вещий Ключ',
        short_name: 'TOTP Auth',
        description: 'Корпоративный TOTP-генератор',
        theme_color: '#2D1810',
        background_color: '#1A0F0A',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['utilities', 'security'],
        icons: [
          {
            src: 'key-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'key-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/auth': apiTarget,
      '/totp': apiTarget,
      '/admin': apiTarget,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: isGhPages
        ? { index: path.resolve(__dirname, 'pwa-index.html') }
        : {
            index: path.resolve(__dirname, 'index.html'),
            pwa: path.resolve(__dirname, 'pwa-index.html'),
          },
    },
  },
})
