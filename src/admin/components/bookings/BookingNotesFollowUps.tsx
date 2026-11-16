import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Pencil, Pin, Plus } from 'lucide-react';
import type { Booking, StaffAccountOption } from '../../types';
import type { BookingFollowUp, BookingNote, BookingWorkspace, WorkspaceChange } from '../../../shared/bookingWorkspace';
import { bookingWorkspaceApi } from '../../api/bookingWorkspace';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { BookingDialog } from './BookingDetailSections';
import { dateTimeLocalInKolkata, followUpDateError, kolkataLocalToIso } from '../followUp.utils';

const formatDate = (value: string) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Legacy data';
const purple = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 focus-visible:outline-purple-600 disabled:opacity-50';
const input = 'mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-text';
type Editor = { kind: 'note'; note?: BookingNote } | { kind: 'task'; task?: BookingFollowUp; sourceNote?: BookingNote } | { kind: 'finish'; task: BookingFollowUp; status: 'completed' | 'cancelled' };
type Draft = { body: string; title: string; details: string; dueAt: string; assigneeId: string; outcome: string };
function History({ entries }: { entries: WorkspaceChange[] }) {
  if (!entries.length) return null;
  return <details className="mt-2 text-xs text-admin-subtle"><summary className="min-h-8 cursor-pointer py-2">Change history · {entries.length}</summary><ol className="space-y-2 border-l border-admin-border pl-3">{[...entries].reverse().map((entry, index) => <li key={index}><p><span className="capitalize">{entry.action}</span> · {entry.actor.name} · {formatDate(entry.at)}</p>{entry.previous?.body != null && <p className="whitespace-pre-wrap break-words">Previous note: {String(entry.previous.body)}</p>}{entry.previous?.dueAt != null && <p>Previous due: {formatDate(String(entry.previous.dueAt))}</p>}</li>)}</ol></details>;
}

