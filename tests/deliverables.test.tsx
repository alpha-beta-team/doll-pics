import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { Simulate } from 'react-dom/test-utils';
import { JSDOM } from 'jsdom';
import { DeliverablePresetPicker } from '../src/admin/components/DeliverablePresetPicker';
import { DeliverablesEditor } from '../src/admin/components/DeliverablesEditor';
import { BookingDeliverablesPanel } from '../src/admin/components/BookingDeliverablesPanel';
import { defaultDeliverables, deliverableExtraTotal, deliverableInputs, configurationDeliverables, applyDeliverableConfiguration } from '../src/shared/deliverables';
import type { BookingDeliverable, DeliverableType } from '../src/shared/deliverables';
import type { Booking } from '../src/admin/types';
import { api } from '../src/admin/api/client';
import { CustomerBookingPresentation } from '../src/components/CustomerBookingPresentation';

const catalog: DeliverableType[] = [{ id: 'frame', name: 'Frame', unit: 'pieces', specifications: '12 × 18 inches', kind: 'physical', defaultQuantity: 2, selectedByDefault: true, active: true, order: 0 }, { id: 'old', name: 'Old album', unit: 'pieces', specifications: '', kind: 'physical', defaultQuantity: 1, selectedByDefault: true, active: false, order: 1 }];
async function mount(element: React.ReactNode) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin/bookings' });
  const previous = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  for (const [key, value] of [['window', dom.window], ['document', dom.window.document], ['IS_REACT_ACT_ENVIRONMENT', true]] as const) Object.defineProperty(globalThis, key, { configurable: true, value });
  const root = createRoot(dom.window.document.getElementById('root')!);
  await act(async () => root.render(element));
  return { document: dom.window.document,
    async click(text: string) { const button = [...dom.window.document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || b.textContent) === text); assert.ok(button, text); await act(async () => button.click()); },
    async change(selector: string, value: string) { const input = dom.window.document.querySelector<HTMLInputElement>(selector); assert.ok(input, selector); await act(async () => { input.value = value; Simulate.change(input); }); },
    async close() { await act(async () => root.unmount()); dom.window.close(); for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } },
  };
}

test('editor preserves included rows, permits separate extras, and keeps fixed specifications', async () => {
  let current: BookingDeliverable[] = [];
  function Harness() { const [rows, setRows] = useState(defaultDeliverables(catalog)); current = rows; return createElement(DeliverablesEditor, { catalog, rows, onChange: setRows }); }
  const view = await mount(createElement(Harness));
  try {
    assert.equal(current.length, 1);
    assert.equal(current[0].quantity, 2);
    assert.equal(view.document.querySelector('option[value="old"]'), null);
    await view.change('select[aria-label="Deliverable to add"]', 'frame');
    await view.click('Add item');
    assert.equal(current.length, 2);
    const selects = view.document.querySelectorAll('article select');
    await act(async () => { (selects[1] as HTMLSelectElement).value = 'extra'; Simulate.change(selects[1]); });
    await view.change('article:nth-of-type(2) input[step="0.01"]', '500');
    await view.change('article:nth-of-type(2) input[step="1"]', '3');
    assert.equal(deliverableExtraTotal(current), 500);
    assert.equal(current[0].category, 'included');
    assert.equal(current[1].quantity, 3);
    assert.equal(view.document.querySelectorAll('article input:not([type="number"])').length, 0);
    assert.equal('specifications' in deliverableInputs(current)[0], false);
  } finally { await view.close(); }
});

test('booking editor retains unsaved changes after failure and submits the original revision on retry', async () => {
  const originalGet = api.getDeliverables, originalUpdate = api.updateBooking, originalConfig = api.getDeliverableConfiguration;
  const calls: object[] = [];
  const booking = { id: 'booking', updatedAt: '2030-01-01T00:00:00.000Z', deliverables: [] } as unknown as Booking;
  let saved = false;
  api.getDeliverables = async () => catalog;
  api.getDeliverableConfiguration = async () => ({ revision: 1, base: [], seasonal: [] });
  api.updateBooking = async (_id, body) => { calls.push(body); if (calls.length === 1) throw new Error('Temporary failure'); return booking; };
  const view = await mount(createElement(BookingDeliverablesPanel, { booking, canManage: true, canPrice: true, onSaved: () => { saved = true; } }));
  try {
    await view.click('Edit deliverables');
    await view.change('select[aria-label="Deliverable to add"]', 'frame');
    await view.click('Add item');
    await view.change('input[maxlength="1000"]', 'Agreed with customer');
    await view.click('Save deliverables');
    assert.match(view.document.body.textContent!, /Temporary failure/);
    await view.click('Save deliverables');
    assert.equal(saved, true);
    assert.deepEqual(calls[0], calls[1]);
  } finally { api.getDeliverables = originalGet; api.updateBooking = originalUpdate; api.getDeliverableConfiguration = originalConfig; await view.close(); }
});

