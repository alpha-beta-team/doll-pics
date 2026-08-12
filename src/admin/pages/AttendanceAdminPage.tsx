import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilePenLine, RefreshCw, UsersRound } from 'lucide-react';
import type { AdminDayResponse, AdminMonthResponse, AttendanceDay, StaffSummary } from '../../attendance/types';
import { documentId } from '../../attendance/types';
import { durationLabel, formatStudioDate, formatStudioTime, statusBadgeClass, studioDate, studioDateTimeIso, studioMonth, words } from '../../attendance/format';
import { api } from '../api/client';
import { AdminAlert, AdminBadge, AdminButton, AdminCard, AdminField, AdminLoadingState, AdminModal, AdminPageHeader, AdminTableSurface, adminFieldClass } from '../components/ui';

type ViewMode = 'daily' | 'monthly';

export function AttendanceAdminPage() {
  const [mode, setMode] = useState<ViewMode>('daily');
  const [date, setDate] = useState(studioDate());
  const [month, setMonth] = useState(studioMonth());
  const [dayData, setDayData] = useState<AdminDayResponse | null>(null);
  const [monthData, setMonthData] = useState<AdminMonthResponse | null>(null);
  const [adjusting, setAdjusting] = useState<{ staff: StaffSummary; day: AttendanceDay } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (mode === 'daily') setDayData(date === studioDate() ? await api.attendanceToday() : await api.attendanceDaily(date));
      else setMonthData(await api.attendanceMonthly(month));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load attendance.'); }
    finally { setLoading(false); }
  }, [date, mode, month]);
  useEffect(() => { void load(); }, [load]);

  const summaries = useMemo(() => {
    const rows = dayData?.rows || [];
    return [
      { label: 'Present', value: rows.filter((row) => ['PRESENT', 'FIELD_WORK'].includes(row.day.status)).length, tone: 'text-emerald-700 bg-emerald-50' },
      { label: 'On leave / off', value: rows.filter((row) => ['ON_LEAVE', 'HALF_DAY_LEAVE', 'SCHEDULED_OFF', 'HOLIDAY'].includes(row.day.status)).length, tone: 'text-blue-700 bg-blue-50' },
      { label: 'Late', value: rows.filter((row) => row.day.flags?.includes('LATE')).length, tone: 'text-amber-800 bg-amber-50' },
      { label: 'Needs attention', value: rows.filter((row) => row.day.unresolved || ['LOSS_OF_PAY', 'ABSENT', 'INCOMPLETE', 'NOT_PUNCHED_IN'].includes(row.day.status)).length, tone: 'text-red-700 bg-red-50' },
    ];
  }, [dayData]);

  return <div className="mx-auto max-w-7xl space-y-6"><AdminPageHeader eyebrow="People" title="Attendance" description="Daily presence, monthly attendance and reasoned corrections for attendance-enabled StaffAccounts." actions={<AdminButton variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Refresh</AdminButton>} />{error && <AdminAlert>{error}</AdminAlert>}{notice && <AdminAlert tone="success">{notice}</AdminAlert>}<div className="flex gap-1 border-b border-admin-border"><Tab active={mode === 'daily'} onClick={() => setMode('daily')}>Daily</Tab><Tab active={mode === 'monthly'} onClick={() => setMode('monthly')}>Monthly</Tab></div>{mode === 'daily' ? <><AdminCard className="p-4"><label className="block max-w-xs text-sm font-semibold text-admin-secondary">Attendance date<input type="date" className={adminFieldClass} value={date} onChange={(event) => setDate(event.target.value)} /></label></AdminCard>{!loading && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaries.map((item) => <AdminCard key={item.label} className="p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}><UsersRound className="h-4 w-4" /></span><p className="mt-3 text-2xl font-bold text-admin-text">{item.value}</p><p className="text-sm text-admin-subtle">{item.label}</p></AdminCard>)}</div>}{loading ? <AdminCard><AdminLoadingState label="Calculating attendance…" /></AdminCard> : <DailyTable data={dayData} onAdjust={setAdjusting} />}</> : <><AdminCard className="p-4"><label className="block max-w-xs text-sm font-semibold text-admin-secondary">Attendance month<input type="month" className={adminFieldClass} value={month} onChange={(event) => setMonth(event.target.value)} /></label></AdminCard>{loading ? <AdminCard><AdminLoadingState label="Calculating month…" /></AdminCard> : <MonthlyTable data={monthData} />}</>}{adjusting && <AdjustmentDialog value={adjusting} onClose={() => setAdjusting(null)} onSaved={async () => { setAdjusting(null); setNotice('Attendance adjustment saved with an audit reason.'); await load(); }} />}</div>;
}

function DailyTable({ data, onAdjust }: { data: AdminDayResponse | null; onAdjust: (value: { staff: StaffSummary; day: AttendanceDay }) => void }) {
  if (!data?.rows.length) return <AdminCard className="p-10 text-center text-sm text-admin-subtle">No attendance-enabled staff are active on this date.</AdminCard>;
  return <AdminTableSurface><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-admin-border bg-admin-muted/60 text-xs uppercase text-admin-subtle"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Punch in</th><th className="px-4 py-3">Punch out</th><th className="px-4 py-3">Worked</th><th className="px-4 py-3">Flags</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-admin-border">{data.rows.map(({ staff, day }) => <tr key={documentId(staff)} className="hover:bg-admin-muted/30"><td className="px-4 py-4"><p className="font-semibold text-admin-text">{staff.name}</p><p className="text-xs text-admin-subtle">{staff.employeeCode}</p></td><td className="px-4 py-4"><AdminBadge className={statusBadgeClass(day.status)}>{words(day.status)}</AdminBadge></td><td className="px-4 py-4">{formatStudioTime(day.punchIn)}</td><td className="px-4 py-4">{formatStudioTime(day.punchOut)}</td><td className="px-4 py-4 font-semibold">{durationLabel(day.netMinutes)}</td><td className="max-w-64 px-4 py-4 text-xs text-admin-subtle">{day.flags?.map(words).join(' · ') || '—'}</td><td className="px-4 py-4 text-right"><AdminButton variant="secondary" onClick={() => onAdjust({ staff, day })}><FilePenLine className="h-4 w-4" />Correct</AdminButton></td></tr>)}</tbody></table></AdminTableSurface>;
}

function MonthlyTable({ data }: { data: AdminMonthResponse | null }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { staff: StaffSummary; present: number; leave: number; off: number; lop: number; late: number; missing: number; overtime: number; net: number }>();
    (data?.rows || []).forEach((day) => { const staff = typeof day.staffAccountId === 'object' ? day.staffAccountId : ({ id: String(day.staffAccountId || ''), name: 'Staff' } as StaffSummary); const id = documentId(staff); const item = map.get(id) || { staff, present: 0, leave: 0, off: 0, lop: 0, late: 0, missing: 0, overtime: 0, net: 0 }; if (['PRESENT', 'FIELD_WORK'].includes(day.status)) item.present += 1; if (['ON_LEAVE', 'HALF_DAY_LEAVE'].includes(day.status)) item.leave += 1; if (['SCHEDULED_OFF', 'HOLIDAY'].includes(day.status)) item.off += 1; if (['LOSS_OF_PAY', 'ABSENT'].includes(day.status)) item.lop += 1; if (day.flags?.includes('LATE')) item.late += 1; if (day.flags?.includes('MISSING_PUNCH_OUT')) item.missing += 1; item.overtime += day.approvedOvertimeMinutes || 0; item.net += day.netMinutes || 0; map.set(id, item); });
    return [...map.values()].sort((a, b) => a.staff.name.localeCompare(b.staff.name));
  }, [data]);
  if (!grouped.length) return <AdminCard className="p-10 text-center text-sm text-admin-subtle">No monthly attendance records.</AdminCard>;
  return <AdminTableSurface><table className="w-full min-w-[960px] text-left text-sm"><thead className="border-b border-admin-border bg-admin-muted/60 text-xs uppercase text-admin-subtle"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Present / field</th><th className="px-4 py-3">Leave</th><th className="px-4 py-3">Off / holiday</th><th className="px-4 py-3">LOP</th><th className="px-4 py-3">Late</th><th className="px-4 py-3">Missing OUT</th><th className="px-4 py-3">Overtime</th><th className="px-4 py-3">Net hours</th></tr></thead><tbody className="divide-y divide-admin-border">{grouped.map((item) => <tr key={documentId(item.staff)}><td className="px-4 py-4"><p className="font-semibold">{item.staff.name}</p><p className="text-xs text-admin-subtle">{item.staff.employeeCode}</p></td><td className="px-4 py-4">{item.present}</td><td className="px-4 py-4">{item.leave}</td><td className="px-4 py-4">{item.off}</td><td className="px-4 py-4 font-semibold text-red-700">{item.lop}</td><td className="px-4 py-4">{item.late}</td><td className="px-4 py-4">{item.missing}</td><td className="px-4 py-4">{durationLabel(item.overtime)}</td><td className="px-4 py-4 font-semibold">{durationLabel(item.net)}</td></tr>)}</tbody></table></AdminTableSurface>;
}

