const CACHE_NAME = 'hybe-giveaway-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/success.html',
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
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve(true))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // Navigation requests: allow direct HTML pages like /success.html; otherwise serve SPA index.html
        if (event.request.mode === 'navigate') {
          const url = new URL(event.request.url);
          if (url.pathname === '/success.html') {
            const cachedSuccess = await caches.match('/success.html');
            if (cachedSuccess) return cachedSuccess;
            const resp = await fetch('/success.html');
            try { const cache = await caches.open(CACHE_NAME); cache.put('/success.html', resp.clone()); } catch (e) { /* ignore */ }
            return resp;
          }
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const response = await fetch('/index.html');
          // populate cache for future navigations
          try { const cache = await caches.open(CACHE_NAME); cache.put('/index.html', response.clone()); } catch (e) { /* ignore */ }
          return response;
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
        // On any failure, attempt to serve cached index.html as a fallback for navigation or return a generic offline response.
        console.error('Service worker fetch failed:', err);
        const fallback = await caches.match('/index.html');
        if (fallback) return fallback;
        return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
