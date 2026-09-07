const CACHE_NAME = 'arabi-app-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=> cache.addAll(SHELL_FILES)).catch(()=>{})
  );
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for the app shell so updates show up quickly, falling back to
// cache when offline. Everything else (Firebase, CDN libraries) goes straight
// to the network since it needs to stay live/current.
self.addEventListener('fetch', event=>{
  const req = event.request;
  if(req.method !== 'GET') return;
  const isShell = SHELL_FILES.some(f => req.url.endsWith(f.replace('./','')));
  if(!isShell) return;
  event.respondWith(
    fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache=> cache.put(req, copy));
      return res;
    }).catch(()=> caches.match(req))
  );
});
