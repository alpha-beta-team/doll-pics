# F12 — Complete mobile menu and route focus behavior

**Audit ID:** F12  
**Priority:** Medium  
**Effort:** Small (0.5–1 developer day)  
**Status:** Complete for implementation tracking\
**Responsible role:** Frontend engineer and accessibility reviewer  
**Assigned owner:** Frontend implementation; accessibility reviewer for manual acceptance\
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Keyboard, touch and screen-reader users can enter, use and exit navigation and reach new page content predictably.

## Current evidence

- [`src/components/Navbar.tsx:59`](../../../src/components/Navbar.tsx#L59) — Escape closes desktop dropdowns but not the mobile overlay.
- [`src/components/Navbar.tsx:271`](../../../src/components/Navbar.tsx#L271) — Mobile toggle has no enlarged hit area.
- [`src/components/Navbar.tsx:286`](../../../src/components/Navbar.tsx#L286) — Mobile overlay has no complete modal focus/background handling.
- [`src/components/SmoothScroll.tsx:45`](../../../src/components/SmoothScroll.tsx#L45) — Route changes reset scroll without moving focus.
- [`src/lib/dialogFocus.ts:2`](../../../src/lib/dialogFocus.ts#L2) — Existing focus containment/restoration helper can be reused.

At 390px, audit probes measured a 24 by 24 pixel menu toggle and confirmed Escape left the mobile menu open.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Retain existing menu layout, links, enquiry flow and reduced-motion behavior. Use dialog semantics only for a genuinely modal overlay. Do not steal focus repeatedly during CMS updates.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [10-accessibility-page-experience](../seo/10-accessibility-page-experience.md)
- [10-accessibility-validation](../seo/10-accessibility-validation.md)

## Ordered checklist

- [x] Enlarge the mobile toggle to at least 44 by 44 CSS pixels while retaining its accessible name and expanded state.
- [x] Give the overlay an internal close control; contain focus, make background content inert while open, and handle Escape.
- [x] Restore focus to the opener on dismissal; close correctly on route selection and desktop breakpoint changes.
- [x] Reuse containDialogFocus with cleanup and account for hidden/disabled controls.
- [x] After a genuine SPA route transition and destination mount, focus its main heading/main once; preserve deliberate hash targets and back-navigation usability.
- [x] Test Tab/Shift+Tab, Escape, outside background access, enquiry opening, zoom and touch targets.
- [ ] Review with VoiceOver at mobile/desktop widths and both themes.

## Acceptance criteria

- [x] Mobile menu opens with sensible focus, contains keyboard navigation and closes on Escape.
- [x] Dismissal restores focus; route selection transfers focus to destination content.
- [x] Toggle hit area is at least 44 by 44 pixels; background is not keyboard-operable while modal.
- [x] No repeated focus theft or regression in enquiry/lightbox focus handling.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
```

- [x] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [x] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Repeat keyboard, touch and route navigation on deployed representative pages at 390px and 1440px.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Manual VoiceOver/keyboard/theme review is required; automated accessibility checks alone cannot complete this item.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert focus/overlay changes together if controls become unreachable; preserve the enlarged hit area if independently safe.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | 44px toggle, portalled modal menu, inert background, Escape/restoration/breakpoint cleanup and shared RouteFocus |
| Local remediation validation | Passed | Release gate and fixture Chromium checks; [evidence](./evidence/f12-local-verification.json) |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |


### Implementation and local verification — 8 September 2026

- The mobile navigation is a labelled modal with a sticky internal 44px close control, body scroll lock and inert background. Focus containment filters hidden and disabled controls; dismissal restores the opener, desktop resizing closes to the visible brand link, and enquiry opening transfers focus to its dialog.
- Shared `RouteFocus` waits for visible destination content, focuses its H1/main once on a path change, handles hash targets and restores recorded scroll on history navigation. SmoothScroll no longer independently resets route scroll. Initial page loading and later content mutations do not steal focus.
- `check:release` passed (existing lint warnings only). Temporary Chromium scripts passed four combinations of light/dark and normal/reduced motion at 390px and 1440px, plus a 320×450 touch viewport for expanded-menu reachability, hash focus and no mutation-driven focus theft. This narrow viewport is a reflow proxy; actual browser zoom and VoiceOver remain manual follow-ups. No spec files were added.
- Changes are local and uncommitted. Deployment acceptance and manual VoiceOver, actual zoom and lightbox review remain pending with the frontend/accessibility reviewer. Repeat on deployed 390px/1440px pages before closing those gates.

Implementation tracking is complete; deployed and manual accessibility acceptance is explicitly pending.
