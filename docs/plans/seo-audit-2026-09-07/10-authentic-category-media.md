# F10 — Use authentic and category-relevant portfolio media

**Audit ID:** F10  
**Priority:** Medium  
**Effort:** Medium (1–2 developer days plus editorial review)  
**Status:** Not started  
**Responsible role:** Frontend engineer and studio content owner  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Public portfolio claims use approved original work and matching service/category imagery.

## Current evidence

- [`src/data/content.ts:34`](../../../src/data/content.ts#L34) — Pexels featured records have session-like titles, locations and years.
- [`src/contexts/SiteDataContext.tsx:390`](../../../src/contexts/SiteDataContext.tsx#L390) — Featured and gallery loading can restore fallback work.
- [`src/lib/serviceImages.ts:57`](../../../src/lib/serviceImages.ts#L57) — General gallery images are pooled without category filtering.
- [`src/pages/PackageCategoryPage.tsx:84`](../../../src/pages/PackageCategoryPage.tsx#L84) — Package pages consume the pooled selector.
- [`src/lib/serviceDiscovery.ts:29`](../../../src/lib/serviceDiscovery.ts#L29) — Current service previews already reject known missing defaults.

The audit confirms fallback paths and category-selection risks, not that every live photograph is incorrect. Preserve the existing filename cleanup and service-preview fixes.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

No mass deletion, renaming or historical export changes. Require content-owner approval for original assets and attribution. Do not claim stock photos were shot by the studio; preserve existing valid URLs.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [02-authentic-media](../seo/02-authentic-media.md)
- [04-social-proof-cleanup](../seo/04-social-proof-cleanup.md)
- [service-page-content-cms](../service-page-content-cms.md)

## Ordered checklist

- [ ] Inventory active featured, contact, package and non-rendered fallback media paths; distinguish originals, illustrations and unavailable assets.
- [ ] Create a content-owner review list for authenticity, category, alt/caption, location, year and publication permission.
- [ ] Replace misleading portfolio fallback with approved original media or an honest empty state; do not fabricate replacements.
- [ ] Filter package imagery by normalized category slugs rather than append the unfiltered general gallery.
- [ ] Remove false authorship from any retained illustrative fallback; audit non-rendered noscript image output too.
- [ ] Keep authored alt text and descriptive category fallback; check meaningful captions on priority images.
- [ ] Cover populated, empty, failed and partially available CMS states; inspect direct entry and navigation from home.

## Acceptance criteria

- [ ] Stock imagery is not presented as an actual Doll Pictures session.
- [ ] Package imagery cannot leak from unrelated categories.
- [ ] Unavailable original work has an honest usable state; approved real images remain accessible.
- [ ] Evidence identifies content approvals and any still-blocked asset needs.

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

Inspect priority galleries, contact and home with actual published media; verify image status, content type and service relevance.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Studio approval of identity, attribution and client publication permission is required before publishing new/replacement portfolio content.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Restore the previous approved content references if image delivery breaks; never restore misleading authorship or delete original media.

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

