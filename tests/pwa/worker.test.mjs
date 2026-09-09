import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness({ version = '200-new', failInstall = false, network = async () => new Response('network') } = {}) {
  const listeners = {}, stores = new Map(), deadlines = [];
  let forced = 0, claimed = 0, preload = 0;
  const build = { version, shell: '/assets/work-shell-new.html', precache: ['/assets/work-shell-new.html', '/assets/entry.js'] };
  class LocalRequest extends Request { constructor(url, options) { super(new URL(url, 'https://studio.test'), options); } }
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://studio.test').href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        addAll: async urls => {
          if (failInstall) throw new Error('Missing asset');
          for (const url of urls) data.set(key(url), new Response(key(url).includes('work-shell') ? 'release shell' : 'script'));
        },
        match: async (url, options = {}) => {
          const match = options.ignoreSearch ? [...data.keys()].find(k => k.split('?')[0] === key(url).split('?')[0]) : key(url);
          return data.get(match)?.clone();
        },
        put: async (url, response) => data.set(key(url), response.clone()),
      };
    },
  };
  const self = {
    location: { origin: 'https://studio.test' },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    skipWaiting: () => { forced++; },
    clients: { claim: async () => { claimed++; } },
    registration: { navigationPreload: { enable: async () => { preload++; } } },
  };
  vm.runInNewContext(readFileSync('public/admin-sw.js', 'utf8').replace('/*__PWA_BUILD__*/ null', JSON.stringify(build)), {
    self, caches, Request: LocalRequest, Response, URL, AbortController, fetch: network,
    setTimeout: (fn, ms) => { deadlines.push(ms); return setTimeout(fn, 10); }, clearTimeout,
  });
  async function lifecycle(name) { let done; listeners[name]({ waitUntil: value => { done = value; } }); await done; }
  async function fetchEvent(path, { mode = 'navigate', destination = 'document', preloadResponse = Promise.resolve(undefined), headers = new Headers() } = {}) {
    let response, lifetime;
    listeners.fetch({ request: { url: new URL(path, self.location.origin).href, mode, destination, method: 'GET', headers }, preloadResponse,
      respondWith: value => { response = value; }, waitUntil: value => { lifetime = value; } });
    const result = response && await response;
    await lifetime;
    return result;
  }
  return { caches, stores, deadlines, lifecycle, fetchEvent, counters: () => ({ forced, claimed, preload }) };
}

test('install precaches a complete shell and waits for old tabs', async () => {
  const h = harness(); await h.lifecycle('install');
  assert.equal((await h.caches.open('doll-work-shell-200-new')).match instanceof Function, true);
  assert.equal(h.stores.get('doll-work-shell-200-new').size, 2);
  assert.equal(h.counters().forced, 0);
});

test('failed installation removes only its incomplete cache', async () => {
  const h = harness({ failInstall: true });
  await h.caches.open('doll-work-shell-100-old'); await h.caches.open('other-app');
  await assert.rejects(h.lifecycle('install'), /Missing asset/);
  assert.deepEqual(await h.caches.keys(), ['doll-work-shell-100-old', 'other-app']);
});

test('activation preserves current and previous release and unrelated caches', async () => {
  const h = harness();
  for (const name of ['other-app', 'doll-work-shell-v8', 'doll-work-shell-50-older', 'doll-work-shell-100-old']) await h.caches.open(name);
  await h.lifecycle('install'); await h.lifecycle('activate');
  assert.deepEqual((await h.caches.keys()).sort(), ['doll-work-shell-100-old', 'doll-work-shell-200-new', 'other-app']);
  assert.deepEqual(h.counters(), { forced: 0, claimed: 1, preload: 1 });
});

test('preload is used without a second fetch and never overwrites release HTML', async () => {
  const h = harness({ network: async () => { throw new Error('Unexpected duplicate request'); } });
  await h.lifecycle('install');
  assert.equal(await (await h.fetchEvent('/admin/today', { preloadResponse: Promise.resolve(new Response('new network shell')) })).text(), 'new network shell');
  assert.equal(await (await (await h.caches.open('doll-work-shell-200-new')).match('/assets/work-shell-new.html')).text(), 'release shell');
});

test('hanging navigation falls back at 3 seconds for all private apps', async () => {
  const h = harness(); await h.lifecycle('install');
  for (const path of ['/admin/today', '/employee/', '/kiosk/']) {
    assert.equal(await (await h.fetchEvent(path, { preloadResponse: new Promise(() => {}) })).text(), 'release shell');
  }
  assert.deepEqual(h.deadlines, [3000, 3000, 3000]);
});

test('without a shell, a 15 second deadline returns a retry page', async () => {
  const h = harness();
  const response = await h.fetchEvent('/admin/today', { preloadResponse: new Promise(() => {}) });
  assert.equal(response.status, 503); assert.match(await response.text(), /Retry/);
  assert.deepEqual(h.deadlines, [15000]);
});

test('offline navigation uses shell; APIs, authorization and public navigation bypass cache', async () => {
  const h = harness({ network: async () => { throw new Error('Offline'); } }); await h.lifecycle('install');
  assert.equal(await (await h.fetchEvent('/admin/today')).text(), 'release shell');
  for (const path of ['/api/auth/me', '/api/admin/work/today', '/', '/administrator']) assert.equal(await h.fetchEvent(path), undefined);
  assert.equal(await h.fetchEvent('https://api.test/data', { destination: 'script', mode: 'cors' }), undefined);
  assert.equal(await h.fetchEvent('/private.js', { destination: 'script', mode: 'cors', headers: new Headers({ Authorization: 'Bearer test' }) }), undefined);
});

test('static assets are cached once; private responses are never cached', async () => {
  let calls = 0;
  const h = harness({ network: async request => { calls++; return new Response('asset', { headers: request.url.includes('private') ? { 'Cache-Control': 'private, no-store' } : {} }); } });
  await h.lifecycle('install');
  const options = { destination: 'script', mode: 'cors' };
  await h.fetchEvent('/assets/page.js', options); await h.fetchEvent('/assets/page.js', options);
  assert.equal(calls, 1);
  await h.fetchEvent('/private.js', options); await h.fetchEvent('/private.js', options);
  assert.equal(calls, 3);
});
