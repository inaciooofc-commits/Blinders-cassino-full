const CACHE_NAME = 'blinders-v5-ninja-release-final';
const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/v16/logos/blinders-ninja-logo.png',
  '/assets/v16/bg/login.png',
  '/assets/v16/bg/home.png',
  '/assets/v16/bg/games.png',
  '/assets/v16/bg/admin.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
});
