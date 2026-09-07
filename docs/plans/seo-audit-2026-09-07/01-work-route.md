# F01 — Restore the /work route

**Audit ID:** F01  
**Priority:** High  
**Effort:** Small (1–3 hours)  
**Status:** Not started  
**Responsible role:** Frontend engineer  
**Assigned owner:** Unassigned  
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

The advertised portfolio URL renders its intended page and remains consistently indexable.

## Current evidence

- [`src/lib/navigation.ts:19`](../../../src/lib/navigation.ts#L19) — The section map includes gallery, services and booking, but omits /work.
- [`src/lib/sectionComponents.tsx:12`](../../../src/lib/sectionComponents.tsx#L12) — The existing work section component can be reused.
- [`src/pages/LandingResolver.tsx:41`](../../../src/pages/LandingResolver.tsx#L41) — Unrecognized landing paths resolve to NotFound.
- [`src/components/sections/Footer.tsx:17`](../../../src/components/sections/Footer.tsx#L17) — The footer still links Portfolio to /work.

The audit browser probe displayed Page Not Found with noindex, nofollow at /work; the static catalog and sitemap still include it. This is local evidence, not a fresh production result.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Restore the existing work section; do not add a navbar item, remove portfolio history, or silently redirect to a different destination.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)

## Ordered checklist

- [ ] Confirm the current /work catalog entry, sitemap entry and incoming footer/service links.
- [ ] Add '/work': 'work' to PATH_TO_SECTION so SECTION_PATHS registers it independently of NAV_LINKS.
- [ ] Reuse FeaturedWork and SectionPageIntro; retain the existing title, description and self-canonical.
- [ ] Add a browser regression for direct entry and footer navigation, including robots after React settles.
- [ ] Check normal unknown URLs still render NotFound; run the focused routing/SEO checks.

## Acceptance criteria

- [ ] Direct entry and SPA navigation display Featured Work rather than NotFound.
- [ ] The rendered main has one meaningful H1, the expected title and index, follow.
- [ ] Canonical and sitemap retain https://dollpictures.in/work; no extra navbar item appears.

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

Inspect the deployed /work response, rendered DOM, footer link and an unknown URL; record HTTP status, commit and canonical.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Use Search Console URL Inspection to examine any previous error/noindex state. Record it separately; recrawl/index recovery is follow-up, not a prerequisite for accepting the code fix.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Restore the previous focused route change if unrelated routing regresses; do not delete portfolio content.

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

