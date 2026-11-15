import React, { act } from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerCode } from '../src/admin/components/CustomerCode';
import { CustomerIdentityChoice } from '../src/admin/components/CustomerIdentityChoice';
import { mapBooking } from '../src/admin/api/mappers';
import { bookingMatchesSearch } from '../src/admin/components/bookings/bookingList';
import { BookingCard } from '../src/admin/components/bookings/BookingCard';

const code = 'DP-C202611-0001';
test('booking mapper preserves identity and list search finds codes case-insensitively', () => {
  const booking = mapBooking({ _id: 'booking', customerId: 'customer', customerCode: code, customerName: 'Ramya', customerPhone: '9876543210' });
  assert.equal(booking.customerId, 'customer');
  assert.equal(booking.customerCode, code);
  assert.equal(bookingMatchesSearch(booking, 'dp-c202611-0001'), true);
  assert.equal(bookingMatchesSearch(booking, 'DP-C2026'), true);
  assert.equal(bookingMatchesSearch(booking, 'DP-C2025'), false);
  assert.equal(mapBooking({ _id: 'legacy' }).customerCode, undefined);
  const html = renderToStaticMarkup(<BookingCard booking={booking} canViewPayments={false} showPricing={false} canViewPhone={false} onOpen={() => {}} />);
  assert.match(html, /DP-C202611-0001/);
  assert.match(html, /Phone hidden/);
  assert.doesNotMatch(html, /9876543210/);
});
test('identity selector keeps customer selection distinct from a different-shoot decision', () => {
  const option = { customerId: 'customer', customerCode: code, customerName: '<Customer>' };
  const html = renderToStaticMarkup(<CustomerIdentityChoice options={[option]} selected={option} reason="" onSelect={() => {}} onReason={() => {}} />);
  assert.match(html, /different shoot can belong/);
  assert.match(html, /different person; create a new customer ID/);
  assert.match(html, /&lt;Customer&gt;/);
  assert.match(html, /aria-pressed="true"/);
  assert.equal(renderToStaticMarkup(<CustomerCode />), '');
});
test('copying an ID does not open the booking and reports clipboard failure', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let copied = '', opened = false;
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async (value: string) => { copied = value; } } }, configurable: true });
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => root.render(<div onClick={() => { opened = true; }}><CustomerCode code={code} /></div>));
    await act(async () => dom.window.document.querySelector('button')!.click());
    assert.equal(copied, code);
    assert.equal(opened, false);
    assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!, /copied/);
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    await act(async () => dom.window.document.querySelector('button')!.click());
    assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!, /Unable to copy/);
  } finally {
    await act(async () => root.unmount()); dom.window.close();
    Object.assign(globalThis, { window: previousWindow, document: previousDocument, IS_REACT_ACT_ENVIRONMENT: false });
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor); else Reflect.deleteProperty(globalThis, 'navigator');
  }
});
