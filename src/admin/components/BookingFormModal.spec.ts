import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKING_WIZARD_FIELD_LABELS,
  BOOKING_WIZARD_STEPS,
  NEW_BOOKING_DEFAULTS,
  canOpenBookingWizardStep,
  initialHighestCompletedStep,
  invalidateBookingWizardProgress,
  packageMatchesShootType,
  packagePrefill,
  packagesForShootType,
  validateBookingWizardStep,
} from './bookingForm.utils';
import type { Package } from '../types';

const pricedPackage = {
  id: 'package-1',
  name: 'Wedding Classic',
  price: 45_000,
  categoryName: 'Wedding',
} as Package;

test('priced package prefills an editable total and photography service', () => {
  assert.deepEqual(packagePrefill([pricedPackage], 'package-1', 'Family'), {
    agreedTotal: '45000',
    shootType: 'Wedding',
  });
});

test('unpriced package leaves the current agreed total untouched', () => {
  assert.deepEqual(packagePrefill([{ ...pricedPackage, price: undefined }], 'package-1', 'Family'), {
    agreedTotal: undefined,
    shootType: 'Wedding',
  });
});

const validWizardValues = {
  customerName: 'Anita Kumar',
  customerPhone: '98765 43210',
  bookingDate: '',
  startTime: '',
  endTime: '',
};

test('booking wizard exposes all four steps without optional field suffixes', () => {
  assert.deepEqual(BOOKING_WIZARD_STEPS.map(step => step.label), [
    'Customer',
    'Shoot details',
    'Price & team',
    'Optional details',
  ]);
  assert.equal(BOOKING_WIZARD_FIELD_LABELS.customerName, 'Name');
  assert.equal(BOOKING_WIZARD_FIELD_LABELS.customerPhone, 'Phone');
  assert.equal(BOOKING_WIZARD_FIELD_LABELS.shootType, 'Photography service');
  for (const label of Object.values(BOOKING_WIZARD_FIELD_LABELS)) {
    assert.doesNotMatch(label, /Optional/);
  }
});

test('booking packages are filtered by photography service', () => {
  const familyPackage = { ...pricedPackage, id: 'package-2', categoryName: 'Family' };
  const legacyWeddingPackage = {
    ...pricedPackage,
    id: 'package-3',
    categoryName: undefined,
    shootType: 'wedding',
  };
  assert.deepEqual(
    packagesForShootType([pricedPackage, familyPackage, legacyWeddingPackage], 'Wedding').map(item => item.id),
    ['package-1', 'package-3'],
  );
  assert.equal(packageMatchesShootType(familyPackage, 'Family'), true);
  assert.equal(packageMatchesShootType(familyPackage, 'Newborn'), false);
});

test('new bookings default to Erode with WhatsApp updates enabled', () => {
  assert.deepEqual(NEW_BOOKING_DEFAULTS, {
    location: 'Erode',
    whatsappOptIn: true,
    whatsappNotificationsEnabled: true,
  });
});

test('booking wizard validates required customer fields', () => {
  assert.deepEqual(validateBookingWizardStep(0, {
    ...validWizardValues,
    customerName: ' ',
    customerPhone: '1234',
  }), {
    customerName: 'Enter the customer\u2019s name.',
    customerPhone: 'Enter a 10-digit Indian phone number; +91, spaces and hyphens are accepted.',
  });
  assert.deepEqual(validateBookingWizardStep(0, validWizardValues), {});
});

test('booking wizard permits empty optional shoot fields but validates a partial time window', () => {
  assert.deepEqual(validateBookingWizardStep(1, validWizardValues), {});
  assert.deepEqual(validateBookingWizardStep(2, validWizardValues), {});
  assert.deepEqual(validateBookingWizardStep(3, validWizardValues), {});
  assert.deepEqual(validateBookingWizardStep(1, {
    ...validWizardValues,
    bookingDate: '2030-02-10',
    startTime: '10:00',
  }), { time: 'Enter both a start time and an end time.' });
  assert.deepEqual(validateBookingWizardStep(1, {
    ...validWizardValues,
    bookingDate: '2030-02-10',
    startTime: '10:00',
    endTime: '12:00',
  }), {});
});

test('booking wizard restores and invalidates completed-step navigation', () => {
  assert.equal(initialHighestCompletedStep(0), -1);
  assert.equal(initialHighestCompletedStep(3), 2);
  assert.equal(canOpenBookingWizardStep(1, 0, 2), true);
  assert.equal(canOpenBookingWizardStep(3, 0, 2), false);
  assert.equal(canOpenBookingWizardStep(0, 0, 2), false);
  assert.equal(invalidateBookingWizardProgress(2, 1), 0);
  assert.equal(invalidateBookingWizardProgress(2, 0), -1);
});
