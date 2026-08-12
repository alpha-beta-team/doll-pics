import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { FieldAssignment, TeamCalendar } from '../../attendance/types';
import { documentId, staffName } from '../../attendance/types';
import { eachDate, formatStudioDate, monthBounds, studioMonth, words } from '../../attendance/format';
import { api } from '../api/client';
import { AdminAlert, AdminCard, AdminLoadingState, AdminPageHeader, adminFieldClass } from '../components/ui';

type Item = { id: string; date: string; label: string; detail: string; tone: string };

export function TeamLeaveCalendarPage() {
  const [month, setMonth] = useState(studioMonth());
  const [calendar, setCalendar] = useState<TeamCalendar | null>(null);
  const [assignments, setAssignments] = useState<FieldAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bounds = useMemo(() => monthBounds(month), [month]);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [calendarRows, fieldRows] = await Promise.all([api.teamLeaveCalendar(bounds.from, bounds.to), api.fieldAssignmentsAdmin(bounds.from, bounds.to)]); setCalendar(calendarRows); setAssignments(fieldRows); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load team calendar.'); } finally { setLoading(false); } }, [bounds.from, bounds.to]);
  useEffect(() => { void load(); }, [load]);
  const items = useMemo(() => buildItems(calendar, assignments), [assignments, calendar]);
  return <div className="mx-auto max-w-7xl space-y-6"><AdminPageHeader eyebrow="People" title="Team Leave Calendar" description="Approved leave, monthly off-days, holidays and outdoor assignments. Employee leave reasons remain private." />{error && <AdminAlert>{error}</AdminAlert>}<AdminCard className="p-4"><label className="block max-w-xs text-sm font-semibold text-admin-secondary">Calendar month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={adminFieldClass} /></label></AdminCard>{loading ? <AdminCard><AdminLoadingState /></AdminCard> : <><AdminCard className="overflow-hidden"><div className="grid grid-cols-7 border-b border-admin-border bg-admin-muted text-center text-xs font-bold uppercase text-admin-subtle">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="p-2">{day}</div>)}</div><div className="grid grid-cols-7">{Array.from({ length: new Date(`${bounds.from}T00:00:00Z`).getUTCDay() }).map((_, index) => <div key={`blank-${index}`} className="min-h-24 border-b border-r border-admin-border bg-admin-muted/30 sm:min-h-32" />)}{eachDate(bounds.from, bounds.to).map((date) => <div key={date} className="min-h-24 border-b border-r border-admin-border p-1.5 sm:min-h-32 sm:p-2"><p className="text-xs font-bold text-admin-subtle">{Number(date.slice(-2))}</p><div className="mt-1 space-y-1">{items.filter((item) => item.date === date).map((item) => <div key={item.id} title={`${item.label} · ${item.detail}`} className={`truncate rounded px-1.5 py-1 text-[9px] font-semibold sm:text-[10px] ${item.tone}`}>{item.label}</div>)}</div></div>)}</div></AdminCard><section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.sort((a, b) => a.date.localeCompare(b.date)).map((item) => <AdminCard key={`list-${item.id}`} className="p-4"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin-muted text-admin-primary"><CalendarDays className="h-5 w-5" /></span><div><p className="font-semibold text-admin-text">{item.label}</p><p className="mt-1 text-sm text-admin-subtle">{formatStudioDate(item.date)} · {item.detail}</p></div></div></AdminCard>)}</section></>}</div>;
}

function buildItems(calendar: TeamCalendar | null, assignments: FieldAssignment[]): Item[] {
  if (!calendar) return [];
  const items: Item[] = [];
  calendar.holidays.forEach((item) => items.push({ id: `holiday-${documentId(item) || item.date}`, date: item.date, label: item.name, detail: 'Studio holiday', tone: 'bg-violet-100 text-violet-800' }));
  calendar.offDays.forEach((item) => items.push({ id: `off-${documentId(item)}`, date: item.date, label: staffName(item.staffAccountId), detail: 'Monthly off-day', tone: 'bg-blue-100 text-blue-800' }));
  calendar.leave.forEach((item) => { const type = typeof item.leaveTypeId === 'object' ? item.leaveTypeId.name : 'Leave'; item.dateEntries.filter((entry) => entry.date >= calendar.from && entry.date <= calendar.to).forEach((entry) => items.push({ id: `leave-${documentId(item)}-${entry.date}`, date: entry.date, label: staffName(item.staffAccountId), detail: `${type} · ${words(entry.portion)}`, tone: 'bg-amber-100 text-amber-900' })); });
  assignments.filter((item) => item.status !== 'CANCELLED').forEach((item) => { const booking = typeof item.bookingId === 'object' ? item.bookingId : null; const names = item.staffAccountIds.map(staffName).join(', '); items.push({ id: `field-${documentId(item)}`, date: item.businessDate, label: booking?.shootType || 'Outdoor shoot', detail: `${names} · ${item.locationLabel}`, tone: 'bg-emerald-100 text-emerald-800' }); });
  return items;
}
