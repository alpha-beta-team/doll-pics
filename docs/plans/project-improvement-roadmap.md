# Doll Pictures improvement roadmap

Created: 2026-09-05
Status: Enquiry email verification completed (user confirmed 2026-09-05). Release checks repaired and locally verified; pull-request CI added, hosted run pending. Remaining workstreams pending.

## Objective

Improve enquiry reliability, marketing measurement, customer conversion, and maintainability across the Doll Pictures website and studio operations system. Preserve the existing booking, quotation, staff, attendance, and salary workflows.

Repositories:

- Frontend: `doll-pics` (this repository).
- Backend: `../photography-cms-backend`.

This document captures the priorities from the project investigation and the email work completed later in the conversation. A local change, a passing test, deployment, and live verification are separate milestones. Earlier audit findings must be rechecked before changing their implementation.

## Priorities and progress

| Priority | Workstream | Status | Expected outcome |
| --- | --- | --- | --- |
| 1 | Reliable enquiry notifications | Completed; email verification confirmed by user on 2026-09-05 | Studio receives enquiry alerts without email errors breaking saved enquiries |
| 2 | Dependable release checks | Local checks pass; PR CI and isolated browser smoke suite added | Relevant checks pass before changes are released |
| 3 | Marketing attribution and analytics | Planned | Campaigns can be connected to enquiries and bookings |
| 4 | CMS failure handling | Planned | Partial content failures do not unnecessarily degrade the whole site |
| 5 | Public HTML rendering | Planned | Important page content is available in the initial HTML |
| 6 | Admin scalability and maintainability | Planned | Lists remain usable as records grow; changes are easier to review |
| 7 | Customer conversion and mobile experience | Experiments planned after measurement repair | Visitors can understand the offer and enquire with less friction |

## 1. Reliable enquiry notifications

### Completed in this conversation

- Replaced the backend mail stub with Resend sending.
- Confirmed `dollpictures.in` domain verification in the user's Resend screenshot.
- Configured studio recipient `dollpictures2025@gmail.com` and sender `Doll Pictures <notifications@dollpictures.in>`.
- Added escaped HTML, plain text, optional customer Reply-To, a bounded send attempt, and provider idempotency keyed by saved enquiry ID.
- Contained email failures so they do not fail the already-saved enquiry or block the following WhatsApp call.
- Confirmed initial live delivery to the Gmail Inbox from the user's screenshot.
- Subsequently added a branded design and changed the CTA to **Open enquiry details**, targeting `https://dollpictures.in/admin/enquiries/{enquiryId}`.

### Acceptance checks — completed

- [x] Deploy the latest email template and enquiry CTA changes.
- [x] Verify the new layout in Gmail on desktop and mobile.
- [x] Verify the button opens the matching enquiry for an authorised user; check the sign-in return path when signed out.
- [x] Check the current mail regression coverage; the earlier mail test file was absent during the later template review.

Completion confirmed by the user on 2026-09-05. These checks were not independently rerun in this update.

### Reliability follow-up

Failed emails currently have sanitised logs but no durable retry queue. Provider acceptance is not proof of inbox delivery. Design a persistent outbox, bounded retries, provider delivery/bounce tracking, and resend controls as a later increment if operational evidence warrants it. Do not describe the current implementation as guaranteed delivery.

Detailed implementation plan: [Resend enquiry notifications](../../../photography-cms-backend/docs/plans/resend-enquiry-notifications.md).

## 2. Restore dependable release checks — implemented locally

### Fresh baseline from this roadmap task

| Command | Result |
| --- | --- |
| `npm run typecheck` | Failed: booking test fixture permits an undefined `source` |
| `npm run test:lib` | 15 passed |
| `npm run test:admin` | 72 passed, 6 failed |
| `npm run test:seo` | 15 passed, 1 failed |

The initial investigation also found no lint errors and a passing production SEO smoke check for 32 canonical URLs. Those two checks were not rerun for this document and are not fresh evidence.

### Implementation sequence

