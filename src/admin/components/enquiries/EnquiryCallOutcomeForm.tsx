import { PhoneMissed, ThumbsUp, FileText, XCircle } from 'lucide-react';
import { AdminAlert } from '../ui/AdminUi';
import { useRef, useState } from 'react';
import type { Enquiry, EnquiryCallOutcome, RecordEnquiryCallPayload } from '../../types';
import { api } from '../../api/client';
import { FollowUpShortcuts } from '../FollowUpShortcuts';
import { followUpDateError, kolkataLocalToIso } from '../followUp.utils';

import { CALL_OUTCOME_LABELS, callTimeLabel } from './enquiryCall.utils';

const outcomeIcons = { no_answer: PhoneMissed, interested: ThumbsUp, quotation_needed: FileText, not_interested: XCircle };

export function EnquiryCallOutcomeForm({ enquiry, onSaved, onDirtyChange, onBusyChange, disabled = false }: {
  enquiry: Enquiry; onSaved: (enquiry: Enquiry) => void; onDirtyChange?: (dirty: boolean) => void; onBusyChange?: (busy: boolean) => void; disabled?: boolean;
}) {
  const [outcome, setOutcome] = useState<EnquiryCallOutcome | ''>('');
  const [note, setNote] = useState('');
  const [scheduleRequested, setScheduleRequested] = useState(false);
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  // Retain the same key and payload on uncertain retries; a changed form starts a new operation.
  const operation = useRef<{ signature: string; id: string }>();
  const locked = disabled || busy || ['booked', 'closed_lost'].includes(enquiry.stage);
  const changed = (value: boolean) => { onDirtyChange?.(value); setError(''); };
  const save = async () => {
    if (pending.current || locked) return;
    if (!outcome) { setError('Choose the call outcome.'); return; }
    if (outcome === 'not_interested' && !note.trim()) { setError('Add a reason for closing this enquiry.'); return; }
    if (outcome === 'no_answer' || scheduleRequested || when) {
      const validation = followUpDateError(when); if (validation) { setError(validation); return; }
    }
    const signature = JSON.stringify({ outcome, note: note.trim(), when });
    if (operation.current?.signature !== signature) operation.current = { signature, id: crypto.randomUUID() };
    const payload: RecordEnquiryCallPayload = { eventId: operation.current.id, outcome, note: note.trim(), ...(when ? { nextFollowUpAt: kolkataLocalToIso(when) } : {}) };
    pending.current = true; setBusy(true); onBusyChange?.(true); setError('');
    try {
      const updated = await api.recordEnquiryCall(enquiry.id, payload);
      setScheduleRequested(false); setOutcome(''); setNote(''); setWhen(''); operation.current = undefined; onDirtyChange?.(false); onSaved(updated);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the call. Your entry is still here.'); }
    finally { pending.current = false; setBusy(false); onBusyChange?.(false); }
  };
  return <form onSubmit={event => { event.preventDefault(); void save(); }} className="enquiry-outcome-form space-y-4">
    <fieldset disabled={locked} className="space-y-3"><legend className="mb-2 text-sm font-semibold">How did the call go?</legend>
      <div className="enquiry-outcomes grid grid-cols-2 gap-2">{Object.entries(CALL_OUTCOME_LABELS).map(([value, label]) => {
        const Icon = outcomeIcons[value as EnquiryCallOutcome];
        return <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${outcome === value ? 'border-admin-primary bg-admin-muted font-semibold' : 'border-admin-border'}`}><input type="radio" name={`call-outcome-${enquiry.id}`} value={value} checked={outcome === value} onChange={() => { setOutcome(value as EnquiryCallOutcome); if (outcome === 'no_answer' && when) setScheduleRequested(true); if (value === 'not_interested') { setWhen(''); setScheduleRequested(false); } changed(true); }} /><span className="enquiry-outcome-icon" data-outcome={value}><Icon size={16}/></span>{label}</label>; })}</div>
      <label className="block text-sm font-semibold">{outcome === 'not_interested' ? 'Reason for closing *' : 'Conversation note (optional)'}<textarea rows={3} maxLength={1000} value={note} onChange={event => { setNote(event.target.value); changed(Boolean(event.target.value || outcome || when)); }} className="mt-2 w-full rounded-xl border border-admin-control bg-admin-surface p-3 text-base font-normal" placeholder="What happened, and what should the team know?" /></label>
      {(outcome === 'no_answer' || scheduleRequested) && <div><p className="mb-2 text-sm font-semibold">{outcome === 'no_answer' ? 'When should we try again? *' : 'Next follow-up (optional)'}</p><FollowUpShortcuts value={when} onChange={value => { setWhen(value); changed(true); }} allowNone={false} disabled={locked} /><p className="mt-2 text-xs text-admin-subtle">India time. {when ? 'This replaces the current reminder.' : 'Saving without a next date completes the current reminder.'}</p></div>}
      {outcome === 'not_interested' && <AdminAlert tone="warning" as="span">Saving closes the enquiry and removes its follow-up.</AdminAlert>}
      {outcome && !scheduleRequested && outcome !== 'no_answer' && outcome !== 'not_interested' && enquiry.nextFollowUpAt && <p className="text-xs text-admin-subtle">Saving without a next date completes the current reminder.</p>}
      {outcome && <p role="status" className="text-sm font-medium">Stage after saving: {outcome === 'not_interested' ? 'Not interested' : outcome === 'no_answer' || when ? 'Follow-up' : 'Contacted'}</p>}
      {outcome === 'quotation_needed' && <p className="text-sm text-admin-secondary">The team can see this request in call history.</p>}
    </fieldset>
    {error && <AdminAlert as="span">{error}</AdminAlert>}
    <div className="enquiry-call-footer">{outcome !== 'not_interested' && <label><input type="checkbox" disabled={locked || outcome === 'no_answer'} checked={scheduleRequested || outcome === 'no_answer'} onChange={event => { setScheduleRequested(event.target.checked); if (!event.target.checked) setWhen(''); changed(true); }}/> Schedule a follow-up after saving</label>}
    <button disabled={locked} type="submit" className="min-h-11 rounded-xl bg-admin-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving call…' : 'Save call outcome'}</button></div>
  </form>;
}

export function EnquiryCallHistory({ enquiry }: { enquiry: Enquiry }) {
  const history = [...(enquiry.callHistory || (enquiry.lastCall ? [enquiry.lastCall] : []))].reverse();
  return <section aria-label="Call history" className="space-y-3"><h3 className="text-sm font-semibold">Call history</h3>{!history.length && <p className="text-sm text-admin-subtle">No call outcomes recorded yet.</p>}<ol className="space-y-3">{history.map(call => <li key={call.eventId} className="rounded-xl border border-admin-border p-3"><p className="text-sm font-semibold">{CALL_OUTCOME_LABELS[call.outcome] || call.outcome}</p><p className="mt-1 text-xs text-admin-subtle">{callTimeLabel(call.recordedAt)} · {call.actorName || 'Studio team'} · India time</p>{call.note && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{call.note}</p>}{call.nextFollowUpAt && <p className="mt-2 text-xs text-admin-secondary">Next follow-up recorded: {callTimeLabel(call.nextFollowUpAt)}</p>}</li>)}</ol></section>;
}
