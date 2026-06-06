const CACHE_NAME = 'blinders-evolution-full-v1';
const STATIC_ASSETS = [
  '/',
  '/menu',
  '/games',
  '/graphics',
  '/assets/backgrounds/lobby.svg',
  '/assets/icons/home.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).pathname.startsWith('/.netlify/functions/')) return;
  event.respondWith(
    fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => null);
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('/')))
  );
});
