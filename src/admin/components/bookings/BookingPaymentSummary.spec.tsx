import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mapBooking } from '../../api/mappers';
import { BookingPaymentSummary } from './BookingDetailSections';

function savedBooking(discount?: number | null) {
  return mapBooking({
    _id: 'saved-booking',
    agreedTotal: 9500, bookingDiscountAmount: discount,
    paymentSummary: { amountPaid: 1000, balanceDue: 8500, status: 'partial' },
  });
}

function render(discount?: number | null) {
  return renderToStaticMarkup(createElement(BookingPaymentSummary, { booking: savedBooking(discount) }));
}

test('payment summary shows the saved discount without subtracting it again', () => {
  for (const discount of [500, 1000, 1500]) {
    const booking = savedBooking(discount);
    assert.equal(booking.bookingDiscountAmount, discount);
    assert.equal(booking.agreedTotal, 9500);
    const html = render(discount);
    assert.match(html, new RegExp(`₹${discount.toLocaleString('en-IN')} discount applied`));
    assert.match(html, /₹9,500/);
    assert.match(html, /₹8,500 remaining/);
  }
});

test('payment summary hides discount for zero and legacy bookings', () => {
  assert.doesNotMatch(render(0), /discount applied/);
  assert.doesNotMatch(render(), /discount applied/);
  assert.doesNotMatch(render(null), /discount applied/);
  assert.equal(savedBooking().bookingDiscountAmount, 0);
  assert.equal(savedBooking(null).bookingDiscountAmount, 0);
});
