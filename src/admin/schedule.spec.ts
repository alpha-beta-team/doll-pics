import test from 'node:test';
import assert from 'node:assert/strict';
import type { ScheduleBookingItem } from './types';
import {
  addScheduleDays, endTimeFor, scheduleDates, slotHasConflict,
  visibleHourBounds, weekStart, windowsOverlap,
} from './pages/schedule.utils';

const booking = (overrides: Partial<ScheduleBookingItem> = {}): ScheduleBookingItem => ({
  id: 'booking-1',
  customerName: 'Ramya',
  customerPhone: '9876543210',
  service: 'Baby',
  bookingDate: '2030-02-10',
  startTime: '11:00',
  endTime: '12:00',
  status: 'confirmed',
  location: 'Studio',
  assignedTeamMemberName: '',
  whatsappOptIn: true,
  ...overrides,
});

test('schedule date navigation uses Monday weeks and date-only arithmetic', () => {
  assert.equal(weekStart('2030-02-10'), '2030-02-04');
  assert.deepEqual(scheduleDates('2030-02-10', 'week'), [
    '2030-02-04', '2030-02-05', '2030-02-06', '2030-02-07',
    '2030-02-08', '2030-02-09', '2030-02-10',
  ]);
  assert.equal(addScheduleDays('2032-02-28', 1), '2032-02-29');
});

test('one, two, and three-hour slots calculate ends and use adjacent-safe overlap rules', () => {
  assert.equal(endTimeFor('11:00', 1), '12:00');
  assert.equal(endTimeFor('11:00', 2), '13:00');
  assert.equal(endTimeFor('11:00', 3), '14:00');
  assert.equal(windowsOverlap('11:00', '12:00', '12:00', '13:00'), false);
  assert.equal(windowsOverlap('11:00', '13:00', '12:00', '13:00'), true);
});

test('only draft and confirmed timed bookings block empty slots', () => {
  assert.equal(slotHasConflict([booking()], '2030-02-10', '11:30', '12:30'), true);
  assert.equal(slotHasConflict([booking()], '2030-02-10', '12:00', '13:00'), false);
  assert.equal(slotHasConflict([booking({ status: 'delivered' })], '2030-02-10', '11:30', '12:30'), false);
  assert.equal(slotHasConflict([booking({ startTime: '', endTime: '' })], '2030-02-10', '11:00', '12:00'), false);
});

test('calendar expands around bookings outside the core 11 AM–8 PM view', () => {
  assert.deepEqual(visibleHourBounds([]), { startHour: 11, endHour: 20 });
  assert.deepEqual(visibleHourBounds([
    booking({ startTime: '09:30', endTime: '10:30' }),
    booking({ id: 'late', startTime: '19:30', endTime: '21:15' }),
  ]), { startHour: 9, endHour: 22 });
});
