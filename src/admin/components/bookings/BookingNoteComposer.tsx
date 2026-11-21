import { useEffect, useRef, useState } from 'react';
import type { BookingNote, BookingWorkspace } from '../../../shared/bookingWorkspace';
import { bookingWorkspaceApi, type WorkspaceApi } from '../../api/bookingWorkspace';
import './booking-notes.css';

export function BookingNoteComposer({ bookingId, onSaved, onFollowUp, onCancel, overview = false, workspaceApi = bookingWorkspaceApi, allowFollowUp = true }: {
  allowFollowUp?: boolean; workspaceApi?: WorkspaceApi; bookingId: string; onSaved: (state: BookingWorkspace) => void;
  onFollowUp: (note: BookingNote) => void; onCancel?: (dirty: boolean) => void; overview?: boolean;
}) {
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef('');
  const saving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!body) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [body]);
  return <form className={`bn-composer${overview ? ' is-overview' : ''}`} onSubmit={async event => {
    event.preventDefault();
    if (saving.current || !body.trim()) return;
    saving.current = true; setBusy(true); setError('');
    requestId.current ||= crypto.randomUUID();
    try {
      const state = await workspaceApi.createNote(bookingId, body.trim(), requestId.current, pinned);
      if (!mounted.current) return;
      const note = state.notes.find(row => row.id === requestId.current);
      setBody(''); setPinned(false); setFollowUp(false); requestId.current = '';
      onSaved(state);
      if (followUp && note) onFollowUp(note);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save note'); }
    finally { saving.current = false; setBusy(false); }
  }}>
    <label className={overview ? "bd-private-note-label" : "sr-only"} htmlFor={`note-body-${overview ? 'overview' : 'tab'}`}>{overview ? 'New internal note — only staff can see this' : 'Write a note'}</label>
    <textarea aria-label="Write a note" id={`note-body-${overview ? 'overview' : 'tab'}`} autoFocus={overview} rows={overview ? 4 : 2} maxLength={5000} required value={body} onChange={e => setBody(e.target.value)} disabled={busy}
      placeholder={overview ? 'e.g. Customer prefers WhatsApp after 6 pm' : 'Write a note for the team… e.g. Customer prefers WhatsApp after 6 pm'} />
    {error && <p role="alert" className="bn-error">{error}</p>}
    <div className="bn-composer-footer">
      {!overview && <label><input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} disabled={busy} />Pin to top</label>}
      {!overview && allowFollowUp && <label><input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} disabled={busy} />Also add a follow-up</label>}
      {onCancel && <button type="button" className="bn-text" disabled={busy} onClick={() => onCancel(!!body || pinned || followUp)}>Cancel</button>}
      <button className="bn-button is-primary" disabled={busy || !body.trim()} type="submit">{busy ? 'Saving…' : 'Save note'}</button>
    </div>
  </form>;
}
