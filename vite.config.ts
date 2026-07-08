/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
// `vite build --mode analyze` additionally emits dist/stats.html (treemap of
// every module with gzip/brotli sizes) — used by the CI bundle-analysis job.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'analyze'
      ? [visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true })]
      : []),
  ],
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
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
    },
  },
}))
