import assert from 'node:assert/strict';
import test from 'node:test';
import { durationLabel, eachDate, monthBounds, studioDateTimeIso, unitsLabel, words } from './format';

test('attendance display helpers preserve half-day units and durations', () => {
  assert.equal(durationLabel(420), '7h');
  assert.equal(durationLabel(451), '7h 31m');
  assert.equal(unitsLabel(1), '0.5 days');
  assert.equal(unitsLabel(2), '1 day');
  assert.equal(words('HALF_DAY_LEAVE'), 'Half Day Leave');
});

test('calendar helpers handle month ends and Kolkata timestamps', () => {
  assert.deepEqual(monthBounds('2028-02'), { from: '2028-02-01', to: '2028-02-29' });
  assert.deepEqual(eachDate('2026-08-30', '2026-09-01'), ['2026-08-30', '2026-08-31', '2026-09-01']);
  assert.equal(studioDateTimeIso('2026-08-11', '10:30'), '2026-08-11T05:00:00.000Z');
});

