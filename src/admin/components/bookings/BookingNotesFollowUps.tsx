import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CalendarClock, Check, ChevronRight, Link2, ListChecks, MessageSquareText, Pencil, Pin, Plus, RotateCcw, Trash2, UserRound } from './BookingNotesIcons';
import type { Booking, StaffAccountOption } from '../../types';
import type { BookingFollowUp, BookingNote, BookingWorkspace, WorkspaceChange } from '../../../shared/bookingWorkspace';
import { bookingWorkspaceApi, type WorkspaceApi } from '../../api/bookingWorkspace';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { BookingDialog } from './BookingDetailSections';
import { BookingNoteComposer } from './BookingNoteComposer';
import { dateTimeLocalInKolkata, followUpDateError, followUpShortcutValue, kolkataLocalToIso } from '../followUp.utils';
import './booking-notes.css';

const date = (value?: string, short = false) => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', ...(short ? {} : { year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) }).format(new Date(value)) : 'Legacy data';
const initials = (name: string) => { const parts = name.trim().split(/\s+/); return (parts.length === 1 ? parts[0].slice(0, 2) : parts.slice(0, 2).map(part => part[0]).join('')).toUpperCase(); };
const taskDate = (value?: string) => date(value).replace(/ \d{4},/, ',');
const completion = (task: BookingFollowUp) => [...task.history].reverse().find(entry => entry.action === 'completed');
function History({ entries, label, note }: { entries: WorkspaceChange[]; label?: string; note?: BookingNote }) {
  if (!entries.length) return null;
  return <details className="bn-history"><summary>{label || `Change history · ${entries.length}`}</summary><div><strong>Change history</strong>{note?.createdAt && <p>Created by {note.createdBy.name} · {date(note.createdAt)}</p>}{[...entries].reverse().map((entry, index) => <p key={index}>{entry.action} by {entry.actor.name} · {date(entry.at)}{entry.previous?.body != null && <span>Previous note: {String(entry.previous.body)}</span>}{entry.previous?.dueAt != null && <span>Previous due: {date(String(entry.previous.dueAt))}</span>}{entry.previous?.outcome ? <span>Previous outcome: {String(entry.previous.outcome)}</span> : null}</p>)}</div></details>;
}
type Editor = { kind: 'note'; note: BookingNote } | { kind: 'task'; task?: BookingFollowUp; sourceNote?: BookingNote } | { kind: 'reopen'; task: BookingFollowUp } | { kind: 'finish'; task: BookingFollowUp; status: 'completed' | 'cancelled' };
type Draft = { body: string; title: string; details: string; dueAt: string; assigneeId: string; outcome: string };
type Props = { booking: Pick<Booking, 'id' | 'customerName' | 'customerCode' | 'assignedStaffAccountId' | 'workflow'>; allowTasks?: boolean; workspaceApi?: WorkspaceApi; recordType?: 'booking' | 'enquiry'; canManage: boolean; staff: StaffAccountOption[]; staffLoading: boolean; staffError: string; retryStaff: () => void; onLoadingChange?: (loading: boolean) => void; onErrorChange?: (error: string) => void; onSummary: (state: BookingWorkspace, changed: boolean) => void };
export interface BookingNotesHandle { openNote: () => void; openFollowUp: (note?: BookingNote) => void; retry: () => void; receive: (state: BookingWorkspace) => void }

