const CACHE_NAME = 'phama-cache-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './admin-login.html',
  './seller-login.html',
  './admin.html',
  './seller.html',
  './assets/phama.css',
  './js/database.js',
  './js/auth.js',
  './js/admin-app.js',
  './js/seller-app.js',
  './js/supabase.js',
  './img/banner.png',
  './img/bg01.png',
  './img/team.png',
  './img/user-avatar.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './manifest.json'
];

// Install Event - Pre-cache critical assets resiliently
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        console.log('[Service Worker] Pre-caching offline assets...');
        const cachePromises = PRECACHE_ASSETS.map(async asset => {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`[Service Worker] Failed to pre-cache asset: ${asset}`, err);
          }
        });
        await Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve cached static assets, network-first for other requests
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Check if the request is for a pre-cached asset
  const isPrecached = PRECACHE_ASSETS.some(asset => {
    // Match relative paths or absolute file names
    const path = asset.replace(/^\.\//, '');
    return url.pathname.endsWith(path) || (asset === './' && url.pathname === '/');
  });

  if (isPrecached) {
    // Cache-First, fallback to Network
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
    );
  } else {
    // Network-First, fallback to Cache (for dynamic/third-party API/CDN requests)
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Clone and cache successful response
          if (networkResponse && networkResponse.status === 200 && !url.pathname.includes('/rest/v1/')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If it's a page navigation, return cached home page
              if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
              }
              return new Response('Offline content not available.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' })
              });
            });
        })
    );
  }
});
