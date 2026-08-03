import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bookingDurationLabel,
  bookingTimeWindowError,
  formatTimeWindow,
} from '../shared/bookingTime';

test('booking time window validation matches the backend contract', () => {
  assert.equal(bookingTimeWindowError('', '', ''), null);
  assert.equal(bookingTimeWindowError('', '10:00', '12:00'), 'Choose a booking date before adding a time window.');
  assert.equal(bookingTimeWindowError('2030-02-10', '10:00', ''), 'Enter both a start time and an end time.');
  assert.equal(bookingTimeWindowError('2030-02-10', '13:00', '12:00'), 'End time must be later than start time.');
  assert.equal(bookingTimeWindowError('2030-02-10', '10:00', '13:30'), null);
});

test('booking time helpers display the window and derived duration', () => {
  assert.equal(formatTimeWindow('10:00', '13:30'), '10:00–13:30');
  assert.equal(formatTimeWindow('', ''), 'Time not set');
  assert.equal(bookingDurationLabel('10:00', '13:30'), '3 hrs 30 min');
});
