# F13 — Measure and improve public-page performance

**Audit ID:** F13  
**Priority:** Medium  
**Effort:** Medium (1–3 days after baseline)  
**Status:** In progress\
**Responsible role:** Frontend engineer  
**Assigned owner:** Frontend engineer (measurement increment)\
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
- [ ] Compression and caching assertions are based on deployed headers, not missing config assumptions.
- [ ] If baseline is healthy, a documented no-change conclusion satisfies the investigation rather than inventing optimization work.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run typecheck
npm run lint
# Use focused browser verification for any eventual code change; no spec files are added.
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect real transfer encodings/cache headers and rerun comparable lab samples against the deployed commit.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Requires Lighthouse/PSI and, where available, CrUX/Search Console data. Track good field targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75; missing field data is not a failure and improvement may need time to appear.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Restore the previous verified assets/deployment if image quality, interactions or measured performance regress; compare under the same conditions.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | In progress | Production lab baseline and diagnosis recorded; no application optimization in this increment |
| Local remediation validation | Pending | No application change to validate; before/after and interaction profiling remain pending |
| Preview/production acceptance | Baseline recorded; remediation pending | Deployed commit `85cbd29c60e3b92030b542a827c41ec96a38d309`; measurement is not acceptance of a future optimization |
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
