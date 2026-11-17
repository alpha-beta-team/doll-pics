# Doll Pictures — Deliverables and Order Tracking Plan

Created: 15 November 2026  
Last updated: 17 November 2026

Status: Phase 1 live (user confirmed 16 November 2026). Phase 2 implemented and locally verified; deployment and live acceptance pending. Phase 3 remains planned.
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
- Use the deliverables list as a reference before printing and customer handover; it is not a mandatory completion gate.
- The only workflow deadline is **five calendar days from entering Editing to Edited photos delivered**, including weekends and holidays. Customer photo-selection time is excluded.
- Digital photo delivery and final physical delivery must be distinguishable.

## Current local foundation

The existing local project has a Delivery Queue, editor assignment, an optional expected delivery date, delivery links, a private customer page, and a shoot-completion timestamp. The current delivery action confirms gallery sharing and moves the booking to `delivered`; it does not represent final album/frame fulfillment.

The current overdue queue uses the saved expected delivery date rather than automatically deriving the planned five-day deadline from entry into Editing. Reference: [existing customer booking and delivery queue documentation](../customer-booking-page.md).

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
- [x] Move Phase 1 deliverables to live (user confirmed 16 November 2026). Deployment order, identifiers, and any migration/index steps were not recorded.
- [ ] Verify live creation and reload of a booking with included defaults, a paid extra, and a complimentary magazine.
- [ ] Verify that editing catalog defaults or deactivating a type does not alter saved booking commitments.
- [ ] Verify that adding/removing an extra adjusts the total once and that customers see only deliverable names and quantities in the list.
- [ ] Confirm staff can use the configuration successfully before starting workflow implementation.

Phase 1 acceptance: staff can reliably record and retrieve everything promised to each customer, including complimentary items, without introducing per-deliverable progress or disrupting existing booking/pricing behavior.

## Phase 2 — Overall order workflow

Proposed physical-order sequence:

