/**
 * Generates public/sitemap.xml from the tool registry.
 * Runs automatically before `vite build` (see the "prebuild" script).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://papermint.pages.dev'

// Extract slugs from the registry without executing TS: match `slug: '...'`
const source = readFileSync(join(root, 'src', 'data', 'tools.ts'), 'utf8')
const slugs = [...source.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1])

const staticPages = ['', 'about', 'privacy', 'terms', 'contact', 'faq']
const today = new Date().toISOString().slice(0, 10)

const urls = [
  ...staticPages.map((p) => `${SITE}/${p}`),
  ...slugs.map((s) => `${SITE}/tool/${s}`),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml written with ${urls.length} URLs`)
