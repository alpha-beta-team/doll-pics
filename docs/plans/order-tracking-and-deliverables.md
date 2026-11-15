# Doll Pictures — Deliverables and Order Tracking Plan

Created: 15 November 2026  
Status: Deliverables implemented and locally verified; deployment pending
Scope: Doll Pictures admin/frontend and photography-cms-backend

## Goal and delivery sequence

Maintain a central record of everything promised to a customer and track the order from actual shoot completion to final delivery. Prevent missed commitments through clear stages, ownership, deadlines, and reminders.

The first release is **deliverables configuration**. Its business rules below are locked from the discussion. Implement it, validate it, and roll it out before implementing the order-tracking workflow. Later workflow and reminder proposals still need final decisions.

1. Lock deliverables configuration and booking inclusion rules.
2. Implement and roll out deliverables configuration.
3. Finalize and implement the overall order workflow and deadlines.
4. Add the dashboard and automated reminders, then roll out workflow tracking.

## Agreed direction

- Each booking maintains a list of promised deliverables.
- Deliverables include edited images, albums, frames, magazines, and future products.
- Deliverables are configured independently of packages. Items can be default inclusions, purchased extras, or complimentary items.
- Seasonal complimentary magazines are customer commitments and must remain visible.
- Track **one overall workflow per order**. Do not create individual progress statuses, stage histories, or deadlines for each deliverable.
- Use the deliverables list as an order-level completeness checklist before printing and customer handover.
- Edited photos must be delivered within seven days of actual shoot completion. Calendar versus working days remains to be decided.
- Digital photo delivery and final physical delivery must be distinguishable.

## Current local foundation

The existing local project has a Delivery Queue, editor assignment, an optional expected delivery date, delivery links, a private customer page, and a shoot-completion timestamp. The current delivery action confirms gallery sharing and moves the booking to `delivered`; it does not represent final album/frame fulfillment.

The current overdue queue uses the saved expected delivery date rather than automatically deriving a seven-day deadline. Reference: [existing customer booking and delivery queue documentation](../customer-booking-page.md).

These are local-source findings from the discussion, not verification of the deployed system. Recheck current contracts before implementation, particularly the meaning of `delivered`, review triggers, customer-page progress, and reporting.

## Phase 1 — Lock deliverables configuration

### Base Package and seasonal extensions

Owner configuration now uses a grouped list rather than adding each deliverable as a separate top-level configuration entry.

- Maintain one **Base Package** with the standard list of items and quantities.
- Add named seasonal extensions such as **Diwali** or **Christmas**. Each extension inherits the current Base Package and stores only its additional items.
- Base edits appear immediately in the seasonal configuration previews. They do not rewrite saved bookings.
- Each row has a name, quantity, digital/physical type, quantity unit, and fixed specification description. Seasonal additions can be Included or Complimentary; Complimentary is the default.
- Owner can add arbitrary items, including edited images, albums, frames, magazines, and calendars.
- The existing Owner role controls configuration. No new Admin role is introduced.
- Each seasonal extension can be made unavailable for new selections. Its items remain readable on existing bookings.
- Group configuration is saved atomically with a revision check. A stale configuration save requires reload.
- No per-deliverable progress, stages, or deadlines are introduced.

Example:

| List | Items entered by Owner | Effective items |
| --- | --- | --- |
| Base Package | 30 edited images, 1 album, 2 frames | Those three entries |
| Diwali | 1 complimentary magazine | Current Base Package + magazine |
| Christmas | 1 complimentary calendar | Current Base Package + calendar |

### Defaults, selection, and booking snapshots

- Deliverable lists remain independent of photography pricing packages. A pricing-package change does not replace booking deliverables.
- New bookings preselect the Base Package. Staff may choose and apply one active seasonal extension to obtain Base + seasonal additions.
- Staff may still deselect items, adjust quantities, and add paid extras or manual complimentary items.
- Applying a list replaces included items and the previous preset's seasonal additions, while preserving paid-extra rows and manually added gifts. It remains a draft change until the booking is saved.
- Explicitly applying a list creates new row identities to capture the current configured specifications, without altering preserved extras or historical snapshots.
- Save the agreed list on the booking. Later configuration changes affect future selections, not saved commitments.
- Existing bookings remain empty until staff manually add items or explicitly apply a list. No historical backfill is performed.
- Existing per-item catalog records remain supported for compatibility. Before any grouped configuration is saved, active old defaults appear as the initial Base Package for Owner review. Once saved, the grouped Base Package determines new-booking defaults.

