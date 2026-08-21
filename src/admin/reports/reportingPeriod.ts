export type ReportingPeriodPreset = 'this_month' | 'last_month' | '7_days' | '30_days' | '90_days' | 'all' | 'custom';
export type ReportingDateRange = { dateFrom: string; dateTo: string };

export const REPORTING_PERIOD_PRESETS: Array<{
  value: Exclude<ReportingPeriodPreset, 'custom'>;
  label: string;
}> = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: '7_days', label: '7 days' },
  { value: '30_days', label: '30 days' },
  { value: '90_days', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export function kolkataToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addReportingDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function rangeForReportingPreset(
  preset: Exclude<ReportingPeriodPreset, 'custom'>,
  today = kolkataToday(),
): ReportingDateRange {
  const [year, month] = today.split('-').map(Number);
  if (preset === 'this_month') return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
  if (preset === 'last_month') {
    const start = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
    return { dateFrom: start, dateTo: end };
  }
  if (preset === 'all') return { dateFrom: '2000-01-01', dateTo: today };
  const days = preset === '7_days' ? 7 : preset === '30_days' ? 30 : 90;
  return { dateFrom: addReportingDays(today, -(days - 1)), dateTo: today };
}
