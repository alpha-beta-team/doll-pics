# F09 — Restore About page heading structure

**Audit ID:** F09  
**Priority:** Medium  
**Effort:** Small (1–2 hours)  
**Status:** Complete\
**Responsible role:** Frontend engineer with content reviewer  
**Assigned owner:** Frontend engineer\
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

About has a meaningful primary heading and a coherent accessible outline.

## Audit baseline evidence

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

- [x] Insert the descriptive About H1 inside main before OurStory using current public styling.
- [x] Preserve one primary H1 regardless of missing team/process CMS content.
- [x] Inspect headings on representative public page families and fix only confirmed outline defects within this issue.
- [x] Verify heading visibility with observer/reduced-motion states and mobile layout.
- [x] Record home/contact wording as optional editorial review rather than a mandatory keyword substitution.

## Acceptance criteria

- [x] JavaScript-enabled About has exactly one visible meaningful H1.
- [x] Subsection and team-name levels remain H2/H3.
- [x] Heading remains readable at 390px and 1440px without horizontal overflow or duplicate fallback content.

## Verification

### Local

No spec files were added. Temporary Playwright checks used a local Vite server and mocked CMS responses.

```sh
npm run typecheck
npx eslint src/pages/About.tsx src/components/about/OurStory.tsx
```

- [x] Typecheck and focused lint passed. A full build was not repeated for this isolated heading/spacing change; the preceding F07 release checks passed.
- [x] Sixteen About browser cases passed: 390px/1440px, normal/reduced motion, normal/inactive observers, and populated/empty optional team/process content.
- [x] Each case has exactly one visible H1 inside main, before the H2 subsections, with no horizontal overflow or duplicate fallback DOM. Populated team names remain H3.
- [x] Home, Contact, package index, service and package-detail pages each retain one main H1. No additional outline defect was confirmed in these representative checks.
- [x] Recorded [local evidence](./evidence/f09-local-verification.json) and inspected [mobile](./evidence/f09-about-390.png) / [desktop](./evidence/f09-about-1440.png) screenshots.

### Deployment

Frontend engineer: deploy and inspect About at 390px and 1440px. Confirm one visible H1 and H2/H3 subsection/team structure with populated and empty optional content. No deployed verification was performed in this implementation turn.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Screen-reader heading navigation requires manual review; ranking changes are not acceptance criteria.

- [ ] Frontend/content reviewer: check screen-reader heading navigation after deployment. Local role/DOM checks do not replace a manual screen-reader review; ranking changes are not an acceptance criterion.

## Rollout and rollback

Revert the isolated heading/layout change if spacing regresses; preserve existing content.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Descriptive visible H1 before OurStory; reduced first-section top spacing preserves the visual rhythm |
| Local remediation validation | Passed | Typecheck, focused lint, 16 About cases, 5 representative heading checks and screenshot inspection |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Complete is used for implementation tracking, consistent with preceding items. Deployed and manual screen-reader checks remain follow-ups.

## Implemented behavior

The About main begins with **About Doll Pictures and our Erode studio**, using the existing public heading typography and container alignment. It is always rendered and has no reveal/observer classes or CMS dependencies. OurStory remains H2 and its top padding is reduced to avoid stacking the old section gap beneath the new header. Other subsection headings and team names keep their H2/H3 levels.

Home and Contact promotional wording is unchanged. Any editorial rewrite is optional and requires content review; an exact-match heading does not guarantee rankings.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

| 2026-09-08 | F09 implementation complete: descriptive About H1 and balanced first-section spacing | Typecheck, focused lint, 21 browser cases and mobile/desktop screenshot inspection passed; no specs added | Frontend/content reviewer: deployed layout and manual screen-reader navigation |
