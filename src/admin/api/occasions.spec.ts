import test from 'node:test';
import assert from 'node:assert/strict';
import { mapOccasion } from './occasions';

test('occasion response mapping normalizes ids and reminder state', () => {
  const result = mapOccasion({
    _id: 'occasion-1', type: 'birthday', occasionName: 'Anu', customerName: 'Priya',
    phone: '9876543210', occasionDate: '2000-08-10', nextOccurrenceDate: '2026-08-10',
    daysUntil: 2, active: true, contactedForOccurrence: false,
    consentRecorded: true, optedOut: false,
  });
  assert.equal(result.id, 'occasion-1');
  assert.equal(result.daysUntil, 2);
  assert.equal(result.contactedForOccurrence, false);
  assert.equal(result.consentRecorded, true);
});
