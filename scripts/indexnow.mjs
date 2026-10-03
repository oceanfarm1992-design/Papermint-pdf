/**
 * Notify IndexNow search engines (Bing, Yandex, Seznam, Naver…) of every URL in
 * the live sitemap, so new and changed pages are crawled within hours instead
 * of waiting for discovery.
 *
 * Runs after a production deploy (.github/workflows/indexnow.yml) or manually:
 *   npm run indexnow
 *
 * Ownership is proven by public/<key>.txt, whose content is the key itself.
 * The key is public by design (search engines fetch it), so it is not a secret.
 * Before submitting, the script waits until the deployed site serves that file,
 * since Cloudflare may still be building when this starts.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const meta = readFileSync(join(root, 'src', 'data', 'meta.ts'), 'utf8')
const SITE = /SITE_URL\s*=\s*'([^']+)'/.exec(meta)?.[1] ?? 'https://privacypdftools.com'

const ENDPOINT = 'https://api.indexnow.org/indexnow'
const KEY_FILE_PATTERN = /^[0-9a-f]{32}\.txt$/
const WAIT_ATTEMPTS = 20
const WAIT_MS = 30_000
const MAX_URLS = 10_000 // IndexNow per-request limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function readKey() {
  const files = readdirSync(join(root, 'public')).filter((f) => KEY_FILE_PATTERN.test(f))
  if (files.length !== 1) {
    throw new Error(`expected exactly one IndexNow key file in public/, found ${files.length}`)
  }
  const key = readFileSync(join(root, 'public', files[0]), 'utf8').trim()
  if (`${key}.txt` !== files[0]) throw new Error(`key file ${files[0]} content does not match its name`)
  return key
}

/** Wait until the live site serves the key file (i.e. the deploy is out). */
async function waitForKeyFile(keyUrl, key) {
  for (let attempt = 1; attempt <= WAIT_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${keyUrl}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok && (await res.text()).trim() === key) return
      console.log(
        `indexnow: key file not live yet (HTTP ${res.status}), attempt ${attempt}/${WAIT_ATTEMPTS}`,
      )
    } catch (err) {
      console.log(
        `indexnow: key file check failed (${err.message}), attempt ${attempt}/${WAIT_ATTEMPTS}`,
      )
    }
    if (attempt < WAIT_ATTEMPTS) await sleep(WAIT_MS)
  }
  throw new Error(`key file never became available at ${keyUrl}`)
}

async function liveSitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`)
  const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  if (urls.length === 0) throw new Error('sitemap contains no <loc> entries')
  return urls.slice(0, MAX_URLS)
}

const key = readKey()
const keyLocation = `${SITE}/${key}.txt`
await waitForKeyFile(keyLocation, key)
const urlList = await liveSitemapUrls()

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation, urlList }),
})
// 200 = accepted, 202 = accepted pending key validation; anything else is a failure.
if (res.status !== 200 && res.status !== 202) {
  throw new Error(`IndexNow rejected the submission: HTTP ${res.status} ${await res.text()}`)
}
console.log(`indexnow: submitted ${urlList.length} URLs (HTTP ${res.status})`)
