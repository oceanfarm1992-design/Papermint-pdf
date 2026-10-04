/**
 * Privacy PDF Tools service worker — makes the app shell and tool code work offline.
 * Only same-origin GET requests are ever handled; nothing is sent anywhere.
 *
 * v2: v1 cached whatever /assets/ request returned, forever. The host answers a
 * missing file with the SPA index.html (HTTP 200, text/html), so a chunk requested
 * around a deploy could be cached as HTML and break that tool permanently in that
 * browser. Bumping CACHE makes every client drop the v1 cache on activate.
 */
const CACHE = 'papermint-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** Only store real, successful responses — never an HTML fallback for a script/style. */
function isCacheable(response, pathname) {
  if (!response || !response.ok || response.type === 'opaque') return false
  const type = response.headers.get('content-type') || ''
  if (/\.(m?js|css|wasm|json|svg|png|webp|ico|webmanifest)$/i.test(pathname)) {
    return !type.includes('text/html')
  }
  return true
}

function store(request, response, key) {
  const pathname = new URL(request.url).pathname
  if (!isCacheable(response, pathname)) return
  const copy = response.clone()
  caches.open(CACHE).then((c) => c.put(key ?? request, copy))
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never touch cross-origin (e.g. OCR models)

  // Navigations: network first, fall back to cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          store(request, response, '/index.html')
          return response
        })
        .catch(() => caches.match('/index.html').then((r) => r ?? Response.error())),
    )
    return
  }

  // Hashed build assets are immutable: cache first (but only genuine files)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            store(request, response)
            return response
          }),
      ),
    )
    return
  }

  // Everything else (icons, manifest): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((hit) => {
      const refresh = fetch(request)
        .then((response) => {
          store(request, response)
          return response
        })
        .catch(() => hit ?? Response.error())
      return hit ?? refresh
    }),
  )
})
