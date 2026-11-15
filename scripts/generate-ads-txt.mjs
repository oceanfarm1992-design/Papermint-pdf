/**
 * Writes public/ads.txt from ADSENSE_CLIENT in src/data/meta.ts.
 * Runs automatically before `vite build` (see the "prebuild" script).
 * With no publisher ID set it writes a comment-only placeholder (a valid,
 * empty ads.txt), so /ads.txt never falls through to the HTML 404 page.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const meta = readFileSync(join(root, 'src', 'data', 'meta.ts'), 'utf8')
const client = /ADSENSE_CLIENT\s*=\s*'([^']*)'/.exec(meta)?.[1] ?? ''

// f08c47fec0942fa0 is Google's fixed certification authority ID for AdSense.
const body = /^ca-pub-\d{10,20}$/.test(client)
  ? `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
  : '# Ads are not enabled yet. Set ADSENSE_CLIENT in src/data/meta.ts and rebuild.\n'

writeFileSync(join(root, 'public', 'ads.txt'), body)
console.log(`ads.txt: ${body.trim()}`)
