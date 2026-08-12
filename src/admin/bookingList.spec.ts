import assert from 'node:assert/strict';
import test from 'node:test';
import type { Booking, BookingStatus } from './types';
import {
  BOOKING_STATUSES,
  bookingMatchesSearch,
  bookingPriceLabel,
  bookingStatusLabel,
  formatBookingDay,
  formatBookingMoney,
  sortBookings,
} from './components/bookings/bookingList';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    customerName: 'Ananya Subramaniam',
    customerPhone: '+91 98765 43210',
    customerEmail: '',
    shootType: 'Newborn',
    preferredEvent: '',
    bookingDate: '2030-02-10',
    durationHours: 2,
    location: '',
    paymentDueDate: '',
    followUpNote: '',
    notes: '',
    packageName: 'Premium newborn photography experience with family portraits',
    packageListedPrice: 25000,
    packagePricingMode: 'price',
    agreedTotal: 25000,
    assignedStaffAccountName: '',
    payments: [],
    paymentSummary: { amountPaid: 10000, balanceDue: 15000, status: 'partial' },
    driveGalleryUrl: '',
    driveEditedUrl: '',
    driveRawsUrl: '',
    driveNotes: '',
    status: 'confirmed',
    scheduleHistory: [],
    reviewStatus: 'not_requested',
    reviewRequestCount: 0,
    reviewHistory: [],
    whatsappOptIn: false,
    whatsappOptInSource: '',
    whatsappNotificationsEnabled: false,
    preferredLanguage: 'en',
    createdAt: '2030-01-01T10:00:00.000Z',
    updatedAt: '2030-01-01T10:00:00.000Z',
    ...overrides,
  };
}

test('booking list exposes a readable label for every supported status', () => {
  const statuses: BookingStatus[] = ['draft', 'confirmed', 'shoot_completed', 'delivered', 'cancelled'];
  assert.deepEqual(BOOKING_STATUSES.map(item => item.value), statuses);
  assert.deepEqual(statuses.map(bookingStatusLabel), [
    'Draft',
    'Confirmed',
    'Shoot completed',
    'Delivered',
    'Cancelled',
  ]);
});

test('compact display rules use one clear missing value and Indian currency', () => {
  assert.equal(formatBookingDay(''), 'Shoot date not set');
  assert.equal(formatBookingMoney(null), 'Price not set');
  assert.match(formatBookingMoney(25000), /^₹\s?25,000$/);
});

test('balance due is prioritised over total price when payment access is available', () => {
  const partial = booking();
  assert.match(bookingPriceLabel(partial, true), /^₹\s?15,000 due$/);
  assert.match(bookingPriceLabel(partial, false), /^₹\s?25,000$/);

  const unpriced = booking({
    agreedTotal: null,
    packageListedPrice: null,
    paymentSummary: { amountPaid: 0, balanceDue: null, status: 'unpriced' },
  });
  assert.equal(bookingPriceLabel(unpriced, true), 'Price not set');
});

test('search covers names, phone numbers, services, events and long package labels', () => {
  const row = booking();
  assert.equal(bookingMatchesSearch(row, 'ananya'), true);
  assert.equal(bookingMatchesSearch(row, '43210'), true);
  assert.equal(bookingMatchesSearch(row, '919876543210'), true);
  assert.equal(bookingMatchesSearch(row, 'newborn'), true);
  assert.equal(bookingMatchesSearch(row, 'family portraits'), true);
  assert.equal(bookingMatchesSearch(row, 'wedding'), false);
});

test('all sort modes keep missing dates at the end', () => {
  const rows = [
    booking({ id: 'later', customerName: 'Zoya', bookingDate: '2030-03-10', nextFollowUpAt: '2030-02-05T10:00:00Z', createdAt: '2030-01-03T10:00:00Z' }),
    booking({ id: 'missing', customerName: 'Maya', bookingDate: '', nextFollowUpAt: undefined, createdAt: '' }),
    booking({ id: 'earlier', customerName: 'Ananya', bookingDate: '2030-02-10', nextFollowUpAt: '2030-02-01T10:00:00Z', createdAt: '2030-01-02T10:00:00Z' }),
  ];

  assert.deepEqual(sortBookings(rows, 'shoot_date').map(row => row.id), ['earlier', 'later', 'missing']);
  assert.deepEqual(sortBookings(rows, 'follow_up').map(row => row.id), ['earlier', 'later', 'missing']);
  assert.deepEqual(sortBookings(rows, 'recent').map(row => row.id), ['later', 'earlier', 'missing']);
  assert.deepEqual(sortBookings(rows, 'customer').map(row => row.id), ['earlier', 'missing', 'later']);
});
