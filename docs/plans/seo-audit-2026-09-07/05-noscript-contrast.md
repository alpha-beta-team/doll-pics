# F05 — Make no-JavaScript fallbacks readable

**Audit ID:** F05  
**Priority:** Medium  
**Effort:** Small (under 1 hour plus checks)  
**Status:** Complete\
**Responsible role:** Frontend engineer  
**Assigned owner:** Frontend engineer\
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Fallback text and links are readable without JavaScript on public and error pages.

## Audit baseline evidence

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

- [x] Create a shared fallback class with explicit dark text on white, readable link color and visible focus.
- [x] Use it in both normal and 404 fallback generators; retain headings and crawlable links.
- [x] Check homepage poster layering when a CMS hero exists so the fallback is not obscured.
- [x] Inspect home, About, a package, a fallback service and 404 with JavaScript disabled at mobile and desktop widths.
- [x] Verify the hydrated versions and the three already rendered services remain unchanged.

## Acceptance criteria

- [x] No-JS content is visible, selectable and readable; normal text meets 4.5:1 contrast and large text 3:1.
- [x] Fallback links are recognizable and keyboard focus is visible.
- [x] A generated hero poster cannot cover fallback copy; 404 fallback is equally usable.

## Verification

### Local

No spec files were added. The existing release command and temporary fixture/browser scripts were used.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
```

- [x] Typecheck, lint (0 errors; 8 existing warnings) and offline production build passed.
- [x] Checked home, About, a CMS-only package, a fallback service and 404 with JavaScript disabled at 390px and 1440px widths, including a configured homepage hero.
- [x] Verified explicit foreground/background, text/link contrast (18.88:1 text, 7.85:1 links), underlines, Tab focus, text selection, lack of horizontal overflow and unobscured headings.
- [x] All 32 browser cases and the local fixture HTML smoke passed. Checked JavaScript-enabled versions and the three rendered service routes at both widths; fallback CSS does not apply to those React layouts.
- [x] Recorded [local browser evidence](./evidence/f05-local-verification.json), [mobile homepage](./evidence/f05-home-mobile.png), [mobile package](./evidence/f05-package-mobile.png) and [desktop 404](./evidence/f05-404-desktop.png). Screenshots were visually inspected.

### Deployment

Frontend/release engineer: deploy F05 and repeat the representative no-JS visual and keyboard checks. Verify white background, dark text, underlined links, visible Tab focus and no homepage poster covering content. Run the existing HTML smoke after deployment; HTML-presence checks alone do not prove contrast.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Manual visual/keyboard review is required; passing HTML-presence checks alone is insufficient.

- [ ] Frontend/release engineer: repeat visual and keyboard checks on deployed pages. Local Chromium/manual screenshot inspection passed; deployment remains pending.

## Rollout and rollback

Revert only the fallback styling/generator change if presentation regresses; keep functional route metadata.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Shared `.public-fallback` class and no-JS-only CSS for normal/404 generators; homepage poster hidden only without JavaScript |
| Local remediation validation | Passed | Release checks and mobile/desktop fixture browser/visual verification; evidence linked above |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Complete is used for implementation tracking, consistent with prior items. Deployed visual/keyboard acceptance remains a follow-up.

## Implemented behavior

The shared fallback style is embedded inside `<noscript>`. Without JavaScript, the body and fallback main are white with `#111` text, blue underlined links, a contrasting visited color and a 3px keyboard-focus outline. Headings and paragraph/list spacing restore readable hierarchy despite the application CSS reset. Images fit the container and long text wraps.

The same block hides the decorative build-time hero poster only when scripting is disabled. With JavaScript enabled the CSS stays inert, preserving the existing hero preload/removal flow. Already rendered service pages omit the fallback block entirely. No React layout, route metadata, copy, catalog or internal links were changed.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

| 2026-09-08 | F05 implementation complete: readable shared no-JS styling, visible links/focus, poster layering fix and 404 parity | Release checks plus local mobile/desktop browser and screenshot evidence; no specs added | Frontend/release engineer: deploy and verify no-JS visual/keyboard behavior |
