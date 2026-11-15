import { formatCustomerName } from '../../../shared/formatCustomerName';
import { useRef, useState } from 'react';
import type { Enquiry } from '../../types';
import { api } from '../../api/client';
import { BookingDialog } from '../bookings/BookingDetailSections';
import { FollowUpShortcuts } from '../FollowUpShortcuts';
import { dateTimeLocalInKolkata, followUpDateError, kolkataLocalToIso } from '../followUp.utils';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

type Action = 'scheduled' | 'completed';

export function EnquiryFollowUpDialog({ enquiry, onClose, onSaved }: {
  enquiry: Enquiry;
  onClose: () => void;
  onSaved: (enquiry: Enquiry, action: Action) => void;
}) {
  const initialDate = enquiry.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(enquiry.nextFollowUpAt)) : '';
  const [when, setWhen] = useState(initialDate);
  const [note, setNote] = useState(enquiry.followUpNote || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);
  const inFlight = useRef(false);
  const confirm = useConfirmDialog();
  const dirty = when !== initialDate || note !== (enquiry.followUpNote || '');
  const customer = formatCustomerName(enquiry.name) || 'Unnamed customer';
  const closed = enquiry.stage === 'booked' || enquiry.stage === 'closed_lost';
  const close = async () => {
    if (inFlight.current) return;
    if (dirty && !await confirm({ title: 'Discard unsaved follow-up?', description: 'Your reminder changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    onClose();
  };
  const save = async (action: Action) => {
    if (inFlight.current || closed) return;
    if (action === 'scheduled') {
      const validation = followUpDateError(when);
      if (validation) { setError(validation); return; }
      if (note.length > 500) { setError('Reminder note must be 500 characters or fewer.'); return; }
    } else {
      if (!enquiry.nextFollowUpAt) return;
      if (dirty && !await confirm({ title: 'Complete the current follow-up?', description: 'Your unsaved date and note changes will be discarded.', confirmLabel: 'Mark complete' })) return;
      if (inFlight.current) return;
    }
    inFlight.current = true; setBusy(action); setError('');
    try {
      const updated = action === 'scheduled'
        ? await api.scheduleEnquiryFollowUp(enquiry.id, kolkataLocalToIso(when), note.trim())
        : await api.completeEnquiryFollowUp(enquiry.id);
      onSaved(updated, action);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the follow-up. Please try again.');
    } finally { inFlight.current = false; setBusy(null); }
  };
  return <BookingDialog title={`${enquiry.nextFollowUpAt ? 'Manage' : 'Schedule'} follow-up · ${customer}`} onClose={() => void close()}>
    <form onSubmit={event => { event.preventDefault(); void save('scheduled'); }} className="space-y-4">
      {enquiry.nextFollowUpAt && <div className={`rounded-xl border p-3 text-sm ${Date.parse(enquiry.nextFollowUpAt) < Date.now() ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-admin-border bg-admin-muted text-admin-secondary'}`}>
        <p className="font-semibold">{Date.parse(enquiry.nextFollowUpAt) < Date.now() ? 'Overdue' : 'Current follow-up'}</p>
        <p className="mt-1">{new Date(enquiry.nextFollowUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} · India time</p>
        {enquiry.followUpNote && <p className="mt-1 whitespace-pre-wrap break-words">{enquiry.followUpNote}</p>}
      </div>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="text-xs text-admin-subtle">Choose the next conversation time. All dates and times use India time.</p>
      <FollowUpShortcuts value={when} onChange={value => { setWhen(value); setError(''); }} disabled={Boolean(busy) || closed} />
      {when && <p className="text-xs font-semibold text-admin-secondary">Selected: {new Date(`${when}:00+05:30`).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} · India time</p>}
      <label className="block text-sm font-semibold text-admin-text">Reminder note <span className="font-normal text-admin-subtle">(optional)</span>
        <textarea rows={2} maxLength={500} value={note} onChange={event => { setNote(event.target.value); setError(''); }} disabled={Boolean(busy) || closed} placeholder="What should we discuss?" className="mt-2 w-full rounded-xl border border-admin-control bg-admin-surface p-3 text-base font-normal outline-none focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={Boolean(busy) || closed} className="min-h-11 rounded-xl bg-admin-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === 'scheduled' ? 'Saving…' : enquiry.nextFollowUpAt ? 'Reschedule follow-up' : 'Save follow-up'}</button>
        {enquiry.nextFollowUpAt && <button type="button" disabled={Boolean(busy) || closed} onClick={() => void save('completed')} className="min-h-11 rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50">{busy === 'completed' ? 'Completing…' : 'Mark complete'}</button>}
        <button type="button" disabled={Boolean(busy)} onClick={() => void close()} className="min-h-11 rounded-xl border border-admin-control px-4 py-2 text-sm font-semibold text-admin-secondary disabled:opacity-50">Cancel</button>
      </div>
    </form>
  </BookingDialog>;
}
