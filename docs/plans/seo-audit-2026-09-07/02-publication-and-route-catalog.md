# F02 — Unify publication state and public route catalogs

**Audit ID:** F02  
**Priority:** High  
**Effort:** Medium (2–4 developer days)  
**Status:** Complete\
**Responsible role:** Frontend engineer with CMS engineer  
**Assigned owner:** Codex (implementation/local validation); Frontend/CMS engineers (deployed acceptance)\
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Navigation, HTML output, sitemap, runtime routing and schema use the same intended public destinations.

## Current evidence

- [`src/lib/seo-core.ts:377`](../../../src/lib/seo-core.ts#L377) — Static service/package entries are added regardless of an authoritative published list.
- [`scripts/lib/seo-build.ts:126`](../../../scripts/lib/seo-build.ts#L126) — Build mapping requires an explicit package path.
- [`src/lib/navigation.ts:200`](../../../src/lib/navigation.ts#L200) — Browser normalization can derive package paths from a slug.
- [`src/pages/LandingResolver.tsx:41`](../../../src/pages/LandingResolver.tsx#L41) — Static entries independently authorize service/package rendering.

Audit probes retained an unlisted static service and produced /custom-packages-erode in the browser path mapper while the build omitted the same slug-only category.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep intentional outage fallback. Distinguish a failed/unavailable CMS response from a successful empty response. Do not change authentication, opaque quotation tokens, historical CMS data or publication records.

## Dependencies and related plans

**Prerequisites:** [F01](./01-work-route.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [x] Define one shared normalized public catalog and explicit source availability for services and packages.
- [x] When CMS loading succeeds, use its published records as the authoritative public list; an empty list stays empty.
- [x] When CMS loading fails, preserve the existing static fallback policy and expose fallback provenance for F06.
- [x] Apply the same slug-derived package path and custom-path rules in build and browser; reject collisions with core/private routes.
- [x] Use the shared catalog for landing resolution, navigation, sitemap, emitted files and service catalogs; retire stale static outputs during fresh builds.
- [x] Keep genuinely retired URLs out of the sitemap and return 404 unless an explicitly approved replacement redirect exists.
- [x] Add coverage for publish/unpublish/delete, all-unpublished and empty lists, malformed/unavailable data, slug-only/custom paths and collisions.

## Acceptance criteria

- [x] Successful CMS unpublishing cannot leave the same static fallback page indexable.
- [x] Slug-only published categories have identical browser links, generated files and canonicals.
- [x] Every intended public catalog entry resolves; private, conflicting and unpublished entries are excluded.
- [x] Offline fallback still works and is distinguishable from CMS-backed output.

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

Crawl the candidate sitemap and compare its set with the approved published catalog; verify unlisted routes and replacement redirects.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Verify backend public endpoint publication semantics before changing frontend assumptions. Exercise lifecycle changes in QA fixtures or an approved QA CMS; no production record edits are implied.

- [x] Record applicable external results or an explicit pending follow-up with responsible role and next action.

Backend endpoint semantics were verified from the paired repository source (details below). Frontend/CMS engineers: after deployment, compare the approved QA published lists with the emitted catalog and sitemap, and verify retired URLs return 404. No live endpoint or production publication records were changed; deployed semantics and build-hook delivery remain pending.

## Rollout and rollback

Revert catalog consumers together to the prior verified release; retain publication data and any approved permanent redirects.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

Marked Complete at the user’s request for implementation tracking. Deployment acceptance remains a follow-up; this status does not establish deployed verification. The test results below are historical: all spec files and their npm/CI commands were subsequently removed at the user’s request. Typecheck passed after removal; `check:release` now runs typecheck, lint and build.

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Shared normalized public catalog, independent CMS/fallback provenance, browser/build consumers, retirement cleanup and last-known build seed |
| Local remediation validation | Passed | 25 library, 79 admin and 43 SEO tests; typechecks/lint/build via check:release; 58 browser tests; see evidence below |
| Preview/production acceptance | Pending | Frontend engineer: deploy candidate, compare public-catalog.json and sitemap with approved published records, verify retired URLs and actual host behavior |
| External checks | Source verified; deployed follow-up pending | Public package endpoint filters isPublished:true; public site-content returns service flags. CMS engineer: QA/live semantics and build-hook delivery verification |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |
| 2026-09-07 | Implemented F02 and passed local validation; Ready for verification | Working-tree changes on `21d91a7`; no F02 commit or deployment created. Existing staged F01 work retained | Frontend/CMS engineers: deployed catalog crawl and QA publication/build-hook acceptance |
| 2026-09-07 | Marked Complete for implementation tracking at the user’s request; synchronized master totals | Prior local evidence retained; subsequent spec-file removal recorded above | Frontend/CMS engineers: deployed catalog and 404 acceptance |

### Implementation and local evidence — 7 September 2026

- [Shared public catalog](../../../src/lib/publicCatalog.ts) records each source as `cms` or `fallback`, with `unavailable` / `invalid-response` fallback reasons. Successful empty, all-unpublished and deleted lists remain authoritative. Malformed rows are excluded without reviving historical entries; malformed response envelopes retain outage fallback.
- [Shared destination normalization](../../../src/lib/publicRoutePath.ts) and [navigation normalization](../../../src/lib/navigation.ts) derive slug-only package paths and normalize custom CMS paths identically in Node and React. Core/private/system routes and malformed destinations are excluded. Duplicate paths, duplicate package slugs and cross-family collisions reject all conflicting records, independent of response arrival order. No replacement redirect was approved or added.
- Runtime landing resolution, services/package lists, navbar/footer links, related links and LocalBusiness service catalogs consume the resolved destination set. Static SEO copy may enrich an authorized page but cannot independently authorize it.
- Build generation emits only resolved destinations in HTML and sitemap, plus `public-catalog.json` containing the emitted paths and source provenance. The safely serialized `public-route-catalog` seed preserves the build's known publication state on client-only pages and the 404 shell when the browser CMS is unavailable; a subsequent successful browser response supersedes the seed. Existing service hydration snapshots remain supported. No new page family was server-rendered.
- Fresh Vite builds clear prior output. [Standalone prerender cleanup](../../../scripts/lib/catalog-output.ts) also removes retired `index.html` files recorded in the previous catalog manifest while retaining unrelated assets and private files.
- Deployment smoke checks now compare sitemap locations with the emitted catalog, and treat unlisted registered service pilots as noindex 404s rather than demanding historical pages stay public. These validators were exercised locally; neither command was run against production.
- [Catalog unit cases](../../../src/lib/publicCatalog.spec.ts), [build/catalog cases](../../../scripts/lib/seo-build.spec.ts), [retirement cleanup case](../../../scripts/lib/catalog-output.spec.ts), [browser lifecycle cases](../../../tests/browser/public-catalog.spec.ts) and [generated-output cases](../../../tests/public-html/catalog.spec.ts) cover publication/unpublication/deletion/republishing, empty and malformed responses, independent outages, response-order collisions, slug-only/custom destinations, emitted canonicals/sitemap/schema, retired HTTP 404s, build-seed outage behavior and newer successful responses.
- The [isolated CMS fixture](../../../tests/public-html/fixtures.json) now explicitly publishes package categories instead of depending on an empty response restoring defaults. It includes `/custom-packages-erode`, `/portrait-plans`, a custom service, unpublished records and rejected path collisions. The browser crawl compares all **20** emitted destinations against the intended fixture set; this is fixture evidence, not an approved production catalog.
- `VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release`: **passed** — 25 library, 79 admin and 43 SEO tests, app/node typechecks, lint and the offline production build. The fallback build emitted **32** sitemap URLs and **33** HTML files including 404. Lint has 8 existing Fast Refresh warnings; build also reports existing Browserslist/import/chunk-size warnings. No release failure remains.
- `npm run test:browser`: **58 passed**, including existing mobile/desktop, hydration, enquiry and F01 checks. The local test server builds into an isolated temporary directory; external resources are controlled. Initial harness failures (native test JSON import, script-text assertions, missing API mocks and historical route-status expectations) were corrected. The retired-route/browser-outage case additionally prompted the build-catalog seed fix before the passing run.
- After the final deployment-validator update, `npm run test:html -- catalog.spec.ts pilot.spec.ts --grep 'deployment validator|generated files'`: **2 passed** against a fresh isolated CMS-backed build. `git diff --check`: **passed**.
- Backend source evidence: `../photography-cms-backend/src/package-categories/package-categories.service.ts:55` filters public records with `isPublished: true` and returns slug/path/SEO fields; omission therefore means the record is not public. `src/site-content/site-content.controller.ts:14` and `src/site-content/site-content.service.ts:18` in that repository return the singleton with service publication flags. Existing service/package mutations already request frontend rebuilds. These are source findings; deployed endpoints and hook delivery were not exercised.
- F06 release-readiness enforcement remains separate: offline builds are intentionally allowed and explicitly labeled. Publishing/unpublishing changes need the existing rebuild/deploy workflow to update HTTP files and the sitemap. Preview/production URL, deployed commit/date, approved catalog comparison and real hosting 404 behavior remain unverified.
