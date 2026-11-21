# Booking notes and follow-ups

The booking detail page has a Notes & Follow-ups tab before Activity. Notes are internal plain text, editable and pinnable by anyone with booking management access. Booking viewers can read them. Follow-ups support assignment, rescheduling, completion outcomes and cancellation; closed tasks and change history remain visible. All entered dates use Asia/Kolkata and are stored in UTC. No automatic reminders, attachments or mentions are included. Notes and follow-ups can be deleted with confirmation; deleting a note preserves linked follow-ups and removes their source-note link.

Shoot notes remain independent. Overview, the work dashboard, linked enquiry summaries and reports retain one next follow-up per booking. Completed/cancelled bookings retain their task history; existing dashboard status filters remain unchanged.

## API

All routes require authenticated booking access; writes require management access.

- `GET /admin/bookings/:id/workspace`: notes and tasks with histories, pending count, next-task summary and last completion timestamp.
- `POST /admin/bookings/:id/notes`: `requestId` (UUID), `body` (1–5000 trimmed characters), optional `pinned` (defaults to false and is saved atomically).
- `PATCH /admin/bookings/:id/notes/:noteId`: `revision` and `body` and/or `pinned`.
- `POST /admin/bookings/:id/follow-ups`: `requestId`, `title` (1–200 trimmed characters), `dueAt` (ISO timestamp), optional `details` (5000 characters), `assigneeId`, `sourceNoteId`.
- `PATCH /admin/bookings/:id/follow-ups/:taskId`: `revision` plus the task fields above, excluding request/source IDs.
- `POST /admin/bookings/:id/follow-ups/:taskId/finish`: `revision`, `status` (`completed` or `cancelled`), optional `outcome` (5000 characters).

- `POST /admin/bookings/:id/follow-ups/:taskId/reopen`: `revision`, future `dueAt`, optional `assigneeId` (empty/omitted means unassigned). Completed or cancelled tasks return to pending; the previous status and outcome remain in history, while the current outcome is cleared. Selected assignees must be active.
- `DELETE /admin/bookings/:id/notes/:noteId` and `DELETE /admin/bookings/:id/follow-ups/:taskId`: `revision`.

The Notes & follow-ups tab follows the supplied desktop HTML: summary tiles, stacked follow-ups, expanded closed-task history, All/Pinned filters, inline note composer and amber pinned notes. Notes are sorted pinned first, newest first within each group. Pinning is available during creation. “Also add a follow-up” saves the note first, then opens a prefilled task modal; cancelling the modal keeps the saved note. Overview note creation is inline; editing existing notes and follow-up operations use centered modals.

Quick due times use IST: tomorrow at 10am, in three days at 10am, the strictly next Monday at 10am, or one hour before the editing deadline (disabled when unavailable or past). Overdue counts refresh every 30 seconds. Completion labels use completion history rather than the last update timestamp. Today continues to show the booking-level next follow-up; it is not a separate personal task inbox.

Deploy backend support for pinned creation and reopening before this frontend. These additions need no migration. Existing legacy workspace migration requirements below still apply to uninitialized installations.

Creates reuse their request UUID on retry. Updates reject stale revisions with HTTP 409. Finishing an already identically closed task is a no-op. New or changed due dates must be in the future; editing another field on an overdue task retains its original date. New assignees must be active staff; an existing inactive assignment can be retained unchanged.

Notes and tasks are stored in hidden booking fields (`internalNotes`, `followUps`, `workflowRevision`). Mutations use a booking-level compare-and-swap as well as per-record revisions, and atomically recompute `pendingFollowUpCount`, `nextFollowUpId`, `nextFollowUpAt`, and `followUpNote`. General booking editing cannot change follow-up fields; old schedule/complete endpoints adapt to the earliest pending task. The frontend refreshes booking details after workspace mutations to keep optimistic booking-edit timestamps current.

Normal booking and public customer-page responses omit the private records. New records do not trigger customer messages or reminder jobs.

## Rollout

1. Deploy the backend first, including compatibility routes. Legacy single follow-ups can be read immediately without writing during a GET.
2. In `photography-cms-backend`, configure the target `MONGODB_URI` through the normal environment and run `npm run migrate:booking-workspace`. This defaults to a dry run and prints counts only.
3. Review counts, then run `npm run migrate:booking-workspace -- --apply`. Rerun after any reported conflicts. The migration skips records already initialized, fences concurrent changes, and can be rerun safely.
4. Deploy the frontend. Verify one migrated overdue task, adding a note and two tasks, rescheduling, completion, the Overview summary, and the grouped work dashboard. Check that customer pages contain no internal text.

Migration preserves legacy dates and notes, retains existing last-completion timestamps, and marks unknown creation metadata as Legacy data. It does not invent completed task history. New bookings created after migration are initialized on their first workspace write. Do not roll back to backend code that writes the single follow-up fields directly once multiple tasks exist; retain the compatibility backend when reverting only the frontend.

## Verification

- Frontend: `npm run check:release`; `npx playwright test --config playwright.schedule.config.ts booking-detail.spec.ts`.
- Backend: `npm run build`; `npm run test:booking-workspace`; booking and work-workspace regression tests.
- The MongoDB-backed workspace test covers pinned/default note creation, duplicate create retries, reopen permissions, stale revisions, competing reopen requests, active assignees, future-date validation, preserved closure history, pending projections, and hidden internal storage. Verify legacy migration dry-run/apply counts separately in the target environment.
- Browser tests cover note retry/edit/pin, note-to-task prefilling, task completion/outcome, IST conversion, read-only access, discard confirmation, and responsive tab layouts.

Production deployment and migration must be verified separately from these local checks.
