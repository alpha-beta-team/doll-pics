# F13 — Measure and improve public-page performance

**Audit ID:** F13  
**Priority:** Medium  
**Effort:** Medium (1–3 days after baseline)  
**Status:** In progress\
**Responsible role:** Frontend engineer  
**Assigned owner:** Frontend engineer (measurement and Booking remediation)\
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Measured public loading and interaction bottlenecks improve without damaging photography, routing or enquiry behavior.

## Current evidence

- [`vite.config.ts:5`](../../../vite.config.ts#L5) — Build inlines CSS into HTML with CSS code splitting disabled.
- [`scripts/prerender.ts:173`](../../../scripts/prerender.ts#L173) — Admin styles are extracted before public documents are emitted.
- [`src/contexts/SiteDataContext.tsx:263`](../../../src/contexts/SiteDataContext.tsx#L263) — Route buckets determine generic CMS/media requests.
- [`src/components/SmoothScroll.tsx:50`](../../../src/components/SmoothScroll.tsx#L50) — Desktop smooth scrolling intercepts wheel input.
- [`src/pages/QuotationPage.tsx:70`](../../../src/pages/QuotationPage.tsx#L70) — PDF code is imported on demand rather than loaded in the public entry.

Existing artifact measurements: approximately 152 KB homepage style text and a 331 KiB public entry (100 KiB locally gzip-compressed). These are not wire measurements or current CWV results; large admin/PDF chunks are separately loaded.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Measure first. Do not remove features or change image quality solely to chase an aggregate score. Do not attribute private lazy chunks to initial public JS. No new analytics provider is required.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [05-hero-core-web-vitals](../seo/05-hero-core-web-vitals.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [x] Record commit, served asset, device/network settings and repeatable baseline for home, service, package, gallery and booking.
- [x] Run three comparable Lighthouse samples and record medians plus actual LCP element, TBT and layout-shift causes. (Mobile baseline; desktop and detailed interaction traces remain pending.)
- [ ] Inspect field LCP/INP/CLS where available and clearly separate origin fallback from URL data.
- [ ] Use CSS coverage and waterfall evidence to decide whether critical-only inline CSS plus a cached shared stylesheet improves the current tradeoff.
- [ ] Check hero preload/rendered-source agreement, responsive sizes, font requests, third-party work and duplicate generic/category media requests.
- [ ] Profile menu, gallery expansion, lightbox and enquiry interactions; change only demonstrated bottlenecks.
- [ ] Repeat identical comparisons after changes and record image/interaction/accessibility regression checks.

## Acceptance criteria

- [ ] Before/after evidence identifies a specific bottleneck and the measured effect of each change.
- [ ] No regression in image relevance/quality, layout stability or enquiry/navigation usability.
- [x] Compression and caching assertions are based on deployed headers, not missing config assumptions. (Baseline and 9 September Booking/entry response headers recorded.)
- [ ] If baseline is healthy, a documented no-change conclusion satisfies the investigation rather than inventing optimization work.

## Verification

### Local

The 10 September Booking discovery increment passed the release gate, CMS-strict fixture HTML smoke, controlled delayed-resource comparison, 16 snapshot/API checks, 8 build-state checks and 14 browser cases. [Evidence](./evidence/f13-booking-discovery-2026-09-10.json) separates local fixtures from the fresh production baseline.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
# Focused browser checks use temporary fixtures; no spec files added.
```

- [x] Record changed behavior, command outcomes, base commit and fixture/browser evidence for the Booking increments; broader experiments remain open.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect real transfer encodings/cache headers and rerun comparable lab samples against the deployed commit.

- [x] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target. (9 September production Booking comparison recorded; preview not checked in this increment; broader production acceptance remains open.)

### External

Requires Lighthouse/PSI and, where available, CrUX/Search Console data. Track good field targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75; missing field data is not a failure and improvement may need time to appear.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Restore the previous verified assets/deployment if image quality, interactions or measured performance regress; compare under the same conditions.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | In progress | Earlier Booking layout/priority fixes are deployed; initial background HTML and CMS snapshot reuse implemented locally on 10 September, pending deployment/comparison. Broader performance work remains open |
| Local remediation validation | Focused checks passed | Release gate, strict fixture HTML, 6 controlled runs, 16 snapshot/API cases, 8 build states and 14 browser cases including wraparound rotation; see 10 September evidence |
| Preview/production acceptance | New baseline recorded; discovery change not deployed | Three mobile samples on `527d2b1`: median LCP 5.35s (range 5.25–8.30s), CLS 0.00344, TBT 104ms, score 74. Background remains JS/CMS-discovered in that deployment. Repeat after deploying the new HTML increment |
| External checks | Pending | PSI API returned HTTP 429; CrUX URL/origin and Search Console field data remain unverified |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |


## Measurement increment — 8 September 2026

[Production baseline and prioritized experiments](./evidence/f13-production-baseline.md) · [Selected machine-readable Lighthouse evidence](./evidence/f13-production-baseline.json).

Fifteen retained serial mobile Lighthouse samples cover home, newborn service, wedding package, gallery and booking against deployed commit `85cbd29c60e3b92030b542a827c41ec96a38d309`. Eleven exploratory samples overlapping concurrent F04 build/browser work were excluded. The mobile medians show low TBT, significant LCP variability and a repeated booking layout shift (median CLS 0.629). Booking content insertion and its lazily loaded LCP background are the first controlled experiment; confirm causes with a trace before changing the shared component.

Deployed gzip, cache headers, actual public script requests, inline CSS coverage, hero preload/source agreement, font shifts and generic/category media requests are recorded. No application optimization was made, so there is no before/after improvement claim. Full interaction profiling, desktop comparisons and field data remain pending; PSI API returned HTTP 429. F13 remains **In progress**.

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-08 | Completed first production measurement and diagnosis increment | 3 mobile Lighthouse samples × 5 page families, deployed manifest/entry verification and response headers | Frontend engineer: trace booking shift and test one scoped improvement, then repeat measurements; site owner/SEO operator: obtain field reports when available |


## Booking remediation increment — 8 September 2026

[Controlled local before/after and interaction evidence](./evidence/f13-booking-local-verification.json).

A local browser experiment delayed both Booking lazy modules by 2 seconds and recorded `PerformanceObserver` layout-shift sources. Before the change, the `Suspense` boundary had a null fallback: the footer started at approximately 334 px on mobile and 321 px on desktop, then left the viewport when the 900 px CTA and FAQ arrived. The footer's individual shift contribution was 0.629 at 390×900 and 0.643 at 1440×900. This reproduces the footer source identified in the production baseline.

`Site.tsx` now supplies a Booking-only `min-h-screen` fallback matching the CTA's existing minimum height. Other section fallbacks remain unchanged. In the same delayed-module experiment, the footer started below the viewport and contributed no layout-shift entry at either width. Smaller unrelated font/other shifts remain. These are controlled local event measurements, not production CLS or a Lighthouse score comparison.

`BookingCTA.tsx` now marks the first active background `loading="eager"` and `fetchpriority="high"` only on `/booking`. The shared Gallery CTA remains lazy, as do subsequent backgrounds. Responsive sources, dimensions, image quality, rotation, copy and enquiry logic are preserved. The image still depends on the CMS response; this change does not establish an LCP improvement or eliminate that discovery dependency.

Validation completed:

- Local Chromium: before/after delayed lazy chunks at 390×900 and 1440×900, reduced motion, mocked CMS and blocked external requests; no horizontal overflow.
- Four Booking/Gallery viewport cases: expected first-image loading/priority, decorative alt and dimensions, enquiry opening and Escape closing. Booking query package prefill and FAQ expansion passed at both widths. No submissions or external writes.
- `npx eslint src/pages/Site.tsx src/components/sections/BookingCTA.tsx` passed. The parent's combined `check:release` also passed with these changes included (eight existing lint warnings and existing chunk warnings).

Reproduce the focused diagnosis by running Vite locally with mocked public API routes, intercepting the two Booking module requests for 2 seconds, recording `layout-shift` entries excluding `hadRecentInput`, and comparing the footer position before `#booking` mounts and after it becomes visible. The JSON retains the exact rectangles and entries. Production acceptance still requires three comparable Lighthouse samples against the deployed change; compare Booking LCP/CLS and actual background request discovery with the recorded baseline. Also check normal-motion background rotation, real images and enquiry behavior. Field CWV, broader interaction profiling and the remaining F13 experiments are still pending. F13 remains **In progress**.


## Booking production comparison — 9 September 2026

[Production comparison and next experiment](./evidence/f13-booking-production-2026-09-09.md) · [Selected Lighthouse evidence](./evidence/f13-booking-production-2026-09-09.json).

Live checks before/after three retained serial mobile Lighthouse runs identified deployed commit `90a068e4d4f53cc3415f9d56dacc03f1d0e73532` and entry `/assets/index-DyvfbbA_.js`. Lighthouse 12.8.2, host Chrome 152.0.0.0 and all configuration values match the baseline. Median Booking CLS fell from **0.62908 to 0.00344**, LCP from **8.62s to 7.07s**, TBT from **60ms to 32ms**, and score rose from **51 to 74**. The large footer shift is absent from all three reports; the remaining small shift is font-related.

The background is served eager/high priority as intended, but Lighthouse still finds it undiscoverable in initial HTML. Modeled load delay is 5.08–5.35s, following lazy JavaScript and the CMS background request. LCP remains slow. Other changes and uncontrolled network/host conditions exist between the two deployments, so these differences do not isolate the effect of image priority. The prior controlled local experiment supplies stronger causal evidence for the loading-space fix. Actual Booking HTML and public-entry GET headers confirm Brotli and the recorded cache policies.

Six production browser cases passed at 390×900 and 1440×900 with normal motion: Booking background rotation/priority, enquiry opening/Escape and FAQ; Gallery lazy background and enquiry controls; Booking package/category query prefill. Booking screenshots were inspected, no horizontal overflow was found, and no enquiries were submitted. Initial Gallery probe timeouts and the corrected wait-for-content approach are retained in the evidence. These focused checks do not complete wider interaction profiling or accessibility/image-quality acceptance.

This supersedes the earlier local-only/deployment-pending wording, while retaining the historical measurement and remediation records. F13 remains **In progress**, chunk 3 remains **1 / 7**, and overall implementation tracking remains **10 / 19**. Frontend engineer: next prepare a controlled earlier-image-discovery experiment through the existing public HTML/CMS flow, coordinate with active F04 changes, and compare against this new baseline. Desktop lab samples, broader profiling, CSS/media/font work and field data remain open.

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-09 | Verified deployed Booking fixes and recorded three comparable mobile samples | Stable deployed commit `90a068e`, matching Lighthouse settings; CLS 0.00344, LCP 7.07s; deployed response headers | Frontend engineer: address CMS/JS image discovery with a controlled experiment; retain broader and field acceptance as pending |


## Booking initial image discovery — 10 September 2026

[Production baseline and local verification](./evidence/f13-booking-discovery-2026-09-10.json).

Three serial Lighthouse 12.8.2 mobile samples on unchanged deployed commit `527d2b1cf98affccfb77b5b6accc11e487f18ed2` used Chrome 152 and exactly the same configuration as the prior baseline. Median LCP was **5.35s**, range **5.25–8.30s**; CLS **0.00344**, TBT **104ms**, FCP **2.11s**, and score **74**. All three identify the first Booking background as the LCP image and report that it is absent from initial HTML. The public `/booking-backgrounds` request still precedes its discovery. This refresh is a baseline for the next change, not evidence that the new code improved production; network/host variation remains uncontrolled.

### Implemented locally

`/booking` now uses the existing public HTML renderer and validated route snapshot. Its route module supplies eager CTA/FAQ components so server rendering emits the full section rather than a Suspense fallback. The build loads and projects public Booking backgrounds; the shared CTA uses those sources for its initial state and skips a redundant browser background request on this route. Only the first background is an initial HTML image, with the existing responsive `picture` sources and eager/high priority. Source quality, dimensions and rotation order are preserved. Later transitions, including the return to the first image, retain their fade; the first paint does not wait for an entrance animation.

Native `picture`/`source`/`img` discovery is used instead of adding a second preload definition. This keeps browser format/width selection in one place and avoids duplicate-format requests, consistent with [responsive image guidance](https://web.dev/articles/preload-responsive-images). Eager route sections also avoid [React's renderToString Suspense fallback limitation](https://react.dev/reference/react-dom/server/renderToString).

The snapshot is limited to Booking and rejects malformed, empty-source, cross-route and excluded-media data. Strict CMS builds reject an unavailable or malformed background endpoint; a valid empty collection remains valid. Optional builds render the gradient and recover through the existing browser request. Gallery keeps runtime loading and lazy/default image priority. Booking copy and native FAQ details remain visible without JavaScript, with telephone/WhatsApp links replacing inactive enquiry buttons. No backend write contract or image-quality setting changed.

### Evidence and limits

- Six controlled Chromium runs alternated the old committed build and new build using identical fixtures and photo bytes. With the entry script and Booking API each deliberately delayed **1.5 seconds**, median image-request start changed from **3094ms to 6ms**; the new route made **zero** background API requests and fetched the first image once. This demonstrates removal of those dependencies, not a production LCP improvement.
- The final release gate and CMS-strict local HTML smoke passed. Sixteen snapshot/HTML/API cases cover malformed and cross-route seeds, priority/source mismatch and the current real public API response shape.
- Eight build states cover publishing, reordered/edited covers, removal, empty data, excluded/duplicate photos, malformed data, strict failure and optional fallback.
- Fourteen browser cases cover 390/1440 px, no-JavaScript content/FAQ/contact links, Booking and Gallery loading/rotation, enquiry opening/Escape, query prefill, invalid snapshot fallback, unavailable-snapshot recovery and wraparound fading. No page/hydration errors or attempted CMS/enquiry writes were recorded in passing cases. Fixture photography was used; mobile no-JavaScript and desktop screenshots were visually reviewed.
- A Gallery probe initially ran before its CTA settled in view; waiting for the visible copy passed. This was a probe correction, not a Gallery code change. No spec files were added.

### Deployment and next comparison

CMS cover, publication and ordering changes require a successful frontend rebuild to refresh the initial Booking snapshot, matching the existing public HTML model. Deploy this increment with the existing production CMS environment, confirm its served commit, then run:

```sh
npm run seo:html-smoke -- --require-cms --base-url https://dollpictures.in
npm run seo:paths-smoke -- --base-url https://dollpictures.in
```

Repeat the three serial Lighthouse samples from the 9 September runbook with the same settings, compare against the **10 September baseline**, and review actual Booking/Gallery photography, rotation, query prefill and enquiry behavior. Do not submit real enquiries during verification. No deployment was performed in this increment. F13 remains **In progress** because the production comparison, broader desktop/interaction/CSS/route work and field CWV remain open.

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-10 | Refreshed production baseline and implemented first Booking image in initial HTML with snapshot reuse | 3 production samples; controlled request dependency removal; release/HTML, 16 snapshot, 8 build and 14 browser checks passed | Deploy and compare three equivalent production samples; retain broader/field work as pending |
