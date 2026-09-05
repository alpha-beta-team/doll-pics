const CACHE_NAME = 'doll-work-shell-v8';
const SHELL = [
  '/admin',
  '/admin/today',
  '/employee',
  '/kiosk',
  '/manifest.webmanifest',
  '/employee.webmanifest',
  '/kiosk.webmanifest',
  '/logo-doll.png?v=20260810',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;
  if (request.mode === 'navigate') {
    const shell = url.pathname.startsWith('/admin')
      ? '/admin'
      : url.pathname.startsWith('/employee')
        ? '/employee'
        : url.pathname.startsWith('/kiosk')
          ? '/kiosk'
          : '';
    if (!shell) return;
    event.respondWith(fetch(request).catch(() => caches.match(shell)));
    return;
  }
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    let cacheWrite = Promise.resolve();
    const responsePromise = caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        // Clone before the browser receives (and may consume) the response body.
        const cacheResponse = response.clone();
        cacheWrite = caches.open(CACHE_NAME)
          .then(cache => cache.put(request, cacheResponse))
          .catch(() => {}); // Cache failures must not fail a successful asset load.
      }
      return response;
    }));
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise.then(() => cacheWrite).catch(() => {}));
  }
});
