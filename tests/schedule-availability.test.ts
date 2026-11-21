import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ScheduleBookingItem } from '../src/admin/types';
import { unbookedWindows, scheduleBookingGroups, shootTiming, photographerClash } from '../src/admin/pages/schedule.utils';
const date = '2026-11-14';
function item(id: string, startTime: string, endTime: string, status: ScheduleBookingItem['status'] = 'confirmed'): ScheduleBookingItem {
  return { id, bookingDate: date, startTime, endTime, status, customerName: id, customerPhone: '', service: '', location: '', assignedStaffAccountId: null, assignedStaffAccountName: '', whatsappOptIn: false };
}
test('availability merges overlaps and touching bookings, clips hours and ignores cancellations', () => {
  assert.deepEqual(unbookedWindows([
    item('early', '07:00', '12:00'), item('overlap', '11:30', '13:00'), item('touching', '13:00', '14:15'),
    item('late', '18:30', '22:00'), item('cancelled', '14:00', '19:00', 'cancelled'), item('unknown', '', ''),
    { ...item('other-day', '14:00', '19:00'), bookingDate: '2026-11-15' },
  ], date), [{ startTime: '14:15', endTime: '18:30' }]);
});
test('completed bookings remain occupied and fully booked days have no gaps', () => {
  assert.deepEqual(unbookedWindows([item('completed', '11:00', '20:00', 'shoot_completed')], date), []);
  assert.deepEqual(unbookedWindows([], date), [{ startTime: '11:00', endTime: '20:00' }]);
});
test('week previews group connected overlaps without merging adjacent bookings', () => {
  const groups = scheduleBookingGroups([item('c', '12:00', '14:00'), item('a', '07:00', '13:00'), item('b', '10:00', '12:00'), item('d', '14:00', '16:00')], 30);
  assert.deepEqual(groups.map(group => group.items.map(row => row.id)), [['a', 'b', 'c'], ['d']]);
});

test('photographer clashes use assigned account IDs and half-open time windows', () => {
  const a = { ...item('a', '10:00', '12:00'), assignedStaffAccountName: 'Alex', assignedStaffAccountId: 'one' };
  const b = { ...a, id: 'b', startTime: '11:00' };
  assert.equal(photographerClash(a, b), true);
  assert.equal(photographerClash(a, { ...b, assignedStaffAccountId: 'two' }), false);
  assert.equal(photographerClash(a, { ...b, startTime: '12:00' }), false);
  assert.equal(photographerClash({ ...a, assignedStaffAccountId: null }, { ...b, assignedStaffAccountId: null }), false);
});

test('shoot indicators change at the scheduled start and end', () => {
  const a = item('a', '09:30', '10:30');
  assert.equal(shootTiming(a, date + 'T09:29'), '');
  assert.equal(shootTiming(a, date + 'T09:30'), 'Shooting now');
  assert.equal(shootTiming(a, date + 'T10:30'), 'Past, not closed');
  assert.equal(shootTiming({ ...a, status: 'draft' }, date + 'T10:30'), 'Past, not closed');
  assert.equal(shootTiming({ ...a, status: 'cancelled' }, date + 'T10:30'), '');
  assert.equal(shootTiming({ ...a, endTime: '' }, date + 'T10:30'), '');
  assert.equal(shootTiming({ ...a, status: 'delivered' }, date + 'T10:30'), 'Done');
});
