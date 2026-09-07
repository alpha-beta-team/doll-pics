# F08 — Normalize known public canonical paths

**Audit ID:** F08  
**Priority:** Medium  
**Effort:** Small (2–4 hours)  
**Status:** Not started  
**Responsible role:** Frontend engineer  
**Assigned owner:** Unassigned  
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Known marketing URL variants resolve to one intended route and canonical.

## Current evidence

- [`src/pages/Site.tsx:78`](../../../src/pages/Site.tsx#L78) — Section selection uses a case-sensitive raw pathname.
- [`src/lib/seo-core.ts:136`](../../../src/lib/seo-core.ts#L136) — Current normalization only trims a trailing slash.
- [`src/lib/navigation.ts:19`](../../../src/lib/navigation.ts#L19) — Known section keys are lowercase.
- [`vercel.json:3`](../../../vercel.json#L3) — Hosting already declares clean URLs and no trailing slash.

The audit browser probe at /Services rendered homepage content with canonical https://dollpictures.in/Services.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Normalize through the public catalog only. Preserve opaque tokens, private identifiers and query values. Do not lowercase arbitrary unknown URLs or redirect every unknown path to home.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [07-title-brand-strategy](../seo/07-title-brand-strategy.md)

## Ordered checklist

- [ ] Resolve case/trailing-slash variants against the normalized public catalog from F02.
- [ ] Apply the same canonical pathname before page selection, metadata generation and internal link construction.
- [ ] Add hosting redirects for known public variants using the existing hosting mechanism; preserve query parameters.
- [ ] Use replace-style client navigation for known variants that enter through SPA navigation.
- [ ] Test /services and /Services, /work, a service, a package, trailing slashes, tracking parameters and unknown routes.
- [ ] Assert quotation tokens and other private identifiers remain unchanged.

## Acceptance criteria

- [ ] Known variants display the intended content and a lowercase canonical without query/fragment.
- [ ] Direct-host redirects and SPA transitions agree on destination.
- [ ] Unknown routes retain 404 behavior and private tokens remain byte-for-byte unchanged.

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

Check HTTP/www/slash/case chains on deployed known paths; ensure no loop and no unexpected loss of query parameters.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Search Console selected canonicals require external review; source configuration alone cannot prove consolidation.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert variant redirects and their resolver together if loops or private-route changes occur.

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

