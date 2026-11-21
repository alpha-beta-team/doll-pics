import test from 'node:test';
import assert from 'node:assert/strict';
import { ownerRange, validOwnerRange, changeLabel, cumulativePoints } from '../src/admin/reports/ownerDashboard';
test('owner presets respect Monday start, leap days and inclusive rolling dates', () => {
  assert.deepEqual(ownerRange('week', '2026-11-22'), { dateFrom: '2026-11-16', dateTo: '2026-11-22' });
  assert.deepEqual(ownerRange('week', '2026-11-23'), { dateFrom: '2026-11-23', dateTo: '2026-11-23' });
  assert.deepEqual(ownerRange('30_days', '2024-03-01'), { dateFrom: '2024-02-01', dateTo: '2024-03-01' });
  assert.equal(validOwnerRange('2026-02-30', '2026-03-01'), false);
  assert.equal(validOwnerRange('2026-11-21', '2026-11-20'), false);
  assert.equal(validOwnerRange('2024-02-29', '2024-03-01'), true);
});
test('changes remain finite with zero/negative baselines and distinguish points from percent', () => {
  assert.equal(changeLabel(10, 0), 'New'); assert.equal(changeLabel(0, 0), '0%');
  assert.equal(changeLabel(19.6, 21.6, 'points'), '-2 pts'); assert.equal(changeLabel(46, 37, 'count'), '+9');
  assert.equal(changeLabel(50, -50), '↑ 200%');
});
test('cumulative chart fills empty days, ISO weeks and months', () => {
  assert.deepEqual(cumulativePoints([{ period: '2026-11-02', amount: 10 }, { period: '2026-11-04', amount: 20 }], '2026-11-01', '2026-11-05'), [0, 10, 10, 30, 30]);
  assert.deepEqual(cumulativePoints([{ period: '2026-11', amount: 10 }, { period: '2027-01', amount: 20 }], '2026-11-01', '2027-01-31', 'month'), [10, 10, 30]);
  assert.deepEqual(cumulativePoints([{ period: '2026-W53', amount: 10 }, { period: '2027-W01', amount: 20 }], '2026-12-28', '2027-01-10', 'week'), [10, 30]);
});
