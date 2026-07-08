import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('@cantoo/pdf-lib')) return 'pdflib'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('jszip')) return 'zip'
            if (id.includes('react')) return 'react'
          }
          return undefined
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