### Booking deliverables

Example:

| Deliverable | Quantity | Specifications | Inclusion source | Added amount |
| --- | --- | --- | --- | --- |
| Edited images | 30 images | High resolution | Included | ₹0 |
| Album | 1 | 20 pages, 12 × 12 inches | Included | ₹0 |
| Frames | 2 | 12 × 18 inches | Included | ₹0 |
| Frame | 1 | 12 × 18 inches | Paid extra | ₹500 total |
| Magazine | 1 | Configured magazine specification | Complimentary | ₹0 |

Staff can edit a booking's selections and quantities even after confirmation. Specifications remain fixed from configuration; staff do not customize album sizes on bookings. Record who changed a promised inclusion, when, and why. A removed commitment needs an explicit cancellation/replacement record rather than disappearing without history.

Keep included quantities and paid extras on separate rows, even for the same catalog type: for example, two included frames and one paid extra frame. Complimentary additions also retain their inclusion category internally. None of these rows has individual progress statuses.

### Booking pricing

- Default included items add ₹0 to the agreed booking price.
- For each paid extra row, staff enter one flexible **total amount for that row**, irrespective of its quantity. Do not multiply that total by quantity or require a catalog unit price.
- Complimentary items add ₹0.
- Paid extras increase the booking total; removing a paid extra automatically deducts its recorded amount.
- Editing an extra's amount updates the booking total by the difference. Persisted saves/retries must not apply the charge twice.
- Integrate with existing booking pricing, discounts, payments, and outstanding balances after inspecting their contracts. Removing an extra changes the amount due; it must not delete recorded payments or imply a completed refund.

### Customer visibility

- Show saved deliverable names and quantities on the customer booking page.
- Do not expose deliverable prices, inclusion/complimentary labels, offer reasons, or internal change history in that list.
- Preserve the current customer-page access controls and existing financial visibility rules elsewhere.

### Complimentary and seasonal items

- Identify complimentary items clearly, with their offer name or reason.
- A zero price does not remove the obligation to deliver the item.
- An expired offer must not remove an item already promised on a booking.
- Staff can select a seasonal extension whose complimentary additions automatically retain its name as their internal offer reason. Individual manual gifts are also supported.
- Automatic seasonal eligibility is outside the first release. No package-based offer engine is required.

### Locked configuration decisions

- [x] Start with edited images, albums, frames, and magazines; admin/owner can add types such as calendars.
- [x] Owner manages one Base Package and named seasonal extensions with item quantities and fixed specifications.
- [x] Base defaults are independent of photography pricing packages and preselected on new bookings; seasonal extensions inherit the base and add items.
- [x] Booking specifications such as album size cannot be customized by staff.
- [x] Staff can edit deliverables after confirmation, within existing booking-access permissions.
- [x] Staff select a seasonal extension or add manual complimentary items; seasonal additions can be configured as complimentary.
- [x] Paid extras have a flexible booking-level total per row, not unit pricing.
- [x] Included and complimentary items add ₹0; adding/removing paid extras adjusts the booking total.
- [x] Included items and paid extras use separate rows.
- [x] Customer deliverable lists show names and quantities only.
- [x] Catalog changes affect new bookings only; existing bookings preserve saved commitments.
- [x] Historical bookings remain empty until staff add deliverables manually.
- [x] Deactivated types disappear from new selection options while remaining visible on saved bookings.

### Implementation and rollout checklist

- [x] Inspect existing frontend/backend booking, catalog/settings, customer-page, access, and pricing contracts.
- [x] Lock the deliverables business rules above in this document.
- [x] Implement backend persistence, validation, permissions, and change history.
- [x] Implement catalog/default configuration and booking deliverables editing/display, independently of packages.
- [x] Implement extra-row total pricing, automatic total adjustments, and customer names/quantities display.
- [x] Preserve historical bookings without auto-backfill and retain saved catalog snapshots.
- [x] Validate default preselection, selection overrides, additional quantities, fixed specifications, complimentary items, post-confirmation edits, deactivation, and access controls.
- [x] Validate extra pricing updates/removal, retry safety, payment preservation, and customer data exposure.
- [x] Run repository-required checks for the changed frontend/backend paths.
- [ ] Deploy compatible backend changes before dependent frontend changes; apply any required database migration/index steps.
- [ ] Verify live creation and reload of a booking with included defaults, a paid extra, and a complimentary magazine.
- [ ] Verify that editing catalog defaults or deactivating a type does not alter saved booking commitments.
- [ ] Verify that adding/removing an extra adjusts the total once and that customers see only deliverable names and quantities in the list.
- [ ] Confirm staff can use the configuration successfully before starting workflow implementation.

