# Enquiry workspace updates

Opening an enquiry row shows a drawer on desktop and a full-width panel on small screens. Search, service, sort and pagination stay in place. The full detail URL remains available from the panel.

## Staff workflow

- Log a call outcome from the panel or full enquiry. No answer requires a future retry time. Interested and Quotation needed accept an optional next follow-up. Not interested requires a reason and closes the enquiry.
- Saving a call replaces the active reminder with the selected date, or completes/removes it when no next date is chosen. The form explains this before saving. All date shortcuts use India time.
- Call history records the outcome, note, server timestamp, and authenticated staff identity. An operation UUID prevents a failed-response retry or concurrent duplicate submission from adding the same entry twice.
- Save internal notes, edit the enquiry, and manage follow-ups from the panel. Unsaved panel notes and call entries prompt before closing or changing sections. Closed-lost enquiries can be reopened. Converted enquiries link to their booking.
- Quotation requests are recorded as call outcomes for all managing staff.

## Duplicate warning

The form checks the existing customer lookup for active enquiries and bookings, treating 10-digit Indian numbers, spaces, hyphens, and +91 formatting as the same phone. Matching records can be opened for review. A separate shoot requires a 10–500 character explanation and explicit acknowledgement.

The backend repeats the authoritative lookup when creating an admin enquiry or changing its canonical phone. A conflict returns `409 / DUPLICATE_ENQUIRY`; the form retains input and refreshes the lookup. The acknowledgement stores the explanation, staff identity, and time. Historical closed records do not prevent a new enquiry. This is a duplicate warning with an explicit override, not a unique-phone constraint: customers may have multiple shoots, and simultaneous independent creations are not serialized.

The list also flags matching phones among its loaded active enquiries. This list hint does not claim to cover records excluded by source/date filters. Masked phone values are not grouped.

## API and release

- New authenticated endpoint: `POST /api/admin/enquiries/:id/calls` with `eventId` (UUID v4), `outcome`, optional `note` (max 1000), optional `nextFollowUpAt` (ISO).
- Optional enquiry fields: `callHistory`, `lastCall`, `duplicateAcknowledgement`. No backfill is required. List responses include the last call, not the full history.
- Enquiry writes used by the panel enforce management permission on the backend. Content Manager defaults to read-only, employee access is denied, and existing explicit enquiry overrides are respected.
- Deploy backend support before the frontend. Existing clients must provide a separate-shoot explanation when an active duplicate is found; otherwise the server returns a conflict rather than creating another record.

## Local verification

- `npm run test:enquiry-workflow`: component interaction coverage for outcomes, failed-save retry identity, note saving, discard confirmation, read-only controls, load retry, duplicate acknowledgement, and existing inline follow-ups.
- Backend: `node --test -r ts-node/register src/enquiries/enquiry-workflow.spec.ts src/customer-lookup/customer-lookup.service.spec.ts src/telegram/events.spec.ts`. Uses disposable in-memory MongoDB for persistence, permissions, concurrent retries, stage transitions, formatted phone matches, historical customers, and active booking matches.
- Frontend `check:release`: typecheck, lint, middleware checks, production build. Backend `npm run build`.
- Live hosting and desktop/mobile visual checks remain separate. Browser automation was unavailable during implementation; native browser attempts encountered active user navigation, so visual QA was not completed. No real customer records were changed for testing.
