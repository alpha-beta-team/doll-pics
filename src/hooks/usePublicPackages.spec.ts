import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import type { PublicPackage } from '../shared/types';
import { usePublicPackages } from './usePublicPackages';
const wedding: PublicPackage = { id: 'wedding-gold', name: 'Wedding Gold', description: '', inclusions: [], pricingMode: 'price', price: 10000, categorySlug: 'wedding' };
function deferred() {
  let resolve!: (value: PublicPackage[]) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<PublicPackage[]>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function mount(load: (signal?: AbortSignal) => Promise<PublicPackage[]>, strict = false) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/wedding-packages-erode' });
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'] as const;
  const before = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  const root = createRoot(dom.window.document.getElementById('root')!);
  let resource!: ReturnType<typeof usePublicPackages>;
  function Probe({ enabled }: { enabled: boolean }) { resource = usePublicPackages(load, enabled); return createElement('div', null, resource.packages.map(pkg => pkg.name).join(',')); }
  const render = async (enabled = true) => { await act(async () => { const child = createElement(Probe, { enabled }); root.render(strict ? createElement(StrictMode, null, child) : child); }); };
  return { render, get value() { return resource; }, async close() {
    await act(async () => root.unmount()); dom.window.close();
    for (const [key, descriptor] of before) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  } };
}
test('route cancellation cannot strand package loading or let a stale result overwrite current packages', async () => {
  const requests: ReturnType<typeof deferred>[] = [];
  const signals: AbortSignal[] = [];
  const view = mount(signal => { const request = deferred(); requests.push(request); signals.push(signal!); return request.promise; });
  try {
    await view.render(); assert.equal(view.value.packagesLoading, true);
    await view.render(false); assert.equal(signals[0].aborted, true);
    await view.render(true); assert.equal(requests.length, 2);
    await act(async () => { requests[1].resolve([wedding]); });
    await act(async () => { requests[0].resolve([]); });
    assert.equal(view.value.packages[0].name, 'Wedding Gold');
    assert.equal(view.value.packagesLoading, false);
  } finally { await view.close(); }
});
test('React StrictMode cleanup permits a fresh package request', async () => {
  const requests: ReturnType<typeof deferred>[] = [];
  const view = mount(() => { const request = deferred(); requests.push(request); return request.promise; }, true);
  try {
    await view.render(); assert.equal(requests.length, 2);
    await act(async () => { requests[1].resolve([wedding]); requests[0].resolve([]); });
    assert.equal(view.value.packages.length, 1); assert.equal(view.value.packagesError, '');
  } finally { await view.close(); }
});
test('failed initial loading is retryable and a successful empty response is not an error', async () => {
  let calls = 0;
  const view = mount(async () => { if (++calls === 1) throw new Error('Offline'); return []; });
  try {
    await view.render(); assert.equal(view.value.packagesError, 'Offline');
    assert.equal(view.value.packagesLoading, false);
    await act(async () => { view.value.retryPackages(); });
    assert.equal(calls, 2); assert.equal(view.value.packagesError, ''); assert.deepEqual(view.value.packages, []);
  } finally { await view.close(); }
});
test('failed price refresh preserves the packages already displayed', async () => {
  let calls = 0;
  const view = mount(async () => { if (++calls === 1) return [wedding]; throw new Error('Refresh failed'); });
  try {
    await view.render(); await act(async () => { view.value.retryPackages(); });
    assert.equal(view.value.packages[0].id, wedding.id);
    assert.equal(view.value.packagesError, 'Refresh failed'); assert.equal(view.value.packagesLoading, false);
  } finally { await view.close(); }
});

test('returning to package pages revalidates previously loaded prices', async () => {
  let calls = 0;
  const view = mount(async () => { calls++; return [wedding]; });
  try {
    await view.render(); assert.equal(calls, 1);
    await view.render(false); await view.render(true);
    assert.equal(calls, 2); assert.equal(view.value.packages.length, 1);
  } finally { await view.close(); }
});
