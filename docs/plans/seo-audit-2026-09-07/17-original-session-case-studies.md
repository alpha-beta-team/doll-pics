# I01 — Publish original session case studies

**Audit ID:** I01  
**Priority:** Medium  
**Effort:** Large (initial 1–2 weeks plus editorial work)  
**Status:** Not started  
**Responsible role:** Studio content owner with frontend/CMS engineer  
**Assigned owner:** Unassigned  
**Chunk:** 4 — Content growth and ongoing verification  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Approved original shoots provide useful indexable evidence linked to relevant services and packages.

## Current evidence

- [`src/App.tsx:127`](../../../src/App.tsx#L127) — Current public route tree has core pages and generic service/package resolution, not session detail routes.
- [`src/pages/Stories.tsx:70`](../../../src/pages/Stories.tsx#L70) — Stories displays ClientReviews rather than individual session articles.
- [`src/data/sitemap-routes.json:1`](../../../src/data/sitemap-routes.json#L1) — Baseline sitemap has core, service and package destinations without session case studies.

This is a relevant content improvement, not a broken existing feature. No original client stories, venues or permissions may be inferred from stock fallback records.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep /stories as the reviews page. Use /journal and /journal/:slug for substantive session articles to avoid changing its intent. No thin city variants, invented clients or auto-generated testimonials.

## Dependencies and related plans

**Prerequisites:** [F04](./04-public-html-expansion.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [08-shoot-case-studies](../seo/08-shoot-case-studies.md)
- [02-authentic-media](../seo/02-authentic-media.md)

## Ordered checklist

- [ ] Select two real approved shoots: one wedding and one newborn session where permission and sufficient material exist.
- [ ] Collect factual session context, photography approach, preparation guidance, selected originals, descriptive alt/captions and related service/package links.
- [ ] Use the existing CMS workflow where feasible; document the minimum journal content contract before implementing authoring/routing.
- [ ] Create the /journal hub and stable lowercase hyphenated article slugs with unique metadata and self-canonicals.
- [ ] Render published article content and selected images in initial HTML using F04 infrastructure.
- [ ] Link articles from matching service/package pages and the journal hub; include only published articles in the sitemap.
- [ ] Add Article/Breadcrumb schema only when matching visible article fields; never invent author/date values.
- [ ] Review permissions, factual accuracy, readability, direct links and mobile/no-JS output before publishing.

## Acceptance criteria

- [ ] Two approved substantive original session articles are available with relevant media and factual context.
- [ ] Each has an incoming crawlable link, stable canonical, unique metadata and initial HTML.
- [ ] Drafts/private content are excluded; existing /stories review behavior remains intact.
- [ ] Publication approvals and any absent optional schema fields are recorded.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run typecheck
npm run test:seo
npm run test:browser
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Verify hub/detail direct requests, no-JS content, hydration, related links, sitemap and unknown/draft slugs.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Studio/client approval is a prerequisite for publication. Measure Search Console discovery later without promising rankings or impressions.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Unpublish the affected article and remove its discovery/sitemap entries if consent or facts are wrong; preserve source media and approved history.

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

