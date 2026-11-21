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
  if (!timed.length) return { startHour: 6, endHour: DEFAULT_END_HOUR };
  const starts = timed.map(item => Math.floor(timeToMinutes(item.startTime) / 60));
  const ends = timed.map(item => Math.ceil(timeToMinutes(item.endTime) / 60));
  return {
    startHour: Math.max(0, Math.min(6, ...starts)),
    endHour: Math.min(24, Math.max(DEFAULT_END_HOUR, ...ends)),
  };
}

/** Unbooked periods within preset hours, based only on known booking times. */
export function unbookedWindows(bookings: ScheduleBookingItem[], date: string) {
  const start = DEFAULT_START_HOUR * 60;
  const end = DEFAULT_END_HOUR * 60;
  const occupied = bookings.filter(item => item.bookingDate === date && item.status !== 'cancelled'
    && item.startTime && item.endTime)
    .map(item => ({ start: Math.max(start, timeToMinutes(item.startTime)), end: Math.min(end, timeToMinutes(item.endTime)) }))
    .filter(window => window.end > window.start).sort((a, b) => a.start - b.start);
  const gaps: Array<{ startTime: string; endTime: string }> = [];
  let cursor = start;
  for (const window of occupied) {
    if (window.start > cursor) gaps.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(window.start) });
    cursor = Math.max(cursor, window.end);
  }
  if (cursor < end) gaps.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(end) });
  return gaps;
}

/** Group intersecting rendered cards so a narrow week column can offer a readable day preview. */
export function scheduleBookingGroups(bookings: ScheduleBookingItem[], minimumMinutes: number) {
  const sorted = bookings.filter(item => item.startTime && item.endTime).slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  const groups: Array<{ start: number; end: number; items: ScheduleBookingItem[] }> = [];
  for (const item of sorted) {
    const start = timeToMinutes(item.startTime);
    const end = Math.max(timeToMinutes(item.endTime), start + minimumMinutes);
    const previous = groups[groups.length - 1];
    if (previous && start < previous.end) {
      previous.end = Math.max(previous.end, end);
      previous.items.push(item);
    } else groups.push({ start, end, items: [item] });
  }
  return groups;
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

/** Pack intersecting cards into columns, including the minimum rendered card height. */
export function layoutScheduleBookings(bookings: ScheduleBookingItem[], minimumMinutes = 0) {
  const sorted = bookings.filter(item => item.startTime && item.endTime).slice().sort((a, b) =>
    a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime) || a.id.localeCompare(b.id));
  const result: Array<{ item: ScheduleBookingItem; column: number; columns: number }> = [];
  let group: typeof result = [];
  let columnEnds: number[] = [];
  let groupEnd = -1;
  const finish = () => {
    group.forEach(entry => { entry.columns = columnEnds.length; });
    result.push(...group);
    group = [];
    columnEnds = [];
  };
  for (const item of sorted) {
    const start = timeToMinutes(item.startTime);
    const end = Math.max(timeToMinutes(item.endTime), start + minimumMinutes);
    if (start >= groupEnd) finish();
    const available = columnEnds.findIndex(value => value <= start);
    const column = available < 0 ? columnEnds.length : available;
    columnEnds[column] = end;
    group.push({ item, column, columns: 1 });
    groupEnd = Math.max(start >= groupEnd ? -1 : groupEnd, end);
  }
  finish();
  return result;
}

export function photographerClash(a: ScheduleBookingItem, b: ScheduleBookingItem) {
  return a.id !== b.id && Boolean(a.assignedStaffAccountId)
    && a.assignedStaffAccountId === b.assignedStaffAccountId && a.bookingDate === b.bookingDate
    && occupiesSchedule(a) && occupiesSchedule(b) && Boolean(a.startTime && b.startTime && a.endTime && b.endTime)
    && windowsOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
}

export function photographerColor(id: string | null) {
  if (!id) return '#64748b';

  let hash = 0;
  for (const char of id) hash = (31 * hash + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 57% 31%)`;
}

export function shootTiming(item: ScheduleBookingItem, now: string) {
  if (item.status === 'shoot_completed' || item.status === 'delivered') return 'Done';
  if (!occupiesSchedule(item) || !item.startTime || !item.endTime) return '';
  if (now >= `${item.bookingDate}T${item.endTime}`) return 'Past, not closed';
  if (item.status === 'confirmed' && now >= `${item.bookingDate}T${item.startTime}`) return 'Shooting now';
  return '';
}
