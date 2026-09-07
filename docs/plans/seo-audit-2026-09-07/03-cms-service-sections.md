# F03 — Preserve CMS service sections during generation

**Audit ID:** F03  
**Priority:** High  
**Effort:** Small (1–3 hours)  
**Status:** Not started  
**Responsible role:** Frontend engineer  
**Assigned owner:** Unassigned  
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Build-time service content retains the same approved CMS sections as runtime content.

## Current evidence

- [`scripts/lib/seo-build.ts:175`](../../../scripts/lib/seo-build.ts#L175) — Service overlays copy SEO fields but omit sections.
- [`src/lib/seo-core.ts:266`](../../../src/lib/seo-core.ts#L266) — Service sections are resolved from the CMS navigation record.
- [`src/lib/navigation.ts:158`](../../../src/lib/navigation.ts#L158) — The existing normalizer preserves valid sections and associated image fields.
- [`src/lib/seo-core.spec.ts:74`](../../../src/lib/seo-core.spec.ts#L74) — An explicitly empty CMS section list must not restore static copy.

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

- [ ] Add a focused loader/catalog fixture containing a distinctive heading, multiple paragraphs and optional section image/alt.
- [ ] Map sections through the existing normalizeServiceNavLinks behavior into servicesByPath.
- [ ] Retain blank-section filtering and explicit empty-section semantics.
- [ ] Assert the generated catalog and fallback include the distinctive paragraph while empty sections remain empty.
- [ ] Compare a fully rendered service and a fallback-only service; verify script-safe serialization remains intact.

## Acceptance criteria

- [ ] CMS headings, body paragraphs and supported image fields survive the build mapper.
- [ ] Absent or intentionally empty CMS sections do not resurrect legacy static chapters.
- [ ] The regression exercises the loader-to-catalog path, not only the resolver in isolation.

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

Verify an existing approved CMS section in initial HTML and the rendered destination; record the deployed commit and content comparison.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

A production CMS edit is unnecessary if existing approved content proves parity. Any controlled freshness edit belongs in QA or requires separate content authorization.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Revert the section mapping and its consumer change together if output becomes malformed; leave CMS content untouched.

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

