import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'vite.svg'],
      manifest: {
        name: 'Existence Ticker',
        short_name: 'Existence',
        description: 'Mutual Currency Wallet',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React Runtime (Stable, rarely changes)
          'vendor-react': ['react', 'react-dom'],
          
          // Firebase SDK (Heavy, split to allow parallel loading)
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // UI Libraries (Visual components)
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          
          // NOTE: "Purification of Dependencies"
          // When adding new large libraries, explicitly add them here to keep the main bundle light.
          // Maintain awareness of what weighs down the vessel.
        }
      }
    }
  }
})
