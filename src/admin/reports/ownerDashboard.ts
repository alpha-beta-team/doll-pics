import { addReportingDays, kolkataToday, type ReportingDateRange } from './reportingPeriod';
export type OwnerPreset = 'today' | 'week' | 'month' | '30_days' | 'custom';
export const OWNER_PRESETS: Array<[OwnerPreset, string]> = [['today', 'Today'], ['week', 'This week'], ['month', 'Month to date'], ['30_days', 'Last 30 days'], ['custom', 'Custom']];
export function ownerRange(preset: OwnerPreset, today = kolkataToday()): ReportingDateRange {
  if (preset === 'today') return { dateFrom: today, dateTo: today };
  if (preset === 'week') {
    const day = new Date(`${today}T12:00:00Z`).getUTCDay();
    return { dateFrom: addReportingDays(today, -((day + 6) % 7)), dateTo: today };
  }
  if (preset === '30_days') return { dateFrom: addReportingDays(today, -29), dateTo: today };
  return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
}
export function validOwnerRange(from: string, to: string) {
  const valid = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
  return valid(from) && valid(to) && from <= to;
}
export type { OwnerQueue, OwnerQueueRow, OwnerQueuePage, OwnerDashboard } from '../../shared/types/ownerDashboard';
export function changeLabel(current: number, previous: number, mode: 'percent' | 'count' | 'points' = 'percent') {
  const delta = current - previous;
  if (mode !== 'percent') return `${delta > 0 ? '+' : ''}${Number(delta.toFixed(1))}${mode === 'points' ? ' pts' : ''}`;
  if (!previous) return current ? 'New' : '0%';
  return `${delta > 0 ? '↑' : delta < 0 ? '↓' : ''} ${Math.abs(Math.round(delta / Math.abs(previous) * 100))}%`.trim();
}
export function cumulativePoints(values: Array<{ period: string; amount: number }>, from: string, to: string, group: 'day' | 'week' | 'month' = 'day') {
  const amounts = new Map<string, number>();
  for (const value of values) amounts.set(value.period, (amounts.get(value.period) || 0) + value.amount);
  let sum = 0;
  const points: number[] = [];
  for (let day = from; day <= to;) {
    const date = new Date(`${day}T12:00:00Z`);
    let key = day;
    if (group === 'month') key = day.slice(0, 7);
    if (group === 'week') {
      const thursday = new Date(date);
      thursday.setUTCHours(0, 0, 0, 0);
      thursday.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
      const week = Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7);
      key = `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    sum += amounts.get(key) || 0;
    points.push(sum);
    if (group === 'day') day = addReportingDays(day, 1);
    else if (group === 'week') day = addReportingDays(day, 8 - (date.getUTCDay() || 7));
    else day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  }
  return points;
}
