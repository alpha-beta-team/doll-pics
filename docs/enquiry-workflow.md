# Enquiry workspace updates

The customer row opens the full enquiry detail. The list URL preserves the view, search, service, filters, sort and page. Active covers unconverted open leads. New · not contacted also requires no recorded call. Follow-up due includes open leads due on or before today in India time. All includes booked and lost leads. Follow-ups for a converted lead continue on its booking.

## Staff workflow

- Log a call outcome from the Overview tab. No answer requires a future retry time. Interested and Quotation needed accept an optional next follow-up. Not interested requires a reason and closes the enquiry.
- Saving a call replaces the active reminder with the selected date, or completes/removes it when no next date is chosen. The form explains this before saving. All date shortcuts use India time.
- Call history records the outcome, note, server timestamp, and authenticated staff identity. An operation UUID prevents a failed-response retry or concurrent duplicate submission from adding the same entry twice.
- Notes & follow-ups uses the booking workspace UI: attributed notes, pinning, editing, revision checks, linked tasks, owners, due times, completion/cancellation outcomes, reopening and deletion. Existing free-text and attributed notes remain available. Activity combines receipt, calls, workspace notes and subsequent stage changes. Past manual transitions have no recorded history.
- Manage follow-ups from the list or Overview. Reopen a lost enquiry using the stage tracker. Convert directly from detail using the booking wizard. A converted enquiry links to its booking.
- Quotation requests are recorded as call outcomes for all managing staff.
- Enquiry detail follows the supplied HTML layout with a wide shoot-preferences summary, call/activity and follow-up/message columns, and Customer and Notes & follow-ups tabs. Important Dates is omitted from this page; shared Important Dates features elsewhere are retained. The name header, tabs and shared sidebar retain their sticky/fixed behavior.

## Duplicate warning

The form checks the existing customer lookup for active enquiries and bookings, treating 10-digit Indian numbers, spaces, hyphens, and +91 formatting as the same phone. Matching records can be opened for review. A separate shoot requires a 10–500 character explanation and explicit acknowledgement.

The backend repeats the authoritative lookup when creating an admin enquiry or changing its canonical phone. A conflict returns `409 / DUPLICATE_ENQUIRY`; the form retains input and refreshes the lookup. The acknowledgement stores the explanation, staff identity, and time. Historical closed records do not prevent a new enquiry. This is a duplicate warning with an explicit override, not a unique-phone constraint: customers may have multiple shoots, and simultaneous independent creations are not serialized.

The list also flags matching phones among its loaded active enquiries. This list hint does not claim to cover records excluded by source/date filters. Masked phone values are not grouped.

## API and release

- Enquiry workspace: `GET /api/admin/enquiries/:id/workspace`. Under that path, `POST notes`, `PATCH/DELETE notes/:noteId`, `POST follow-ups`, `PATCH/DELETE follow-ups/:taskId`, `POST follow-ups/:taskId/finish`, and `POST follow-ups/:taskId/reopen` use the booking workspace payloads (UUID request IDs and item revisions). These routes enforce enquiry permissions independently of booking access.
- Workspace notes and task arrays are private, excluded from ordinary enquiry/list responses. Legacy notes import lazily, retaining original attribution where available. Imported-note IDs prevent deleted legacy notes from reappearing. No bulk migration runs during deployment.
- Task updates maintain the earliest pending `nextFollowUpAt` / `followUpNote` projection used by the inbox and reminders. Older list, form and call actions reconcile with the workspace: completing/removing the earliest follow-up promotes any other pending task; closing/converting cancels pending enquiry tasks. Closed enquiries still allow notes but cannot receive/reopen tasks. Reminder scheduling is refreshed only when the next reminder changes.
- Deploy the new backend workspace support before this frontend. Local tests use fixtures or disposable MongoDB and do not verify hosted deployment or reminder delivery.

- Authenticated endpoint: `POST /api/admin/enquiries/:id/calls` with `eventId` (UUID v4), `outcome`, optional `note` (max 1000), optional `nextFollowUpAt` (ISO).
- Authenticated note append: `POST /api/admin/enquiries/:id/notes` takes a UUID v4 `eventId` and `text` (up to 2000 characters). Authorized detail responses include optional `internalNotes` and `stageHistory`. No backfill is needed. Release CMS support before enabling the new screens.
- Optional enquiry fields: `callHistory`, `lastCall`, `duplicateAcknowledgement`. No backfill is required. List responses include the last call, not the full history.
- Enquiry writes enforce management permission on the backend. Content Manager defaults to read-only, employee access is denied, and existing explicit enquiry overrides are respected.
- Deploy backend support before the frontend. Existing clients must provide a separate-shoot explanation when an active duplicate is found; otherwise the server returns a conflict rather than creating another record.

## Local verification

- `npm run test:enquiry-workflow`: component interaction coverage for outcomes, failed-save retry identity, note saving, discard confirmation, read-only controls, load retry, duplicate acknowledgement, and existing inline follow-ups.
- Backend: `node --test -r ts-node/register src/enquiries/enquiry-history.spec.ts src/bookings/*.spec.ts`. Uses disposable in-memory MongoDB for persistence, permissions, concurrent retries, stage transitions, booking conversion, and private-note isolation.
- Frontend `check:release`: typecheck, lint, middleware checks, production build. Backend `npm run build`.
- Use a designated QA enquiry for hosted verification of note persistence, stage history and conversion.
