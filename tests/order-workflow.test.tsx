import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrderJourney } from '../src/admin/components/bookings/OrderJourney';
import { CustomerBookingPresentation } from '../src/components/CustomerBookingPresentation';
import { nextOrderStages, orderHeaderAction, orderLocalInput, type OrderWorkflow } from '../src/shared/orderWorkflow';
import type { CustomerBooking } from '../src/shared/customerBooking';

function order(overrides: Partial<OrderWorkflow> = {}): OrderWorkflow {
  return {
    stage: 'shoot_completed', mode: 'physical', state: 'active',
    enteredAt: '2026-11-17T04:30:00.000Z', assigneeId: 'staff-1', assigneeName: 'Studio staff',
    dates: {}, details: {}, revision: 1, history: [], ...overrides,
  };
}

test('physical orders require selection and printing before handover and final receipt', () => {
  let current = order();
  for (const stage of ['awaiting_selection', 'editing', 'photos_delivered', 'edited_selected', 'printing', 'received'] as const) {
    assert.deepEqual(nextOrderStages(current), [stage]);
    current = { ...current, stage };
  }
  assert.deepEqual(nextOrderStages(current), ['handed_over', 'shipped']);
  for (const stage of ['handed_over', 'shipped'] as const) {
    const dispatched = { ...current, stage };
    assert.deepEqual(nextOrderStages(dispatched), ['delivered']);
    assert.equal(orderHeaderAction(dispatched), 'Mark delivered');
    const html = renderToStaticMarkup(<OrderJourney order={dispatched} actions={null} />);
    assert.match(html, /In progress/);
    assert.doesNotMatch(html, /Order complete/);
  }
});

test('digital orders stop at edited-photo delivery while physical orders continue', () => {
  assert.deepEqual(nextOrderStages(order({ mode: 'digital', stage: 'awaiting_selection' })), ['editing']);
  assert.deepEqual(nextOrderStages(order({ mode: 'digital', stage: 'editing' })), ['photos_delivered']);
  assert.deepEqual(nextOrderStages(order({ mode: 'digital', stage: 'photos_delivered' })), []);
  assert.deepEqual(nextOrderStages(order({ stage: 'photos_delivered' })), ['edited_selected']);
});

test('completed and cancelled orders offer no forward transitions', () => {
  assert.equal(orderHeaderAction(null), 'Start order tracking');
  for (const stage of ['editing', 'printing', 'delivered', 'collected'] as const) {
    assert.deepEqual(nextOrderStages(order({ stage, state: 'completed' })), []);
    assert.equal(orderHeaderAction(order({ stage, state: 'completed' })), 'Reopen order');
    assert.deepEqual(nextOrderStages(order({ stage, state: 'cancelled' })), []);
    assert.equal(orderHeaderAction(order({ stage, state: 'cancelled' })), 'Order cancelled');
  }
});

test('legacy printing stages can continue through the revised workflow', () => {
  assert.deepEqual(nextOrderStages(order({ stage: 'preparing_print' })), ['edited_selected']);
  assert.deepEqual(nextOrderStages(order({ stage: 'in_transit' })), ['received']);
  assert.deepEqual(nextOrderStages(order({ stage: 'ready_dispatch' })), ['handed_over', 'shipped']);
  assert.deepEqual(nextOrderStages(order({ stage: 'collected', state: 'completed' })), []);
});

test('retained editing deadlines display only during active editing', () => {
  const editing = order({ stage: 'editing', editingDueAt: '2000-01-01T04:30:00.000Z' });
  const render = (value: OrderWorkflow) => renderToStaticMarkup(<OrderJourney order={value} actions={null} />);
  assert.match(render(editing), /Editing overdue/);
  assert.doesNotMatch(render({ ...editing, stage: 'photos_delivered' }), /Editing overdue|Editing due/);
  assert.doesNotMatch(render({ ...editing, state: 'cancelled' }), /Editing overdue|Editing due/);
  assert.doesNotMatch(render({ ...editing, state: 'completed' }), /Editing overdue|Editing due/);
});

test('digital completion displays photo delivery without a printing phase', () => {
  const html = renderToStaticMarkup(<OrderJourney order={order({
    mode: 'digital', stage: 'photos_delivered', state: 'completed',
    dates: { photos_delivered: '2026-11-17T04:30:00.000Z' },
  })} actions={null} />);
  assert.match(html, /Your digital photos are delivered/);
  assert.match(html, /Order complete/);
  assert.match(html, /Delivered on/);
  assert.doesNotMatch(html, /<strong>Printing<\/strong>/);
});

test('workflow datetime inputs use India time across midnight', () => {
  assert.equal(orderLocalInput('2026-11-17T04:30:00.000Z'), '2026-11-17T10:00');
  assert.equal(orderLocalInput('2026-11-17T20:00:00.000Z'), '2026-11-18T01:30');
});

test('customer progress shows saved milestones without inventing legacy progress', () => {
  const booking: CustomerBooking = {
    customerName: 'Test family', shootType: 'Family', packageName: '', bookingDate: '',
    startTime: '', endTime: '', location: '', status: 'delivered', expectedDeliveryDate: '', update: '', delivery: {},
  };
  const render = (value: CustomerBooking) => renderToStaticMarkup(<CustomerBookingPresentation booking={value} />);
  assert.doesNotMatch(render(booking), /Customer selected edited photos/);
  const tracked: CustomerBooking = { ...booking, orderProgress: {
    stage: 'edited_selected', state: 'active',
    milestones: [{ stage: 'photos_delivered', at: '2026-11-17T04:30:00.000Z' }],
  } };
  const html = render(tracked);
  assert.match(html, /Customer selected edited photos/);
  assert.match(html, /Edited photos shared/);
  assert.match(html, /In progress/);
  assert.match(html, /10:00/);
  assert.match(html, /IST/);
  assert.doesNotMatch(html, /Order complete/);
  assert.doesNotMatch(render({ ...tracked, status: 'cancelled' }), /Customer selected edited photos/);
});
