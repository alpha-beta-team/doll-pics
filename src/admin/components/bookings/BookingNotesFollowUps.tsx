import { AdminAlert } from '../ui/AdminUi';
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  BellOff,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardPlus,
  Link2,
  ListChecks,
  MessageSquareText,
  Pencil,
  Pin,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Booking, StaffAccountOption } from "../../types";
import type {
  BookingFollowUp,
  BookingNote,
  BookingWorkspace,
  WorkspaceChange,
} from "../../../shared/bookingWorkspace";
import { bookingWorkspaceApi } from "../../api/bookingWorkspace";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { BookingDialog } from "./BookingDetailSections";
import {
  dateTimeLocalInKolkata,
  followUpDateError,
  kolkataLocalToIso,
} from "../followUp.utils";

const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Legacy data";
const purple =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 focus-visible:outline-purple-600 disabled:opacity-50";
const iconButton = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-admin-subtle transition-colors hover:bg-purple-50 hover:text-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50';
const badge =
  "inline-flex items-center rounded-full bg-admin-muted px-2 py-0.5 text-xs font-semibold text-admin-secondary";
const input =
  "mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-text";
type Editor =
  | { kind: "note"; note?: BookingNote }
  | { kind: "task"; task?: BookingFollowUp; sourceNote?: BookingNote }
  | {
      kind: "finish";
      task: BookingFollowUp;
      status: "completed" | "cancelled";
    };
