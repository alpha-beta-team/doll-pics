import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Booking } from '../../types';
import { BookingPaymentSummary } from './BookingDetailSections';

function render(discount?: number) {
  return renderToStaticMarkup(createElement(BookingPaymentSummary, { booking: {
    agreedTotal: 9500, bookingDiscountAmount: discount,
    paymentSummary: { amountPaid: 1000, balanceDue: 8500, status: 'partial' },
  } as Booking }));
}

test('payment summary shows the saved discount without subtracting it again', () => {
  for (const discount of [500, 1000, 1500]) {
    const html = render(discount);
    assert.match(html, new RegExp(`₹${discount.toLocaleString('en-IN')} discount applied`));
    assert.match(html, /₹9,500/);
    assert.match(html, /₹8,500 remaining/);
  }
});

test('payment summary hides discount for zero and legacy bookings', () => {
  assert.doesNotMatch(render(0), /discount applied/);
  assert.doesNotMatch(render(), /discount applied/);
});
