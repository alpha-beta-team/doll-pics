# F07 — Clarify private, preview and error-page indexing

**Audit ID:** F07  
**Priority:** Medium  
**Effort:** Small (1–3 hours plus hosting checks)  
**Status:** Not started  
**Responsible role:** Frontend/release engineer  
**Assigned owner:** Unassigned  
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Private shells and error documents have deliberate initial indexing signals; preview behavior is verified.

## Current evidence

- [`vercel.json:12`](../../../vercel.json#L12) — Private routes rewrite to the public shell; admin has no matching HTTP noindex header.
- [`netlify.toml:23`](../../../netlify.toml#L23) — Alternate-host private rewrites and headers need equivalent review.
- [`src/admin/AdminApp.tsx:48`](../../../src/admin/AdminApp.tsx#L48) — Admin noindex is applied by a client effect.
- [`public/robots.txt:3`](../../../public/robots.txt#L3) — Slash-suffixed exclusions do not cover exact roots.
- [`scripts/prerender.ts:454`](../../../scripts/prerender.ts#L454) — 404 generation leaves homepage canonical/social/schema from the template.

The audit confirmed configuration gaps, not current private-data exposure or live preview indexability.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Preserve authentication and private data controls. No blanket noindex on production public pages. Never lowercase or log quotation tokens. Robots blocking is not an indexing-removal mechanism.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [ ] Add exact /admin and nested admin X-Robots-Tag noindex rules in Vercel and equivalent maintained Netlify rules.
- [ ] Verify exact/nested employee, kiosk and quotation behavior and ensure these URLs remain excluded from public catalogs.
- [ ] Clean generated 404 head: retain error title/description/noindex, remove homepage canonical and public-page JSON-LD, and remove misleading social URL/title values.
- [ ] Inspect preview-host protection or HTTP noindex in hosting configuration; document the verified mechanism.
- [ ] Check whether private shells are already indexed before changing robots policy; a crawler must be able to fetch a non-sensitive noindex response to observe it.
- [ ] Add response/config regressions for public indexability, private roots, nested routes and genuine 404.

## Acceptance criteria

- [ ] Exact/nested admin responses carry HTTP noindex before JavaScript runs.
- [ ] Public canonical routes remain indexable and unknown routes return genuine 404.
- [ ] 404 initial metadata does not describe or canonicalize to the homepage.
- [ ] Preview indexing controls have an evidence record or an explicit unresolved external gate.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect headers and initial HTML using synthetic, non-sensitive private paths and a random unknown public URL. Verify both maintained hosting targets when active.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Requires hosting access for preview configuration and Search Console for existing private-shell indexing. Never treat Disallow plus noindex as guaranteed removal.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert only affected hosting/header changes if public pages are blocked; restore the previous verified deployment and recheck public robots/canonicals immediately.

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

