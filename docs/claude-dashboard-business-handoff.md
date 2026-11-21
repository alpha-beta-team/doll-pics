# Doll Pictures: dashboard business handoff for Claude

Prepared: 20 November 2026. Currency: INR. Business timezone: Asia/Kolkata.

## Purpose and instructions for Claude

Use this document to design dashboards for Doll Pictures, a photography studio managing enquiries, bookings, shoots, post-production, delivery, collections and staff payments.

Design an owner overview plus focused enquiry, booking/production and finance views. Prioritize decisions and actionable queues. Clearly distinguish selected-period performance from the current operational position. Preserve the business rules below.

This is a source-based analysis of the local frontend and paired backend, including work in progress. It is not a production data extract or a deployment verification. No real customer counts, revenue figures or balances were obtained. Any demonstration data must be labelled as sample data. Proposed dashboard widgets below are design recommendations, not claims that every aggregate already has an API.

Before implementation, inspect current source contracts and permissions. Do not invent metrics, endpoints or accounting capabilities. Identify any required backend aggregation separately from UI work. Preserve existing uncommitted changes.

## 1. Business model and relationships

The primary journey is:

```text
Enquiry -> Contact and follow-up -> Booking -> Shoot
        -> Customer photo selection -> Editing
        -> Printing where applicable -> Handover/courier -> Delivery
```

Payments, internal follow-ups and customer updates run alongside this journey. Production progress and payment progress are separate dimensions.

| Entity | Business purpose | Relationships |
| --- | --- | --- |
| Customer | Reusable customer identity and code | Can have multiple shoots/bookings |
| Enquiry | Potential customer requirement | Can convert to a linked booking |
| Booking | Agreed shoot, commercial terms and execution | Customer, optional enquiry/package, crew, deliverables and payments |
| Package | Service offering and pricing basis | Can be selected on a booking |
| Sale campaign | Promotional pricing | Package selection and saved booking pricing snapshot |
| Deliverable | Digital or physical item promised | Included, extra or complimentary booking row |
| Order workflow | Post-shoot production and logistics | Saved against booking |
| Follow-up | Internal task | Booking, optional assignee and source note |
| Salary transaction | Recorded payment to staff | Staff account and optional booking |

Do not equate an enquiry with a unique customer. Phone matching is a duplicate warning; repeat customers and separate shoots are supported.

## 2. Enquiries

### Information captured

- Name, phone, email, shoot/service type and preferred event.
- Preferred booking date, start/end time and location.
- Customer message and separate internal notes.
- Source, landing page, referrer and UTM attribution where supplied.
- Optional package/campaign context.
- Stage, legacy read status, next follow-up and follow-up note.
- Calls, stage history, conversion booking link and timestamps.
- WhatsApp consent, notification preference and preferred language.

Sources: website, Facebook, Instagram, Google Business, ads, phone, WhatsApp, walk-in, referral and diary import. Empty or historical source values must be handled explicitly.

### Pipeline and contact rules

| Stage | Meaning |
| --- | --- |
| `new` | Lead received |
| `contacted` | Contact recorded without a pending follow-up |
| `follow_up` | Further contact scheduled |
| `booked` | Converted into a booking |
| `closed_lost` | Closed without conversion |

Legacy status is separately `new`, `read` or `responded`. Do not use it as a replacement for the pipeline stage. Manual stage changes mean a stage alone does not always prove a call occurred.

| Call outcome | Result |
| --- | --- |
| `no_answer` | Future retry required |
| `interested` | Optional next follow-up |
| `quotation_needed` | Records quotation intent; optional follow-up |
| `not_interested` | Reason required; closes enquiry |

Saving a call replaces the active reminder or clears it if no next date is chosen. Calls and appended notes retain staff/time attribution and use retry identifiers to prevent duplicate entries. A quotation-needed outcome does not prove that a quotation document was generated or sent.

Phone duplicate checks normalize Indian formats, including +91, spaces and hyphens. Active matching enquiries/bookings prompt review. A separate shoot can proceed with acknowledgement and a 10–500 character explanation. Historical closed records do not block creation. This is not a serialized unique-phone constraint.

