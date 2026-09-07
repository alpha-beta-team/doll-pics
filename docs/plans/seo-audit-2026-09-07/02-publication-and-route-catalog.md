# F02 — Unify publication state and public route catalogs

**Audit ID:** F02  
**Priority:** High  
**Effort:** Medium (2–4 developer days)  
**Status:** Not started  
**Responsible role:** Frontend engineer with CMS engineer  
**Assigned owner:** Unassigned  
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Navigation, HTML output, sitemap, runtime routing and schema use the same intended public destinations.

## Current evidence

- [`src/lib/seo-core.ts:377`](../../../src/lib/seo-core.ts#L377) — Static service/package entries are added regardless of an authoritative published list.
- [`scripts/lib/seo-build.ts:126`](../../../scripts/lib/seo-build.ts#L126) — Build mapping requires an explicit package path.
- [`src/lib/navigation.ts:200`](../../../src/lib/navigation.ts#L200) — Browser normalization can derive package paths from a slug.
- [`src/pages/LandingResolver.tsx:41`](../../../src/pages/LandingResolver.tsx#L41) — Static entries independently authorize service/package rendering.

Audit probes retained an unlisted static service and produced /custom-packages-erode in the browser path mapper while the build omitted the same slug-only category.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep intentional outage fallback. Distinguish a failed/unavailable CMS response from a successful empty response. Do not change authentication, opaque quotation tokens, historical CMS data or publication records.

## Dependencies and related plans

**Prerequisites:** [F01](./01-work-route.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [ ] Define one shared normalized public catalog and explicit source availability for services and packages.
- [ ] When CMS loading succeeds, use its published records as the authoritative public list; an empty list stays empty.
- [ ] When CMS loading fails, preserve the existing static fallback policy and expose fallback provenance for F06.
- [ ] Apply the same slug-derived package path and custom-path rules in build and browser; reject collisions with core/private routes.
- [ ] Use the shared catalog for landing resolution, navigation, sitemap, emitted files and service catalogs; retire stale static outputs during fresh builds.
- [ ] Keep genuinely retired URLs out of the sitemap and return 404 unless an explicitly approved replacement redirect exists.
- [ ] Add coverage for publish/unpublish/delete, all-unpublished and empty lists, malformed/unavailable data, slug-only/custom paths and collisions.

## Acceptance criteria

- [ ] Successful CMS unpublishing cannot leave the same static fallback page indexable.
- [ ] Slug-only published categories have identical browser links, generated files and canonicals.
- [ ] Every intended public catalog entry resolves; private, conflicting and unpublished entries are excluded.
- [ ] Offline fallback still works and is distinguishable from CMS-backed output.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:lib
npm run test:seo
npm run test:browser
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Crawl the candidate sitemap and compare its set with the approved published catalog; verify unlisted routes and replacement redirects.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Verify backend public endpoint publication semantics before changing frontend assumptions. Exercise lifecycle changes in QA fixtures or an approved QA CMS; no production record edits are implied.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert catalog consumers together to the prior verified release; retain publication data and any approved permanent redirects.

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

