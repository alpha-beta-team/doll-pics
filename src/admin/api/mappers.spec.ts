import test from 'node:test';
import assert from 'node:assert/strict';
import { mapBooking, mapEnquiry } from './mappers';

test('mapBooking exposes the operations contract and normalizes legacy records', () => {
  const booking = mapBooking({
    _id: 'booking-1',
    customerName: 'Ramya',
    customerPhone: '9876543210',
    status: 'completed',
    shootDate: '2030-02-10T04:30:00.000Z',
    reminderDate: '2030-02-05',
    agreedTotal: 5000,
    payments: [{
      _id: 'payment-1', amount: 1000, paidAt: '2030-01-10T00:00:00.000Z', method: 'upi',
    }],
    paymentSummary: { amountPaid: 1000, balanceDue: 4000, status: 'partial' },
  });
  assert.equal(booking.status, 'shoot_completed');
  assert.equal(booking.bookingDate, '2030-02-10');
  assert.equal(booking.paymentDueDate, '2030-02-05');
  assert.equal('shootDate' in booking, false);
  assert.equal('startTime' in booking, false);
  assert.equal('endTime' in booking, false);
  assert.deepEqual(booking.paymentSummary, {
    amountPaid: 1000,
    balanceDue: 4000,
    status: 'partial',
  });
  assert.equal(booking.payments[0].id, 'payment-1');
});

test('mapBooking preserves null pricing instead of inventing a balance', () => {
  const booking = mapBooking({
    id: 'booking-2',
    customerName: 'Sri',
    customerPhone: '77987998',
    bookingDate: '2030-05-01',
    payments: [],
    paymentSummary: { amountPaid: 0, balanceDue: null, status: 'unpriced' },
  });
  assert.equal(booking.agreedTotal, null);
  assert.equal(booking.paymentSummary.balanceDue, null);
  assert.equal(booking.paymentSummary.status, 'unpriced');
});

test('mapEnquiry prefers bookingDate and supports the compatibility shootDate', () => {
  assert.equal(mapEnquiry({ id: 'e1', bookingDate: '2030-03-01' }).bookingDate, '2030-03-01');
  assert.equal(
    mapEnquiry({ id: 'e2', shootDate: '2030-03-02T10:00:00.000Z' }).bookingDate,
    '2030-03-02',
  );
});
