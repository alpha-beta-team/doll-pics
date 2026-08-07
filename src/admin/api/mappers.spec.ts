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
    startTime: '10:00',
    endTime: '13:30',
    durationMinutes: 210,
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
  assert.equal(booking.startTime, '10:00');
  assert.equal(booking.endTime, '13:30');
  assert.equal(booking.durationMinutes, 210);
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

test('mapBooking maps schedule history newest first with actor details', () => {
  const booking = mapBooking({
    id: 'booking-history',
    customerName: 'Sri',
    customerPhone: '9876543210',
    scheduleHistory: [
      { _id: 'old', action: 'cancelled', changedAt: '2030-01-01T00:00:00.000Z', changedBy: { id: 'u1', name: 'Ani' }, previous: { bookingDate: '2030-02-01', startTime: '11:00', endTime: '12:00', status: 'confirmed' }, next: { bookingDate: '2030-02-01', startTime: '11:00', endTime: '12:00', status: 'cancelled' } },
      { _id: 'new', action: 'restored', changedAt: '2030-01-02T00:00:00.000Z', changedBy: { id: 'u2', name: 'Maya' }, previous: { bookingDate: '2030-02-01', startTime: '11:00', endTime: '12:00', status: 'cancelled' }, next: { bookingDate: '2030-02-01', startTime: '11:00', endTime: '12:00', status: 'confirmed' } },
    ],
  });
  assert.deepEqual(booking.scheduleHistory.map(item => item.id), ['new', 'old']);
  assert.equal(booking.scheduleHistory[0].changedBy.name, 'Maya');
});

test('mapEnquiry prefers bookingDate and supports the compatibility shootDate', () => {
  const enquiry = mapEnquiry({
    id: 'e1', bookingDate: '2030-03-01', startTime: '14:00', endTime: '16:00',
  });
  assert.equal(enquiry.bookingDate, '2030-03-01');
  assert.equal(enquiry.startTime, '14:00');
  assert.equal(enquiry.endTime, '16:00');
  assert.equal(
    mapEnquiry({ id: 'e2', shootDate: '2030-03-02T10:00:00.000Z' }).bookingDate,
    '2030-03-02',
  );
});
