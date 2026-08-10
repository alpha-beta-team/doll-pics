import type { ScheduleBookingItem } from '../types';

export const SCHEDULE_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_START_HOUR = 11;
export const DEFAULT_END_HOUR = 20;

export function kolkataToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addScheduleDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function weekStart(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return addScheduleDays(value, -mondayOffset);
}

export function scheduleDates(anchor: string, view: 'day' | 'week') {
  const start = view === 'week' ? weekStart(anchor) : anchor;
  return Array.from({ length: view === 'week' ? 7 : 1 }, (_, index) => addScheduleDays(start, index));
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(value: number) {
  const bounded = Math.max(0, Math.min(24 * 60 - 1, value));
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(bounded % 60).padStart(2, '0')}`;
}

export function endTimeFor(startTime: string, durationHours: 1 | 2 | 3) {
  return minutesToTime(timeToMinutes(startTime) + durationHours * 60);
}

export function windowsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

export function occupiesSchedule(item: ScheduleBookingItem) {
  return item.status === 'draft' || item.status === 'confirmed';
}

export function slotHasConflict(
  bookings: ScheduleBookingItem[],
  bookingDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
) {
  return bookings.some(item =>
    item.id !== excludeBookingId &&
    item.bookingDate === bookingDate &&
    occupiesSchedule(item) &&
    item.startTime && item.endTime &&
    windowsOverlap(startTime, endTime, item.startTime, item.endTime),
  );
}

export function visibleHourBounds(bookings: ScheduleBookingItem[]) {
  const timed = bookings.filter(item => item.startTime && item.endTime);
  if (!timed.length) return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  const starts = timed.map(item => Math.floor(timeToMinutes(item.startTime) / 60));
  const ends = timed.map(item => Math.ceil(timeToMinutes(item.endTime) / 60));
  return {
    startHour: Math.max(0, Math.min(DEFAULT_START_HOUR, ...starts)),
    endHour: Math.min(24, Math.max(DEFAULT_END_HOUR, ...ends)),
  };
}

export function formatScheduleDay(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', options ?? {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(`${value}T12:00:00+05:30`));
}

export function formatScheduleTime(value: string) {
  if (!value) return 'Time not set';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric', minute: '2-digit', timeZone: SCHEDULE_TIMEZONE,
  }).format(new Date(`2000-01-01T${value}:00+05:30`)).toUpperCase();
}
