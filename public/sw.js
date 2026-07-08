/**
 * Privacy PDF Tools service worker — makes the app shell and tool code work offline.
 * Only same-origin GET requests are ever handled; nothing is sent anywhere.
 */
const CACHE = 'papermint-v1'

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
          const copy = response.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html').then((r) => r ?? Response.error())),
    )
    return
  }

  // Hashed build assets are immutable: cache first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
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
          const copy = response.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return response
        })
        .catch(() => hit ?? Response.error())
      return hit ?? refresh
    }),
  )
})
