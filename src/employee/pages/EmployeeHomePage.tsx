import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Camera, Clock3, LogIn, LogOut, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AttendanceDay, FieldAssignment, LeaveBalance, PunchDirection } from '../../attendance/types';
import { documentId } from '../../attendance/types';
import { durationLabel, formatStudioTime, newRequestId, studioDate, studioMonth, words } from '../../attendance/format';
import { ScopedApiError } from '../../attendance/scopedHttp';
import { employeeApi } from '../api';
import { EmployeeAlert, EmployeeButton, EmployeeCard, EmployeeLoading, EmployeePageHeader, StatusBadge } from '../components/EmployeeUi';

export function EmployeeHomePage() {
  const [today, setToday] = useState<AttendanceDay | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [assignments, setAssignments] = useState<FieldAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [punching, setPunching] = useState('');
  const [pendingPunch, setPendingPunch] = useState<{ assignmentId: string; direction: PunchDirection; requestId: string } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const date = studioDate();
      const [day, leaveBalances, fieldAssignments] = await Promise.all([
        employeeApi.today(), employeeApi.balances(studioMonth()), employeeApi.fieldAssignments(date, date),
      ]);
      setToday(day); setBalances(leaveBalances); setAssignments(fieldAssignments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load today.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const punchField = async (assignment: FieldAssignment, direction: PunchDirection) => {
    const assignmentId = documentId(assignment);
    if (!assignmentId || punching) return;
    setPunching(assignmentId); setError(''); setNotice('');
    const currentPending = pendingPunch?.assignmentId === assignmentId && pendingPunch.direction === direction
      ? pendingPunch
      : { assignmentId, direction, requestId: newRequestId() };
    setPendingPunch(currentPending);

    const location = await locate();
    try {
      const result = await employeeApi.fieldPunch(assignmentId, {
        direction,
        clientRequestId: currentPending.requestId,
        ...(location.ok
          ? { latitude: location.latitude, longitude: location.longitude, accuracyM: location.accuracy }
          : { gpsPermissionDenied: true }),
      });
      setPendingPunch(null);
      setToday(result.day);
      setNotice(result.requiresReview
        ? `${words(direction)} was saved and sent to the owner for location review.`
        : `${words(direction)} recorded for ${assignment.locationLabel}.`);
    } catch (punchError) {
      if (!(punchError instanceof ScopedApiError) || punchError.status !== 0) setPendingPunch(null);
      setError(punchError instanceof Error ? punchError.message : 'Could not record the field punch.');
    } finally { setPunching(''); }
  };

  if (loading) return <EmployeeLoading label="Loading today…" />;
  const nextDirection: PunchDirection | null = !today?.punchIn ? 'IN' : !today.punchOut ? 'OUT' : null;

  return (
    <>
      <EmployeePageHeader title="Today" description={new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} action={<button type="button" onClick={() => void load()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button>} />
      {error && <EmployeeAlert>{error}</EmployeeAlert>}
      {notice && <EmployeeAlert tone="success">{notice}</EmployeeAlert>}
      <EmployeeCard className="overflow-hidden">
        <div className="bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Attendance status</p><div className="mt-2"><StatusBadge status={today?.status || 'EXPECTED'} /></div></div><Clock3 className="h-7 w-7 text-blue-300" /></div><div className="mt-6 grid grid-cols-3 gap-3"><Metric label="Punch in" value={formatStudioTime(today?.punchIn)} /><Metric label="Punch out" value={formatStudioTime(today?.punchOut)} /><Metric label="Worked" value={durationLabel(today?.netMinutes || 0)} /></div></div>
        {today?.flags?.length ? <div className="flex flex-wrap gap-2 border-t border-slate-800 bg-slate-900 px-5 py-3">{today.flags.map((flag) => <span key={flag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">{words(flag)}</span>)}</div> : null}
      </EmployeeCard>

      {assignments.length > 0 && <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-bold">Today’s field work</h2><MapPin className="h-5 w-5 text-slate-400" /></div>{assignments.map((assignment) => { const id = documentId(assignment); const booking = typeof assignment.bookingId === 'object' ? assignment.bookingId : null; return <EmployeeCard key={id} className="p-4"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Camera className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-bold">{booking?.shootType || 'Outdoor shoot'}</h3><p className="mt-0.5 text-sm text-slate-600">{assignment.locationLabel}</p><p className="mt-1 text-xs text-slate-500">{assignment.startTime || 'Time not set'}{assignment.endTime ? `–${assignment.endTime}` : ''} · {words(assignment.creditMode)}</p></div></div><p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">Location is requested only when you tap the button. If GPS is unavailable, the punch is saved for owner review.</p>{nextDirection ? <EmployeeButton className="mt-3 w-full" disabled={punching === id} onClick={() => void punchField(assignment, nextDirection)}>{nextDirection === 'IN' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}{punching === id ? 'Checking location…' : `Field punch ${words(nextDirection)}`}</EmployeeButton> : <p className="mt-3 text-center text-sm font-semibold text-emerald-700">Today’s IN and OUT are complete.</p>}</EmployeeCard>; })}</section>}

      <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Leave balance</h2><Link to="/employee/leave" className="text-sm font-semibold text-blue-700">Manage leave</Link></div><div className="grid grid-cols-2 gap-3">{balances.map((balance) => <EmployeeCard key={balance.leaveType.id} className="p-4"><CalendarPlus className="h-5 w-5 text-blue-700" /><p className="mt-3 text-2xl font-bold">{balance.availableDays}</p><p className="text-sm text-slate-600">{balance.leaveType.name}</p><p className="mt-1 text-xs text-slate-400">of {balance.allowanceDays} days this month</p></EmployeeCard>)}</div></section>
      {!today?.punchIn && !assignments.length && <EmployeeAlert tone="info">Use the office tablet to punch in. Your phone is used for leave, history and assigned outdoor shoots.</EmployeeAlert>}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold sm:text-base">{value}</p></div>;
}

function locate(): Promise<{ ok: true; latitude: number; longitude: number; accuracy: number } | { ok: false }> {
  if (!navigator.geolocation) return Promise.resolve({ ok: false });
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
    (position) => resolve({ ok: true, latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
    () => resolve({ ok: false }),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 12_000 },
  ));
}