Conversion creates a linked booking and marks the enquiry booked. Booked enquiries cannot be manually reopened. Their continuing follow-ups are shown through the booking. Lost enquiries can be reopened.

### Dashboard recommendations

- Period: enquiries received, conversions and lost leads, with clearly defined cohorts.
- Current: untouched open leads, follow-ups due today, overdue follow-ups and open pipeline.
- Breakdowns: source and service; staff breakdown only if the required ownership data exists.
- Queue columns: customer, service, source, stage, last call, next follow-up and age.
- Actions: open enquiry, log call, schedule follow-up, convert to booking.

For conversion rate, explicitly state whether the denominator is leads received during the selected period or another cohort. Verify the existing report implementation before reusing its field; do not silently mix conversion event dates and enquiry creation dates.

## 3. Bookings and schedule

### Booking information

| Area | Fields |
| --- | --- |
| Customer | Customer ID/code, name, phone, email, source, originating enquiry |
| Shoot | Service/event, date, start/end, duration, location, assignee, crew |
| Pricing | Package snapshot, base agreement, discount, extras, final total, campaign snapshot |
| Collection | Payments, payment summary, due date |
| Operations | Status, production workflow, deadlines, internal notes and tasks |
| Delivery | Gallery/edited/RAW URLs, delivery dates, publication and logistics |
| History | Status/schedule changes, workflow actions, review tracking |

Bookings can be created directly or from enquiries. Core statuses are `draft`, `confirmed`, `shoot_completed`, `delivered`, `cancelled`.

Schedule checks distinguish timed overlaps and records without times. Required conflict acknowledgements must be preserved. Rescheduling and cancellation retain history. All date-based labels use India time.

Cancellation requires a reason, records the previous status and cancels an existing order workflow. Restoration must target the previous status and recheck schedule availability. Some legacy cancelled records require customer migration before restoration. Once an order workflow exists, progress corrections use that workflow rather than ordinary status reversals.

### Dashboard recommendations

- Period: confirmation activity, scheduled shoot value, cancellations.
- Current: upcoming shoots in 7/30 days, drafts missing details, incomplete assignments and outstanding tasks.
- Calendar/list: show each shoot directly, with time, service, location and crew/assignee.
- Drill-down: open the exact booking; preserve filter context when returning.
- Keep the payment panel consistent across booking tabs.

Do not treat booking creation date, confirmation date and shoot date as interchangeable.

## 4. Production, deliverables and delivery

Normal physical-product sequence:

```text
shoot_completed -> awaiting_selection -> editing -> photos_delivered
-> edited_selected -> printing -> received
-> handed_over OR shipped -> delivered
```

Display labels:

| Stage | Label |
| --- | --- |
| `awaiting_selection` | Photos shared for customer selection |
| `editing` | Customer photos selected |
| `photos_delivered` | Edited photos shared |
| `edited_selected` | Customer selected edited photos |
| `printing` | Shared for printing |
| `received` | Printing received |
| `handed_over` | Handed over to customer |
| `shipped` | Couriered to customer |
| `delivered` | Delivered |

Digital-only orders finish their production path at edited photos shared. Physical items require printing and customer handover/courier steps. Legacy stages remain readable; use current workflow helpers to determine valid next actions.

Track workflow assignee, editing deadline, printing house/reference, expected print/studio/dispatch/delivery dates, courier tracking, blocker and next action. Workflow changes retain attributed history and support corrections/reopening.

Deliverables save name/specifications, digital/physical kind, quantity, category and row amount. Categories are included, extra and complimentary. Existing booking snapshots must not change merely because the catalog changes.

Handover, dispatch and customer receipt are distinct. A saved URL, copied message or shipment does not prove customer receipt.

### Customer page

- Owner creates a private link with 180-day validity; replacement revokes the old link and disabling removes access.
- Copying a link does not send it.
- Delivery links require explicit publication of selected saved gallery/edited URLs.
- Customers see the published snapshot, not later internal URL edits, until republished.
- RAW links, finance, internal notes and staff records are excluded.
- Draft access is rejected; cancellation hides delivery links.