type Draft = {
  body: string;
  title: string;
  details: string;
  dueAt: string;
  assigneeId: string;
  outcome: string;
};
function History({ entries }: { entries: WorkspaceChange[] }) {
  if (!entries.length) return null;
  return (
    <details className="mt-2 text-xs text-admin-subtle">
      <summary className="min-h-11 cursor-pointer rounded-md py-3 focus-visible:outline-purple-600">
        Change history · {entries.length}
      </summary>
      <ol className="space-y-2 border-l border-admin-border pl-3">
        {[...entries].reverse().map((entry, index) => (
          <li key={index}>
            <p>
              <span className="capitalize">{entry.action}</span> ·{" "}
              {entry.actor.name} · {formatDate(entry.at)}
            </p>
            {entry.previous?.body != null && (
              <p className="whitespace-pre-wrap break-words">
                Previous note: {String(entry.previous.body)}
              </p>
            )}
            {entry.previous?.dueAt != null && (
              <p>Previous due: {formatDate(String(entry.previous.dueAt))}</p>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function BookingNotesFollowUps({
  booking,
  canManage,
  staff,
  staffLoading,
  staffError,
  retryStaff,
  onSummary,
}: {
  booking: Booking;
  canManage: boolean;
  staff: StaffAccountOption[];
  staffLoading: boolean;
  staffError: string;
  retryStaff: () => void;
  onSummary: (state: BookingWorkspace, changed: boolean) => void;
}) {
  const [data, setData] = useState<BookingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const actionsId = useId();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState<Draft>({
    body: "",
    title: "",
    details: "",
    dueAt: "",
    assigneeId: "",
    outcome: "",
  });
  const initial = useRef("");
  const requestId = useRef("");
  const mounted = useRef(true);
  const summaryRef = useRef(onSummary);
  summaryRef.current = onSummary;
  const confirm = useConfirmDialog();
  const receive = useCallback((state: BookingWorkspace, changed = false) => {
    if (!mounted.current) return;
    setData(state);
    summaryRef.current(state, changed);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      receive(await bookingWorkspaceApi.get(booking.id));
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Could not load notes and follow-ups",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [booking.id, receive]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  useEffect(() => {
    if (!actionsOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node))
        setActionsOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActionsOpen(false);
        actionsButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [actionsOpen]);
  const dirty = !!editor && JSON.stringify(draft) !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const open = (next: Editor) => {
    setActionsOpen(false);
    const task = next.kind === "task" ? next.task : undefined;
    const note = next.kind === "note" ? next.note : undefined;
    const source = next.kind === "task" ? next.sourceNote : undefined;
    const values = {
      body: note?.body || "",
      title: task?.title || source?.body.slice(0, 200) || "",
      details: task?.details || source?.body || "",
      dueAt: task ? dateTimeLocalInKolkata(new Date(task.dueAt)) : "",
      assigneeId: task?.assigneeId ?? booking.assignedStaffAccountId ?? "",
      outcome: "",
    };
    setDraft(values);
    initial.current = JSON.stringify(values);
    requestId.current = crypto.randomUUID();
    setSaveError("");
    setEditor(next);
  };
  const close = async () => {
    if (busy) return;
    if (
      dirty &&
      !(await confirm({
        title: "Discard unsaved changes?",
        description: "Your changes have not been saved.",
        confirmLabel: "Discard changes",
        variant: "danger",
      }))
    )
      return;
    setEditor(null);
    setSaveError("");
  };
  const save = async () => {
    if (!editor || busy) return;
    setSaveError("");
    if (editor.kind === "note" && !draft.body.trim()) {
      setSaveError("Enter a note.");
      return;
    }
    if (editor.kind === "task") {
      if (!draft.title.trim()) {
        setSaveError("Enter a follow-up title.");
        return;
      }
      const unchangedDate =
        editor.task &&
        draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt));
      const dateError = unchangedDate ? null : followUpDateError(draft.dueAt);
      if (dateError) {
        setSaveError(dateError);
        return;
      }
    }
    setBusy(true);
    try {
      let result: BookingWorkspace;
      if (editor.kind === "note")
        result = editor.note
          ? await bookingWorkspaceApi.updateNote(booking.id, editor.note.id, {
              revision: editor.note.revision,
              body: draft.body.trim(),
            })
          : await bookingWorkspaceApi.createNote(
              booking.id,
              draft.body.trim(),
              requestId.current,
            );
      else if (editor.kind === "finish")
        result = await bookingWorkspaceApi.finishFollowUp(
          booking.id,
          editor.task.id,
          {
            revision: editor.task.revision,
            status: editor.status,
            outcome: draft.outcome.trim(),
          },
        );
      else {
        const values = {
          title: draft.title.trim(),
          details: draft.details.trim(),
          dueAt:
            editor.task &&
            draft.dueAt === dateTimeLocalInKolkata(new Date(editor.task.dueAt))
              ? editor.task.dueAt
              : kolkataLocalToIso(draft.dueAt),
          assigneeId: draft.assigneeId,
        };
        result = editor.task
          ? await bookingWorkspaceApi.updateFollowUp(
              booking.id,
              editor.task.id,
              { ...values, revision: editor.task.revision },
            )
          : await bookingWorkspaceApi.createFollowUp(booking.id, {
              ...values,
              requestId: requestId.current,
              sourceNoteId: editor.sourceNote?.id,
            });
      }
      receive(result, true);
      setEditor(null);
      setNotice("Changes saved");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setBusy(false);
    }
  };
  const pin = async (note: BookingNote) => {
    setBusy(true);
    setError("");
    try {
      receive(
        await bookingWorkspaceApi.updateNote(booking.id, note.id, {
          revision: note.revision,
          pinned: !note.pinned,
        }),
        true,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update note");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (kind: 'note' | 'follow-up', item: BookingNote | BookingFollowUp) => {
    if (busy) return;
    const approved = await confirm({ title: `Delete ${kind}?`, description: kind === 'note' ? 'This note will be permanently deleted. Linked follow-ups will be kept without the note link.' : 'This follow-up will be permanently deleted. This cannot be undone.', confirmLabel: `Delete ${kind}`, variant: 'danger' });
    if (!approved || !mounted.current) return;
    setBusy(true); setError(''); setNotice('');
    try {
      receive(await (kind === 'note' ? bookingWorkspaceApi.deleteNote(booking.id, item.id, item.revision) : bookingWorkspaceApi.deleteFollowUp(booking.id, item.id, item.revision)), true);
      setNotice(kind === 'note' ? 'Note deleted' : 'Follow-up deleted');
    } catch (e) { setError(e instanceof Error ? e.message : `Could not delete ${kind}`); }
    finally { setBusy(false); }
  };
  const pending = (data?.followUps || [])
    .filter((row) => row.status === "pending")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const closed = (data?.followUps || [])
    .filter((row) => row.status !== "pending")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const notes = [...(data?.notes || [])].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const taskRow = (task: BookingFollowUp) => {
    const overdue =
      task.status === "pending" && new Date(task.dueAt).getTime() < Date.now();
    const dueToday =
      task.status === "pending" &&
      !overdue &&
      dateTimeLocalInKolkata(new Date(task.dueAt)).slice(0, 10) ===
        dateTimeLocalInKolkata(new Date()).slice(0, 10);
    const status =
      task.status === "completed"
        ? "Completed"
        : task.status === "cancelled"
          ? "Cancelled"
          : overdue
            ? "Overdue"
            : dueToday
              ? "Due today"
              : "Upcoming";
    return (
      <li
        key={task.id}
        id={`booking-follow-up-${task.id}`}
        className="scroll-mt-28 rounded-xl border border-admin-border bg-admin-surface p-4 target:ring-2 target:ring-purple-400"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${overdue ? "bg-red-50 text-red-700" : task.status === "completed" ? "bg-emerald-50 text-emerald-700" : task.status === "cancelled" ? "bg-admin-muted text-admin-subtle" : "bg-purple-50 text-purple-800"}`}
          >
            {task.status === "completed" && (
              <Check className="h-3 w-3" aria-hidden="true" />
            )}
            {overdue && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
            {status}
          </span>
        </div>
        <h4 className="break-words text-sm font-semibold leading-6 text-admin-text">
          {task.title}
        </h4>
        <div className="mt-2 space-y-2 text-xs text-admin-secondary">
          <p className="flex items-start gap-2">
            <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="break-words">
              {task.assigneeName || "Unassigned"}
            </span>
          </p>
          <p
            className={`flex items-start gap-2 ${overdue ? "font-medium text-red-700" : ""}`}
          >
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formatDate(task.dueAt)} IST</span>
          </p>
        </div>
        {task.details && (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-admin-secondary">
            {task.details}
          </p>
        )}
        {task.sourceNoteId && (
          <a
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-purple-700 underline underline-offset-4 focus-visible:outline-purple-600"
            href={`#booking-note-${task.sourceNoteId}`}
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            View linked note
          </a>
        )}
        <p className="mt-3 text-xs leading-5 text-admin-subtle">
          {task.createdAt
            ? `Created by ${task.createdBy.name} · ${formatDate(task.createdAt)}`
            : "Imported legacy follow-up · original author and creation time unavailable"}
        </p>
        {canManage && task.status === "pending" && (
          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-admin-border pt-3">
            <button
              disabled={busy}
              aria-label="Mark as done"
              title="Mark as done"
              className="mr-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:border-emerald-700 hover:bg-emerald-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
              onClick={() =>
                open({ kind: "finish", task, status: "completed" })
              }
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              disabled={busy}
              className={iconButton}
              aria-label={`Edit follow-up: ${task.title}`}
              title="Edit follow-up"
              onClick={() => open({ kind: "task", task })}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />

            </button>
            <button
              disabled={busy}
              className="min-h-11 rounded-lg px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              onClick={() =>
                open({ kind: "finish", task, status: "cancelled" })
              }
            >
              Cancel
            </button>
            <button disabled={busy} className={`${iconButton} hover:!bg-red-50 hover:!text-red-700`} aria-label={`Delete follow-up: ${task.title}`} title="Delete follow-up" onClick={() => void remove('follow-up', task)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        )}
        {task.status !== "pending" && (
          <div className="mt-3 border-t border-admin-border pt-3 text-xs leading-5 text-admin-subtle">
            <p>
              {task.updatedBy.name} · {formatDate(task.updatedAt)}
            </p>
            {task.outcome && (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-admin-secondary">
                {task.outcome}
              </p>
            )}
          </div>
        )}
        {canManage && task.status !== 'pending' && <div className="flex justify-end"><button disabled={busy} className={`${iconButton} hover:!bg-red-50 hover:!text-red-700`} aria-label={`Delete follow-up: ${task.title}`} title="Delete follow-up" onClick={() => void remove('follow-up', task)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>}
      <History entries={task.history} />
      </li>
    );
  };
  return (
    <section
      aria-label="Notes and follow-ups"
      className="space-y-5 text-admin-text"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Notes &amp; Follow-ups
          </h2>
          <p className="mt-1 text-sm text-admin-secondary">
            Keep customer context and the next step in one place.
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-admin-subtle">
            <span>Internal team workspace · Times in IST</span>
            <span className="inline-flex items-center gap-1.5">
              <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
              No automatic reminders
            </span>
          </p>
        </div>
      </div>
      {notice && (
        <AdminAlert tone="success" as="span" contentClassName="flex items-center gap-2">

          {notice}
        </AdminAlert>
      )}
      {error && (
        <AdminAlert contentClassName="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-2">

            {error}
          </p>
          <button
            disabled={busy}
            className="min-h-11 rounded-lg px-3 font-semibold underline focus-visible:outline-red-700"
            onClick={() => void load()}
          >
            Reload
          </button>
        </AdminAlert>
      )}
      {loading && (
        <div
          role="status"
          className="rounded-xl border border-admin-border bg-admin-surface p-6"
        >
          <p className="text-sm text-admin-subtle">
            Loading notes and follow-ups…
          </p>
          <div
            aria-hidden="true"
            className="mt-4 space-y-3 motion-safe:animate-pulse"
          >
            <div className="h-3 w-2/3 rounded bg-admin-muted" />
            <div className="h-3 w-1/2 rounded bg-admin-muted" />
          </div>
        </div>
      )}
      {data && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
          <aside
            aria-label="Follow-ups"
            className="min-w-0 rounded-2xl border border-admin-border bg-admin-muted/50 p-4 lg:col-start-2 lg:row-start-1"
          >
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks
                  className="h-4 w-4 text-purple-700"
                  aria-hidden="true"
                />
                Pending follow-ups{" "}
                <span className={badge}>{pending.length}</span>
              </h3>
              <p className="mt-1 text-xs text-admin-subtle">
                Next actions, earliest due first.
              </p>
            </div>
            {pending.length ? (
              <ul className="space-y-3">{pending.map(taskRow)}</ul>
            ) : (
              <div className="rounded-xl border border-dashed border-admin-border bg-admin-surface p-5 text-center">
                <CheckCircle2
                  className="mx-auto mb-2 h-6 w-6 text-purple-600"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">No pending follow-ups</p>
                <p className="mt-1 text-xs leading-5 text-admin-subtle">
                  Add a next step with an owner and due date.
                </p>
                {canManage && (
                  <button
                    disabled={busy}
                    className={`${purple} mt-2`}
                    onClick={() => open({ kind: "task" })}
                  >
                    Add a follow-up
                  </button>
                )}
              </div>
            )}
            <details className="group mt-4 border-t border-admin-border pt-2">
              <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-xs font-semibold text-admin-secondary focus-visible:outline-purple-600">
                Completed &amp; cancelled · {closed.length}
              </summary>
              {closed.length ? (
                <ul className="mt-2 space-y-3">{closed.map(taskRow)}</ul>
              ) : (
                <p className="px-1 pb-3 text-xs leading-5 text-admin-subtle">
                  Completed and cancelled follow-ups will appear here.
                </p>
              )}
              {data.lastFollowUpCompletedAt &&
                !closed.some((row) => row.status === "completed") && (
                  <p className="mt-2 text-xs text-admin-subtle">
                    Legacy completion recorded{" "}
                    {formatDate(data.lastFollowUpCompletedAt)}. Task details
                    were not retained.
                  </p>
                )}
            </details>
          </aside>
          <div className="min-w-0 rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-sm sm:p-5 lg:col-start-1 lg:row-start-1">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquareText
                  className="h-4 w-4 text-purple-700"
                  aria-hidden="true"
                />
                Notes <span className={badge}>{notes.length}</span>
              </h3>
              <p className="mt-1 text-xs text-admin-subtle">
                Customer preferences, conversations and team updates.
              </p>
            </div>
            {!notes.length && (
              <div className="rounded-xl border border-dashed border-admin-border px-5 py-8 text-center">
                <MessageSquareText
                  className="mx-auto mb-3 h-7 w-7 text-purple-500"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">No notes yet.</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-admin-subtle">
                  Capture a conversation or customer preference so the team has
                  the full picture.
                </p>
                {canManage && (
                  <button
                    disabled={busy}
                    className={`${purple} mt-3`}
                    onClick={() => open({ kind: "note" })}
                  >
                    Add the first note
                  </button>
                )}
              </div>
            )}
            <ul className="space-y-3">
              {notes.map((note) => {
                const linked = data.followUps.filter(
                  (task) => task.sourceNoteId === note.id,
                );
                const edit = [...note.history]
                  .reverse()
                  .find((entry) => entry.action === "edited");
                return (
                  <li
                    key={note.id}
                    id={`booking-note-${note.id}`}
                    className={`scroll-mt-28 rounded-xl border p-4 target:ring-2 target:ring-purple-400 ${note.pinned ? "border-purple-100 bg-purple-50/50" : "border-admin-border bg-admin-surface"}`}
                  >
                    {note.pinned && (
                      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[11px] font-semibold text-purple-800">
                        <Pin className="h-3 w-3" aria-hidden="true" />
                        Pinned
                      </span>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-admin-text">
                      {note.body}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-admin-subtle">
                      <span className="font-medium text-admin-secondary">
                        {note.createdBy.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={note.createdAt}>
                        {formatDate(note.createdAt)}
                      </time>
                    </div>
                    {edit && (
                      <p className="mt-1 text-xs leading-5 text-admin-subtle">
                        Edited by {edit.actor.name} · {formatDate(edit.at)}
                      </p>
                    )}
                    {linked.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {linked.map((task) => (
                          <a
                            key={task.id}
                            href={`#booking-follow-up-${task.id}`}
                            onClick={() => {
                              const target = document.getElementById(
                                `booking-follow-up-${task.id}`,
                              );
                              const history = target?.closest("details");
                              if (history) history.open = true;
                            }}
                            className="flex min-h-11 items-center gap-2 rounded-lg border border-purple-100 bg-admin-surface px-3 py-2 text-xs text-purple-800 focus-visible:outline-purple-600"
                          >
                            <Link2
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 break-words">
                              <span className="font-medium">{task.title}</span>
                              <span className="ml-1 capitalize text-admin-subtle">
                                · {task.status}
                              </span>
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                    {canManage && (
                      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-admin-border/70 pt-2">
                        <button
                          disabled={busy}
                          className={`${purple} mr-auto !px-2`}
                          onClick={() =>
                            open({ kind: "task", sourceNote: note })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          Add follow-up
                        </button>
                        <button
                          disabled={busy}
                          className={iconButton}
                          aria-label="Edit note"
                          title="Edit note"
                          onClick={() => open({ kind: "note", note })}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          disabled={busy}
                          className={iconButton}
                          aria-label={note.pinned ? "Unpin note" : "Pin note"}
                          title={note.pinned ? "Unpin note" : "Pin note"}
                          onClick={() => void pin(note)}
                        >
                          <Pin
                            className={`h-3.5 w-3.5 ${note.pinned ? "fill-purple-100" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                        <button disabled={busy} className={`${iconButton} hover:!bg-red-50 hover:!text-red-700`} aria-label="Delete note" title="Delete note" onClick={() => void remove('note', note)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                      </div>
                    )}
                    <History entries={note.history} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      {canManage && data && !editor && (
        <div className="pointer-events-none sticky bottom-6 z-20 flex justify-end pr-2">
          <div
            ref={actionsRef}
            className="pointer-events-auto relative"
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setActionsOpen(false);
            }}
          >
            <button
              ref={actionsButtonRef}
              type="button"
              disabled={busy}
              aria-label={
                actionsOpen ? "Close create actions" : "Open create actions"
              }
              aria-expanded={actionsOpen}
              aria-controls={actionsId}
              onClick={() => setActionsOpen((value) => !value)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-800 to-purple-600 text-white shadow-lg shadow-purple-900/20 transition duration-200 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300 active:scale-95 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Plus
                aria-hidden="true"
                className={`h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${actionsOpen ? "rotate-45" : "rotate-0"}`}
              />
            </button>
            <div
              id={actionsId}
              aria-hidden={!actionsOpen}
              className={`absolute bottom-full right-0 mb-3 w-60 max-w-[calc(100vw-3rem)] origin-bottom-right rounded-2xl border border-admin-border bg-admin-surface p-2 shadow-[0_8px_24px_rgba(30,20,50,0.14)] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${actionsOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"}`}
            >
              <button
                type="button"
                disabled={busy}
                tabIndex={actionsOpen ? 0 : -1}
                onClick={() => open({ kind: "task" })}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-admin-text transition-colors hover:bg-purple-50 hover:text-purple-800 focus-visible:outline-purple-600 active:bg-purple-100 motion-reduce:transition-none"
              >
                <ListChecks className="h-5 w-5 shrink-0" aria-hidden="true" />
                Create a Follow-up
              </button>
              <button
                type="button"
                disabled={busy}
                tabIndex={actionsOpen ? 0 : -1}
                onClick={() => open({ kind: "note" })}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-admin-text transition-colors hover:bg-purple-50 hover:text-purple-800 focus-visible:outline-purple-600 active:bg-purple-100 motion-reduce:transition-none"
              >
                <ClipboardPlus
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                Create a Note
              </button>
            </div>
          </div>
        </div>
      )}
      {editor && (
        <BookingDialog
          className="admin-theme !bg-black/50"
          variant="modal"
          title={
            editor.kind === "note"
              ? editor.note
                ? "Edit note"
                : "Add note"
              : editor.kind === "task"
                ? editor.task
                  ? "Edit follow-up"
                  : "Add follow-up"
                : editor.status === "completed"
                  ? "Complete follow-up"
                  : "Cancel follow-up"
          }
          onClose={() => {
            void close();
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
              {editor.kind === "note" ? (
                <label className="block text-sm">
                  Internal note
                  <textarea
                    required
                    maxLength={5000}
                    rows={8}
                    className={input}
                    value={draft.body}
                    onChange={(event) =>
                      setDraft({ ...draft, body: event.target.value })
                    }
                  />
                </label>
              ) : editor.kind === "finish" ? (
                <>
                  <p className="text-sm font-semibold">{editor.task.title}</p>
                  <label className="block text-sm">
                    {editor.status === "completed"
                      ? "Outcome (optional)"
                      : "Reason (optional)"}
                    <textarea
                      maxLength={5000}
                      rows={4}
                      className={input}
                      value={draft.outcome}
                      onChange={(event) =>
                        setDraft({ ...draft, outcome: event.target.value })
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block text-sm">
                    Title
                    <input
                      required
                      maxLength={200}
                      className={input}
                      value={draft.title}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    Due date &amp; time (IST)
                    <input
                      required
                      type="datetime-local"
                      className={input}
                      value={draft.dueAt}
                      onChange={(event) =>
                        setDraft({ ...draft, dueAt: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    Assigned staff
                    <select
                      disabled={staffLoading || !!staffError}
                      className={input}
                      value={draft.assigneeId}
                      onChange={(event) =>
                        setDraft({ ...draft, assigneeId: event.target.value })
                      }
                    >
                      <option value="">Unassigned</option>
                      {draft.assigneeId &&
                        !staff.some(
                          (person) => person.id === draft.assigneeId,
                        ) && (
                          <option value={draft.assigneeId}>
                            {editor.task?.assigneeName ||
                              booking.assignedStaffAccountName ||
                              "Current assignee"}
                          </option>
                        )}
                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {staffLoading && (
                    <p role="status" className="text-sm">
                      Loading staff…
                    </p>
                  )}
                  {staffError && (
                    <AdminAlert as="span">
                      {staffError}{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={retryStaff}
                      >
                        Retry staff loading
                      </button>
                    </AdminAlert>
                  )}
                  <label className="block text-sm">
                    Details (optional)
                    <textarea
                      maxLength={5000}
                      rows={4}
                      className={input}
                      value={draft.details}
                      onChange={(event) =>
                        setDraft({ ...draft, details: event.target.value })
                      }
                    />
                  </label>
                </>
              )}
            </fieldset>
            {saveError && (
              <AdminAlert>
                <p>{saveError}</p>
                <button
                  type="button"
                  className="min-h-11 underline"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: "Reload latest records?",
                        description:
                          "Discard this draft and load the latest saved records.",
                        confirmLabel: "Reload",
                        variant: "danger",
                      })
                    ) {
                      setEditor(null);
                      void load();
                    }
                  }}
                >
                  Discard draft and reload latest
                </button>
              </AdminAlert>
            )}
            <div className="flex gap-3 border-t border-admin-border pt-4">
              <button
                disabled={
                  busy ||
                  (editor.kind === "task" && (staffLoading || !!staffError))
                }
                className="min-h-11 rounded-lg bg-purple-700 px-4 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                type="submit"
              >
                {busy
                  ? "Saving…"
                  : editor.kind === "finish"
                    ? editor.status === "completed"
                      ? "Mark done"
                      : "Confirm cancellation"
                    : "Save"}
              </button>
              <button
                type="button"
                disabled={busy}
                className="min-h-11 px-3 text-sm"
                onClick={() => void close()}
              >
                Cancel
              </button>
            </div>
          </form>
        </BookingDialog>
      )}
    </section>
  );
}
