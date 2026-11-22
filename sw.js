// Offline cache. Bump the version when index.html changes so phones pick up the update.
const CACHE = 'gas-sniffer-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first so updates arrive when online. Anything other than a good answer
// (offline, or the site taken down and returning 404) falls back to the cached copy,
// and never overwrites it.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true });
    try {
      const r = await fetch(e.request);
      if (r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }
      return cached || r;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