test('customer presentation renders names and quantities without internal metadata', () => {
  const html = renderToStaticMarkup(createElement(CustomerBookingPresentation, { booking: { customerName: 'Test', shootType: '', packageName: '', bookingDate: '', startTime: '', endTime: '', location: '', status: 'confirmed', expectedDeliveryDate: '', update: '', delivery: {}, deliverables: [{ name: 'Frame', quantity: 3 }] } }));
  assert.match(html, /Your deliverables/);
  assert.match(html, /Frame/);
  assert.doesNotMatch(html, /Complimentary|Paid extra|Extra total/);
});


test('seasonal extensions inherit the current base; switching preserves paid extras and manual gifts', () => {
  const base = { id: 'base-album', name: 'Album', quantity: 1, kind: 'physical' as const, unit: 'pieces', specifications: '20 pages', category: 'included' as const };
  const gift = { ...base, id: 'seasonal-magazine', name: 'Magazine', category: 'complimentary' as const };
  const configuration = { revision: 1, base: [base], seasonal: [{ id: 'diwali', name: 'Diwali', active: true, items: [gift] }] };
  const selected = configurationDeliverables(configuration, 'diwali');
  assert.deepEqual(selected.map(row => row.name), ['Album', 'Magazine']);
  assert.equal(selected[1].reason, 'Diwali');
  const paid = { ...selected[0], id: 'manual-extra', category: 'extra' as const, amount: 500 };
  const manualGift = { ...selected[1], id: 'manual-gift', reason: 'Owner gift' };
  const next = applyDeliverableConfiguration({ ...configuration, base: [{ ...base, quantity: 2 }] }, '', [...selected, paid, manualGift]);
  assert.equal(next[0].quantity, 2);
  assert.ok(next[0].id.startsWith('preset:base:base-album:'));
  assert.deepEqual(next.slice(1).map(row => row.id), ['manual-extra', 'manual-gift']);
  assert.equal(deliverableExtraTotal(next), 500);
  assert.equal(selected[0].quantity, 1, 'previous booking snapshot stays unchanged');
  assert.equal(configurationDeliverables({ ...configuration, seasonal: [{ ...configuration.seasonal[0], active: false }] }, 'diwali').length, 1);
});


test('selecting Christmas immediately adds Calendar and preserves paid extras and manual gifts', async () => {
  const item = { id: 'album', name: 'Album', quantity: 1, kind: 'physical' as const, unit: 'pieces', specifications: '20 pages', category: 'included' as const };
  const configuration = { revision: 1, base: [item], seasonal: [{ id: 'christmas', name: 'Christmas', active: true, items: [{ ...item, id: 'calendar', name: 'Calendar', category: 'complimentary' as const }] }] };
  const extra: BookingDeliverable = { ...item, id: 'extra', catalogId: 'album', category: 'extra', amount: 500, quantity: 2 };
  const gift: BookingDeliverable = { ...item, id: 'manual-gift', catalogId: 'album', category: 'complimentary', amount: 0, reason: 'Customer gift' };
  let current: BookingDeliverable[] = [];
  function Harness() {
    const [rows, setRows] = useState([...configurationDeliverables(configuration), extra, gift]);
    current = rows;
    return createElement(DeliverablePresetPicker, { configuration, rows, onApply: setRows });
  }
  const view = await mount(createElement(Harness));
  try {
    await view.change('select[aria-label="Deliverable list"]', 'christmas');
    assert.deepEqual(current.map(row => row.name), ['Album', 'Calendar', 'Album', 'Album']);
    assert.equal(current[1].reason, 'Christmas');
    assert.equal(current[1].category, 'complimentary');
    assert.deepEqual(current.slice(2), [extra, gift]);
    assert.equal(deliverableExtraTotal(current), 500);
    await view.change('select[aria-label="Deliverable list"]', '');
    assert.equal(current.some(row => row.name === 'Calendar'), false);
    assert.deepEqual(current.slice(1), [extra, gift]);
  } finally { await view.close(); }
});
