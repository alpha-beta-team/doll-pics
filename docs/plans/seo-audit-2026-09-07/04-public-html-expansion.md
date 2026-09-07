# F04 — Expand public HTML rendering incrementally

**Audit ID:** F04  
**Priority:** High  
**Effort:** Large (1–3 weeks in increments)  
**Status:** Not started  
**Responsible role:** Frontend engineer with content reviewer  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority public routes deliver substantive content in normal initial HTML and retain working hydration.

## Current evidence

- [`src/lib/publicHtmlRoutes.ts:2`](../../../src/lib/publicHtmlRoutes.ts#L2) — Only newborn, wedding and maternity are registered for rendered public HTML.
- [`src/entry-public-server.tsx:13`](../../../src/entry-public-server.tsx#L13) — The existing server entry renders the shared React page.
- [`scripts/prerender.ts:503`](../../../scripts/prerender.ts#L503) — Build rendering is restricted to the registered services.
- [`src/main.tsx:43`](../../../src/main.tsx#L43) — Valid snapshots hydrate; other pages use client mounting.

The audited existing dist contained three populated public roots and 29 empty roots. Those artifact counts are baseline observations, not proof of deployed coverage.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Reuse React 18, Vite and existing components. No framework migration, request-time server, crawler-specific output or private-route prerendering. Omit unavailable media rather than borrowing unrelated work.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md), [F05](./05-noscript-contrast.md), [F06](./06-cms-release-readiness.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [public-html-rendering](../public-html-rendering.md)
- [public-html-service-expansion](../public-html-service-expansion.md)

## Ordered checklist

- [ ] Generalize route renderer and snapshot selection beyond a ServicePage-only assumption; preserve route/version validation and public field allowlists.
- [ ] Render the homepage first, including meaningful heading, approved media, contact and service discovery links.
- [ ] Render /services and /packages hubs next using the authoritative public catalog.
- [ ] Render package-category pages next, beginning with wedding and newborn, then the remaining intended published package routes.
- [ ] Render the other intended published services and the gallery's initial content; then work/about/stories/contact and legal pages using their existing components.
- [ ] Release each page family separately; disable observer-only hiding in initial HTML and match the first browser render to its snapshot.
- [ ] Exercise light/dark preference restoration, malformed snapshots, stale assets, independent CMS/media failures and route transitions.
- [ ] Prove a controlled QA content change reaches generated HTML and hydrated content after rebuild before expanding the next family.

## Acceptance criteria

- [ ] Each released family has meaningful heading, copy and crawlable links inside #root without JavaScript.
- [ ] Initial and hydrated content agree with the approved catalog and available CMS content.
- [ ] Enquiry interactions work with mocked submissions; no hydration mismatches or private snapshot leakage occur.
- [ ] Each increment has recorded preview and production acceptance before the next family expands.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
npm run typecheck
npm run test:html
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Run both smoke tools against each released candidate and production; extend validators as route coverage expands. Record commit, deployment, source provenance and served entry asset.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Inspect representative URLs in Search Console after release. Google indexing and ranking observations are separate from HTML/hydration acceptance.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Roll back the affected route-family deployment or registry increment to the previous verified build; preserve earlier proven families and source data.

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