Phase 1 acceptance: staff can reliably record and retrieve everything promised to each customer, including complimentary items, without introducing per-deliverable progress or disrupting existing booking/pricing behavior.

## Phase 2 — Overall order workflow

Proposed physical-order sequence:

```text
Shoot completed
  → Editing
  → Edited photos delivered
  → Preparing for printing
  → Printing
  → In transit to studio
  → Received at studio
  → Ready for customer dispatch
  → Shipped
  → Delivered / Collected
```

- Digital-only orders finish after edited-photo delivery.
- Record editing readiness and actual photo sharing separately; a saved link or opened messaging window does not prove delivery.
- Keep order-level timestamps for completed milestones so later printing stages do not hide photo delivery history.
- Record printing submission, in-progress work, and completion as order-level milestones within the simplified printing stage. Finalize whether staff need separate visible stage labels for these milestones.
- Record selection/approval blockers and quality-check/reprint issues at order level. Decide whether selection or approval needs an additional overall stage.
- Before printing, review the promised physical products. Before customer dispatch, confirm the promised physical items are included.
- If an item is missing, keep the order open with a clear blocker, such as “Waiting for complimentary magazine.”
- Support customer collection as an alternative to customer courier delivery.
- Assign a responsible staff member, next action, and stage deadline; retain an audit trail for changes and corrections.
- Keep payment status separately visible. Decide whether an unpaid balance blocks dispatch.

### Deadlines

- Derive the edited-photo deadline from actual shoot completion, even if staff record completion later.
- Decide calendar versus working days, the precise due-time rule in Asia/Kolkata, and treatment of customer selection/approval delays.
- Record original commitments and revised expected dates with reasons; revised dates must not erase evidence of a missed original commitment.
- Record expected and actual printing completion, studio arrival, studio dispatch, and customer delivery dates.
- Flag missing deadlines/assignees so incomplete records cannot disappear from attention.

### Printing and shipment records

| Record | Information |
| --- | --- |
| Printing | Printing house, order reference, submission date, expected completion, actual completion |
| Printer → studio | Courier, tracking number/link, dispatch date, expected arrival, actual receipt |
| Studio → customer | Courier, tracking number/link, dispatch date, expected delivery, actual delivery |
| Customer collection | Handover date, staff confirmation, relevant acknowledgement |

Keep the two courier journeys separate. Initially, staff can record courier updates and delivery confirmation manually. Automatic courier integration is a later option, not an assumed capability.

### Workflow decisions still open

- [ ] Selection and approval sequence, including its effect on the seven-day commitment.
- [ ] Standard printing, transit, and dispatch turnaround times.
- [ ] Stage ownership and update permissions.
- [ ] Meaning of delivery confirmation and required evidence.
- [ ] Treatment of partial shipments with one overall order workflow. Proposed simplest first version: keep the order open until all promised items are handed over; do not introduce individual item statuses.
- [ ] Correction, cancellation, reprint, and reopening rules.
- [ ] Compatibility/migration for existing `delivered` bookings; do not assume historical gallery delivery proves physical fulfillment.
- [ ] Whether and how the customer page presents the new overall progress.

## Phase 3 — Dashboard and reminders

### Dashboard queues

Provide clickable counts and actionable lists for:

- Completed shoots awaiting editing or edited-photo delivery.
- Edited photos due soon or overdue beyond seven days.
- Orders awaiting selection/approval or printing submission.
- Orders currently with the printing house, including printing delays.
- Printed orders awaiting studio receipt, including delayed shipments.
- Orders received at the studio but awaiting customer dispatch.
- Customer shipments pending delivery or delayed.
- Fully fulfilled orders.
- Orders missing deadlines or responsible staff.

Each row shows the customer/booking, deliverables summary, overall stage, responsible person, next action, deadline, overdue duration, and blocker. Define overlapping dashboard counts clearly; the same order may have an overdue commitment and a current printing stage.