1. Repair the incomplete booking fixture in `src/admin/bookingList.spec.ts`, using an empty source for an unrecorded value. Preserve the mapper's existing legacy-data normalisation.
2. Trace the failing role and navigation expectations against the current route configuration, backend permissions, and intended access rules. Update stale expectations where justified; do not expand permissions or restore removed screens just to make tests pass.
3. Repair the social-proof test's missing `teamMembers` import using the current content model. Preserve checks against fabricated reviews, staff, or statistics.
4. Run typecheck, library/admin/SEO tests, lint, and the frontend build. Run focused backend checks for any cross-service change.
5. Add a pull-request workflow using `npm ci` and the checks above. Use documented static CMS fallback for deterministic frontend builds without production credentials. Keep the existing production SEO monitor.
6. Add a small browser smoke suite for enquiry submission, enquiry-to-booking conversion, and role visibility using isolated test fixtures. Keep production writes out of CI.

### Acceptance

- [x] The refreshed failures have explicit resolutions tied to intended behaviour.
- [ ] Relevant checks pass locally and in pull-request CI.
- [x] No protected pricing/phone permissions change as a side effect.
- [x] Build success is reported separately from browser and production verification.

### Release-check implementation — 2026-09-05

- Added the missing empty `source` to the booking test fixture; legacy mapper behaviour is unchanged.
- Updated stale role tests to the current Content Manager contract: manage bookings, view enquiries, no default website access. Services and Site Settings have independent route permissions. Added pricing/phone restriction and navigation override checks without changing permissions.
- Updated the social-proof test to assert the current empty `staffProfiles` fallback.
- Fixed the booking edit payload's unused destructured variable by copying the payload and deleting `enquiryId`, preserving the existing exclusion.
- Added `check:release`, tooling/browser typechecks, and `.github/workflows/release-checks.yml` with `npm ci`, static fallback build, and Chromium smoke tests. The production SEO monitor remains separate.
- Added isolated browser coverage for public enquiry submission, owner enquiry conversion, and Content Manager visibility. Requests outside the local test origin are blocked; API responses are fixtures.

Local results: typechecks passed; library **15/15**, admin **81/81**, SEO **16/16**; lint **0 errors, 7 existing warnings**; production build passed and prerendered **33 files using static JSON fallback**; Chromium smoke tests **3/3**. See README for reproducible commands.

Hosted PR CI has not run in this session. No deployment or live CMS/backend/customer delivery verification was performed. Browser tests validate the frontend against mocked API contracts. Existing hook/fast-refresh warnings and build size/tooling warnings remain separate follow-up work.

## 3. Connect marketing to bookings

Current gap from the audit: public enquiries default to the `website` source and do not retain campaign attribution. GA4/Meta events already exist; the page tracker waits for interaction or 20 seconds, which can exclude short non-interactive visits.

### Planned changes

- Capture landing path, referrer origin, and allowlisted UTM campaign fields when the visitor arrives. Store first-touch attribution for the browser session; bound lengths and omit arbitrary URL query strings.
- Keep attribution separate from the existing manually selected lead source. A website submission remains a website lead, with campaign metadata alongside it.
- Add optional attribution fields to the backend DTO/schema and frontend payload; preserve them when an enquiry becomes a booking. Existing records remain unrecorded, without guessed backfills.
- Rework analytics activation so measurement does not depend on interaction or a 20-second wait. Retain deduplication, private-route exclusions, and any applicable consent behaviour.
- Extend existing reports with campaign enquiry counts, linked confirmed bookings, and clearly defined revenue totals. Do not interpret a WhatsApp click as a confirmed enquiry or sale.

### Acceptance

- [ ] A tagged landing visit retains attribution after navigation and form submission.
- [ ] The linked booking retains the same attribution.
- [ ] Unattributed visitors and legacy records still work.
- [ ] Analytics receives no customer names, email addresses, phone numbers, messages, or private quotation tokens.
- [ ] Short visits and SPA navigation are measured without duplicate page views.
- [ ] Report totals reconcile to the enquiry and booking records under the selected date definition.

Deploy optional backend support first, then frontend capture, then reporting. Define reporting date/revenue semantics before implementing the report extension.

## 4. Improve CMS failure handling

Audit entrypoints: `src/contexts/SiteDataContext.tsx` and `src/lib/api.ts`.

