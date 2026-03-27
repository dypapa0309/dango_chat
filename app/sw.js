const CACHE = 'dango-v1'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/img/favicon.svg',
  '/assets/img/home/logo.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // API / Netlify functions → 항상 네트워크
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) {
    return
  }

  // GET 요청만 캐싱
  if (request.method !== 'GET') return

  e.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
        }
        return res
      })
      // 캐시 있으면 즉시 반환 + 백그라운드 갱신, 없으면 네트워크
      return cached || fresh
    })
  )
})