### Automated reminders

Proposed behavior:

- Warn before edited-photo delivery is due.
- Alert when the seven-day deadline passes without recorded photo delivery.
- Send a daily unresolved-overdue summary.
- Alert for missed printing completion, studio arrival, studio dispatch, and customer delivery dates.
- Escalate unresolved delays to the owner according to an agreed schedule.
- Stop reminders for a milestone when completion is recorded; exclude cancelled commitments/orders as appropriate.

Reminders must run in the backend without requiring an open dashboard. Avoid duplicate alerts, retry failed sends, and show notification failures. A queued or provider-accepted message is not proof of recipient delivery.

Decisions to lock: channels (in-app, Telegram, WhatsApp, email), recipients, timing/frequency, escalation rules, and handling of blocked orders. Customer messaging is not assumed to be authorized or included; the requested reminders are to the studio.

## Final workflow rollout and acceptance

- [ ] Finalize the remaining workflow and reminder rules after Phase 1 is usable.
- [ ] Verify deadline calculation, milestone transitions, digital-only completion, blockers, and final order completeness.
- [ ] Verify both courier journeys, collection, late arrivals, and the agreed partial-shipment behavior.
- [ ] Verify dashboard filters/counts against underlying orders.
- [ ] Verify reminder scheduling, duplicate prevention, failure/retry behavior, and completion-based stopping.
- [ ] Preserve existing customer-link publication controls and review/payment behavior through explicit compatibility checks.
- [ ] Plan historical-order reconciliation; do not fabricate missing dates, deliverables, or delivery confirmations.
- [ ] Deploy and verify the complete workflow with real authorized studio users and configured notification channels.

Success means every active customer order has a visible promise, an overall stage, an accountable next action, and a deadline, and cannot be marked fully fulfilled while promised items remain outstanding.

## Progress

- [x] Consolidate the discussion into one plan.
- [x] Lock deliverables configuration.
- [x] Implement deliverables configuration.
- [ ] Roll out and verify deliverables configuration.
- [ ] Finalize and implement order tracking.
- [ ] Implement dashboard and reminders.
- [ ] Roll out and verify the full workflow.

Deliverables implementation is complete locally. No deployment, production setup script, or live customer/studio verification has been performed. The order workflow, dashboard, and reminders remain future phases.


## Phase 1 implementation contract and rollout runbook

### Delivered behavior

- Owner-only Base Package and seasonal-extension configuration is at `/admin/deliverables`, linked from the admin sidebar.
- Staff with booking access can read the catalog; booking-management access is required to change booking deliverables. Owner-only configuration is enforced by API guards and route access.
- Booking creation/editing supports default preselection, independent selections, quantity changes, separate paid-extra rows, and manual complimentary items with internal reasons.
- Booking detail provides a dedicated deliverables editor, including after confirmation. Saved changes require a reason and current booking revision; audit snapshots are persisted atomically in `deliverablesHistory`.
- Catalog changes do not replace saved names/specifications. Inactive types remain on existing rows but cannot be newly selected. Historical bookings receive no automatic backfill.
- The private customer page and owner preview display only saved names and combined quantities. Prices, categories, specifications, and reasons are excluded from the customer deliverables response.

### API and pricing contracts

- `GET /api/admin/deliverables`: authenticated catalog read with booking access.
- `POST /api/admin/deliverables`: Owner creates a catalog entry.
- `PATCH /api/admin/deliverables/:id`: retained Owner-only legacy item editing.
- `GET /api/admin/deliverables/configuration`: staff with booking access read `{ revision, base, seasonal }`.
- `PATCH /api/admin/deliverables/configuration`: Owner saves the complete base and seasonal lists with their current revision. Items have stable Mongo-style IDs, name, type, unit, specifications, quantity, and inclusion category; extensions have their own ID, name, availability flag, and additions. Base items are always Included.
- Configuration is stored in one `deliverable_configurations` document (`_id: studio`). Seasonal lists store additions only; the effective list combines current base and selected additions. Stale revisions return conflict; no pricing or booking data is changed by configuration saves.
- Booking create, enquiry conversion, and update payloads accept `deliverables`: rows with `id`, `catalogId`, `quantity`, `category`, `amount`, and optional `reason`. Server resolution supplies names/specifications; client-supplied snapshots are not accepted.
- Omitted selections use current defaults on creation; explicit `[]` means none. Omitted selections on updates preserve the saved list.
- New clients send `baseAgreedTotal` after the existing booking discount. The backend derives final `agreedTotal` by adding paid-extra row totals. Admin responses expose the base and extras subtotal separately.
- Each paid-extra `amount` is one row total. Quantity changes do not multiply it. Included and complimentary rows must add zero.
- Discounts reduce the base only. Sale validation and owner-only manual base-price overrides operate on that base before extras.
- Legacy clients' `agreedTotal` retains its final-total meaning. Updates derive the base by subtracting extras. A total below the extras subtotal is invalid.
- A base amount must be set before nonzero paid extras can be saved. Removing extras preserves payment records and may expose an overpaid balance; no refund is implied.
- Deliverable or explicit base-price updates require `expectedUpdatedAt`; changed deliverables also require `deliverablesChangeReason`. Stale edits return a conflict requiring reload. Creation retries reuse the existing request identity; transaction retries do not add extras twice.