```text
Shoot completed
  → Awaiting customer photo selection
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

- After shoot completion, staff prepare the selection-photo links and confirm **Photos shared → Awaiting customer selection**. The status modal includes optional WhatsApp sharing; staff may skip that action when photos were shared through another channel. Opening WhatsApp never changes the stage. This separate sharing step was confirmed by the user on 17 November 2026.
- Customer photo selection is required after shoot completion and before editing, for both digital-only and physical orders. Keep the order in **Awaiting customer photo selection** until selection is complete; editing cannot start before that. This stage placement was confirmed by the user on 16 November 2026.
- Customer photo selection is confirmed manually: the customer shares selections through the existing studio process. Owner or staff with booking-management access then select **Selection completed → Start editing** (user confirmed 17 November 2026).
- That action records selection completion, moves the order from Awaiting customer photo selection to Editing, records the acting staff member and transition timestamp, and starts the five-calendar-day editing deadline in one atomic update. No separate customer photo-selection portal is required for this phase.
- After sharing edited photos through the existing studio process, Owner or staff with booking-management access select **Mark edited photos delivered** (user confirmed 17 November 2026). This action records the delivery-confirmation date/time and acting staff member, advances the stage to Edited photos delivered, and stops the five-calendar-day editing deadline in one atomic update. Preserve the original editing start, due date, and delivery timestamp so late delivery remains visible in history.
- Digital-only orders finish at Edited photos delivered. Orders with physical products continue to Preparing for printing.
- Record editing readiness and actual photo sharing separately; a saved link or opened messaging window does not prove delivery. The stage update is staff confirmation that sharing occurred, not independent proof of customer receipt.
- Keep order-level timestamps for completed milestones so later printing stages do not hide photo delivery history.
- Keep one **Printing** stage, with printing submission and completion dates recorded as order-level milestones. Do not introduce separate visible printing sub-stages (user confirmed 17 November 2026).
- Customer approval of the album/design before printing happens offline through the existing studio process (user confirmed 17 November 2026). No separate in-app approval stage or customer approval portal is required; staff handle that approval before moving the order to Printing.
- Record customer-selection blockers and quality-check/reprint issues at order level. Customer photo selection retains its own overall stage before editing.
- Before printing and customer dispatch, staff can review the promised physical products; item-by-item completion confirmation is not required to advance the overall stage.
- Do not require an order to remain open until every promised item has been handed over (user confirmed 17 November 2026). Staff may mark the overall order Delivered / Collected without an all-items completion gate. Preserve the saved deliverables list; the overall stage does not create individual item-delivery confirmations.
- Support customer collection as an alternative to customer courier delivery.
- Owner or staff with booking-management access confirm final physical handover using **Mark delivered** or **Mark collected** (user confirmed 17 November 2026). Record the chosen delivery/collection outcome, confirmation date/time, and acting staff member; a note is optional. No photo, signature, receipt, or other proof upload is mandatory. Save the completed order state and stage-history entry atomically. This is manual staff confirmation, not independently verified courier delivery.
- Owner and staff members with booking-management access can update order stages within their existing booking-access scope (user confirmed 17 November 2026). Each stage update records the staff identity and timestamp and preserves prior stage history.
- Owner and staff with booking-management access may correct an incorrect stage or date within their existing booking-access scope (user confirmed 17 November 2026). Require a correction reason, preserve the original history entry, and append an audit entry containing the previous and corrected values, correcting staff member, and recorded timestamp.
- Assign one responsible staff member per order throughout the workflow, rather than separate assignees for each stage (user confirmed 17 November 2026). Owner and staff with booking-management access may reassign the order within their existing booking-access scope. Record the previous and new assignee, who reassigned it, and when. Other authorised staff may still update stages; assignment does not grant or restrict booking access.
- Owner and staff with booking-management access may reopen a completed order for a reprint or correction within their existing booking-access scope, choose the appropriate workflow stage, and provide a required reason (user confirmed 17 November 2026). Preserve previous completion dates and all stage history; append a reopening entry recording the previous and selected stage, reason, acting staff member, and timestamp. Save the reopened state and history entry atomically.
- Keep an accountable next action on the order; apply the five-day deadline only to Editing → Edited photos delivered and retain an audit trail for changes and corrections.
- Keep payment status and outstanding balances separately visible. An unpaid balance does not block final dispatch or customer collection (user confirmed 17 November 2026). Dispatch, collection, or order completion must not mark the balance as paid or alter payment records.

### Booking cancellation

- Cancelling a booking also stops its order workflow and any active editing deadline (user confirmed 17 November 2026). Preserve all stage history, original deadline values, and recorded milestone dates; cancellation does not imply completion or delivery.
- Record the cancellation timestamp and acting staff member under the existing booking-cancellation permissions. Cancelled orders are excluded from active workflow/deadline tracking and future workflow reminders.

### Deadlines

- Start the five-day deadline when the order enters **Editing**; stop it when **Edited photos delivered** is recorded. This rule was confirmed by the user on 16 November 2026.
- Time awaiting customer photo selection is outside this deadline. No deadlines are assigned to the other workflow stages.
- Reopening a completed order into **Editing** starts a new five-calendar-day deadline from the reopening timestamp, due at the same local time in Asia/Kolkata five days later (user confirmed 17 November 2026). Preserve the original editing start, deadline, delivery dates, and prior cycles in history. The new active deadline stops when edited-photo delivery is confirmed again. Reopening into any other stage creates no deadline.
- Use **five calendar days**, including weekends and holidays, due at the same local time in Asia/Kolkata five days after Editing starts (confirmed by the user on 17 November 2026). For example, Editing starts 17 November at 10:00 AM IST → edited photos are due 22 November at 10:00 AM IST.
- Record original commitments and revised expected dates with reasons; revised dates must not erase evidence of a missed original commitment.
- Record expected and actual printing completion, studio arrival, studio dispatch, and customer delivery dates for reference; these are not workflow deadlines.
- Flag missing Editing start times/deadlines for orders in Editing, and missing assignees across active orders.

### Printing and shipment records

| Record | Information |
| --- | --- |
| Printing | Printing house, order reference, submission date, expected completion, actual completion |
| Printer → studio | Courier, tracking number/link, dispatch date, expected arrival, actual receipt |
| Studio → customer | Courier, tracking number/link, dispatch date, expected delivery, actual delivery |
| Customer collection | Handover confirmation date/time, confirming staff member, optional note |

Keep the two courier journeys separate. Initially, staff can record courier updates and delivery confirmation manually. Automatic courier integration is a later option, not an assumed capability.

### Customer-visible order progress

- Show the current overall stage and completed milestone dates on the private customer booking page (user confirmed 17 November 2026). Display dates in Asia/Kolkata.
- Keep staff names/identities, internal notes, correction reasons, and blockers private. Return only the customer-visible progress fields through the customer API; do not expose the internal workflow audit history.
- Preserve existing customer-link access and publication controls. For historical bookings without an initialized workflow, do not invent progress or milestone dates.

### Existing delivered bookings

- Leave existing bookings already marked `delivered` unchanged. Start the new order workflow only when Owner or staff with booking-management access explicitly select the correct stage within their existing booking-access scope (user confirmed 17 November 2026).
- Historical gallery delivery does not prove physical fulfillment. Do not automatically map these bookings to final Delivered / Collected, fabricate historical stage dates, or infer physical-delivery confirmations.
- Record the staff member, selected initial stage, and timestamp of manual workflow initialization. This recorded timestamp is not evidence of when earlier milestones occurred; retain existing booking history.

### Phase 2 planning status

The discussed workflow decisions are agreed, including offline pre-print approval and one Printing stage. Backend/frontend implementation and focused local verification are complete. Deployment and live acceptance remain pending. Phase 3 dashboard/reminder implementation and reminder rules remain separate work.

## Phase 3 — Dashboard and reminders

### Dashboard queues

Provide clickable counts and actionable lists for:

- Completed shoots awaiting customer photo selection.
- Orders in Editing awaiting edited-photo delivery.
- Edited photos due soon or overdue against the five-day deadline from entry into Editing.
- Orders awaiting customer photo selection or printing submission; pre-print approval is handled offline.
- Orders currently with the printing house.
- Printed orders awaiting studio receipt.
- Orders received at the studio but awaiting customer dispatch.
- Customer shipments pending delivery.
- Fully fulfilled orders.
- Orders in Editing missing their start time/deadline, and active orders missing responsible staff.

Each row shows the customer/booking, deliverables summary, overall stage, responsible person, next action, editing deadline and overdue duration where applicable, and blocker. Define overlapping dashboard counts clearly; the same order may have an overdue commitment and a current printing stage.

### Automated reminders

Proposed behavior:

- Warn before edited-photo delivery is due.
- Alert when five days from entry into Editing have passed without recorded photo delivery.
- Send a daily unresolved-overdue summary.
- Deadline alerts apply only to Editing → Edited photos delivered; other stages have no deadline alerts.
- Escalate unresolved delays to the owner according to an agreed schedule.
- Stop reminders for a milestone when completion is recorded. Exclude cancelled orders from all future workflow reminders, including reminders for previously overdue editing deadlines.

Reminders must run in the backend without requiring an open dashboard. Avoid duplicate alerts, retry failed sends, and show notification failures. A queued or provider-accepted message is not proof of recipient delivery.

Decisions to lock: channels (in-app, Telegram, WhatsApp, email), recipients, timing/frequency, escalation rules, and handling of blocked orders. Customer messaging is not assumed to be authorized or included; the requested reminders are to the studio.

## Final workflow rollout and acceptance

- [ ] Finalize the remaining workflow and reminder rules after Phase 1 is usable.
- [ ] Verify deadline calculation, milestone transitions, digital-only completion, blockers, and staff-controlled completion without an all-items gate.
- [ ] Verify both courier journeys, collection, and late arrivals.
- [ ] Verify dashboard filters/counts against underlying orders.
- [ ] Verify reminder scheduling, duplicate prevention, failure/retry behavior, and completion-based stopping.
- [ ] Preserve existing customer-link publication controls and review/payment behavior through explicit compatibility checks.
- [ ] Verify manual workflow initialization for existing delivered bookings preserves their existing status/history until explicitly initialized and does not fabricate missing dates, deliverables, or delivery confirmations.
- [ ] Deploy and verify the complete workflow with real authorized studio users and configured notification channels.

Success means every active customer order has a visible promise, an overall stage, an accountable next action, and an editing deadline where applicable, with staff-controlled final completion and no mandatory all-items handover gate.

## Progress

- [x] Consolidate the discussion into one plan.
- [x] Lock deliverables configuration.
- [x] Implement deliverables configuration.
- [x] Roll out deliverables configuration (user confirmed live 16 November 2026).
- [ ] Record detailed live verification of deliverables configuration.
- [x] Finalize and implement order tracking locally.
- [ ] Deploy and verify Phase 2 order tracking live.
- [ ] Implement dashboard and reminders.
- [ ] Roll out and verify the full workflow.

Phase 1 deliverables are live, as confirmed by the user on 16 November 2026. The detailed live acceptance checks above have not yet been recorded; this update does not independently verify production behavior. Phase 2 order tracking is implemented locally; deployment and live verification remain pending. The Phase 3 dashboard and reminders remain future work.


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

### Rollout runbook and live verification

Phase 1 is live (user confirmed 16 November 2026). The deployment steps below are retained as the rollout runbook, not pending deployment tasks. Configuration and individual live-verification results have not yet been recorded.

1. Deploy the backend before the dependent frontend.
2. No booking backfill is required. The grouped configuration document is created on the first Owner save. The legacy `setup:deliverables` script remains optional for old catalog setup; it does not create or overwrite the grouped lists.
3. Deploy the frontend. Owner opens Deliverables, adds the actual Base Package items/quantities/specifications, adds seasonal extensions and their additions, and saves the configuration.
4. Verify live creation/reload, enquiry conversion, confirmed-booking edits, paid-extra addition/removal, and a complimentary magazine. Confirm financial totals and customer names/quantities.
5. Change a base item and disable a seasonal extension. Verify seasonal previews inherit the current base, new bookings use the base only, inactive extensions cannot be newly selected, and saved bookings retain their snapshots. Check that explicitly applying a different list preserves paid extras and manual gifts.
6. Verify Owner-only catalog management, booking-staff selections, and customer-link access/publication controls in the deployed environment.
7. Record deployment identifiers and live results here before marking detailed live verification complete. If the frontend is rolled back, retain the additive backend data and verify legacy clients preserve deliverables and final-total semantics.


### Booking deliverables UX refinement

The booking editor uses a compact divided list instead of separate large cards. Desktop fields share column headings; narrow layouts stack the item name above quantity and inclusion. Actual specifications appear as secondary text; empty specification placeholders are hidden. Remove actions use labelled icon buttons, and complimentary reasons and extra totals appear only when relevant.

The package chooser is a compact selector with an Apply button and collapsed preview. Booking creation/editing shows one Base / Extras / Booking total summary; redundant zero-extra totals and lengthy instructional text were removed. Controls retain accessible names and visible keyboard focus, with larger targets for touch input.

Verified with existing editor/retry tests, pricing-payload browser checks, and desktop/mobile screenshots. Compact-layout checks cover row height, removal, one pricing summary, and absence of horizontal overflow. No backend pricing, persistence, or permission behavior was changed by this UX refinement.


## Phase 2 implementation and rollout — 17 November 2026

### Implemented locally

- Order tracking appears above the booking tabs after shoot completion. The header shows the exact next action (for example, **Selection completed → Start editing**) instead of Review delivery or a generic Update order status label and opens a centered, action-specific modal. Owner and booking-management staff can advance stages, reassign responsibility, correct stages/dates with a reason, reopen completed orders, and record printing/courier details.
- A booking stores one `orderWorkflow` object: current stage/state, digital/physical order type, responsible staff, Date-valued milestone timestamps, editing due date, logistics, revision, and an append-only history array. History entries retain previous and next snapshots, event time, recorded time, staff identity, reason, and note. Public customer responses only contain stage/state and milestone dates.
- `GET /api/admin/bookings/:id/order-workflow` requires booking read access; `PATCH` requires booking-management access. The update includes an expected revision and request UUID. Compare-and-swap writes atomically persist state/history, reject stale updates, and make identical request retries safe. Reusing a request UUID with changed values is rejected.
- New shoot-completion actions initialize **Shoot completed · Photos to share**. Staff explicitly confirm sharing before the order enters Awaiting customer photo selection. Saved deliverables identify the order type; when none are recorded, the default includes physical products and the UI asks staff to review that classification before editing. Responsibility starts with the booking's assigned staff member, or the staff member completing the shoot. Staff may reassign it and correct digital/physical classification while awaiting selection.
- Existing shoot-completed/delivered bookings are not backfilled or silently initialized; they require explicit initialization with order type and responsible staff. Staff select the actual current stage; earlier milestones are not invented.
- The photo-sharing and edited-photo-delivery modals include saved-link editing and optional WhatsApp sharing. Changed links save before the status update; a link-save failure prevents the status update. Actual sharing remains a separate staff-confirmed action.
- Selection confirmation enters Editing. Edited-photo delivery confirmation ends the active five-calendar-day deadline and preserves the original due date. It also retains the existing booking `delivered`/gallery-sharing semantics so review and customer-link publication behavior remains compatible. Physical fulfillment continues in the separate order workflow.
- Manual stage updates capture actual event time (default: save time), separately from server-recorded time. Date corrections validate milestone chronology. Reopening into Editing starts a fresh five-day cycle; reopening into another stage creates no deadline. Previous cycles remain in history.
- Printing has one stage. Submission is its entry timestamp; actual completion can be recorded separately, or at dispatch to the studio if not already recorded. Both courier journeys have separate courier, tracking number/link, and reference dates. Expected logistics dates are informational, not deadlines.
- Final delivery/collection requires staff confirmation, with optional notes and no proof upload, payment gate, or all-items gate. Cancelling a tracked booking cancels its workflow without deleting milestone/deadline history. Cancelled workflows cannot be advanced or reopened through these actions.
- Customer progress preserves the existing private-link access/publication controls and displays milestone dates in Asia/Kolkata. Internal staff identities, blockers, notes, correction reasons, and history snapshots are excluded by the backend allowlist.
- Phase 3 scheduling, reminders, and dashboard queues are not implemented in this increment. Cancellation state is available for their future exclusion rules.

### Local verification

- Frontend release check passed using static CMS fallback: typechecks, lint (existing warnings), 29 middleware checks, production build and 33 prerendered files. This does not verify live CMS content.
- Focused frontend workflow/customer-booking/deliverables tests: 10 passed.
- Backend workflow tests: 8 passed, including a temporary local MongoDB test for atomic persistence, concurrent-update rejection, retry safety, permissions, legacy initialization, customer projection, shoot-completion/delivery compatibility, and cancellation. Notification/calendar dependencies are stubbed; no customer messages are sent by these tests.
- Backend production build passed.
- Browser tests: 3 passed, covering 390px/1280px modal and stage actions, separate courier controls, no horizontal overflow, and read-only access. Screenshots reviewed locally. Browser tests use isolated API fixtures.

Reproducible checks:

```sh
# doll-pics
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run test:order-workflow
npm run test:order-workflow:browser

