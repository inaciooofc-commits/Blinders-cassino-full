const CACHE_NAME='blinders-v4-login-pwa-visual';
const CORE=['/','/index.html','/manifest.webmanifest','/assets/v15/reference/home-dashboard-exact.png','/assets/v15/backgrounds/anime-casino-blue.png','/assets/v14/icons/home.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;e.respondWith(fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(r,copy)).catch(()=>null);return res;}).catch(()=>caches.match(r).then(c=>c||caches.match('/index.html'))));});
