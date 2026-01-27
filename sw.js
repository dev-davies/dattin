const CACHE_NAME = 'dat-tin-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  // CSS
  './css/main.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  // JavaScript
  './js/app.js',
  './js/constants.js',
  './js/utils.js',
  './js/sound-manager.js',
  './js/ui-manager.js',
  './js/game-manager.js',
  // Libraries
  './lib/splitting.min.js',
  // Data
  './data/cards.json',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // Cache miss - fetch from network
      return fetch(event.request);
    })
  );
});

// Activate event - clean up old caches
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
});
