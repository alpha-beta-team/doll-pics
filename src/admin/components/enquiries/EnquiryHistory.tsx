import { useRef, useState } from 'react';
import type { Enquiry } from '../../types';
import { api } from '../../api/client';
import { CALL_OUTCOME_LABELS, callTimeLabel } from './enquiryCall.utils';
import { enquiryStageLabel } from './enquiryList';
import { leadSourceLabel } from '../leadSource';
import type { BookingNote } from '../../../shared/bookingWorkspace';

export function EnquiryActivity({ enquiry, workspaceNotes }: { enquiry: Enquiry; workspaceNotes?: BookingNote[] }) {
  const history = enquiry.stageHistory || [];
  const calls = enquiry.callHistory || (enquiry.lastCall ? [enquiry.lastCall] : []);
  const entries = [
    { title: enquiry.source ? 'Enquiry received via ' + leadSourceLabel(enquiry.source) : 'Enquiry received', at: enquiry.createdAt, detail: [enquiry.shootType, enquiry.bookingDate].filter(Boolean).join(' · '), actor: '' },
    ...calls.map(call => {
      const transition = history.find(entry => entry.callId === call.eventId);
      const reminder = call.nextFollowUpAt ? 'Follow-up ' + callTimeLabel(call.nextFollowUpAt) : '';
      return { title: CALL_OUTCOME_LABELS[call.outcome], at: call.recordedAt, actor: call.actorName,
        detail: [call.note, transition && enquiryStageLabel(transition.from) + ' → ' + enquiryStageLabel(transition.to), reminder].filter(Boolean).join(' · ') };
    }),
    ...history.filter(entry => !entry.callId).map(entry => ({
      title: enquiryStageLabel(entry.from) + ' → ' + enquiryStageLabel(entry.to), at: entry.recordedAt,
      detail: entry.cause.replace(/_/g, ' '), actor: entry.actorName,
    })),
    ...(workspaceNotes ? workspaceNotes.map(note => ({ title: 'Internal note added', at: note.createdAt, actor: note.createdBy.name, detail: note.body })) :
      (enquiry.internalNotes || []).map(note => ({ title: 'Internal note added', at: note.recordedAt, actor: note.actorName, detail: note.text }))),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return <ol className="lead-timeline">{entries.map((entry, index) => <li key={index}><strong>{entry.title}</strong>
    <small>{[callTimeLabel(entry.at), entry.actor].filter(Boolean).join(' · ')}</small><p>{entry.detail}</p></li>)}</ol>;
}

export function EnquiryNotes({ enquiry, canManage, onSaved }: { enquiry: Enquiry; canManage: boolean; onSaved: (item: Enquiry) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = useRef<{ text: string; id: string }>();
  const save = async () => {
    const body = text.trim();
    if (busy || !body) return;
    if (operation.current?.text !== body) operation.current = { text: body, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      onSaved(await api.addEnquiryNote(enquiry.id, body, operation.current.id));
      setText(''); operation.current = undefined;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add note. Please retry.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-4">{canManage && <form onSubmit={event => { event.preventDefault(); void save(); }}>
    <label className="text-sm font-medium">New internal note<textarea className="mt-2 block w-full rounded-xl border p-3" placeholder="Budget, family details, what they liked on the call…" rows={4} maxLength={2000} value={text} disabled={busy} onChange={e => setText(e.target.value)}/></label>
    {error && <p role="alert">{error}</p>}<button className="lead-primary mt-2" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Add note'}</button></form>}
    <ul className="lead-timeline">{[...(enquiry.internalNotes || [])].reverse().map(note => <li key={note.eventId}><strong>{note.actorName}</strong><small>{callTimeLabel(note.recordedAt)}</small><p>{note.text}</p></li>)}
    {enquiry.notes && <li><strong>Existing note</strong><p>{enquiry.notes}</p></li>}</ul>
    {!enquiry.notes && !enquiry.internalNotes?.length && <p>No internal notes recorded.</p>}</div>;
}
