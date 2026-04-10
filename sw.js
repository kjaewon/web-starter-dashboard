const CACHE_NAME = 'dashboard-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './config.json',
  './manifest.json',
  './css/style.css',
  './css/glassmorphism.css',
  './js/app.js',
  './js/widgets.js',
  './js/productivity.js',
  './js/dragdrop.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Network first, fallback to cache for dynamic requests like config.json
  // Not heavily caching external API calls (weather, unsplash) to keep them fresh
  if (event.request.url.includes('api.openweathermap.org') || event.request.url.includes('unsplash')) {
    return; // Let browser handle it normally
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cache
        }
        return fetch(event.request); // Return network
      })
  );
});
