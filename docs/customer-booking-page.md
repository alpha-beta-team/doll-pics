# Private customer booking page

The owner opens **Bookings → booking → Customer → Customer page**. Confirm the
booking, save an optional expected delivery date and customer-facing note, then
create and copy the private link. Copying never sends a message. Share manually
with the customer. Anyone holding the link can view the permitted details.

Links expire 180 days after creation. **Replace link** immediately invalidates the
old link and starts a fresh 180-day period; **Disable link** removes access.
Existing bookings have no customer link until the owner creates one. A cancelled
booking displays cancellation details without delivery links. Draft bookings
cannot be accessed even if a link was created before a status correction.

## Delivery publication

Save gallery/edited-photo URLs in the existing Delivery editor and mark the
booking delivered. In Customer page, select the links and choose **Publish selected
links** after reviewing the displayed URLs. The customer sees that published
snapshot, not subsequent edits to internal URLs. **Republish** explicitly replaces
the snapshot; **Unpublish links** removes it. RAW URLs, delivery notes, internal
notes, financial details and staff records are never returned by the customer API.
The preview uses the same presentation component as the live customer page and
shows only saved updates and the published snapshot.

The booking status remains the source of progress: confirmed, shoot completed
(preparing delivery), delivered. No separate editing workflow or automated
messages are introduced. Refresh/reopen loads current data; failed refreshes hide
previous details rather than presenting them as current.

## Backend contract

All routes below are under `/api`:

| Method | Route | Access |
| --- | --- | --- |
| GET/PATCH | `/admin/bookings/:id/customer-page` | Owner |
| POST/DELETE | `/admin/bookings/:id/customer-page/link` | Owner |
| POST/DELETE | `/admin/bookings/:id/customer-page/delivery` | Owner |
| GET | `/customer-bookings/:token` | Private link |

PATCH accepts `expectedDeliveryDate` (date-only or empty) and `update` (plain text,
maximum 2000 characters). Delivery POST accepts required booleans `gallery` and
`edited`, selecting current saved HTTPS URLs. Owner GET includes preview, source
URLs, link token and expiry; tokens are excluded from ordinary booking queries
and responses. The customer response uses an explicit field allowlist. Invalid,
expired, revoked and unknown tokens receive the same 404 message. Existing global
API throttling applies. Mutations use optimistic concurrency and record actor/time.

## Deployment and pilot

1. Deploy the matching `photography-cms-backend` changes first. From that checkout,
   using the intended database environment, run:

   ```sh
   npx ts-node src/scripts/sync-customer-booking-index.ts
   npx ts-node src/scripts/sync-customer-booking-index.ts --apply
   ```

   The first command only inspects. The second adds the partial unique token index
   if missing; neither drops indexes nor enrolls customers. Do not run against an
   unintended database. No data backfill is required.

2. Deploy the frontend. Vercel and Netlify configurations serve
   `/customer-booking/:token` from the private app shell with `private, no-store`,
   `no-referrer`, and `noindex, nofollow`. The API also applies these headers to
   success and error responses. Customer routes are excluded from analytics,
   attribution, public path normalization, sitemap and service-worker caching.

3. Use a synthetic booking to verify direct navigation on the deployed host,
   mobile layout, actual response headers, saved updates, selected link publication,
   expiry/replacement/revocation, and rejection of a non-owner management request.
   Never include real access links/tokens in public logs or QA screenshots.

4. Manually share a real link only after the pilot passes. Evaluate customer
   feedback and the change in booking-status enquiries; no page-view tracking is
   added. Local tests and builds do not establish hosting behavior or deployment.

If rollback is needed, revoke pilot links and restore the prior frontend. Optional
booking fields and the token index are additive and compatible with existing records.


## Local validation

Use Node.js 22. From the frontend run `npm run test:customer-booking` and
`VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release`.
From the backend run `node --test -r ts-node/register src/bookings/customer-booking.spec.ts`
and `npm run build`. The access/publication suite uses an isolated in-memory MongoDB
and a test-only JWT signing strategy with the actual JWT and owner guards.
It never reads application credentials or writes application databases.


## Owner delivery queue

Open **Bookings & Sales → Delivery Queue** (`/admin/delivery`). Owner access is
required in the frontend and API (`GET /api/admin/delivery-queue`). The queue has
server-side pagination (20 bookings), no customer access tokens or financial data,
and the following filters:

- **Awaiting delivery:** `shoot_completed` bookings, including those without dates.
- **Due this week:** completed shoots whose expected delivery date falls between
  Monday and Sunday of the current week in Asia/Kolkata. This can overlap Overdue.
- **Overdue:** completed shoots with a nonempty expected date before today in India;
  a booking due today is not overdue. Owner Home uses the same rule and links here.
- **Delivered:** delivered bookings, including those still needing link publication.

Expected delivery dates use the existing customer-page field; no backfill or
second date is introduced. Dates sort earliest first, with missing dates last.
**Update / publish** opens owner controls to assign an active staff account as the
editor, set the expected date, save a customer update, or publish/unpublish links.
The internal editor assignment is separate from the shoot assignee and never
appears on the customer page. Historical editor names remain visible if a staff
account is later disabled; choose another active editor or clear the assignment.

**Mark delivered** reuses the existing booking delivery operation and requires a
saved delivery link. It opens publishing controls afterward; status changes never
publish a gallery automatically. Existing booking event handling remains in place.

The index helper above now also verifies/applies the compound
`{ status: 1, 'customerPage.expectedDeliveryDate': 1 }` index. Deploy the backend and
index before the frontend. The Owner Home card is hidden when an older backend
omits its new `overdueDeliveries` field.

Run `npm run test:delivery-queue` for deadline labels and owner-only navigation.
The backend `src/bookings/delivery-queue.spec.ts` suite exercises real MongoDB
aggregation, calendar boundaries, pagination, Owner Home count parity, and the
existing delivery transition without automatic publication.
