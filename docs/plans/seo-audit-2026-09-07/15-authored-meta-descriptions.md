# F15 — Preserve authored metadata descriptions

**Audit ID:** F15  
**Priority:** Low  
**Effort:** Small (1–3 hours)  
**Status:** Not started  
**Responsible role:** Frontend engineer and content reviewer  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Published descriptions retain approved meaning in initial and runtime metadata.

## Current evidence

- [`src/lib/seo-core.ts:144`](../../../src/lib/seo-core.ts#L144) — Descriptions are clipped to 160 characters.
- [`src/lib/seo-core.ts:146`](../../../src/lib/seo-core.ts#L146) — Three paths have fixed overrides for long authored descriptions.
- [`scripts/lib/seo-build.ts:195`](../../../scripts/lib/seo-build.ts#L195) — Resolved metadata uniqueness checks already exist.
- [`src/lib/seo-core.spec.ts:22`](../../../src/lib/seo-core.spec.ts#L22) — Current tests codify long-description replacement behavior.

Audit catalog titles/descriptions were unique. The defect is loss of authored meaning, not a universal requirement to keep descriptions below 160 characters.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Use authored trimmed values when present, retain existing missing-value fallbacks and uniqueness checks, and replace length enforcement with editorial guidance. Do not automatically rewrite CMS content.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [07-title-brand-strategy](../seo/07-title-brand-strategy.md)

## Ordered checklist

- [ ] Remove path-specific long-description substitutions and automatic truncation from the shared resolver.
- [ ] Retain whitespace cleanup and existing missing-content fallback at the appropriate resolver boundary.
- [ ] Change length handling to a review warning without treating 160 characters as a crawler limit.
- [ ] Update tests to assert exact authored content survives at short/long lengths, including formerly overridden paths.
- [ ] Check build/runtime parity and safely escaped metadata with quotes, ampersands and non-ASCII text.
- [ ] Ask the content owner to review any descriptions that are inaccurate independently of length.

## Acceptance criteria

- [ ] Long valid authored descriptions are not replaced or clipped by code.
- [ ] Missing descriptions retain meaningful fallback; duplicate/empty catalog validation remains effective.
- [ ] Initial HTML, runtime meta and social descriptions agree with resolved content.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:lib
npm run test:seo
npm run typecheck
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Compare representative CMS values with deployed initial and rendered metadata.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Google may rewrite/truncate displayed snippets. Search Console/search appearance is follow-up and cannot guarantee verbatim descriptions.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Restore the prior resolver only if metadata validity regresses; retain approved CMS values and avoid overwriting them.

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

