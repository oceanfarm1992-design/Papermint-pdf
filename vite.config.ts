/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

// Google AdSense site-ownership tag: a plain <meta>, no script. Added to every
// page once ADSENSE_CLIENT is set in src/data/meta.ts (read without executing
// TS, like the scripts/ generators). Ad code itself only loads on guide
// articles, and only once ADSENSE_SLOT is set too — see src/utils/ads.ts.
const adsenseClient =
  /ADSENSE_CLIENT\s*=\s*'([^']*)'/.exec(
    readFileSync(fileURLToPath(new URL('./src/data/meta.ts', import.meta.url)), 'utf8'),
  )?.[1] ?? ''

function adsenseAccountMeta(): Plugin {
  return {
    name: 'adsense-account-meta',
    transformIndexHtml(html) {
      if (!/^ca-pub-\d{10,20}$/.test(adsenseClient)) return html
      return html.replace(
        '</head>',
        `  <meta name="google-adsense-account" content="${adsenseClient}" />
  </head>`,
      )
    },
  }
}

// https://vite.dev/config/
// `vite build --mode analyze` additionally emits dist/stats.html (treemap of
// every module with gzip/brotli sizes) — used by the CI bundle-analysis job.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    adsenseAccountMeta(),
    ...(mode === 'analyze'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
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
