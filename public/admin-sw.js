// Replaced after Vite + prerender. An unbuilt worker deliberately cannot install.
const BUILD = /*__PWA_BUILD__*/ null;
const PREFIX = 'doll-work-shell-';
const CACHE_NAME = BUILD ? PREFIX + BUILD.version : PREFIX + 'unbuilt';
const PRIVATE_PATH = /^\/(admin|employee|kiosk)(\/|$)/;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (!BUILD) throw new Error('Missing PWA build manifest');
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(BUILD.precache.map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
  // Let existing tabs finish on their current release; never force a reload.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    const names = (await caches.keys()).filter(name => name.startsWith(PREFIX) && name !== CACHE_NAME);
    // Timestamped release names sort chronologically; legacy v8 is oldest.
    names.sort((a, b) => Number(b.slice(PREFIX.length).split('-')[0]) - Number(a.slice(PREFIX.length).split('-')[0]) || b.localeCompare(a));
    const previous = names.find(name => /^\d+-/.test(name.slice(PREFIX.length))) || names[0];
    await Promise.all(names.filter(name => name !== previous).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

function connectionError() {
  return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Connection unavailable</title><body><main><h1>Couldn’t connect to Doll Work</h1><p>Check your connection and try again.</p><button onclick="location.reload()">Retry</button></main></body></html>', {
    status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function navigation(event) {
  const cache = await caches.open(CACHE_NAME);
  const stored = BUILD && await cache.match(BUILD.shell);
  // Clean-URL hosts can redirect the precache .html URL. A navigation response
  // must not carry that redirected response URL into a different private route.
  const cached = stored && new Response(stored.body, { status: stored.status, statusText: stored.statusText, headers: stored.headers });
  const controller = new AbortController();
  let timer;
  const network = (async () => {
    const preloaded = await event.preloadResponse;
    const response = preloaded || await fetch(event.request, { signal: controller.signal });
    if (!response.ok) throw new Error('Navigation unavailable');
    return response;
  })().catch(() => cached || connectionError());
  try {
    return await Promise.race([
      network,
      new Promise(resolve => {
        timer = setTimeout(() => {
          resolve(cached || connectionError());
          controller.abort();
        }, cached ? 3000 : 15000);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || /^\/api(\/|$)/.test(url.pathname) || request.headers.has('Authorization')) return;
  if (request.mode === 'navigate') {
    if (PRIVATE_PATH.test(url.pathname)) event.respondWith(navigation(event));
    return;
  }
  if (!['script', 'style', 'image', 'font'].includes(request.destination)) return;
  let cacheWrite = Promise.resolve();
  const responsePromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    // Manifest icons have a version query; the same release's login uses the bare URL.
    const cached = await cache.match(request, { ignoreSearch: url.pathname === '/logo-doll.png' });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && !/no-store|private/i.test(response.headers.get('Cache-Control') || '')) {
      const copy = response.clone();
      cacheWrite = cache.put(request, copy).catch(() => {});
    }
    return response;
  })();
  event.respondWith(responsePromise);
  event.waitUntil(responsePromise.then(() => cacheWrite).catch(() => {}));
});
