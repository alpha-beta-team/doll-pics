# F01 — Restore the /work route

**Audit ID:** F01  
**Priority:** High  
**Effort:** Small (1–3 hours)  
**Status:** Complete\
**Responsible role:** Frontend engineer  
**Assigned owner:** Codex (implementation/local validation); Frontend engineer (deployment acceptance)\
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

The advertised portfolio URL renders its intended page and remains consistently indexable.

## Current evidence

- [`src/lib/navigation.ts:19`](../../../src/lib/navigation.ts#L19) — The section map includes gallery, services and booking, but omits /work.
- [`src/lib/sectionComponents.tsx:12`](../../../src/lib/sectionComponents.tsx#L12) — The existing work section component can be reused.
- [`src/pages/LandingResolver.tsx:41`](../../../src/pages/LandingResolver.tsx#L41) — Unrecognized landing paths resolve to NotFound.
- [`src/components/sections/Footer.tsx:17`](../../../src/components/sections/Footer.tsx#L17) — The footer still links Portfolio to /work.

The audit browser probe displayed Page Not Found with noindex, nofollow at /work; the static catalog and sitemap still include it. This is local evidence, not a fresh production result.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Restore the existing work section; do not add a navbar item, remove portfolio history, or silently redirect to a different destination.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)

## Ordered checklist

- [x] Confirm the current /work catalog entry, sitemap entry and incoming footer/service links.
- [x] Add '/work': 'work' to PATH_TO_SECTION so SECTION_PATHS registers it independently of NAV_LINKS.
- [x] Reuse FeaturedWork and SectionPageIntro; retain the existing title, description and self-canonical.
- [x] Add a browser regression for direct entry and footer navigation, including robots after React settles.
- [x] Check normal unknown URLs still render NotFound; run the focused routing/SEO checks.

## Acceptance criteria

- [x] Direct entry and SPA navigation display Featured Work rather than NotFound.
- [x] The rendered main has one meaningful H1, the expected title and index, follow.
- [x] Canonical and sitemap retain https://dollpictures.in/work; no extra navbar item appears.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
npm run test:lib
npm run test:seo
npm run test:browser
```

- [x] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [x] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Inspect the deployed /work response, rendered DOM, footer link and an unknown URL; record HTTP status, commit and canonical.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Use Search Console URL Inspection to examine any previous error/noindex state. Record it separately; recrawl/index recovery is follow-up, not a prerequisite for accepting the code fix.

- [x] Record applicable external results or an explicit pending follow-up with responsible role and next action.

Pending follow-up — SEO/site owner: after deployment, inspect `https://dollpictures.in/work` in Search Console for any previous error/noindex state and request recrawl if appropriate. Search Console access and index recovery were not tested locally; recovery is non-gating follow-up.

## Rollout and rollback

Restore the previous focused route change if unrelated routing regresses; do not delete portfolio content.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

Completion scope: marked Complete at the user’s request for implementation tracking on 7 September 2026. Implementation and local validation are complete; deployment acceptance and Search Console follow-up below remain pending. This status update does not establish deployed verification.

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Added the independent `/work` section mapping; existing FeaturedWork, SectionPageIntro, metadata and links reused |
| Local remediation validation | Passed | 19 library tests, 38 SEO tests, 43 browser tests, app/node typechecks, focused ESLint and diff whitespace check |
| Preview/production acceptance | Pending | Frontend engineer: deploy the release candidate and record deployed status/DOM, footer navigation, unknown URL and canonical evidence |
| External checks | Follow-up recorded | SEO/site owner: Search Console URL Inspection after deployment; recrawl/index recovery remains unverified |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |
| 2026-09-07 | Restored `/work`; implementation and local checks passed; Ready for verification | Working-tree change on `21d91a7` (audit baseline `ff8e0ad`); no implementation commit or deployment created. See local evidence below | Frontend engineer: deploy and verify actual hosting/CMS behavior; SEO/site owner: URL Inspection follow-up |
| 2026-09-07 | Marked Complete at the user’s request for implementation tracking; synchronized master totals | Existing implementation/local validation evidence below; no new deployment or external verification | Frontend engineer: deployed acceptance; SEO/site owner: URL Inspection follow-up |

### Local remediation evidence — 7 September 2026

- Source recheck confirmed `/work` in `src/data/seo-pages.json`, `src/data/sitemap-routes.json` and `public/sitemap.xml`; incoming links remain in Footer, Hero and the service/package page catalogs. The single application change is in `src/lib/navigation.ts`; NAV_LINKS remains unchanged.
- [Browser regression](../../../tests/public-html/work-route.spec.ts) runs against the isolated production build with [local CMS fixtures](../../../tests/public-html/fixtures.json), at 390px and 1440px. Four new cases cover direct entry, homepage footer navigation and footer recovery from an unknown URL. A document marker confirms SPA navigation.
- Local `/work` returned HTTP 200 and rendered exactly one main H1, `Featured Work`, plus the existing work section. Title remains `Featured Photography Work | Doll Pictures`; description remains the catalog text; settled robots are `index, follow`. Initial HTML and settled canonical retain `https://dollpictures.in/work`, also present in the served sitemap. No `/work` navbar link appears.
- Local `/unknown-work-route-regression` returned HTTP 404 and rendered NotFound with `noindex, nofollow`; its Portfolio footer link restored `/work` and indexable metadata without a document reload.
- `npm run test:lib`: **19 passed**; `npm run test:seo`: **38 passed**; `npm run typecheck`: **passed**; `npm run test:browser`: **43 passed**, including the four new route cases and existing public-HTML/hydration cases. `npx eslint src/lib/navigation.ts tests/public-html/work-route.spec.ts` and `git diff --check`: **passed**.
- Browser tests built and prerendered into an isolated temporary directory. They emitted existing Browserslist freshness, mixed analytics-import and large-chunk warnings; no build or test failure. Full release/admin gates were not run for this focused public route change.
- Direct-entry screenshots are emitted as `test-results/work-route-*/work-route.png`. External media is blocked by the fixture harness; screenshots are routing/layout evidence, not acceptance of actual portfolio media or live CMS content.
- Preview/production URLs, deployment date, deployed commit, hosting status and Search Console state remain unverified. Local acceptance checkmarks above do not close the deployment gate. No public-HTML rendering expansion, CMS writes or historical-plan updates apply to F01.
