import assert from 'node:assert/strict';
import test from 'node:test';
import { changeBookingDiscount } from './bookingDiscount';

test('switching and clearing discounts retains the original base', () => {
  assert.equal(changeBookingDiscount('10000', 0, 500).amount, '9500');
  assert.equal(changeBookingDiscount('9500', 500, 1000).amount, '9000');
  assert.equal(changeBookingDiscount('9000', 1000, 1500).amount, '8500');
  assert.equal(changeBookingDiscount('8500', 1500, 0).amount, '10000');
  assert.equal(changeBookingDiscount('9500', 500, 500).amount, '9500');
});

test('restored final amounts and decimal prices are not discounted twice', () => {
  assert.equal(changeBookingDiscount('9500.25', 500, 1000).amount, '9000.25');
  assert.equal(changeBookingDiscount('0', 500, 0).amount, '500');
  assert.equal(changeBookingDiscount('500', 0, 500).amount, '0');
});

test('invalid or excessive discounts leave the amount unchanged', () => {
  for (const amount of ['', ' ', '-1', 'NaN', 'Infinity', '499.99']) {
    const result = changeBookingDiscount(amount, 0, 500);
    assert.ok(result.error);
    assert.equal(result.amount, amount);
  }
  assert.ok(changeBookingDiscount('10000', 0, 750).error);
});
