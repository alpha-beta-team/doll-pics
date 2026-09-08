# F09 — Restore About page heading structure

**Audit ID:** F09  
**Priority:** Medium  
**Effort:** Small (1–2 hours)  
**Status:** Not started  
**Responsible role:** Frontend engineer with content reviewer  
**Assigned owner:** Unassigned  
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

About has a meaningful primary heading and a coherent accessible outline.

## Current evidence

- [`src/pages/About.tsx:20`](../../../src/pages/About.tsx#L20) — About main renders section components without a page heading.
- [`src/components/about/OurStory.tsx:20`](../../../src/components/about/OurStory.tsx#L20) — The first visible section starts with an H2.
- [`src/components/about/MeetTheTeam.tsx:23`](../../../src/components/about/MeetTheTeam.tsx#L23) — Team section heading is H2; names use H3.
- [`src/pages/Contact.tsx:150`](../../../src/pages/Contact.tsx#L150) — Contact has a promotional H1; it is not a missing-H1 defect.

The generated noscript About H1 does not supply an H1 to the JavaScript-enabled component tree.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Use 'About Doll Pictures and our Erode studio' as the default H1. Retain H2 subsections/H3 people names. Do not rewrite home/contact brand copy without content review or claim exact-match headings guarantee rankings.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [10-accessibility-page-experience](../seo/10-accessibility-page-experience.md)
- [07-title-brand-strategy](../seo/07-title-brand-strategy.md)

## Ordered checklist

- [ ] Insert the descriptive About H1 inside main before OurStory using current public styling.
- [ ] Preserve one primary H1 regardless of missing team/process CMS content.
- [ ] Inspect headings on representative public page families and fix only confirmed outline defects within this issue.
- [ ] Verify heading visibility with observer/reduced-motion states and mobile layout.
- [ ] Record home/contact wording as optional editorial review rather than a mandatory keyword substitution.

## Acceptance criteria

- [ ] JavaScript-enabled About has exactly one visible meaningful H1.
- [ ] Subsection and team-name levels remain H2/H3.
- [ ] Heading remains readable at 390px and 1440px without horizontal overflow or duplicate fallback content.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run typecheck
npm run test:browser
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect deployed About heading outline and layout with populated/empty optional content.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Screen-reader heading navigation requires manual review; ranking changes are not acceptance criteria.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert the isolated heading/layout change if spacing regresses; preserve existing content.

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

