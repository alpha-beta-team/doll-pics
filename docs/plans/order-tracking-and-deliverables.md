# Doll Pictures — Deliverables and Order Tracking Plan

Created: 15 November 2026  
Status: Planning; configuration decisions pending  
Scope: Doll Pictures admin/frontend and photography-cms-backend

## Goal and delivery sequence

Maintain a central record of everything promised to a customer and track the order from actual shoot completion to final delivery. Prevent missed commitments through clear stages, ownership, deadlines, and reminders.

The first release is **deliverables configuration**. Finalize its business rules, implement it, validate it, and roll it out before implementing the order-tracking workflow. This document records the full intended scope; proposed defaults below are not yet locked decisions.

1. Lock deliverables configuration and booking inclusion rules.
2. Implement and roll out deliverables configuration.
3. Finalize and implement the overall order workflow and deadlines.
4. Add the dashboard and automated reminders, then roll out workflow tracking.

## Agreed direction

- Each booking maintains a list of promised deliverables.
- Deliverables include edited images, albums, frames, magazines, and future products.
- Items can be package inclusions, purchased extras, or complimentary items.
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

### Deliverable catalog

Maintain reusable deliverable types instead of free-typing product names on every booking.

| Type | Proposed information |
| --- | --- |
| Edited images | Promised image count; optional format/resolution description |
| Album | Quantity, dimensions, page count, optional finish |
| Frame | Quantity, dimensions, optional finish |
| Magazine | Quantity, dimensions, page count |
| Future products | Name, quantity/unit, specifications |

Catalog configuration describes the product only. It must not introduce separate deliverable progress tracking.

Proposed catalog fields: stable identifier, name, digital/physical classification, quantity unit, relevant specification fields, active/inactive state, and display order. Finalize the field structure after inspecting existing package and pricing models.

### Package inclusions

- Define deliverable types, quantities, and specifications in each package.
- Copy the agreed inclusions into a booking when that package is selected.
- Preserve a booking snapshot: later package/catalog changes must not silently change promises made to existing customers.
- Keep referenced historical items readable when a catalog type is deactivated.
- Decide explicitly what happens when staff change a package on an existing booking; do not silently overwrite customized inclusions.

### Booking deliverables

Example:

| Deliverable | Quantity | Specifications | Inclusion source |
| --- | --- | --- | --- |
| Edited images | 30 images | High resolution | Package |
| Album | 1 | 20 pages, 12 × 12 inches | Package |
| Frames | 2 | 12 × 18 inches | Package |
| Magazine | 1 | Seasonal offer | Complimentary |

Staff can add purchased extras or complimentary items and update agreed specifications. Record who changed a promised inclusion, when, and why. A removed commitment needs an explicit cancellation/replacement record rather than disappearing without history.

Items with different specifications should be separate rows. Identical items can share a row with a quantity. Neither arrangement has individual progress statuses.

### Complimentary and seasonal items

- Identify complimentary items clearly, with their offer name or reason.
- A zero price does not remove the obligation to deliver the item.
- An expired offer must not remove an item already promised on a booking.
- Proposed first release: staff manually add/select the complimentary item and record the offer/reason.
- Optional later automation: configure eligible packages, eligibility dates, whether booking date or shoot date controls eligibility, and the item/quantity awarded. Decide whether this automation is required for the first release.
- Reuse existing package, extra-item, discount, and pricing behavior; decide how deliverable rows relate to billing before adding price fields or calculations.

### Configuration decisions to lock before implementation

- [ ] Initial catalog types and specification fields, including image-count units and album page/spread terminology.
- [ ] Package defaults and the rule for copying them into a booking.
- [ ] Behavior when changing a booking's package or revising an agreed inclusion.
- [ ] Staff roles permitted to configure the catalog, edit package inclusions, and modify booking deliverables.
- [ ] Manual complimentary additions versus automatic seasonal eligibility for release one.
- [ ] Relationship between purchased extras and existing pricing/payment records.
- [ ] Whether customer-facing booking pages show the agreed deliverables in release one.
- [ ] Treatment of historical bookings with no structured deliverables; avoid inventing past commitments from today's packages.

### Implementation and rollout checklist

- [ ] Inspect existing frontend/backend package, booking, access, and pricing contracts.
- [ ] Lock the decisions above in this document.
- [ ] Implement backend persistence, validation, permissions, and change history.
- [ ] Implement catalog configuration, package inclusion editing, and booking deliverables editing/display.
- [ ] Preserve existing bookings and historical package promises.
- [ ] Validate package copying, booking overrides, complimentary items, quantity/specification validation, historical snapshots, and access controls.
- [ ] Run repository-required checks for the changed frontend/backend paths.
- [ ] Deploy compatible backend changes before dependent frontend changes; apply any required database migration/index steps.
- [ ] Verify live creation and reload of a booking with package items, an extra, and a complimentary magazine.
- [ ] Verify that editing package defaults does not alter the saved booking.
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
- [ ] Lock deliverables configuration.
- [ ] Implement deliverables configuration.
- [ ] Roll out and verify deliverables configuration.
- [ ] Finalize and implement order tracking.
- [ ] Implement dashboard and reminders.
- [ ] Roll out and verify the full workflow.

No implementation or deployment is recorded as completed by this plan.
