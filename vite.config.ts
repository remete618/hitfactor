import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Hit Factor — IPSC/USPSA Calculator',
        short_name: 'Hit Factor',
        description: 'Calculate hit factors, plan competitions, get AI coaching',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        scope: '/hitfactor/',
        start_url: '/hitfactor/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.(anthropic|openai)\.com/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  base: '/hitfactor/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
        },
      },
    },
  },
})
