# Booking notes and follow-ups

The booking detail page has a Notes & Follow-ups tab before Activity. Notes are internal plain text, editable and pinnable by anyone with booking management access. Booking viewers can read them. Follow-ups support assignment, rescheduling, completion outcomes and cancellation; closed tasks and change history remain visible. All entered dates use Asia/Kolkata and are stored in UTC. No automatic reminders, attachments, mentions or note deletion are included.

Shoot notes remain independent. Overview, the work dashboard, linked enquiry summaries and reports retain one next follow-up per booking. Completed/cancelled bookings retain their task history; existing dashboard status filters remain unchanged.

## API

All routes require authenticated booking access; writes require management access.

- `GET /admin/bookings/:id/workspace`: notes and tasks with histories, pending count, next-task summary and last completion timestamp.
- `POST /admin/bookings/:id/notes`: `requestId` (UUID), `body` (1–5000 trimmed characters).
- `PATCH /admin/bookings/:id/notes/:noteId`: `revision` and `body` and/or `pinned`.
- `POST /admin/bookings/:id/follow-ups`: `requestId`, `title` (1–200 trimmed characters), `dueAt` (ISO timestamp), optional `details` (5000 characters), `assigneeId`, `sourceNoteId`.
- `PATCH /admin/bookings/:id/follow-ups/:taskId`: `revision` plus the task fields above, excluding request/source IDs.
- `POST /admin/bookings/:id/follow-ups/:taskId/finish`: `revision`, `status` (`completed` or `cancelled`), optional `outcome` (5000 characters).

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
- MongoDB-backed tests exercise dry-run/apply/rerun migration, permissions, duplicate creates, competing edits, projection updates, legacy adapters, and private customer projections.
- Browser tests cover note retry/edit/pin, note-to-task prefilling, task completion/outcome, IST conversion, read-only access, discard confirmation, and responsive tab layouts.

Production deployment and migration must be verified separately from these local checks.
