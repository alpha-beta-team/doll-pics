export type FollowUpShortcut = 'later' | 'tomorrow' | 'three_days' | 'next_week' | 'custom' | 'none';

const KOLKATA_OFFSET = '+05:30';
const HALF_HOUR = 30 * 60 * 1000;

function kolkataParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value || 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}

function pad(value: number) { return String(value).padStart(2, '0'); }

function pseudoKolkataDate(days: number, hour: number, minute: number, now: Date) {
  const current = kolkataParts(now);
  const date = new Date(Date.UTC(current.year, current.month - 1, current.day + days, hour, minute));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function dateTimeLocalInKolkata(date: Date): string {
  const value = kolkataParts(date);
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}

export function kolkataLocalToIso(value: string): string {
  return new Date(`${value}:00${KOLKATA_OFFSET}`).toISOString();
}

export function followUpShortcutValue(shortcut: Exclude<FollowUpShortcut, 'custom' | 'none'>, now = new Date()): string {
  if (shortcut === 'later') {
    const rounded = new Date(Math.ceil((now.getTime() + 2 * 60 * 60 * 1000) / HALF_HOUR) * HALF_HOUR);
    return dateTimeLocalInKolkata(rounded);
  }
  if (shortcut === 'tomorrow') return pseudoKolkataDate(1, 10, 0, now);
  if (shortcut === 'three_days') return pseudoKolkataDate(3, 10, 0, now);
  return pseudoKolkataDate(7, 10, 0, now);
}

export function canUseLaterToday(now = new Date()): boolean {
  const later = kolkataParts(new Date(Math.ceil((now.getTime() + 2 * 60 * 60 * 1000) / HALF_HOUR) * HALF_HOUR));
  const today = kolkataParts(now);
  return later.year === today.year && later.month === today.month && later.day === today.day && (later.hour < 20 || (later.hour === 20 && later.minute === 0));
}

export function followUpDateError(value: string, now = new Date()): string | null {
  if (!value) return 'Choose a follow-up date and time.';
  const timestamp = new Date(`${value}:00${KOLKATA_OFFSET}`).getTime();
  return Number.isFinite(timestamp) && timestamp > now.getTime() ? null : 'Follow-up must be in the future.';
}
