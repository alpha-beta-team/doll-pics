# F11 — Provide crawlable discovery for intended photography

**Audit ID:** F11  
**Priority:** Medium  
**Effort:** Medium (2–4 developer days)  
**Status:** Not started  
**Responsible role:** Frontend/CMS engineer with content reviewer  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority approved photography has a normal HTML discovery path without requiring clicks to reveal its only reference.

## Current evidence

- [`src/pages/ServicePage.tsx:527`](../../../src/pages/ServicePage.tsx#L527) — Only six gallery images initially render before expansion.
- [`src/pages/ServicePage.tsx:692`](../../../src/pages/ServicePage.tsx#L692) — Show more is interaction-driven.
- [`src/components/gallery/GalleryPortfolio.tsx:28`](../../../src/components/gallery/GalleryPortfolio.tsx#L28) — The main gallery is capped at 100 photos.
- [`src/lib/api.ts:169`](../../../src/lib/api.ts#L169) — Current public photo query exposes featured, limit and category, not pagination.

The collection cap is a completeness defect only if the intended published collection exceeds it. Interactive lightboxes need not each become indexed pages.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep bounded responsive downloads and existing gallery interactions. Do not dump every original image into initial HTML or add empty/duplicate SEO pages. Treat image sitemap support as supplemental.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F04](./04-public-html-expansion.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [09-image-discovery](../seo/09-image-discovery.md)
- [08-shoot-case-studies](../seo/08-shoot-case-studies.md)

## Ordered checklist

- [ ] Inventory intended published images versus initial HTML discovery and document whether the 100-photo limit truncates the intended collection.
- [ ] Keep a curated representative gallery in each rendered public page and link to broader approved work.
- [ ] Use I01 session pages for substantive session-level discovery; do not make I01 a hard prerequisite for initial gallery improvement.
- [ ] If the measured collection exceeds the cap, add backend-supported stable pagination and real anchor destinations before changing the frontend query; document the contract in this file before coding that extension.
- [ ] Include only published approved originals in any supplemental image sitemap, associated with their canonical landing pages.
- [ ] Crawl without interaction, compare discovered URLs/images to the intended set and test pagination limits if introduced.

## Acceptance criteria

- [ ] Each priority image intended for search has an accessible HTML page reference or appropriate supplemental discovery entry.
- [ ] The first gallery view remains bounded and usable without JavaScript.
- [ ] Any intended collection beyond a cap has a verified discovery route; otherwise the cap is explicitly documented as non-blocking.
- [ ] No private, unpublished, broken or duplicate-canonical destinations enter discovery output.

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

Perform a no-interaction crawl and image-response sample on the deployed content set; verify any image sitemap independently.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Search Console image-search data and indexing are follow-up observations; client permission and approved collection scope come from the content owner.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Remove the new discovery links/sitemap entries if they reference incorrect content; retain approved canonical pages and media.

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

