# I02 — Verify business identity and structured-data facts

**Audit ID:** I02  
**Priority:** Low  
**Effort:** Small–Medium (owner review plus focused updates)  
**Status:** Not started  
**Responsible role:** Studio owner/SEO reviewer with frontend engineer  
**Assigned owner:** Unassigned  
**Chunk:** 4 — Content growth and ongoing verification  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Visible business facts and applicable structured data match verified operations and official profiles.

## Current evidence

- [`src/data/business-identity.json:27`](../../../src/data/business-identity.json#L27) — Configured opening hours include overnight Friday/Saturday periods.
- [`src/data/business-identity.json:44`](../../../src/data/business-identity.json#L44) — Official profiles contain only the site URL and socials are empty.
- [`src/lib/businessIdentity.ts:33`](../../../src/lib/businessIdentity.ts#L33) — The site's own URL is excluded from sameAs.
- [`src/lib/seo-core.ts:501`](../../../src/lib/seo-core.ts#L501) — LocalBusiness includes identity, location, hours and services.
- [`src/lib/seo-core.ts:627`](../../../src/lib/seo-core.ts#L627) — FAQ schema exists alongside relevant service and page schema.

JSON-LD parsed in the audited artifacts. Unusual hours are not automatically invalid, and empty social profiles are not evidence that accounts exist. Prior completed NAP work is historical evidence, not permission to overwrite facts.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep the canonical identity source and distinct existing entities. No fabricated profiles, keyword-stuffed business names, irrelevant Product/SearchAction schema, or self-serving LocalBusiness review-star markup.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [03-business-identity-nap](../seo/03-business-identity-nap.md)
- [04-social-proof-cleanup](../seo/04-social-proof-cleanup.md)

## Ordered checklist

- [ ] Have the studio owner confirm name, address, map coordinates, phone/email, service areas and overnight opening hours.
- [ ] Compare approved facts with the website and controlled official business listings; record discrepancies with dates.
- [ ] Add only confirmed official profile URLs if they exist; keep sameAs absent when none are verified.
- [ ] Validate LocalBusiness, WebPage/WebSite, Service, breadcrumbs and FAQ relationships against visible content.
- [ ] Apply narrowly scoped factual corrections through the existing identity source only after confirmation; test template/build/runtime parity.
- [ ] Document FAQ and review rich-result eligibility limitations so future work does not promise unsupported results.

## Acceptance criteria

- [ ] Verified facts and any unresolved discrepancies have owner/evidence records.
- [ ] Applicable schema matches visible content and validates without confirmed errors.
- [ ] No invented profiles or irrelevant rich-result markup is introduced.
- [ ] Any required external profile changes are recorded separately with authorization and completion evidence.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
npm run test:lib
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Compare deployed identity/schema with the approved source and inspect representative public route JSON-LD.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Owner and official-profile verification plus Schema Markup Validator/Rich Results Test are required. Third-party profile edits are not authorized by creating this checklist.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert an incorrect factual change to the last verified identity; do not restore facts already confirmed wrong.

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

