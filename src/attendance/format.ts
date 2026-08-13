const STUDIO_TIME_ZONE = 'Asia/Kolkata';

function parts(date: Date) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => values.find((item) => item.type === type)?.value || '';
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function studioDate(date = new Date()): string {
  const value = parts(date);
  return `${value.year}-${value.month}-${value.day}`;
}

export function studioMonth(date = new Date()): string {
  return studioDate(date).slice(0, 7);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(end).padStart(2, '0')}` };
}

export function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function formatStudioDate(value?: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00+05:30`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: STUDIO_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatStudioTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: STUDIO_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function durationLabel(minutes = 0): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const remaining = safe % 60;
  if (!hours) return `${remaining}m`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function unitsLabel(units = 0): string {
  const days = units / 2;
  return `${Number.isInteger(days) ? days : days.toFixed(1)} ${days === 1 ? 'day' : 'days'}`;
}

export function words(value?: string): string {
  if (!value) return '—';
  return value.toLowerCase().split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function studioDateTimeIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function statusBadgeClass(status?: string): string {
  if (status === 'PRESENT' || status === 'APPROVED' || status === 'FIELD_WORK') return 'bg-emerald-100 text-emerald-800';
  if (status === 'PENDING' || status === 'EXPECTED' || status === 'NOT_PUNCHED_IN') return 'bg-amber-100 text-amber-900';
  if (status === 'ON_LEAVE' || status === 'HALF_DAY_LEAVE' || status === 'SCHEDULED_OFF' || status === 'HOLIDAY') return 'bg-blue-100 text-blue-800';
  if (status === 'REJECTED' || status === 'ABSENT' || status === 'LOSS_OF_PAY') return 'bg-red-100 text-red-800';
  if (status === 'CANCELLED') return 'bg-slate-200 text-slate-700';
  return 'bg-orange-100 text-orange-800';
}