function AdjustmentDialog({ value, onClose, onSaved }: { value: { staff: StaffSummary; day: AttendanceDay }; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const [inTime, setInTime] = useState(timeInput(value.day.punchIn)); const [outTime, setOutTime] = useState(timeInput(value.day.punchOut)); const [reason, setReason] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!inTime && !outTime) return setError('Enter a corrected IN or OUT time.'); setSaving(true); setError(''); try { await api.adjustAttendance({ staffAccountId: documentId(value.staff), businessDate: value.day.businessDate, ...(inTime ? { effectiveIn: studioDateTimeIso(value.day.businessDate, inTime) } : {}), ...(outTime ? { effectiveOut: studioDateTimeIso(value.day.businessDate, outTime) } : {}), reason }); await onSaved(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save the correction.'); setSaving(false); } };
  return <AdminModal open title={`Correct ${value.staff.name}`} description={`${formatStudioDate(value.day.businessDate)} · original punch evidence will be preserved`} onClose={onClose} footer={<div className="flex justify-end gap-3"><AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton><AdminButton type="submit" form="attendance-adjustment" disabled={saving}>{saving ? 'Saving…' : 'Save correction'}</AdminButton></div>}><form id="attendance-adjustment" className="space-y-4" onSubmit={(event) => void submit(event)}>{error && <AdminAlert>{error}</AdminAlert>}<div className="grid grid-cols-2 gap-3"><AdminField label="Effective IN"><input type="time" className={adminFieldClass} value={inTime} onChange={(event) => setInTime(event.target.value)} /></AdminField><AdminField label="Effective OUT"><input type="time" className={adminFieldClass} value={outTime} onChange={(event) => setOutTime(event.target.value)} /></AdminField></div><AdminField label="Reason" hint="Required for the audit trail."><textarea required minLength={3} rows={3} className={`${adminFieldClass} py-3`} value={reason} onChange={(event) => setReason(event.target.value)} /></AdminField></form></AdminModal>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-semibold ${active ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-subtle'}`}>{children}</button>; }
function timeInput(value?: string) { if (!value) return ''; const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(value)); const get = (type: string) => parts.find((item) => item.type === type)?.value || ''; return `${get('hour')}:${get('minute')}`; }
