# F05 — Make no-JavaScript fallbacks readable

**Audit ID:** F05  
**Priority:** Medium  
**Effort:** Small (under 1 hour plus checks)  
**Status:** Not started  
**Responsible role:** Frontend engineer  
**Assigned owner:** Unassigned  
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Fallback text and links are readable without JavaScript on public and error pages.

## Current evidence

- [`scripts/prerender.ts:416`](../../../scripts/prerender.ts#L416) — Normal fallback main uses color:#111 without a background.
- [`scripts/prerender.ts:482`](../../../scripts/prerender.ts#L482) — 404 fallback repeats the color-only treatment.
- [`src/index.css:9`](../../../src/index.css#L9) — Default dark tokens give the page a very dark background.

The audit inspected home/About artifacts with JavaScript disabled: text rgb(17,17,17), transparent main, and body rgb(5,5,8).

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Apply a shared explicit foreground/background treatment to generated fallbacks; preserve branded React layouts and the working hero-loading behavior.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [10-accessibility-page-experience](../seo/10-accessibility-page-experience.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [ ] Create a shared fallback class with explicit dark text on white, readable link color and visible focus.
- [ ] Use it in both normal and 404 fallback generators; retain headings and crawlable links.
- [ ] Check homepage poster layering when a CMS hero exists so the fallback is not obscured.
- [ ] Inspect home, About, a package, a fallback service and 404 with JavaScript disabled at mobile and desktop widths.
- [ ] Verify the hydrated versions and the three already rendered services remain unchanged.

## Acceptance criteria

- [ ] No-JS content is visible, selectable and readable; normal text meets 4.5:1 contrast and large text 3:1.
- [ ] Fallback links are recognizable and keyboard focus is visible.
- [ ] A generated hero poster cannot cover fallback copy; 404 fallback is equally usable.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
npm run test:html
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Disable JavaScript against deployed representative routes; record foreground/background values and screenshots without customer information.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Manual visual/keyboard review is required; passing HTML-presence checks alone is insufficient.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert only the fallback styling/generator change if presentation regresses; keep functional route metadata.

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