### Dashboard recommendations

- Current production board by stage, with individual bookings visible.
- Overdue editing and delivery queues, missing deadlines and blockers.
- Ready for handover/dispatch, shipped awaiting delivery, delivered awaiting publication.
- Show the exact next valid action, not a generic change-status control.
- Distinguish production editing deadlines from customer-page expected delivery dates; do not merge similarly named dates without a defined rule.

## 5. Internal notes and follow-ups

Bookings support multiple editable/pinnable notes and multiple tasks. Tasks have title, due date, details, optional assignee and optional source-note link. Staff can reschedule, complete, cancel or reopen tasks. Closure outcomes and change history remain visible.

The booking summary exposes pending count and earliest pending follow-up. New/changed due dates must be future dates. Existing overdue dates can remain when another field is edited. Assignees must be active when newly assigned. Revision checks reject stale edits.

These records do not automatically send customer messages or create reminder jobs. An operational due queue should not imply that notifications were delivered.

Recommended queue: overdue first, then due today, with task, booking, owner, due time and explicit complete/reschedule actions. Cancellation should be red and completion green, with accessible text/focus states.

## 6. Pricing and collections

```text
Final agreed total = agreed base amount + sum(extra deliverable row amounts)
Amount paid        = sum(recorded payment amounts)
Balance due        = final agreed total - amount paid
```

Extra row amount is a row total: the current helper does not multiply it by quantity. The base agreement may already include a discount. Do not subtract the booking discount again.

Supported booking discounts: INR 0, 500, 1,000 or 1,500. Positive discounts require a valid final agreement. Supported CMS roles can apply these discounts. Arbitrary promotional-price overrides have separate owner/reason restrictions.

Package pricing modes: fixed price, starting-from and enquire. Campaigns support percentage/fixed discounts and package overrides. Saved booking pricing snapshots retain campaign revision/name/terms, base price, discount, sale price, agreement, adjustment and override reason.

| Payment state | Rule |
| --- | --- |
| Unpriced | Agreed total is null; do not convert this to zero |
| Unpaid | No collection against a positive priced balance |
| Partial | Some collection with a positive remaining balance |
| Paid | Collection equals the agreement, including zero-value agreements |
| Overpaid | Collection exceeds agreement |

Payments store positive amount, paid date, method, reference and note. Methods: cash, UPI, bank transfer, card, other. Dedicated payment add/edit/delete endpoints require owner access. Creation/conversion also has advance-payment fields; verify their write-path permissions separately rather than assuming the dedicated-payment guard covers every path.

Records can be edited and deleted. This is not an immutable accounting ledger, and recording a payment does not establish bank reconciliation or provider verification.

## 7. Finance metric dictionary: existing backend behavior

| Metric | Exact business basis | Scope/caveat |
| --- | --- | --- |
| Payments received | Sum payments with `paidAt` in selected period | Includes payments on draft/cancelled bookings |
| Payment transactions | Count those payment rows | Not unique customers/bookings |
| Booked revenue | Sum current agreed totals using `confirmedAt`, falling back to `createdAt` | Excludes current draft/cancelled status and null totals |
| Shoot value | Sum current agreed totals by `bookingDate` in period | Excludes draft/cancelled and null totals; not proof shoot occurred |
| Confirmed bookings in finance | Count eligible priced rows used for booked revenue | Not every confirmed booking |
| Average booking value | Booked revenue / qualifying priced count | Backend rounds to whole rupees |
| Outstanding now | Sum positive agreement minus lifetime payments | All dates, all non-cancelled statuses, including drafts |
| Overdue now | Positive outstanding with due date before today | All dates; due today is not overdue |
| Salary spend | Sum salary transactions by transaction date in period | All supported salary types |
| Net cash after salary | Period payments received minus salary spend | Not profit |
| Collection rate | Period payments / period booked revenue x 100 | Different booking cohorts; can exceed 100%; backend returns 0 when denominator is zero |
| Average payment received | Period payments / payment row count | Not average booking value |

Current payment-state counts exclude cancelled bookings but include drafts. Unpriced rows appear in data-quality counts rather than the paid/partial/unpaid/overpaid breakdown.

