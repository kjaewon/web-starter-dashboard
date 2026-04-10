const CACHE_NAME = 'dashboard-cache-destroy-v5';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always fetch from network to avoid caching issues during development
  event.respondWith(fetch(event.request));
});
