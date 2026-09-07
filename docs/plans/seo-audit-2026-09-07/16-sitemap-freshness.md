# F16 — Extend trustworthy sitemap modification dates

**Audit ID:** F16  
**Priority:** Low  
**Effort:** Medium (2–4 days across frontend/CMS)  
**Status:** Not started  
**Responsible role:** Frontend and CMS engineers  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Sitemap dates reflect actual material changes to the intended published pages.

## Current evidence

- [`scripts/lib/seo-build.ts:133`](../../../scripts/lib/seo-build.ts#L133) — Package contentUpdatedAt can populate lastmodByPath.
- [`scripts/lib/seo-build.ts:174`](../../../scripts/lib/seo-build.ts#L174) — Service contentUpdatedAt can populate lastmodByPath.
- [`scripts/lib/sitemap.mjs:19`](../../../scripts/lib/sitemap.mjs#L19) — Serializer excludes absent, invalid and future dates.
- [`scripts/prerender.ts:550`](../../../scripts/prerender.ts#L550) — The final sitemap is generated from the catalog and date map.

The audited existing dist sitemap had zero lastmod elements. Other content-family date mappings are incomplete; production/backend revision state was not established.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep missing dates when there is no trustworthy source. Never stamp every URL with build time, infer dates from file access time, or mutate historical data. Backend investigation is future remediation, not this documentation task.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F06](./06-cms-release-readiness.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [06-sitemap-lastmod](../seo/06-sitemap-lastmod.md)
- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)

## Ordered checklist

- [ ] Trace service/package content revisions through backend public responses, frontend loading and rebuild/deploy hooks.
- [ ] Define material-change ownership for home, gallery/work, About/Stories and static/legal content before adding dates.
- [ ] Propagate only affected published route timestamps; account for shared content that materially changes several destinations.
- [ ] Cover no-op saves, ordering-only changes, drafts, publish/unpublish, image/content changes and invalid/future dates.
- [ ] Verify required shared-page timestamps are affected deliberately; retain stable dates on unrelated pages.
- [ ] Prove a controlled QA edit/rebuild and record a later approved deployed verification without rewriting old exports.

## Acceptance criteria

- [ ] Dates advance for material changes and remain stable for unrelated/no-op changes.
- [ ] Invalid/future dates are omitted and unpublished/private paths are excluded.
- [ ] Content revisions reach the final deployed sitemap after the intended rebuild.
- [ ] Routes without authoritative revision data omit lastmod rather than invent it.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Compare before/after sitemap XML for one controlled change, including the expected affected and unaffected route sets.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Backend source/API and deployed hooks require verification. Do not run a CMS production edit without content authorization; use QA first.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Omit incorrect lastmod values or restore the prior sitemap generator; preserve canonical URL coverage and original data.

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