export function BookingNotesFollowUps({ booking, canManage, staff, staffLoading, staffError, retryStaff, onSummary }: {
  booking: Booking; canManage: boolean; staff: StaffAccountOption[]; staffLoading: boolean; staffError: string; retryStaff: () => void;
  onSummary: (state: BookingWorkspace, changed: boolean) => void;
}) {
  const [data, setData] = useState<BookingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState<Draft>({ body: '', title: '', details: '', dueAt: '', assigneeId: '', outcome: '' });
  const initial = useRef('');
  const requestId = useRef('');
  const mounted = useRef(true);
  const summaryRef = useRef(onSummary);
  summaryRef.current = onSummary;
  const confirm = useConfirmDialog();
  const receive = useCallback((state: BookingWorkspace, changed = false) => { if (!mounted.current) return; setData(state); summaryRef.current(state, changed); }, []);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { receive(await bookingWorkspaceApi.get(booking.id)); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not load notes and follow-ups'); }
    finally { if (mounted.current) setLoading(false); }
  }, [booking.id, receive]);
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; }; }, [load]);
  const dirty = !!editor && JSON.stringify(draft) !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const open = (next: Editor) => {
    const task = next.kind === 'task' ? next.task : undefined;
    const note = next.kind === 'note' ? next.note : undefined;
    const source = next.kind === 'task' ? next.sourceNote : undefined;
    const values = { body: note?.body || '', title: task?.title || source?.body.slice(0, 200) || '', details: task?.details || source?.body || '', dueAt: task ? dateTimeLocalInKolkata(new Date(task.dueAt)) : '', assigneeId: task?.assigneeId ?? booking.assignedStaffAccountId ?? '', outcome: '' };
    setDraft(values); initial.current = JSON.stringify(values); requestId.current = crypto.randomUUID(); setSaveError(''); setEditor(next);
  };
  const close = async () => {
    if (busy) return;
    if (dirty && !await confirm({ title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setEditor(null); setSaveError('');
  };
  const save = async () => {
    if (!editor || busy) return;
    setSaveError('');
    if (editor.kind === 'note' && !draft.body.trim()) { setSaveError('Enter a note.'); return; }
    if (editor.kind === 'task') {
      if (!draft.title.trim()) { setSaveError('Enter a follow-up title.'); return; }
      const unchangedDate = editor.task && draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt));
      const dateError = unchangedDate ? null : followUpDateError(draft.dueAt);
      if (dateError) { setSaveError(dateError); return; }
    }
    setBusy(true);
    try {
      let result: BookingWorkspace;
      if (editor.kind === 'note') result = editor.note
        ? await bookingWorkspaceApi.updateNote(booking.id, editor.note.id, { revision: editor.note.revision, body: draft.body.trim() })
        : await bookingWorkspaceApi.createNote(booking.id, draft.body.trim(), requestId.current);
      else if (editor.kind === 'finish') result = await bookingWorkspaceApi.finishFollowUp(booking.id, editor.task.id, { revision: editor.task.revision, status: editor.status, outcome: draft.outcome.trim() });
      else {
        const values = { title: draft.title.trim(), details: draft.details.trim(), dueAt: editor.task && draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt)) ? editor.task.dueAt : kolkataLocalToIso(draft.dueAt), assigneeId: draft.assigneeId };
        result = editor.task ? await bookingWorkspaceApi.updateFollowUp(booking.id, editor.task.id, { ...values, revision: editor.task.revision }) : await bookingWorkspaceApi.createFollowUp(booking.id, { ...values, requestId: requestId.current, sourceNoteId: editor.sourceNote?.id });
      }
      receive(result, true); setEditor(null); setNotice('Changes saved');
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Could not save changes'); }
    finally { setBusy(false); }
  };
  const pin = async (note: BookingNote) => {
    setBusy(true); setError('');
    try { receive(await bookingWorkspaceApi.updateNote(booking.id, note.id, { revision: note.revision, pinned: !note.pinned }), true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update note'); }
    finally { setBusy(false); }
  };
  const pending = (data?.followUps || []).filter(row => row.status === 'pending').sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const closed = (data?.followUps || []).filter(row => row.status !== 'pending').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const notes = [...(data?.notes || [])].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  const taskRow = (task: BookingFollowUp) => <li key={task.id} className="py-4">
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row"><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{task.title}</h3><p className="mt-1 text-sm text-admin-subtle">{task.assigneeName || 'Unassigned'} · {formatDate(task.dueAt)} {task.status === 'pending' && new Date(task.dueAt).getTime() < Date.now() && <span className="ml-1 font-semibold text-red-700">Overdue</span>}</p>{task.details && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{task.details}</p>}<p className="mt-2 text-xs text-admin-subtle">{task.createdAt ? `Created by ${task.createdBy.name} · ${formatDate(task.createdAt)}` : 'Imported legacy follow-up · original author and creation time unavailable'}</p>{task.sourceNoteId && <a className="text-xs text-purple-700 underline" href={`#booking-note-${task.sourceNoteId}`}>View source note</a>}</div>
      {canManage && task.status === 'pending' && <div className="flex shrink-0 flex-wrap items-center"><button disabled={busy} className={purple} onClick={() => open({ kind: 'finish', task, status: 'completed' })}><Check className="h-4 w-4" aria-hidden="true" />Mark done</button><button disabled={busy} className={purple} aria-label={`Edit follow-up: ${task.title}`} title="Edit follow-up" onClick={() => open({ kind: 'task', task })}><Pencil className="h-4 w-4" aria-hidden="true" /></button><button disabled={busy} className="min-h-11 px-3 text-sm text-admin-subtle" onClick={() => open({ kind: 'finish', task, status: 'cancelled' })}>Cancel</button></div>}
    </div>
    {task.status !== 'pending' && <p className="mt-2 text-sm text-admin-subtle"><span className="capitalize">{task.status}</span> · {task.updatedBy.name} · {formatDate(task.updatedAt)}{task.outcome && <span className="mt-1 block whitespace-pre-wrap break-words">{task.outcome}</span>}</p>}
    <History entries={task.history} />
  </li>;
  return <section aria-label="Notes and follow-ups" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Notes &amp; Follow-ups</h2><p className="text-xs text-admin-subtle">Internal team workspace · Times in IST · No automatic reminders</p></div>{canManage && data && <div className="flex gap-2"><button disabled={busy} className={purple} onClick={() => open({ kind: 'note' })}><Plus className="h-4 w-4" aria-hidden="true" />Note</button><button disabled={busy} className={`${purple} border border-purple-200 bg-purple-50`} onClick={() => open({ kind: 'task' })}><Plus className="h-4 w-4" aria-hidden="true" />Follow-up</button></div>}</div>
    {notice && <p role="status" className="text-sm text-admin-subtle">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} <button disabled={busy} className="min-h-11 px-2 underline" onClick={() => void load()}>Reload</button></p>}
    {loading && <p role="status">Loading notes and follow-ups…</p>}
    {data && <><div className="rounded-xl border border-admin-border bg-admin-surface p-4"><h3 className="text-sm font-semibold">Pending follow-ups · {pending.length}</h3>{pending.length ? <ul className="divide-y divide-admin-border">{pending.map(taskRow)}</ul> : <p className="py-4 text-sm text-admin-subtle">No pending follow-ups. Add one to track the next step.</p>}<details className="border-t border-admin-border pt-2"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Completed &amp; cancelled · {closed.length}</summary>{closed.length ? <ul className="divide-y divide-admin-border">{closed.map(taskRow)}</ul> : <p className="text-sm text-admin-subtle">No recorded follow-up history.</p>}{data.lastFollowUpCompletedAt && !closed.some(row => row.status === 'completed') && <p className="mt-2 text-xs text-admin-subtle">Legacy completion recorded {formatDate(data.lastFollowUpCompletedAt)}. Task details were not retained.</p>}</details></div>
      <div className="rounded-xl border border-admin-border bg-admin-surface p-4"><h3 className="text-sm font-semibold">Notes · {notes.length}</h3>{!notes.length && <p className="py-4 text-sm text-admin-subtle">No notes yet. Record customer preferences or team updates here.</p>}<ul className="divide-y divide-admin-border">{notes.map(note => <li key={note.id} id={`booking-note-${note.id}`} className="scroll-mt-32 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{note.pinned && <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-purple-700"><Pin className="h-3 w-3" aria-hidden="true" />Pinned</p>}<p className="whitespace-pre-wrap break-words text-sm">{note.body}</p><p className="mt-2 text-xs text-admin-subtle">{note.createdBy.name} · {formatDate(note.createdAt)}</p>{note.history.some(entry => entry.action === 'edited') && <p className="text-xs text-admin-subtle">Edited · {[...note.history].reverse().find(entry => entry.action === 'edited')?.actor.name} · {formatDate([...note.history].reverse().find(entry => entry.action === 'edited')!.at)}</p>}</div>{canManage && <div className="flex shrink-0"><button disabled={busy} className={purple} aria-label="Edit note" title="Edit note" onClick={() => open({ kind: 'note', note })}><Pencil className="h-4 w-4" aria-hidden="true" /></button><button disabled={busy} className={purple} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} title={note.pinned ? 'Unpin note' : 'Pin note'} onClick={() => void pin(note)}><Pin className={`h-4 w-4 ${note.pinned ? 'fill-purple-100' : ''}`} aria-hidden="true" /></button></div>}</div>{canManage && <button disabled={busy} className={purple} onClick={() => open({ kind: 'task', sourceNote: note })}>Add follow-up</button>}<History entries={note.history} /></li>)}</ul></div></>}
    {editor && <BookingDialog className="admin-theme !bg-black/50" variant="modal" title={editor.kind === 'note' ? editor.note ? 'Edit note' : 'Add note' : editor.kind === 'task' ? editor.task ? 'Edit follow-up' : 'Add follow-up' : editor.status === 'completed' ? 'Complete follow-up' : 'Cancel follow-up'} onClose={() => { void close(); }}>
      <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
          {editor.kind === 'note' ? <label className="block text-sm">Internal note<textarea required maxLength={5000} rows={8} className={input} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} /></label> : editor.kind === 'finish' ? <><p className="text-sm font-semibold">{editor.task.title}</p><label className="block text-sm">{editor.status === 'completed' ? 'Outcome (optional)' : 'Reason (optional)'}<textarea maxLength={5000} rows={4} className={input} value={draft.outcome} onChange={event => setDraft({ ...draft, outcome: event.target.value })} /></label></> : <>
            <label className="block text-sm">Title<input required maxLength={200} className={input} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
            <label className="block text-sm">Due date &amp; time (IST)<input required type="datetime-local" className={input} value={draft.dueAt} onChange={event => setDraft({ ...draft, dueAt: event.target.value })} /></label>
            <label className="block text-sm">Assigned staff<select disabled={staffLoading || !!staffError} className={input} value={draft.assigneeId} onChange={event => setDraft({ ...draft, assigneeId: event.target.value })}><option value="">Unassigned</option>{draft.assigneeId && !staff.some(person => person.id === draft.assigneeId) && <option value={draft.assigneeId}>{editor.task?.assigneeName || booking.assignedStaffAccountName || 'Current assignee'}</option>}{staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            {staffLoading && <p role="status" className="text-sm">Loading staff…</p>}{staffError && <p role="alert" className="text-sm text-red-700">{staffError} <button type="button" className="underline" onClick={retryStaff}>Retry staff loading</button></p>}
            <label className="block text-sm">Details (optional)<textarea maxLength={5000} rows={4} className={input} value={draft.details} onChange={event => setDraft({ ...draft, details: event.target.value })} /></label>
          </>}
        </fieldset>
        {saveError && <div role="alert" className="text-sm text-red-700"><p>{saveError}</p><button type="button" className="min-h-11 underline" onClick={async () => { if (await confirm({ title: 'Reload latest records?', description: 'Discard this draft and load the latest saved records.', confirmLabel: 'Reload', variant: 'danger' })) { setEditor(null); void load(); } }}>Discard draft and reload latest</button></div>}
        <div className="flex gap-3 border-t border-admin-border pt-4"><button disabled={busy || (editor.kind === 'task' && (staffLoading || !!staffError))} className="min-h-11 rounded-lg bg-purple-700 px-4 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50" type="submit">{busy ? 'Saving…' : editor.kind === 'finish' ? editor.status === 'completed' ? 'Mark done' : 'Confirm cancellation' : 'Save'}</button><button type="button" disabled={busy} className="min-h-11 px-3 text-sm" onClick={() => void close()}>Cancel</button></div>
      </form>
    </BookingDialog>}
  </section>;
}