export const BookingNotesFollowUps = forwardRef<BookingNotesHandle, Props>(function BookingNotesFollowUps({ booking, workspaceApi = bookingWorkspaceApi, allowTasks = true, recordType = 'booking', canManage, staff, staffLoading, staffError, retryStaff, onLoadingChange, onErrorChange, onSummary }, ref) {
  const [data, setData] = useState<BookingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  const [doneOpen, setDoneOpen] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState<Draft>({ body: '', title: '', details: '', dueAt: '', assigneeId: '', outcome: '' });
  const initial = useRef('');
  const requestId = useRef('');
  const mutation = useRef(false);
  const mounted = useRef(true);
  const loadGeneration = useRef(0);
  const summaryRef = useRef(onSummary); summaryRef.current = onSummary;
  const confirm = useConfirmDialog();
  const receive = useCallback((state: BookingWorkspace, changed = false) => {
    if (!mounted.current) return;
    setData(state); summaryRef.current(state, changed);
  }, []);
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setLoading(true); setError('');
    try { const state = await workspaceApi.get(booking.id); if (generation === loadGeneration.current) receive(state); }
    catch (cause) { if (mounted.current && generation === loadGeneration.current) setError(cause instanceof Error ? cause.message : 'Could not load notes and follow-ups'); }
    finally { if (mounted.current && generation === loadGeneration.current) setLoading(false); }
  }, [booking.id, receive, workspaceApi]);
  useEffect(() => { mounted.current = true; setData(null); void load(); return () => { mounted.current = false; }; }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
  useEffect(() => { onErrorChange?.(error); }, [error, onErrorChange]);
  const dirty = !!editor && JSON.stringify(draft) !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const open = (next: Editor) => {
    if (!canManage || mutation.current || (next.kind !== 'note' && !allowTasks)) return;
    setNow(Date.now());
    const task = next.kind !== 'note' ? next.task : undefined;
    const source = next.kind === 'task' ? next.sourceNote : undefined;
    const values = { body: next.kind === 'note' ? next.note.body : '', title: task?.title || source?.body.slice(0, 200) || '', details: task?.details || source?.body || '',
      dueAt: next.kind === 'reopen' ? '' : task ? dateTimeLocalInKolkata(new Date(task.dueAt)) : followUpShortcutValue('tomorrow'), assigneeId: task?.assigneeId ?? booking.assignedStaffAccountId ?? '', outcome: '' };
    setDraft(values); initial.current = JSON.stringify(values); requestId.current = crypto.randomUUID(); setSaveError(''); setEditor(next);
  };
  useImperativeHandle(ref, () => ({ openNote: () => document.getElementById('note-body-tab')?.focus(), openFollowUp: note => { if (data) open({ kind: 'task', sourceNote: note }); }, retry: () => { void load(); }, receive: state => receive(state, true) }));
  const close = async () => {
    if (mutation.current) return;
    if (dirty && !await confirm({ title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setEditor(null); setSaveError('');
  };
  const save = async () => {
    if (!editor || mutation.current || !canManage) return;
    setSaveError('');
    if (editor.kind === 'note' && !draft.body.trim()) { setSaveError('Enter a note.'); return; }
    if (editor.kind === 'task' || editor.kind === 'reopen') {
      if (!draft.title.trim()) { setSaveError('Enter a follow-up title.'); return; }
      const unchanged = editor.kind === 'task' && editor.task && draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt));
      const issue = unchanged ? null : followUpDateError(draft.dueAt);
      if (issue) { setSaveError(issue); return; }
    }
    mutation.current = true; setBusy(true);
    try {
      let state: BookingWorkspace;
      if (editor.kind === 'note') state = await workspaceApi.updateNote(booking.id, editor.note.id, { revision: editor.note.revision, body: draft.body.trim() });
      else if (editor.kind === 'finish') state = await workspaceApi.finishFollowUp(booking.id, editor.task.id, { revision: editor.task.revision, status: editor.status, outcome: draft.outcome.trim() });
      else if (editor.kind === 'reopen') state = await workspaceApi.reopenFollowUp(booking.id, editor.task.id, { revision: editor.task.revision, dueAt: kolkataLocalToIso(draft.dueAt), assigneeId: draft.assigneeId });
      else {
        const values = { title: draft.title.trim(), details: draft.details.trim(), dueAt: editor.task && draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt)) ? editor.task.dueAt : kolkataLocalToIso(draft.dueAt), assigneeId: draft.assigneeId };
        state = editor.task ? await workspaceApi.updateFollowUp(booking.id, editor.task.id, { ...values, revision: editor.task.revision }) : await workspaceApi.createFollowUp(booking.id, { ...values, requestId: requestId.current, sourceNoteId: editor.sourceNote?.id });
      }
      receive(state, true); setEditor(null); setNotice('Changes saved');
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : 'Could not save changes'); }
    finally { mutation.current = false; setBusy(false); }
  };
  const pin = async (note: BookingNote) => {
    if (mutation.current || !canManage) return;
    mutation.current = true; setBusy(true); setError('');
    try { receive(await workspaceApi.updateNote(booking.id, note.id, { revision: note.revision, pinned: !note.pinned }), true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update note'); }
    finally { mutation.current = false; setBusy(false); }
  };
  const remove = async (kind: 'note' | 'follow-up', item: BookingNote | BookingFollowUp) => {
    if (mutation.current || !canManage) return;
    if (!await confirm({ title: `Delete ${kind}?`, description: kind === 'note' ? 'This note will be permanently deleted. Linked follow-ups will be kept without the note link.' : 'This follow-up will be permanently deleted. This cannot be undone.', confirmLabel: `Delete ${kind}`, variant: 'danger' }) || !mounted.current) return;
    mutation.current = true; setBusy(true); setError(''); setNotice('');
    try { receive(await (kind === 'note' ? workspaceApi.deleteNote(booking.id, item.id, item.revision) : workspaceApi.deleteFollowUp(booking.id, item.id, item.revision)), true); setNotice(`${kind === 'note' ? 'Note' : 'Follow-up'} deleted`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : `Could not delete ${kind}`); }
    finally { mutation.current = false; setBusy(false); }
  };
  const tasks = data?.followUps || [];
  const pending = tasks.filter(task => task.status === 'pending').sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
  const closed = tasks.filter(task => task.status !== 'pending').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const notes = [...(data?.notes || [])].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  const pinned = notes.filter(note => note.pinned).length;
  const completed = tasks.filter(task => task.status === 'completed');
  const completionDates = tasks.flatMap(task => task.history.filter(entry => entry.action === 'completed').map(entry => entry.at)).concat(data?.lastFollowUpCompletedAt || []).sort();
  const lastCompletion = completionDates[completionDates.length - 1];
  const overdue = pending.filter(task => Date.parse(task.dueAt) < now).length;
  const editingDue = booking.workflow?.steps.find(step => step.key === 'editing')?.dueAt;
  const beforeEditing = editingDue ? Date.parse(editingDue) - 3600000 : NaN;
  const taskRow = (task: BookingFollowUp) => {
    const done = completion(task);
    const isOverdue = task.status === 'pending' && Date.parse(task.dueAt) < now;
    const status = task.status === 'completed' ? done && Date.parse(done.at) < Date.parse(task.dueAt) ? 'Done early' : 'Completed' : task.status === 'cancelled' ? 'Cancelled' : isOverdue ? 'Overdue' : 'Upcoming';
    return <li key={task.id} id={`booking-follow-up-${task.id}`} className={`bn-task ${isOverdue ? 'is-overdue' : ''} ${task.status === 'completed' ? 'is-completed' : ''}`}>
      <span className={`bn-task-status ${task.status}`} role="img" aria-label={status}>{task.status === 'completed' ? <Check size={14} /> : task.status === 'cancelled' ? '×' : <CalendarClock size={14} />}</span>
      <div className="bn-task-content"><div className="bn-task-title"><strong>{task.title}</strong><span className={`bn-badge ${isOverdue || task.status === 'cancelled' ? 'is-danger' : ''}`}>{status}</span></div>
        {task.details && <p className="bn-task-details">{task.details}</p>}
        <div className="bn-task-meta"><span><UserRound size={14} />{task.assigneeName || 'Unassigned'}</span><span><CalendarClock size={14} />Due {taskDate(task.dueAt)}</span>{task.status === 'completed' && done && <span className="bn-teal"><Check size={14} />Done {taskDate(done.at)} by {done.actor.name}</span>}</div>
        <div className="bn-task-audit"><p className="bn-caption">{task.createdAt ? `Created by ${task.createdBy.name} · ${taskDate(task.createdAt)}` : 'Imported legacy follow-up · original author and creation time unavailable'}</p><History entries={task.history} label={`· changed ${task.history.length === 1 ? 'once' : `${task.history.length} times`}`} /></div>
        {task.outcome && <p className="bn-task-details">{task.outcome}</p>}
        {task.sourceNoteId && <a className="bn-linked" href={`#booking-note-${task.sourceNoteId}`} onClick={() => setFilter('all')}><Link2 size={14} />View linked note</a>}
      </div>
      {canManage && allowTasks && <div className="bn-task-actions">{task.status === 'pending' ? <><button className="bn-icon is-success" disabled={busy} aria-label="Mark as done" title="Mark as done" onClick={() => open({ kind: 'finish', task, status: 'completed' })}><Check size={17} /></button><button className="bn-icon" disabled={busy} aria-label={`Edit follow-up: ${task.title}`} title="Edit follow-up" onClick={() => open({ kind: 'task', task })}><Pencil size={15} /></button><button className="bn-text is-danger" disabled={busy} onClick={() => open({ kind: 'finish', task, status: 'cancelled' })}>Cancel</button></> : <button className="bn-icon" disabled={busy} aria-label="Reopen follow-up" title="Reopen" onClick={() => open({ kind: 'reopen', task })}><RotateCcw size={15} /></button>}<button className="bn-icon" disabled={busy} aria-label={`Delete follow-up: ${task.title}`} title="Delete follow-up" onClick={() => void remove('follow-up', task)}><Trash2 size={15} /></button></div>}
    </li>;
  };
  const dateEditor = editor?.kind === 'task' || editor?.kind === 'reopen';
  return <section className="booking-notes" aria-label="Notes and follow-ups">
    <div className="bn-heading"><div><h2>Notes &amp; follow-ups</h2><p>Staff only · Times in IST{recordType === 'booking' ? ' · No automatic reminders' : ''}</p></div>{canManage && allowTasks && <button className="bn-button is-primary" disabled={loading || !data || busy} onClick={() => open({ kind: 'task' })}><Plus size={16} />Add follow-up</button>}</div>
    {notice && <div role="status" className="bn-notice">{notice}<button aria-label="Dismiss confirmation" onClick={() => setNotice('')}>×</button></div>}
    {error && <div role="alert" className="bn-error">{error} <button className="bn-text" onClick={() => void load()}>Reload</button></div>}
    {loading && <p role="status" className="bn-loading">Loading notes and follow-ups…</p>}
    {data && <>
      <div className="bn-stats">{[
        ['Pending', pending.length, pending.length ? 'Next actions waiting' : 'Nothing waiting'],
        ['Overdue', overdue, overdue ? 'Needs attention' : 'All on time'],
        ['Completed', completed.length, lastCompletion ? `Last: ${date(lastCompletion, true)}` : 'None yet'],
        ['Notes', notes.length, `${pinned} pinned`],
      ].map(([label, value, caption]) => <div key={label}><span>{label}</span><strong className={label === 'Overdue' ? overdue ? 'is-danger' : 'bn-teal' : ''}>{value}</strong><small>{caption}</small></div>)}</div>
      <section className="bn-followups" aria-label="Follow-ups"><h3><ListChecks size={18} />Follow-ups <span>· earliest due first</span></h3>
        {pending.length ? <ul className="bn-list">{pending.map(taskRow)}</ul> : <div className="bn-empty"><span className="bn-empty-icon"><Check size={20} /></span><div><strong>No pending follow-ups</strong><p>Add the next step with an owner and a due time so the team knows what to do next.</p></div>{canManage && allowTasks && <button className="bn-button is-dashed" disabled={busy} onClick={() => open({ kind: 'task' })}><Plus size={14} />Add follow-up</button>}</div>}
        <button className="bn-disclosure" aria-expanded={doneOpen} aria-controls={`closed-followups-${booking.id}`} onClick={() => setDoneOpen(value => !value)}><span style={{ display: 'inline-flex', transform: doneOpen ? 'rotate(90deg)' : undefined }}><ChevronRight size={14} /></span>Completed &amp; cancelled · {closed.length}</button>
        {doneOpen && <div id={`closed-followups-${booking.id}`}><ul className="bn-list">{closed.map(taskRow)}</ul>{!closed.length && <p className="bn-caption">Completed and cancelled follow-ups will appear here.</p>}{data.lastFollowUpCompletedAt && !completed.length && <p className="bn-caption">Legacy completion recorded {date(data.lastFollowUpCompletedAt)}. Task details were not retained.</p>}</div>}
      </section>
      <section className="bn-notes-section" aria-label="Notes"><div className="bn-section-heading"><h3><MessageSquareText size={18} />Notes <span>· preferences, conversations, team updates</span></h3><div className="bn-filters" role="group" aria-label="Filter notes"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All {notes.length}</button><button aria-pressed={filter === 'pinned'} onClick={() => setFilter('pinned')}>Pinned {pinned}</button></div></div>
        {canManage && <BookingNoteComposer allowFollowUp={allowTasks} workspaceApi={workspaceApi} key={booking.id} bookingId={booking.id} onSaved={state => { receive(state, true); setNotice('Note saved'); }} onFollowUp={note => open({ kind: 'task', sourceNote: note })} />}
        <ul className="bn-list bn-note-list">{notes.filter(note => filter === 'all' || note.pinned).map(note => <li className={`bn-note${note.pinned ? ' is-pinned' : ''}`} key={note.id} id={`booking-note-${note.id}`}>
          <div className="bn-note-top"><span className="bn-avatar" aria-hidden="true">{initials(note.createdBy.name)}</span><div className="bn-note-main"><div className="bn-note-meta"><strong>{note.createdBy.name}</strong><time dateTime={note.createdAt}>{date(note.createdAt)}</time>{!!note.history.length && <History note={note} entries={note.history} label={`Edited · ${note.history.length}`} />}{note.pinned && <span className="bn-badge is-pinned"><Pin size={12} />Pinned</span>}</div><p className="bn-note-body">{note.body}</p></div></div>
          {canManage && <div className="bn-note-actions">{allowTasks && <button className="bn-text bn-teal" disabled={busy} onClick={() => open({ kind: 'task', sourceNote: note })}><Plus size={14} />Follow-up from note</button>}<span><button className="bn-icon" disabled={busy} aria-label="Edit note" title="Edit" onClick={() => open({ kind: 'note', note })}><Pencil size={15} /></button><button className={`bn-icon ${note.pinned ? 'is-pinned' : ''}`} disabled={busy} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} title={note.pinned ? 'Unpin' : 'Pin'} onClick={() => void pin(note)}><Pin size={15} /></button><button className="bn-icon" disabled={busy} aria-label="Delete note" title="Delete" onClick={() => void remove('note', note)}><Trash2 size={15} /></button></span></div>}
          {tasks.some(task => task.sourceNoteId === note.id) && <div className="bn-note-links">{tasks.filter(task => task.sourceNoteId === note.id).map(task => <a className="bn-linked" key={task.id} href={`#booking-follow-up-${task.id}`} onClick={() => { if (task.status !== 'pending') setDoneOpen(true); }}><Link2 size={14} />{task.title} · {task.status}</a>)}</div>}
        </li>)}</ul>
        {!notes.length && <p className="bn-caption">No notes yet.</p>}{filter === 'pinned' && !!notes.length && !pinned && <p className="bn-caption">No pinned notes yet.</p>}
      </section>
    </>}
    {editor && <BookingDialog dismissOnBackdrop className="admin-theme bn-dialog" title={editor.kind === 'note' ? 'Edit note' : editor.kind === 'reopen' ? 'Reopen follow-up' : editor.kind === 'finish' ? editor.status === 'completed' ? 'Complete follow-up' : 'Cancel follow-up' : editor.task ? 'Edit follow-up' : 'Add follow-up'} subtitle={[booking.customerName, booking.customerCode].filter(Boolean).join(' · ')} onClose={() => void close()}>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy}>
          {editor.kind === 'note' && <label>Note<textarea aria-label="Note" rows={5} required maxLength={5000} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} /></label>}
          {dateEditor && <>
            {editor.kind === 'task' ? <label>What needs to happen?<input placeholder="e.g. Call to confirm the new shoot date" required maxLength={200} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label> : <p className="bn-reopen-title">{editor.task.title}</p>}
            <div className="bn-field-grid"><label>Due date &amp; time <span>(IST)</span><input type="datetime-local" required value={draft.dueAt} onChange={e => setDraft({ ...draft, dueAt: e.target.value })} /></label><label>Owner<select disabled={staffLoading || !!staffError} value={draft.assigneeId} onChange={e => setDraft({ ...draft, assigneeId: e.target.value })}><option value="">Unassigned</option>{draft.assigneeId && !staff.some(person => person.id === draft.assigneeId) && <option value={draft.assigneeId}>{editor.task?.assigneeName || 'Current assignee'} (unavailable)</option>}{staff.map(person => <option key={person.id} value={person.id}>{person.name}{person.jobTitle ? ` · ${person.jobTitle}` : ''}</option>)}</select></label></div>
            {staffLoading && <p role="status">Loading staff…</p>}{staffError && <p role="alert">{staffError} <button type="button" onClick={retryStaff}>Retry staff</button></p>}
            <div className="bn-shortcuts" role="group" aria-label="Quick due times"><button type="button" onClick={() => setDraft({ ...draft, dueAt: followUpShortcutValue('tomorrow') })}>Tomorrow 10 am</button><button type="button" onClick={() => setDraft({ ...draft, dueAt: followUpShortcutValue('three_days') })}>In 3 days</button><button type="button" onClick={() => { const current = new Date(); const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }).format(current); const delta = (8 - ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day)) % 7 || 7; const next = new Date(current.getTime() + delta * 86400000); setDraft({ ...draft, dueAt: `${dateTimeLocalInKolkata(next).slice(0, 10)}T10:00` }); }}>Next Monday</button>{recordType === 'booking' && <button type="button" disabled={!Number.isFinite(beforeEditing) || beforeEditing <= now} onClick={() => setDraft({ ...draft, dueAt: dateTimeLocalInKolkata(new Date(beforeEditing)) })}>Before editing due{editingDue ? ` · ${date(editingDue, true)}` : ''}</button>}</div>
            {editor.kind === 'task' && <label>Details <span>(optional)</span><textarea aria-label="Details (optional)" rows={3} maxLength={5000} placeholder="Context the owner needs, e.g. customer asked for a weekend slot" value={draft.details} onChange={e => setDraft({ ...draft, details: e.target.value })} /></label>}
            <div className="bn-info"><UserRound size={16} /><p>{recordType === 'booking' ? 'Follow-ups appear on the booking’s Today entry.' : 'Follow-ups appear in the enquiry inbox.'} Overdue items turn red here.</p></div>
          </>}
          {editor.kind === 'finish' && <label>Outcome <span>(optional)</span><textarea aria-label="Outcome (optional)" rows={3} maxLength={5000} value={draft.outcome} onChange={e => setDraft({ ...draft, outcome: e.target.value })} /></label>}
        </fieldset>
        {saveError && <p role="alert" className="bn-error">{saveError} <button className="bn-text" type="button" disabled={busy} onClick={async () => { await load(); setEditor(null); }}>Reload workspace</button></p>}
        <footer><button type="button" className="bn-button" disabled={busy} onClick={() => void close()}>Cancel</button><button type="submit" disabled={busy || (dateEditor && (staffLoading || !!staffError))} className={`bn-button is-primary ${editor.kind === 'finish' ? editor.status === 'completed' ? 'is-success' : 'is-danger' : ''}`}>{busy ? 'Saving…' : editor.kind === 'note' ? 'Save note' : editor.kind === 'reopen' ? 'Reopen follow-up' : editor.kind === 'finish' ? editor.status === 'completed' ? 'Mark done' : 'Confirm cancellation' : 'Save follow-up'}</button></footer>
      </form>
    </BookingDialog>}
  </section>;
});