# photography-cms-backend
npm run test:order-workflow
npm run build
```

### Deployment and live acceptance pending

1. Deploy the compatible backend first, then the frontend. No historical booking migration/backfill or new index is required for this per-booking workflow.
2. Verify authorised staff can complete a shoot, confirm selection photos were shared, later confirm customer selection, see the five-calendar-day due time, share and confirm edited photos, and continue physical fulfillment through printing, both courier journeys, and delivery/collection.
3. Verify assignment, late date entry/correction, reason-required reopening, cancellation, and simultaneous/stale staff updates using authorised QA records.
4. Verify a digital-only order completes at photo delivery and a physical order can complete despite unpaid balances or unconfirmed individual items; existing payments remain unchanged.
5. Verify a historical delivered booking stays untouched until explicit initialization and the private customer page displays only approved progress fields.
6. Record deployed versions and live results here before marking Phase 2 live. Retain additive workflow data if rolling back the frontend; older UI versions do not provide the workflow controls.


### Top-level status and sharing refinement — 17 November 2026

- Order tracking is visible above the tabs, including when Delivery is selected. The header opens the appropriate next status modal directly.
- New orders follow **Shoot completed → Photos shared / Awaiting customer selection → Editing → Edited photos delivered**. Only entry into Editing starts the five-calendar-day deadline.
- Prepare delivery links and optional sharing are available in both the selection-photo sharing modal and the edited-photo delivery modal. Sharing opens WhatsApp for the staff member to send; the separate confirmation records status. The background remains visible behind the modal.
- Existing workflows already in Awaiting customer selection retain their recorded stage/history; they are not automatically rewound. Historical bookings still require explicit initialization.
- Local checks for this refinement: 8 backend workflow tests and backend build; 7 frontend workflow/customer/sharing tests; 7 isolated browser tests including mobile/desktop, optional sharing without advancing, link-save failure/retry, and the two separate sharing/selection updates. No live customer messages were sent or existing booking records changed by validation.

- Status modal timestamps now use action-specific labels, such as **Editing started at · India time**. They record when the step actually happened; leaving an optional timestamp blank uses save time. Editing start time determines the five-calendar-day deadline.

### Revised stage sequence — 17 November 2026

After shoot completion, the normal physical workflow is:
1. Shared for customer selection.
2. Customer photos selected (starts the existing five-calendar-day editing deadline).
3. Edited photos shared (stops the editing deadline; digital-only orders finish here).
4. Customer selected edited photos for printing.
5. Shared for printing.
6. Printing received at the studio.
7. Handed over to customer OR couriered to customer. Both remain active.
8. Delivered: staff explicitly confirm final customer receipt.

The edited-photo selection and direct-handover milestones have distinct persisted keys. Existing Preparing for printing orders next require edited-photo selection; existing In transit to studio orders next record Printing received; existing Ready for dispatch orders next record handover/courier dispatch. Historical stages and dates are preserved, and legacy completed collection orders remain completed. New normal flows omit the old preparation, studio-transit, and ready-for-dispatch steps. Printing receipt does not fabricate a printing-completion timestamp. Earlier actual dates remain allowed when advancing, with recorded audit time retained separately.
