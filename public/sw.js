// Service Worker para YouCut PWA - Habilita a instalação no Android
const CACHE_NAME = 'youcut-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // Ignora erros se alguns arquivos de desenvolvimento não estiverem pré-compilados
        console.log('Pre-caching skip details');
      });
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    }).catch(() => {
      return fetch(e.request);
    })
  );
});
