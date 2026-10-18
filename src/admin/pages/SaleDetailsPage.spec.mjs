import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const { act, createElement } = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter, Routes, Route, useLocation } = require('react-router-dom');

const output = await build({
  stdin: { contents: "export { SaleDetailsPage } from './src/admin/pages/SaleDetailsPage'; export { ConfirmDialogContext } from './src/admin/hooks/useConfirmDialog';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false, tsconfig: 'tsconfig.app.json',
  plugins: [{ name: 'fake-sales-api', setup(build) {
    build.onResolve({ filter: /api\/client$/ }, () => ({ path: 'sales-api', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const api = globalThis.__saleEditTestApi;', loader: 'js' }));
  } }],
});

for (const scenario of ['accept', 'cancel', 'failure', 'draft', 'paused', 'archived']) {
  test(`sale detail editing: ${scenario}`, async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin/sales/sale' });
    const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT', '__saleEditTestApi'];
    const previous = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const calls = [];
    const confirmations = [];
    const state = ['draft', 'paused', 'archived'].includes(scenario) ? scenario : 'published';
    const sale = { _id: 'sale', name: 'Diwali', state, phase: state, enabled: true, revision: 1, showUpcoming: false, description: '', terms: '', startsAt: '2030-11-01T00:00:00Z', endsAt: '2030-11-10T00:00:00Z', discountType: 'percentage', discountValue: 20, packageIds: [], packages: [] };
    Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
    Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
    Object.defineProperty(globalThis, '__saleEditTestApi', { configurable: true, value: {
      getSale: async () => sale,
      saleAction: async (...args) => { calls.push(args); if (scenario === 'failure') throw new Error('Could not pause sale'); },
    } });
    const compiled = new Module('sale-edit-page-test');
    compiled.filename = path.join(process.cwd(), 'sale-edit-page-test.cjs');
    compiled.paths = Module._nodeModulePaths(process.cwd());
    compiled._compile(output.outputFiles[0].text, compiled.filename);
    const { SaleDetailsPage, ConfirmDialogContext } = compiled.exports;
    const root = createRoot(dom.window.document.getElementById('root'));
    function EditorDestination() { return createElement('p', null, `Editor ${useLocation().search}`); }
    try {
      await act(async () => root.render(createElement(MemoryRouter, { initialEntries: ['/admin/sales/sale'] },
        createElement(ConfirmDialogContext.Provider, { value: async options => { confirmations.push(options); return scenario !== 'cancel'; } },
          createElement(Routes, null,
            createElement(Route, { path: '/admin/sales/:id', element: createElement(SaleDetailsPage) }),
            createElement(Route, { path: '/admin/sales', element: createElement(EditorDestination) }))))));
      const buttons = [...dom.window.document.querySelectorAll('button')];
      const edit = buttons.find(button => button.textContent === 'Pause & edit');
      if (['draft', 'paused'].includes(scenario)) {
        assert.equal(edit, undefined);
        assert.ok(dom.window.document.querySelector('a[href="/admin/sales?edit=sale"]'));
      } else if (scenario === 'archived') {
        assert.equal(edit, undefined);
        assert.equal(dom.window.document.querySelector('a[href="/admin/sales?edit=sale"]'), null);
      } else {
        assert.ok(edit);
        await act(async () => edit.click());
        assert.match(confirmations[0].description, /stops new offer bookings immediately/);
        assert.match(confirmations[0].description, /Cancelling the editor leaves the sale paused/);
        if (scenario === 'accept') {
          assert.deepEqual(calls, [['sale', 'pause']]);
          assert.match(dom.window.document.body.textContent, /Editor \?edit=sale/);
        } else {
          assert.doesNotMatch(dom.window.document.body.textContent, /Editor/);
          assert.equal(calls.length, scenario === 'cancel' ? 0 : 1);
          if (scenario === 'failure') assert.match(dom.window.document.querySelector('[role="alert"]').textContent, /Could not pause sale/);
        }
      }
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
