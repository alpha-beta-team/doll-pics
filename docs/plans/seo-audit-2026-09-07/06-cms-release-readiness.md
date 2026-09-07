# F06 — Separate fallback coverage from CMS release readiness

**Audit ID:** F06  
**Priority:** Medium  
**Effort:** Medium (1–2 developer days)  
**Status:** Not started  
**Responsible role:** Frontend/release engineer  
**Assigned owner:** Unassigned  
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Release evidence distinguishes a complete offline fallback from current CMS-backed content.

## Current evidence

- [`scripts/lib/seo-build.ts:122`](../../../scripts/lib/seo-build.ts#L122) — Missing API configuration returns empty overlays.
- [`scripts/lib/seo-build.ts:146`](../../../scripts/lib/seo-build.ts#L146) — CMS errors are caught while static fallback remains available.
- [`scripts/prerender.ts:81`](../../../scripts/prerender.ts#L81) — SEO_REQUIRE_CMS runs required-route coverage validation.
- [`scripts/check-public-html-deployment.ts:151`](../../../scripts/check-public-html-deployment.ts#L151) — The existing HTML smoke supports --require-cms.
- [`README.md:133`](../../../README.md#L133) — README documents intentional static fallback during outages.

With SEO_REQUIRE_CMS=true and both CMS endpoints mocked as 503, the audit catalog still passed coverage with 32 static routes. This is not proof that intentional fallback should be removed.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep availability fallback and existing CI fixtures. Do not claim test:browser lacks public HTML coverage; its configuration includes that suite. Do not expose secrets or introduce production writes.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [public-html-rendering](../public-html-rendering.md)
- [cms-resilience](../cms-resilience.md)

## Ordered checklist

- [ ] Document separate coverage and content-readiness meanings; reconcile environment-example wording with actual outage behavior.
- [ ] Carry explicit per-source availability/provenance from the catalog through relevant build and snapshot validation.
- [ ] Retain non-strict local/offline checks; make CMS-backed candidate acceptance a separate required release check.
- [ ] Extend the existing --require-cms validator as published route coverage expands; check CMS-only routes and applicable content markers, not just route count.
- [ ] Cover missing configuration, malformed/empty responses, partial endpoint failure, stale fallback and complete successful responses.
- [ ] Record candidate commit, public origin, deployment ID and content comparison; demonstrate a QA edit/rebuild reaches both initial and hydrated content.

## Acceptance criteria

- [ ] A static-only build may pass fallback checks but cannot be reported as a CMS-verified release.
- [ ] Valid empty collections are distinguished from unavailable sources.
- [ ] Required CMS-only routes and content are checked without weakening canonical or private-route exclusions.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
npm run test:browser
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Run npm run seo:html-smoke -- --require-cms against the candidate and production, alongside seo:smoke. Record any route coverage the checker does not yet validate.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Hosting environment values and deploy-hook behavior require dashboard or deployed evidence. No current production readiness is assumed.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Keep the previous CMS-verified deployment if candidate readiness fails; do not disable production availability fallback to hide the distinction.

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

