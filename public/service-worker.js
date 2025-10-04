const CACHE_NAME = 'hybe-giveaway-v2';
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Use Promise.allSettled so a single missing asset doesn't reject the entire install.
      const results = await Promise.allSettled(ASSETS.map((path) => cache.add(path)));
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length) {
        console.warn('Some assets failed to cache during install:', failures);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // Navigation requests: always go to network for the freshest app shell.
        if (event.request.mode === 'navigate') {
          return fetch(event.request);
        }

        // For other requests: try cache first, then network. If network succeeds, cache GET same-origin responses.
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        try {
          if (event.request.method === 'GET' && response && response.ok && new URL(event.request.url).origin === location.origin) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone()).catch(() => {});
          }
        } catch (e) { /* ignore cache put errors */ }
        return response;
      } catch (err) {
        // On failure, return a minimal offline page to avoid stale caches.
        console.error('Service worker fetch failed:', err);
        const offlineHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b0b0b;color:#fff;font-family:sans-serif}</style></head><body><div><h1>You are offline</h1><p>Please check your connection and try again.</p></div></body></html>';
        return new Response(offlineHtml, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })()
  );
});