Finance also returns payment and salary trends, top shoot types by booked revenue, recent payments, overdue balances and data-quality warnings. Current implementation limits recent payments to 10, overdue detail rows to 20 and shoot-type revenue rows to 8; these lists are not complete totals.

Trend grouping: daily for ranges up to 31 days, weekly for 32–120 days, monthly beyond 120 days. Period comparisons use a preceding equal-length period. Percentage change can be null when the previous value is zero; display an appropriate unavailable/new label rather than infinity.

### Staff payments

Salary transaction fields: staff account, amount, transaction date, salary month, type, payment method, optional booking link, note and creator. Types: weekly, monthly, shoot, advance, bonus, other. Methods include cash, bank transfer, UPI, cheque and other. Amounts are rounded to two decimals. New assignments require active staff.

Salary summaries break down by employee, type and month. A salary payment linked to a booking does not establish complete booking cost or margin.

## 8. Finance caveats to make visible

1. Net cash after salary excludes rent, printing, travel, equipment and other expenses. Never label it profit.
2. Collection rate mixes collections from any booking with agreements confirmed in the period. Do not label it cohort collection efficiency.
3. Historical reports aggregate current editable booking/payment records. Price changes, cancellations and payment corrections can change past reports.
4. Cancellation does not record a refund. Cancelled booking payments remain in collection totals while cancelled balances are omitted from outstanding.
5. Outstanding includes drafts; booked revenue excludes drafts. State this in tooltips or separate draft commitments if a new aggregate is implemented.
6. Unpriced is not free and not zero outstanding. Keep it a separate data-quality category.
7. Source review did not find dedicated refund, tax/GST, invoice or general-expense modules. Treat these as unimplemented/unverified capabilities, not available widgets.
8. Financial report values are operational aggregates, not a complete profit-and-loss statement or bank balance.

## 9. Role boundaries

| Role | Default access relevant to dashboards |
| --- | --- |
| Owner | Full operations, owner reports, payments and administration |
| Sales | Manage enquiries, bookings and schedule; no owner finance dashboard or dedicated payment management |
| Content Manager | Manage bookings, view enquiries; no owner finance dashboard or dedicated payment management |
| Employee | Separate employee portal; no CMS booking/enquiry dashboard |

Owner, Sales and Content Manager can view booking pricing. Supported overrides can alter permissions within role restrictions. Content Manager enquiry management is not enabled by default. Salary access uses its own guards; employees can view their own salary through employee endpoints.

Enforce restrictions in the API and UI. A frontend role check alone is not sufficient. Never expose a full owner-report response merely to hide its financial cards on screen.

## 10. Suggested dashboard structure

### Owner overview

1. Date range, India-time indicator, last generated time and previous-period comparison.
2. Period cards: collections, booked revenue, enquiries received and confirmations with precise definitions.
3. Separate current-position cards: outstanding, overdue balances, overdue delivery and follow-ups.
4. Collections trend and enquiry-source breakdown.
5. Upcoming shoots and production attention queues.
6. Data-quality panel: unpriced, missing due dates and overpayments.

### Enquiry dashboard

Pipeline distribution, source/service breakdown, untouched leads, due follow-ups and call-action queue. Preserve list filters and provide direct record navigation. Do not display unsupported acquisition cost, ROAS or marketing ROI without spend data.

### Booking/production dashboard

Upcoming shoots, individual shoot schedule, production stages, deadline queues, blockers, crew/assignee visibility and delivery status. Payment and production badges remain independent. Bulk updates need eligibility review, exclusions, per-record results and retries for failures only.

### Finance dashboard

Period collections, booked revenue, shoot value, salary spend and net cash after salary; a separately labelled current receivables section; overdue customer table; recent payments; payment-state and data-quality breakdowns. Preserve overpayments instead of silently clamping all balances to zero.

### Interaction and presentation requirements

