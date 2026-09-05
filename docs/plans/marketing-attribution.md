# Campaign attribution and reporting

Implemented locally on 2026-09-05 across `doll-pics` and `photography-cms-backend`.
Deployment and live analytics-provider verification remain pending.

## Contract

Public enquiry requests can include optional `attribution` with `landingPath`,
`referrerOrigin`, and `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
`utm_term`. The frontend captures the first public landing before React mounts,
keeps it in sessionStorage for the tab session, and uses an in-memory fallback
when storage is unavailable. An untagged landing is still the first touch: later
campaign links in that session do not overwrite it. Private landings do not count.

Paths are limited to 300 characters, referrer origins to 200, and each campaign
label to 100. Campaign labels accept ASCII letters, digits, spaces, `.`, `_`, `~`,
and `-`; email/URL/query fragments, oversized labels, and eight consecutive digits
are omitted. Paths contain slug characters only; unusual public paths become
`/other`. Arbitrary queries, fragments, and private quotation tokens are omitted.
Do not put customer information in campaign labels.

The backend validates optional nested metadata, stores an explicit subdocument
without an extra ID, and copies saved attribution during transactional enquiry
conversion. Booking requests and edits cannot replace this attribution. The
manually selected lead source is independent; public enquiries remain `website`.
Old records stay without attribution; there is no guessed backfill.

## Owner report semantics

`GET /admin/reports/owner-overview` adds `campaigns`, grouped by source, medium,
and campaign. The existing owner-only route guard also protects these totals.
The frontend tolerates an older backend response without this field.

- Date range: enquiries created from the selected start date at 00:00 Asia/Kolkata
  up to, but excluding, 00:00 after the selected end date.
- Enquiry count: all enquiry stages in that creation cohort.
- Booking count: linked bookings currently `confirmed`, `shoot_completed`, or
  `delivered`, regardless of confirmation date. Drafts/cancellations are excluded.
- Agreed booking value: current agreed totals of those linked bookings, in INR.
  This is not payments received, profit, or finance-report period revenue.
- Unpriced bookings: qualifying linked bookings with absent/null agreed totals;
  they contribute to counts but not value. A recorded zero price is priced.
- `Not recorded`: no captured attribution, including legacy/manual enquiries.
  `Untagged`: a captured visit with no source/medium/campaign tags. Neither means
  a guessed campaign or a confirmed direct visit.

The cohort can change value as bookings are confirmed, repriced, or cancelled.
Totals include every campaign row and reconcile to matching enquiry/booking
records. WhatsApp clicks never increment enquiry or booking counts.

## Analytics behavior and rollout requirements

Application page views fire on route mount without interaction or a 20-second
wait, deduped by public pathname. Query-only changes are not extra page views.
GA gets explicit query-free page URLs, referrer origins, bounded campaign fields,
and a fixed public page title. The GA disable property also blocks sending from
private routes, retaining a separately set opt-out value.

Meta automatic configuration is disabled. Its SDK is suppressed for URLs or
referrers with private paths, arbitrary query parameters, or fragments, since it
reads document URLs itself. This deliberately reduces Meta coverage for those
visits; GA application events still use sanitized context. A loaded Meta SDK is
suspended on excluded routes and resumed on eligible public navigation. There
was no existing consent UI in the inspected application; enquiry WhatsApp opt-in
is unchanged and is not used as analytics consent.

Before release, review the GA4 web stream and Google tag settings: disable
browser-history automatic page views and other enhanced automatic measurements
that duplicate manual events or collect unfiltered URLs/form/link data. Also
verify Meta automatic event/advanced matching settings. Provider configuration
has not been inspected or changed by this implementation.

References: [GA configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config),
[GA privacy controls](https://developers.google.com/tag-platform/security/guides/privacy),
[enhanced measurement settings](https://support.google.com/analytics/answer/9216061),
[Meta's official tag template](https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel/blob/main/template.tpl).

## Validation and deployment

Local automated tests use synthetic data, intercepted browser APIs/provider
scripts, and a temporary MongoDB replica set. They send no real email, WhatsApp,
Telegram, calendar, or analytics-provider events. Provider queue checks establish
application behavior, not provider delivery or production configuration.

1. Deploy backend optional DTO/schema/conversion/report support first. No data
   migration or production index mutation is included. Inspect report query timing
   on representative data before choosing any additional indexes.
2. Verify the owner report endpoint, then deploy the frontend capture/tracker/UI.
   The campaign table appears only when the backend returns campaign data.
3. In an isolated QA environment, submit a tagged landing after navigating to a
   second page, convert it, and compare both saved attribution objects.
4. Reconcile campaign enquiries/bookings/value against database records using the
   above date/status semantics. Check legacy, untagged, unpriced, and cancelled cases.
5. Using QA analytics properties, verify a short non-interactive visit, SPA
   navigation, query-only navigation, and private routes in actual network traffic
   and provider tools. Confirm no duplicate views, customer data, or quotation tokens.
6. Only then record live acceptance in the roadmap. Do not create production test
   enquiries or send customer notifications as part of automated checks.

Frontend: `npm run check:release` with empty `VITE_API_URL` and `API_URL`,
`SEO_REQUIRE_CMS=false`, then `npm run test:browser` (Node.js 22).
Backend: `node --test -r ts-node/register src/work/campaign-report.spec.ts src/bookings/bookings.service.spec.ts`
and `npm run build` (Node.js 22). The MongoDB test downloads a test binary on first
run and launches an ephemeral local replica set; it never uses an environment DB URL.
