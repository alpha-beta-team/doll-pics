import { useCallback, useEffect, useState } from 'react';
import { Clock3, FilePenLine, TimerReset, X } from 'lucide-react';
import type { AttendanceDay, AttendanceDayResponse, CorrectionRequest, OvertimeRequest } from '../../attendance/types';
import { documentId } from '../../attendance/types';
import { durationLabel, formatStudioDate, formatStudioTime, monthBounds, studioDate, studioDateTimeIso, studioMonth, words } from '../../attendance/format';
import { employeeApi } from '../api';
import { EmployeeAlert, EmployeeButton, EmployeeCard, EmployeeLoading, EmployeePageHeader, StatusBadge, employeeFieldClass } from '../components/EmployeeUi';

export function EmployeeAttendancePage() {
  const [month, setMonth] = useState(studioMonth());
  const [history, setHistory] = useState<AttendanceDay[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [detail, setDetail] = useState<AttendanceDayResponse | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [overtimeOpen, setOvertimeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    const range = monthBounds(month);
    try {
      const [days, correctionRows, overtimeRows] = await Promise.all([
        employeeApi.attendanceHistory(range.from, range.to), employeeApi.corrections(), employeeApi.overtimeRequests(),
      ]);
      setHistory(days); setCorrections(correctionRows); setOvertime(overtimeRows);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load attendance.'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { setLoading(true); void load(); }, [load]);

  const openDay = async (date: string) => {
    setError('');
    try { setDetail(await employeeApi.attendanceDay(date)); }
    catch (detailError) { setError(detailError instanceof Error ? detailError.message : 'Could not load the day.'); }
  };

  const cancelCorrection = async (request: CorrectionRequest) => {
    try { await employeeApi.cancelCorrection(documentId(request)); setNotice('Correction request cancelled.'); await load(); }
    catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the request.'); }
  };

  return (
    <>
      <EmployeePageHeader title="Attendance" description="Punch history, corrections and overtime" />
      {error && <EmployeeAlert>{error}</EmployeeAlert>}{notice && <EmployeeAlert tone="success">{notice}</EmployeeAlert>}
      <div className="flex gap-2"><EmployeeButton onClick={() => setCorrectionOpen(true)} className="flex-1"><FilePenLine className="h-4 w-4" />Request correction</EmployeeButton><EmployeeButton variant="secondary" onClick={() => setOvertimeOpen(true)} className="flex-1"><TimerReset className="h-4 w-4" />Request overtime</EmployeeButton></div>
      <label className="block text-sm font-semibold text-slate-700">Attendance month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={employeeFieldClass} /></label>
      {loading ? <EmployeeLoading /> : history.length === 0 ? <EmployeeCard className="p-8 text-center"><Clock3 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-bold">No attendance records</h2><p className="mt-1 text-sm text-slate-500">Records will appear after your first punch.</p></EmployeeCard> : <div className="space-y-3">{history.map((day) => <button type="button" key={day.businessDate} onClick={() => void openDay(day.businessDate)} className="w-full text-left"><EmployeeCard className="p-4 transition hover:border-blue-300"><div className="flex items-center justify-between gap-3"><div><p className="font-bold">{formatStudioDate(day.businessDate, { weekday: 'short', year: undefined })}</p><p className="mt-1 text-xs text-slate-500">{formatStudioTime(day.punchIn)} – {formatStudioTime(day.punchOut)} · {durationLabel(day.netMinutes)}</p></div><StatusBadge status={day.status} /></div>{day.flags?.length ? <p className="mt-2 text-xs font-medium text-orange-700">{day.flags.map(words).join(' · ')}</p> : null}</EmployeeCard></button>)}</div>}

      {(corrections.length > 0 || overtime.length > 0) && <section className="space-y-3"><h2 className="font-bold">Requests</h2>{corrections.slice(0, 8).map((request) => <EmployeeCard key={documentId(request)} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">Punch correction · {formatStudioDate(request.businessDate)}</p><p className="mt-1 text-sm text-slate-600">{request.reason}</p><p className="mt-2 text-xs text-slate-500">Proposed: {formatStudioTime(request.proposedIn)} – {formatStudioTime(request.proposedOut)}</p></div><StatusBadge status={request.status} /></div>{request.adminComment && <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Owner: {request.adminComment}</p>}{request.status === 'PENDING' && <button type="button" className="mt-3 text-sm font-semibold text-red-700" onClick={() => void cancelCorrection(request)}>Cancel request</button>}</EmployeeCard>)}{overtime.slice(0, 8).map((request) => <EmployeeCard key={documentId(request)} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">Overtime · {formatStudioDate(request.businessDate)}</p><p className="mt-1 text-sm text-slate-600">Requested {durationLabel(request.requestedMinutes)} · eligible {durationLabel(request.eligibleMinutes)}</p><p className="mt-1 text-xs text-slate-500">{request.reason}</p></div><StatusBadge status={request.status} /></div>{request.status === 'APPROVED' && <p className="mt-2 text-xs font-semibold text-emerald-700">Approved: {durationLabel(request.approvedMinutes)}</p>}</EmployeeCard>)}</section>}

      {detail && <DayDetail data={detail} onClose={() => setDetail(null)} />}
      {correctionOpen && <CorrectionForm onClose={() => setCorrectionOpen(false)} onSaved={async () => { setCorrectionOpen(false); setNotice('Correction request sent to the owner.'); await load(); }} />}
      {overtimeOpen && <OvertimeForm onClose={() => setOvertimeOpen(false)} onSaved={async () => { setOvertimeOpen(false); setNotice('Overtime request sent to the owner.'); await load(); }} />}
    </>
  );
}

function DayDetail({ data, onClose }: { data: AttendanceDayResponse; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">{formatStudioDate(data.day.businessDate)}</h2><div className="mt-2"><StatusBadge status={data.day.status} /></div></div><button type="button" onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-slate-100" aria-label="Close"><X className="mx-auto h-5 w-5" /></button></div><div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4"><Metric label="In" value={formatStudioTime(data.day.punchIn)} /><Metric label="Out" value={formatStudioTime(data.day.punchOut)} /><Metric label="Worked" value={durationLabel(data.day.netMinutes)} /></div>{data.day.flags?.length ? <p className="mt-4 text-sm font-semibold text-orange-700">{data.day.flags.map(words).join(' · ')}</p> : null}<h3 className="mt-5 text-sm font-bold">Punch evidence</h3><div className="mt-2 space-y-2">{data.punches.length ? data.punches.map((punch) => <div key={documentId(punch)} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex justify-between"><strong>{words(punch.direction)} · {words(punch.source)}</strong><span>{formatStudioTime(punch.serverAt)}</span></div><p className="mt-1 text-xs text-slate-500">{words(punch.verificationStatus)}{punch.exceptionReason ? ` · ${punch.exceptionReason}` : ''}</p></div>) : <p className="text-sm text-slate-500">No original punches.</p>}</div></div></div>;
}

function CorrectionForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void | Promise<void> }) {
  const [date, setDate] = useState(studioDate()); const [inTime, setInTime] = useState(''); const [outTime, setOutTime] = useState(''); const [reason, setReason] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!inTime && !outTime) return setError('Enter a corrected IN or OUT time.'); setSaving(true); setError(''); try { await employeeApi.createCorrection({ businessDate: date, ...(inTime ? { proposedIn: studioDateTimeIso(date, inTime) } : {}), ...(outTime ? { proposedOut: studioDateTimeIso(date, outTime) } : {}), reason }); await onSaved(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not submit correction.'); setSaving(false); } };
  return <FormSheet title="Request punch correction" description="The original punch remains unchanged. The owner will review this request." onClose={onClose}><form className="space-y-4" onSubmit={(event) => void submit(event)}>{error && <EmployeeAlert>{error}</EmployeeAlert>}<label className="block text-sm font-semibold">Date<input required type="date" max={studioDate()} className={employeeFieldClass} value={date} onChange={(event) => setDate(event.target.value)} /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Correct IN<input type="time" className={employeeFieldClass} value={inTime} onChange={(event) => setInTime(event.target.value)} /></label><label className="block text-sm font-semibold">Correct OUT<input type="time" className={employeeFieldClass} value={outTime} onChange={(event) => setOutTime(event.target.value)} /></label></div><label className="block text-sm font-semibold">Reason<textarea required minLength={3} rows={3} className={`${employeeFieldClass} py-3`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Example: I forgot to punch out" /></label><div className="grid grid-cols-2 gap-3"><EmployeeButton type="button" variant="secondary" onClick={onClose}>Cancel</EmployeeButton><EmployeeButton disabled={saving}>{saving ? 'Sending…' : 'Send request'}</EmployeeButton></div></form></FormSheet>;
}

function OvertimeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void | Promise<void> }) {
  const [date, setDate] = useState(studioDate()); const [minutes, setMinutes] = useState('30'); const [reason, setReason] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await employeeApi.createOvertime(date, Number(minutes), reason); await onSaved(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not submit overtime.'); setSaving(false); } };
  return <FormSheet title="Request overtime" description="Available only after completing seven normal working hours and at least 30 eligible minutes after 6:30 PM." onClose={onClose}><form className="space-y-4" onSubmit={(event) => void submit(event)}>{error && <EmployeeAlert>{error}</EmployeeAlert>}<label className="block text-sm font-semibold">Date<input required type="date" max={studioDate()} className={employeeFieldClass} value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="block text-sm font-semibold">Requested minutes<input required type="number" min={30} step={1} className={employeeFieldClass} value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label><label className="block text-sm font-semibold">Reason<textarea required minLength={3} rows={3} className={`${employeeFieldClass} py-3`} value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="grid grid-cols-2 gap-3"><EmployeeButton type="button" variant="secondary" onClick={onClose}>Cancel</EmployeeButton><EmployeeButton disabled={saving}>{saving ? 'Sending…' : 'Send request'}</EmployeeButton></div></form></FormSheet>;
}

function FormSheet({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div><button type="button" onClick={onClose} className="h-10 w-10 shrink-0 rounded-xl hover:bg-slate-100" aria-label="Close"><X className="mx-auto h-5 w-5" /></button></div><div className="mt-5">{children}</div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }
