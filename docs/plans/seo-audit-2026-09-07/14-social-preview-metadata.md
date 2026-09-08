# F14 — Support route-specific social previews

**Audit ID:** F14  
**Priority:** Low  
**Effort:** Medium (1–2 days with approved images)  
**Status:** Not started  
**Responsible role:** Frontend engineer and content owner  
**Assigned owner:** Unassigned  
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority pages share accurate route-specific previews with a reliable common fallback.

## Current evidence

- [`scripts/prerender.ts:39`](../../../scripts/prerender.ts#L39) — Build uses a single default share image.
- [`scripts/prerender.ts:271`](../../../scripts/prerender.ts#L271) — OG/Twitter titles and descriptions vary, but image replacements share the default.
- [`src/lib/seo.ts:261`](../../../src/lib/seo.ts#L261) — Runtime allows seo.image, but build catalog parity is incomplete.
- [`public/og-share.jpg`](../../../public/og-share.jpg) — The inspected default is an existing 1200 by 630 image.

Default OG and Twitter metadata are present. Missing route images are a presentation improvement, not an established organic ranking defect.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Use approved existing photography and shared SEO utilities. No new SEO dependency, generated client claims or automatic selection of unrelated images.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [07-title-brand-strategy](../seo/07-title-brand-strategy.md)
- [02-authentic-media](../seo/02-authentic-media.md)

## Ordered checklist

- [ ] Add an optional shared social-image object (url, alt, width, height) to page/catalog metadata; keep the existing default when absent.
- [ ] Normalize image URLs to absolute public URLs in build and runtime and reject unusable metadata values.
- [ ] Carry optional image values through data loading/catalog construction and apply matching OG/Twitter tags.
- [ ] Emit image dimensions and meaningful image alternative text; emit type only when known.
- [ ] Assign approved imagery to home, wedding, newborn and representative package pages before expanding.
- [ ] Verify route transitions remove/replace old image metadata and reset to fallback correctly.

## Acceptance criteria

- [ ] Initial and runtime social metadata agree for configured routes and fallback routes.
- [ ] Images are publicly accessible, correctly dimensioned and represent the destination.
- [ ] One current set of social tags remains after route navigation; stale per-page values are removed.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:seo
npm run test:lib
npm run typecheck
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect actual OG/Twitter tags and public image HTTP responses on deployed configured and fallback routes.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Use available sharing preview/debug tools to verify cropping, text and cache refresh; platform cache behavior requires live verification.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Remove optional route overrides or restore the previous metadata build; retain the working default share image.

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

