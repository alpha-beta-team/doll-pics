# F03 — Preserve CMS service sections during generation

**Audit ID:** F03  
**Priority:** High  
**Effort:** Small (1–3 hours)  
**Status:** Complete\
**Responsible role:** Frontend engineer  
**Assigned owner:** Codex (implementation/local verification); Frontend engineer (deployment follow-up)\
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Build-time service content retains the same approved CMS sections as runtime content.

## Current evidence

- [`scripts/lib/seo-build.ts:175`](../../../scripts/lib/seo-build.ts#L175) — Service overlays copy SEO fields but omit sections.
- [`src/lib/seo-core.ts:266`](../../../src/lib/seo-core.ts#L266) — Service sections are resolved from the CMS navigation record.
- [`src/lib/navigation.ts:158`](../../../src/lib/navigation.ts#L158) — The existing normalizer preserves valid sections and associated image fields.
- Historical `src/lib/seo-core.spec.ts:74` — An explicitly empty CMS section list must not restore static copy. Spec files were subsequently removed at the user’s request; this is audit evidence only.

An audit fixture with one CMS section yielded zero catalog sections and one runtime section. The three rendered service routes receive site content separately; the omitted fallback content particularly affects other services.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep CMS ownership of sections and intentionally empty arrays. Do not restore legacy static sections, invent copy or change public API shapes.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [service-page-content-cms](../service-page-content-cms.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [x] Add a focused loader/catalog fixture containing a distinctive heading, multiple paragraphs and optional section image/alt.
- [x] Map sections through the existing normalizeServiceNavLinks behavior into servicesByPath.
- [x] Retain blank-section filtering and explicit empty-section semantics.
- [x] Assert the generated catalog and fallback include the distinctive paragraph while empty sections remain empty.
- [x] Compare a fully rendered service and a fallback-only service; verify script-safe serialization remains intact.

## Acceptance criteria

- [x] CMS headings, body paragraphs and supported image fields survive the build mapper.
- [x] Absent or intentionally empty CMS sections do not resurrect legacy static chapters.
- [x] The regression exercises the loader-to-catalog path, not only the resolver in isolation.

## Verification

### Local

Spec files and test npm scripts were removed at the user’s request. F03 used temporary loader and browser verification scripts, without adding spec files back. Current checks:

```sh
npm run typecheck
npm run lint
```

- [x] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [x] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Verify an existing approved CMS section in initial HTML and the rendered destination; record the deployed commit and content comparison.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

A production CMS edit is unnecessary if existing approved content proves parity. Any controlled freshness edit belongs in QA or requires separate content authorization.

- [x] Record applicable external results or an explicit pending follow-up with responsible role and next action.

Frontend engineer: after deployment, compare existing approved CMS section text and images with initial HTML and the rendered page. Production content edits are unnecessary and were not performed. Deployed URL, date and commit remain pending.

## Rollout and rollback

Revert the section mapping and its consumer change together if output becomes malformed; leave CMS content untouched.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

Complete for implementation tracking, consistent with the F01/F02 tracking convention requested in this session. Deployment verification remains a separate follow-up; no deployed result is claimed.

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Verified F02 section mapping; added optional image fields to CatalogPage and escaped section images/alt text to fallback HTML |
| Local remediation validation | Passed | Six HTTP loader-to-catalog cases, six generated responses, 12 Chromium JS/no-JS checks, typecheck, lint and isolated production build |
| Preview/production acceptance | Pending follow-up | Frontend engineer: compare approved content against deployed initial HTML and DOM; record URL/date/commit |
| External checks | Follow-up recorded | Synthetic fixtures only; no live CMS reads or edits required for local verification |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |
| 2026-09-07 | Completed implementation and local verification; updated master tracking | Working-tree change on `7fb7375`; no new commit or deployment created; evidence below | Frontend engineer: deployed content parity follow-up |

### F03 local verification — 7 September 2026

- F02 already routes complete normalized service records through `loadCmsOverlays` and `buildPageCatalog`. A temporary HTTP fixture confirmed that headings, multiple paragraphs, image URLs and alt text survive that actual loader-to-catalog path. The checks did not bypass the loader by calling only the resolver.
- Remaining gap fixed: `CatalogPage.sections` now declares optional `imageUrl` / `imageAlt`; generated fallback sections emit their CMS image with escaped attributes, lazy loading and async decoding. Missing alt text uses the section heading, matching the runtime component. No legacy chapters or new editorial copy were added.
- Populated fixtures: `/newborn-baby-photography-erode` (fully rendered) and `/family-photography-erode` (fallback HTML). Each included a distinctive approved-chapter heading, two paragraphs, an image URL containing `&`, quoted/angle-bracket alt text and blank-heading/body rows to filter out.
- Empty fixtures: `/wedding-photography-erode` and `/pre-wedding-photography-erode`. Absent-section fixtures: `/maternity-photography-erode` and `/kids-photography-erode`. All retained zero CMS sections and did not restore legacy chapter headings.
- Paragraphs contained synthetic script-like text (`</script><script>window.f03Injected=true</script>`). Raw HTML contained no executable injection sequence; JSON catalog data and visible paragraph text round-tripped, and no browser execution marker appeared.
- `PUBLIC_HTML_FIXTURE_FILE=<temporary fixture> node scripts/test-public-html-server.mjs` built and prerendered into an isolated temporary directory. Six initial responses returned HTTP 200 with expected canonical/indexing metadata. One-off Chromium checks covered all six routes with JavaScript enabled and disabled at 390×844; section images loaded, alt text/text matched, no page errors occurred and no horizontal overflow appeared.
- `npm run typecheck`: passed. `npm run lint`: passed with 8 existing Fast Refresh warnings. The isolated production build passed with the existing Browserslist/import/chunk-size warnings. `git diff --check`: passed. No spec files were recreated.
- [Sanitized local verification results](./evidence/f03-local-verification.json) retain route-level outcomes. Verification scripts and input fixtures were temporary; no live CMS content or credentials were used. These results establish local parity, not deployment, actual CMS freshness or production hosting behavior.