- Every KPI states its date basis and scope in a subtitle or tooltip.
- KPI drill-down must reproduce the same filter and cohort. Add a backend filter if existing list routes cannot do this accurately.
- Use sample values only in labelled prototypes.
- Format INR consistently; preserve calculation precision and avoid premature rounding.
- Distinguish loading, empty, failed and stale states; never present an API failure as zero.
- Support mobile cards and desktop tables, keyboard access and text labels alongside status colors.
- Booking/enquiry forms use centered modals. Focused crew or due-date actions open a small dedicated modal.
- Avoid grouping shoots in ways that hide individual work.

## 11. Existing integration and source map

Paths below are relative to each repository. API routes are shown with the usual `/api` prefix; frontend clients use paths relative to their configured API base.

### Existing report endpoints

| Route | Purpose/access |
| --- | --- |
| `GET /api/admin/reports/owner-overview?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` | Owner overview including finance, comparisons, enquiries, bookings, campaigns and attention |
| `GET /api/admin/reports/weekly` | Owner weekly report |
| `GET /api/admin/reports/sales` | Owner campaign reporting; inspect DTO for filters |
| `GET /api/admin/reports/sales/:id/bookings` | Owner campaign booking drill-down |
| `GET /api/admin/delivery-queue` | Owner delivery queue |
| `GET /api/admin/salary/transactions` | Salary transaction listing, salary permission guard |
| `GET /api/admin/salary/summary` | Salary summary, salary permission guard |

FinanceReportService is embedded in the owner overview; do not assume a standalone finance endpoint exists. Other proposed dashboard filters/aggregates require contract verification.

### Frontend: `doll-pics`

- `src/admin/pages/OwnerOverviewPage.tsx`: existing owner dashboard.
- `src/admin/api/reports.ts`: owner report client.
- `src/admin/pages/EnquiryDetailPage.tsx`, `WorkEnquiriesPage.tsx`: enquiry workflow.
- `src/admin/pages/BookingsPage.tsx`, `BookingDetailPage.tsx`: booking workspace.
- `src/admin/pages/SchedulePage.tsx`, `PostShootTrackingPage.tsx`: execution views.
- `src/admin/access/roles.ts`: role catalog and effective access.
- `src/shared/types/index.ts`: core enquiry/booking/payment fields.
- `src/shared/types/sales.ts`: campaign pricing and reporting types.
- `src/shared/orderWorkflow.ts`: stage labels and valid next actions.
- `src/shared/deliverables.ts`: deliverables and extra-total calculations.
- `docs/enquiry-workflow.md`, `docs/booking-notes-follow-ups.md`, `docs/customer-booking-page.md`: detailed operational rules.

### Backend: sibling `photography-cms-backend`

- `src/work/owner-overview-report.service.ts`: owner report cohorts, comparisons and attention counts.
- `src/work/finance-report.service.ts`: exact financial aggregations.
- `src/work/reports.controller.ts`: owner report access.
- `src/enquiries/enquiries.service.ts`: lead transitions, calls, notes and duplicate checks.
- `src/bookings/bookings.service.ts`: booking creation/conversion, pricing, payments and transitions.
- `src/bookings/bookings.controller.ts`: endpoint guards, including owner-only payment mutations.
- `src/bookings/booking-discount.ts`: allowed discounts.
- `src/bookings/order-workflow.ts`, `order-workflow.service.ts`, `record-workflow.ts`: production and milestone behavior.
- `src/bookings/booking-workspace.service.ts`: notes and follow-up persistence.
- `src/bookings/customer-booking.service.ts`, `delivery-queue.service.ts`: publication and delivery queues.
- `src/sales/sale-pricing.ts`, `sales-report.service.ts`: campaign agreement/report behavior.
- `src/salary/salary.service.ts`, `salary.controller.ts`: salary records, summaries and access.

## 12. Expected output from Claude

Produce a responsive dashboard proposal covering owner overview, enquiries, booking/production and finance. For each widget specify the business question, metric formula, date basis, filters, drill-down and role access. Separate existing API-backed widgets from widgets requiring backend additions.

Include representative loading/empty/error states, sample data clearly marked as such, and a list of unresolved business decisions. Preserve the existing semantics above unless proposing an explicit change for review. Do not introduce profit, refunds, invoicing, tax, marketing ROI or verified customer receipt without the supporting business records.
