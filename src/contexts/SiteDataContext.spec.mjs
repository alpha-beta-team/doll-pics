import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Module } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const { act, createElement, StrictMode } = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter } = require('react-router-dom');

for (const route of ['/wedding-packages-erode', '/packages']) {
test(`${route} provider displays package results even when optional media requests fail`, async () => {
  const output = await build({ entryPoints: ['src/contexts/SiteDataContext.tsx'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false, tsconfig: 'tsconfig.app.json', define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: 'http://packages.test/api', DEV: true, PROD: false }) } });
  const compiled = new Module('package-provider-test');
  compiled.filename = path.join(process.cwd(), 'package-provider-test.cjs');
  compiled.paths = Module._nodeModulePaths(process.cwd());
  compiled._compile(output.outputFiles[0].text, compiled.filename);
  const { SiteDataProvider, useSiteData } = compiled.exports;
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/wedding-packages-erode' });
  const previous = new Map(['window', 'document', 'fetch', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let photoFailures = 0;
  const fixtures = {
    '/api/site-content': { serviceNavLinks: [] },
    '/api/hero-slides': [],
    '/api/package-categories': [{ name: 'Wedding', slug: 'wedding', path: '/wedding-packages-erode' }],
    '/api/packages': [{ id: 'gold', name: 'Wedding Gold', categoryName: 'Wedding', categorySlug: 'wedding', pricingMode: 'price', price: 10000, inclusions: [], description: '' }],
  };
  Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async input => {
    const url = new URL(String(input));
    if (url.pathname === '/api/photos') { photoFailures++; throw new Error('Optional media unavailable'); }
    assert.equal(url.hostname, 'packages.test');
    assert.ok(url.pathname in fixtures, `Unexpected endpoint: ${url.pathname}`);
    return new Response(JSON.stringify(fixtures[url.pathname]), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const root = createRoot(dom.window.document.getElementById('root'));
  let state;
  function Probe() {
    state = useSiteData();
    return createElement('div', null, state.packages.filter(pkg => pkg.categorySlug === 'wedding').map(pkg => pkg.name).join(', '));
  }
  try {
    await act(async () => root.render(createElement(StrictMode, null, createElement(MemoryRouter, { initialEntries: [route] }, createElement(SiteDataProvider, null, createElement(Probe))))));
    for (let attempt = 0; attempt < 30 && (!state?.packages.length || (route !== '/packages' && !photoFailures)); attempt++) {
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    }
    assert.match(dom.window.document.body.textContent, /Wedding Gold/);
    assert.equal(state.packagesLoading, false);
    assert.equal(state.packagesError, '');
    if (route !== '/packages') assert.ok(photoFailures > 0);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

}
