import test from 'node:test';
import assert from 'node:assert/strict';
import { packagePrefill } from './bookingForm.utils';
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
