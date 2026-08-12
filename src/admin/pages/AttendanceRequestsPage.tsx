import { useCallback, useEffect, useState } from 'react';
import { CalendarOff, CalendarPlus, Clock3, MapPin, TimerReset } from 'lucide-react';
import type { CorrectionRequest, DayOffRequest, LeaveRequest, OvertimeRequest, PunchEvent, RequestStatus, StaffSummary } from '../../attendance/types';
import { documentId, staffName } from '../../attendance/types';
import { durationLabel, formatStudioDate, formatStudioTime, unitsLabel, words } from '../../attendance/format';
import { api } from '../api/client';
import { AdminAlert, AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminField, AdminLoadingState, AdminModal, AdminPageHeader, adminFieldClass } from '../components/ui';

type Tab = 'leave' | 'off' | 'correction' | 'overtime' | 'location';
type Decision = Extract<RequestStatus, 'APPROVED' | 'REJECTED'>;
type DecisionTarget =
  | { type: 'leave'; item: LeaveRequest }
  | { type: 'off'; item: DayOffRequest }
  | { type: 'correction'; item: CorrectionRequest }
  | { type: 'overtime'; item: OvertimeRequest }
  | { type: 'location'; item: PunchEvent };

export function AttendanceRequestsPage() {
  const [tab, setTab] = useState<Tab>('leave');
  const [data, setData] = useState<{ leave: LeaveRequest[]; off: DayOffRequest[]; correction: CorrectionRequest[]; overtime: OvertimeRequest[]; location: PunchEvent[] }>({ leave: [], off: [], correction: [], overtime: [], location: [] });
  const [target, setTarget] = useState<DecisionTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [leave, off, correction, overtime, location] = await Promise.all([
        api.leavePending(), api.dayOffsPending(), api.correctionsPending(), api.overtimePending(), api.fieldExceptionsPending(),
      ]);
      setData({ leave, off, correction, overtime, location });
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load pending requests.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const definitions: Array<{ id: Tab; label: string; icon: typeof CalendarPlus }> = [
    { id: 'leave', label: 'Leave', icon: CalendarPlus }, { id: 'off', label: 'Off-days', icon: CalendarOff }, { id: 'correction', label: 'Corrections', icon: Clock3 }, { id: 'overtime', label: 'Overtime', icon: TimerReset }, { id: 'location', label: 'GPS review', icon: MapPin },
  ];
  const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);
  return <div className="mx-auto max-w-6xl space-y-6"><AdminPageHeader eyebrow="People" title="Attendance & Leave Requests" description={`${total} pending request${total === 1 ? '' : 's'} need an owner decision.`} />{error && <AdminAlert>{error}</AdminAlert>}{notice && <AdminAlert tone="success">{notice}</AdminAlert>}<div className="overflow-x-auto border-b border-admin-border"><div className="flex min-w-max gap-1">{definitions.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${tab === id ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-subtle'}`}><Icon className="h-4 w-4" />{label}<AdminBadge>{data[id].length}</AdminBadge></button>)}</div></div>{loading ? <AdminCard><AdminLoadingState /></AdminCard> : <RequestList tab={tab} rows={data[tab]} onDecide={setTarget} />}{target && <DecisionDialog target={target} onClose={() => setTarget(null)} onSaved={async (decision) => { setTarget(null); setNotice(`${words(target.type)} request ${decision.toLowerCase()}.`); await load(); }} />}</div>;
}

function RequestList({ tab, rows, onDecide }: { tab: Tab; rows: Array<LeaveRequest | DayOffRequest | CorrectionRequest | OvertimeRequest | PunchEvent>; onDecide: (target: DecisionTarget) => void }) {
  if (!rows.length) return <AdminEmptyState title={`No pending ${tab === 'location' ? 'GPS exceptions' : `${words(tab).toLowerCase()} requests`}`} description="New employee requests will appear here." />;
  return <div className="space-y-3">{rows.map((row) => { const id = documentId(row); const staff = row.staffAccountId as StaffSummary | string | undefined; return <AdminCard key={id} className="p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-admin-text">{staffName(staff)}</h2><AdminBadge>{typeof staff === 'object' ? staff.employeeCode : ''}</AdminBadge></div><RequestDetails tab={tab} row={row} /></div><div className="flex shrink-0 gap-2"><AdminButton variant="secondary" onClick={() => onDecide({ type: tab, item: row } as DecisionTarget)}>Review</AdminButton></div></div></AdminCard>; })}</div>;
}

function RequestDetails({ tab, row }: { tab: Tab; row: LeaveRequest | DayOffRequest | CorrectionRequest | OvertimeRequest | PunchEvent }) {
  if (tab === 'leave') { const item = row as LeaveRequest; const type = typeof item.leaveTypeId === 'object' ? item.leaveTypeId.name : 'Leave'; const units = item.dateEntries.reduce((sum, entry) => sum + entry.units, 0); return <><p className="mt-2 text-sm font-semibold text-admin-secondary">{type} · {unitsLabel(units)}</p><p className="mt-1 text-sm text-admin-subtle">{item.dateEntries.map((entry) => `${formatStudioDate(entry.date, { year: undefined })} (${words(entry.portion)})`).join(', ')}</p><p className="mt-2 text-sm text-admin-secondary">{item.reason}</p></>; }
  if (tab === 'off') { const item = row as DayOffRequest; return <><p className="mt-2 text-sm font-semibold text-admin-secondary">{formatStudioDate(item.date)}</p><p className="mt-1 text-sm text-admin-subtle">{item.employeeNote || 'No employee note'}</p>{item.fieldAssignmentConflict && <p className="mt-2 text-sm font-semibold text-red-700">Conflicts with a field assignment</p>}</>; }
  if (tab === 'correction') { const item = row as CorrectionRequest; return <><p className="mt-2 text-sm font-semibold text-admin-secondary">{formatStudioDate(item.businessDate)} · proposed {formatStudioTime(item.proposedIn)} – {formatStudioTime(item.proposedOut)}</p><p className="mt-1 text-sm text-admin-subtle">{item.reason}</p></>; }
  if (tab === 'overtime') { const item = row as OvertimeRequest; return <><p className="mt-2 text-sm font-semibold text-admin-secondary">{formatStudioDate(item.businessDate)} · requested {durationLabel(item.requestedMinutes)}</p><p className="mt-1 text-sm text-admin-subtle">Observed {durationLabel(item.observedMinutes)} · eligible {durationLabel(item.eligibleMinutes)}</p><p className="mt-1 text-sm text-admin-subtle">{item.reason}</p></>; }
  const item = row as PunchEvent; return <><p className="mt-2 text-sm font-semibold text-admin-secondary">{formatStudioDate(item.businessDate)} · {words(item.direction)} at {formatStudioTime(item.serverAt)}</p><p className="mt-1 text-sm text-admin-subtle">{item.exceptionReason || 'Location verification failed'} · accuracy {item.accuracyM ? `${Math.round(item.accuracyM)}m` : 'unavailable'} · distance {item.distanceM ? `${Math.round(item.distanceM)}m` : 'unavailable'}</p></>;
}

function DecisionDialog({ target, onClose, onSaved }: { target: DecisionTarget; onClose: () => void; onSaved: (decision: Decision) => void | Promise<void> }) {
  const overtime = target.type === 'overtime' ? target.item : null;
  const [decision, setDecision] = useState<Decision>('APPROVED'); const [comment, setComment] = useState(''); const [approvedMinutes, setApprovedMinutes] = useState(String(overtime?.requestedMinutes || '')); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); const id = documentId(target.item); try { if (target.type === 'leave') await api.decideLeave(id, decision, comment); if (target.type === 'off') await api.decideDayOff(id, decision, comment); if (target.type === 'correction') await api.decideCorrection(id, decision, comment); if (target.type === 'location') await api.decideFieldException(id, decision, comment); if (target.type === 'overtime') await api.decideOvertime(id, decision, comment, decision === 'APPROVED' ? Number(approvedMinutes) : 0); await onSaved(decision); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save the decision.'); setSaving(false); } };
  return <AdminModal open title={`Review ${words(target.type)} request`} description="Review the employee evidence before making a final decision." onClose={onClose} footer={<div className="flex justify-end gap-3"><AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton><AdminButton type="submit" form="request-decision" variant={decision === 'REJECTED' ? 'danger' : 'primary'} disabled={saving}>{saving ? 'Saving…' : `${words(decision)} request`}</AdminButton></div>}><form id="request-decision" className="space-y-4" onSubmit={(event) => void submit(event)}>{error && <AdminAlert>{error}</AdminAlert>}<RequestDetails tab={target.type} row={target.item} /><fieldset><legend className="text-sm font-semibold text-admin-secondary">Decision</legend><div className="mt-2 grid grid-cols-2 gap-3"><button type="button" onClick={() => setDecision('APPROVED')} className={`h-11 rounded-xl border font-semibold ${decision === 'APPROVED' ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-admin-border'}`}>Approve</button><button type="button" onClick={() => setDecision('REJECTED')} className={`h-11 rounded-xl border font-semibold ${decision === 'REJECTED' ? 'border-red-700 bg-red-50 text-red-800' : 'border-admin-border'}`}>Reject</button></div></fieldset>{overtime && decision === 'APPROVED' && <AdminField label="Approved overtime minutes" hint={`Maximum eligible: ${overtime.eligibleMinutes}`}><input required type="number" min={0} max={overtime.eligibleMinutes} className={adminFieldClass} value={approvedMinutes} onChange={(event) => setApprovedMinutes(event.target.value)} /></AdminField>}<AdminField label="Owner comment" hint="Optional, but recommended for rejections and exceptions."><textarea rows={3} maxLength={500} className={`${adminFieldClass} py-3`} value={comment} onChange={(event) => setComment(event.target.value)} /></AdminField></form></AdminModal>;
}
