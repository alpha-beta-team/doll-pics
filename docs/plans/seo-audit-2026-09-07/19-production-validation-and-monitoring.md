# I03 — Record production SEO acceptance and ongoing monitoring

**Audit ID:** I03  
**Priority:** Medium  
**Effort:** Medium (1–2 days setup; ongoing review)  
**Status:** Not started  
**Responsible role:** Release engineer and SEO/analytics owner  
**Assigned owner:** Unassigned  
**Chunk:** 4 — Content growth and ongoing verification  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Each released chunk has traceable acceptance evidence and an owned process for detecting SEO regressions.

## Current evidence

- [`.github/workflows/seo-sitemap-monitor.yml:1`](../../../.github/workflows/seo-sitemap-monitor.yml#L1) — Scheduled sitemap/robots/404 monitoring already exists.
- [`.github/workflows/release-checks.yml:29`](../../../.github/workflows/release-checks.yml#L29) — Hosted workflow runs release and browser checks.
- [`playwright.config.ts:6`](../../../playwright.config.ts#L6) — The browser configuration includes the public HTML suite.
- [`scripts/check-seo-deployment.mjs:200`](../../../scripts/check-seo-deployment.mjs#L200) — Production smoke inspects sitemap destinations and baseline HTTP/HTML.
- [`scripts/check-public-html-deployment.ts:120`](../../../scripts/check-public-html-deployment.ts#L120) — HTML smoke checks rendered services, snapshots and route exclusions.

Earlier audit tests passed (38 SEO, 19 library, both TypeScript checks). Those historical local results do not establish current hosted CI, deployment, Search Console status or field CWV.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Monitoring setup and baseline collection can start immediately. Dependencies gate final program closure only. Do not treat missing field data as failure, ranking gains as release gates, or create real enquiries/notifications during tests.

## Dependencies and related plans

**Prerequisites:** [F01](./01-work-route.md), [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md), [F04](./04-public-html-expansion.md), [F05](./05-noscript-contrast.md), [F06](./06-cms-release-readiness.md), [F07](./07-private-preview-and-404-indexing.md), [F08](./08-canonical-path-normalization.md), [F09](./09-about-heading-and-semantics.md), [F10](./10-authentic-category-media.md), [F11](./11-image-discovery.md), [F12](./12-mobile-navigation-and-focus.md), [F13](./13-performance-and-core-web-vitals.md), [F14](./14-social-preview-metadata.md), [F15](./15-authored-meta-descriptions.md), [F16](./16-sitemap-freshness.md), [I01](./17-original-session-case-studies.md), [I02](./18-business-identity-and-schema-verification.md) These gate final closure, not initial monitoring setup.

Historical context (retain its original records; do not copy old statuses into this item):

- [README](../seo/README.md)
- [project-improvement-roadmap](../project-improvement-roadmap.md)
- [marketing-attribution](../marketing-attribution.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [ ] Create a dated evidence record keyed by commit/deployment and served asset; distinguish local, hosted CI, preview, production and external observations.
- [ ] Run relevant unit/type/browser checks and require the current hosted release checks for actual releases.
- [ ] Run both production smoke commands and verify each sitemap destination's HTTP status, initial/rendered metadata and canonical.
- [ ] Review private/preview/404 headers, redirects, no-JS content, images, hydration and mocked enquiry interactions.
- [ ] Inspect representative URLs and sitemap processing in Search Console; record selected canonicals and unresolved exclusions.
- [ ] Record comparable Lighthouse runs and available field LCP/INP/CLS; verify image/CDN compression/cache behavior.
- [ ] Validate social previews and applicable schema with external tools; perform mobile/keyboard/theme review.
- [ ] Verify existing analytics page/lead receipt through QA/test mechanisms; distinguish contact clicks from successful enquiries and bookings.
- [ ] Assign monitoring ownership and review cadence: smoke on release plus existing scheduled checks, monthly search/lead review, and investigation on alerts.
- [ ] Update master/child statuses together with evidence and explicit remaining external follow-ups.

## Acceptance criteria

- [ ] Every released chunk has a dated deployment/acceptance record or named blocker.
- [ ] All required technical and external checks have recorded outcomes; absent optional field data is documented.
- [ ] Monitoring owners, cadence and response procedure are recorded.
- [ ] No item is Complete solely because its plan or local test was completed; final program closure reconciles all 19 statuses.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run check:release
npm run test:browser
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Run npm run seo:smoke and npm run seo:html-smoke -- --require-cms. Record commit, deployment, assets and failures. Keep candidate and production evidence distinct.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Search Console, PSI/CrUX, schema/share validation, accessibility review and analytics receipts need appropriate access. Store sanitized evidence only, never credentials, customer data or token-bearing URLs.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Stop promotion or restore the previous verified deployment on incorrect content, hydration failure, public indexing blockage or routing regressions. Monitoring-only changes can be reverted without changing CMS data.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Not started | Plan only; no application changes made |
| Local remediation validation | Pending | Audit baseline is not proof of a future fix |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

