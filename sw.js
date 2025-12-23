const CACHE_NAME = 'noor-inventory-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache first strategy for static assets, network first for others
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like ESM CDN) for strict caching, 
  // or handle them with Stale-While-Revalidate if needed.
  // For simplicity, we just try cache then network.
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache successful GET requests to same origin or ESM CDN
        if (
          event.request.method === 'GET' &&
          fetchResponse.status === 200 &&
          (event.request.url.startsWith(self.location.origin) || 
           event.request.url.includes('esm.sh') ||
           event.request.url.includes('cdn.tailwindcss.com'))
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});