### Local verification

- Frontend `VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release`: passed (typechecks, lint with existing warnings, middleware checks, static-fallback production build). The default local-CMS prerender was stopped after connection retries because localhost:3001 was unavailable; live CMS content is not verified by the fallback build.
- Backend `npm run build`: passed.
- Backend booking/sales/owner-guard/staff-collection regression checks: 86 tests passed.
- Backend focused `npm run test:deliverables`: covers persistence, guards/DTOs, pricing, snapshots, conversion, confirmation, duplicate requests, and aborted-transaction retry behavior.
- Frontend `npm run test:deliverables`: 4 tests passed for editor interaction, failed-save retry, customer display, and base/seasonal list switching with preserved extras/gifts.
- Frontend `npm run test:customer-booking`: 3 customer-page tests and 9 service-worker tests passed.
- Browser checks: 6 deliverables scenarios passed (base/seasonal inheritance and application at 390px and 1280px, booking creation and enquiry-conversion payloads, compact editor layout and remove controls at both widths); 9 existing booking-discount scenarios passed.
- Mobile screenshot visually reviewed; both tested widths have no horizontal page overflow. Browser checks use isolated fixtures, not deployed CMS data.
- A broader authentication-suite attempt is separately blocked by an existing compile error in `src/auth/auth.service.spec.ts`: two constructor arguments are passed where the unchanged auth service requires three. Authentication files were not modified for this feature.

### Remaining rollout steps

1. Deploy the backend before the dependent frontend.
2. No booking backfill is required. The grouped configuration document is created on the first Owner save. The legacy `setup:deliverables` script remains optional for old catalog setup; it does not create or overwrite the grouped lists.
3. Deploy the frontend. Owner opens Deliverables, adds the actual Base Package items/quantities/specifications, adds seasonal extensions and their additions, and saves the configuration.
4. Verify live creation/reload, enquiry conversion, confirmed-booking edits, paid-extra addition/removal, and a complimentary magazine. Confirm financial totals and customer names/quantities.
5. Change a base item and disable a seasonal extension. Verify seasonal previews inherit the current base, new bookings use the base only, inactive extensions cannot be newly selected, and saved bookings retain their snapshots. Check that explicitly applying a different list preserves paid extras and manual gifts.
6. Verify Owner-only catalog management, booking-staff selections, and customer-link access/publication controls in the deployed environment.
7. Record deployment identifiers and live results here before marking rollout complete. If the frontend is rolled back, retain the additive backend data and verify legacy clients preserve deliverables and final-total semantics.


### Booking deliverables UX refinement

The booking editor uses a compact divided list instead of separate large cards. Desktop fields share column headings; narrow layouts stack the item name above quantity and inclusion. Actual specifications appear as secondary text; empty specification placeholders are hidden. Remove actions use labelled icon buttons, and complimentary reasons and extra totals appear only when relevant.

The package chooser is a compact selector with an Apply button and collapsed preview. Booking creation/editing shows one Base / Extras / Booking total summary; redundant zero-extra totals and lengthy instructional text were removed. Controls retain accessible names and visible keyboard focus, with larger targets for touch input.

Verified with existing editor/retry tests, pricing-payload browser checks, and desktop/mobile screenshots. Compact-layout checks cover row height, removal, one pricing summary, and absence of horizontal overflow. No backend pricing, persistence, or permission behavior was changed by this UX refinement.
