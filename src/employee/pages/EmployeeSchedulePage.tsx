import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera } from 'lucide-react';
import type { EmployeeCalendar } from '../../attendance/types';
import { documentId } from '../../attendance/types';
import { eachDate, formatStudioDate, monthBounds, studioMonth, words } from '../../attendance/format';
import { employeeApi } from '../api';
import { EmployeeAlert, EmployeeCard, EmployeeLoading, EmployeePageHeader, StatusBadge, employeeFieldClass } from '../components/EmployeeUi';

type CalendarItem = { id: string; date: string; label: string; tone: string; detail?: string; status?: string };

export function EmployeeSchedulePage() {
  const [month, setMonth] = useState(studioMonth());
  const [calendar, setCalendar] = useState<EmployeeCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = useMemo(() => monthBounds(month), [month]);

  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try { setCalendar(await employeeApi.calendar(range.from, range.to)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load schedule.'); }
    finally { setLoading(false); }
  }, [range.from, range.to]);
  useEffect(() => { void load(); }, [load]);

  const items = useMemo(() => calendarItems(calendar), [calendar]);
  return <><EmployeePageHeader title="Schedule" description="Your shoots, holidays, approved leave and monthly off-days" />{error && <EmployeeAlert>{error}</EmployeeAlert>}<label className="block text-sm font-semibold">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={employeeFieldClass} /></label>{loading ? <EmployeeLoading /> : <><EmployeeCard className="hidden overflow-hidden sm:block"><div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase text-slate-500">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="p-2">{day}</div>)}</div><div className="grid grid-cols-7">{Array.from({ length: new Date(`${range.from}T00:00:00Z`).getUTCDay() }).map((_, index) => <div key={`blank-${index}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/50" />)}{eachDate(range.from, range.to).map((date) => <div key={date} className="min-h-28 border-b border-r border-slate-100 p-2"><p className="text-xs font-bold text-slate-500">{Number(date.slice(-2))}</p><div className="mt-1 space-y-1">{items.filter((item) => item.date === date).map((item) => <div key={item.id} title={item.detail} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${item.tone}`}>{item.label}</div>)}</div></div>)}</div></EmployeeCard><div className="space-y-3"><h2 className="font-bold sm:hidden">Month details</h2>{items.length ? items.sort((a, b) => a.date.localeCompare(b.date)).map((item) => <EmployeeCard key={item.id} className="p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{item.label.includes('shoot') || item.label.includes('Shoot') ? <Camera className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="font-bold">{item.label}</p><p className="mt-1 text-sm text-slate-600">{formatStudioDate(item.date)}{item.detail ? ` · ${item.detail}` : ''}</p></div>{item.status && <StatusBadge status={item.status} />}</div></EmployeeCard>) : <EmployeeCard className="p-8 text-center text-sm text-slate-500">Nothing scheduled for this month.</EmployeeCard>}</div></>}</>;
}

function calendarItems(calendar: EmployeeCalendar | null): CalendarItem[] {
  if (!calendar) return [];
  const items: CalendarItem[] = [];
  calendar.holidays.forEach((holiday) => items.push({ id: `holiday-${documentId(holiday) || holiday.date}`, date: holiday.date, label: holiday.name, detail: 'Studio holiday', tone: 'bg-violet-100 text-violet-800' }));
  calendar.offDays.forEach((off) => items.push({ id: `off-${documentId(off)}`, date: off.date, label: 'Monthly off-day', detail: off.employeeNote, status: off.status, tone: 'bg-blue-100 text-blue-800' }));
  calendar.leave.forEach((leave) => { const type = typeof leave.leaveTypeId === 'object' ? leave.leaveTypeId.name : 'Leave'; leave.dateEntries.filter((entry) => entry.date >= calendar.from && entry.date <= calendar.to).forEach((entry) => items.push({ id: `leave-${documentId(leave)}-${entry.date}`, date: entry.date, label: `${type} · ${words(entry.portion)}`, status: leave.status, tone: 'bg-amber-100 text-amber-900' })); });
  calendar.assignments.forEach((assignment) => { const booking = typeof assignment.bookingId === 'object' ? assignment.bookingId : null; items.push({ id: `assignment-${documentId(assignment)}`, date: assignment.businessDate, label: booking?.shootType || 'Field shoot', detail: `${assignment.startTime || 'Time not set'} · ${assignment.locationLabel}`, tone: 'bg-emerald-100 text-emerald-800' }); });
  return items;
}