- Separate critical site-content, hero, and category outcomes so successful responses remain usable when another request fails.
- Add bounded GET request timeouts and cancellation. Allow one bounded retry for transient public GET failures; do not apply automatic retries to enquiry POST requests.
- Retain appropriate built-in/build-time fallback data without replacing successful CMS content with empty arrays.
- Expose useful diagnostic categories without logging sensitive payloads.
- Preserve route-aware deferred loading and the shared initial hero asset used by HTML, preload, and React.

Acceptance: exercise individual endpoint failures, timeouts, full outage, navigation during loading, and recovery. Verify usable navigation/content, no permanent loading state, and no duplicate enquiry submissions.

## 5. Render meaningful public HTML

Audit finding: the existing prerender script produces metadata and `noscript` content while leaving the React root empty. Preserve its existing sitemap, canonical, and genuine-404 behaviour.

- Pilot real static React rendering on one high-value service landing page before broad rollout.
- Share a build-time content snapshot between initial HTML and client hydration to avoid mismatches or duplicate initial content.
- Render service descriptions, selected work, package information where applicable, and enquiry actions into visible HTML.
- Keep admin, employee, kiosk, and private quotation routes out of public static content generation.
- Expand to the remaining service/package pages and homepage only after the pilot passes.
- Preserve CMS publication/rebuild behaviour and deterministic outage fallback.

Acceptance: meaningful content is visible without JavaScript; hydration has no warnings; navigation and enquiry forms work after hydration; metadata, sitemap, and 404 checks pass; no private content is exported.

Choose the smallest compatible static-rendering approach after tracing browser-only hooks and data providers. This roadmap does not authorise an unbounded framework migration.

## 6. Scale admin lists and simplify large pages

- Measure actual list response sizes, row counts, and query timings before selecting performance targets.
- Add an optional paginated backend contract, retaining compatibility with existing consumers during rollout.
- Move filtering/search and ordering to the backend for the paginated UI. Use stable ordering with an ID tie-breaker.
- Keep dashboard/report aggregates independent of the currently visible page so totals do not become page-local.
- Add or adjust indexes only after inspecting the exact filters and query plans; audit before applying changes to production.
- Extract forms, data access, and workflow logic from large admin pages incrementally during relevant feature work, avoiding a bulk rewrite.

Acceptance: no duplicates or omissions between pages; filtering and totals are correct; access masking remains intact; representative large datasets meet the measured performance budget.

## 7. Customer conversion and mobile experiments

Start after attribution and analytics are reliable. These are hypotheses, not confirmed conversion gains.

- Compare the current primary action with **Check availability** and explain what happens after submission.
- Test a shorter initial form: name, phone, shoot type, and optional date; collect remaining details during follow-up. Maintain consent fields where needed.
- Place genuine galleries, package inclusions, delivery timelines, and relevant customer feedback near each service enquiry action.
- Check the 760px-minimum homepage hero on short mobile screens; adjust only after visual inspection establishes the issue.
- Verify keyboard access, focus, contrast, reduced motion, and touch target behaviour across forms and modals.
- Record mobile performance before and after changes on the same deployed build. Track real-user LCP, INP, and CLS; do not infer speed improvements from source changes alone.

Acceptance: report form starts/completions, qualified enquiries, linked bookings, and mobile performance. Retain experiments only when the evidence supports them; low traffic may require sequential observation rather than a formal A/B test.

## Execution and release policy

1. Email CTA/live-layout checks are complete (user confirmed); confirm the first hosted release-check CI run.
2. Complete priority 2 before introducing broader behaviour changes.
3. Repair attribution/analytics, then improve CMS resilience.
4. Pilot public HTML rendering and introduce admin pagination as separate increments.
5. Run customer conversion experiments using the repaired measurement.

For each increment, record changed behaviour, focused checks, known limitations, deployment status, and live acceptance evidence here. Keep changes independently reviewable and reversible. Do not send test emails, notify customers, or mutate production records as part of an automated test suite.

## Immediate work queue

- [x] Capture the ordered roadmap and refresh the release-check baseline.
- [x] Repair the booking test fixture and identify each stale role/navigation expectation.
- [x] Repair the social-proof test against the current content model.
- [x] Run the full frontend release checks and add pull-request CI.
- [ ] Confirm the first hosted pull-request CI run passes.
- [x] Verify the latest enquiry email CTA and design after backend deployment (user confirmed 2026-09-05).
