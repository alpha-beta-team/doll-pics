# SEO Audit Remediation — Master Checklist

**Created:** 7 September 2026  
**Audit date:** 7 September 2026  
**Repository baseline:** `ff8e0ad`  
**Source:** The complete React.js SEO audit in this conversation (68/100 implementation assessment)  
**Program status:** In progress\
**Completion:** **10 / 19 items complete**

**Current status:** 10 complete, F04 and F11 ready for verification, F13 in progress, 6 not started. F04 automated production checks passed; manual acceptance remains. F11 implementation/local checks passed; deployment and content/browser acceptance remain.

## Objective and boundaries

Resolve the audit's demonstrated routing/content contradictions, make public output usable and dependable, then improve rendering, media discovery and measurement. This directory contains 19 separate remediation/improvement checklists connected to this master.

Creating these files is documentation work only. It does not fix application code, authorize production CMS edits or external-profile changes, send messages, or deploy anything. Existing plans under [the historical SEO master](../seo/README.md) and adjacent public-HTML plans remain unchanged.

The dated audit is the baseline for this program. Earlier repository audit reports and historical plan records can describe different implementations; do not treat their dates or completion labels as current verification. Recheck source before implementing.

## Evidence baseline and limits

| Evidence | Audit observation | Limit |
|---|---|---|
| Source architecture | React 18.3.1, Vite, React Router; shared metadata and three registered rendered services | Not request-time SSR or proof of deployment |
| Static catalog probe | 32 unique titles and 32 unique descriptions | Does not prove every rendered route is indexable |
| Focused audit checks | 38 SEO tests, 19 library tests and TypeScript checks passed | Historical local baseline; not remediation, hosted-CI or production acceptance |
| Local browser probes | /work became NotFound/noindex; /Services showed homepage content; menu Escape/target issues | CMS mocked and external resources controlled |
| Existing dist inspection | Three populated public roots; 29 empty roots; poor noscript contrast | Existing artifact only, not rebuilt or deployed evidence |
| Production/search/field data | Not established by the audit | Requires external verification |

Do not claim that tests prove search indexing, email delivery, production CMS state, field CWV or ranking improvements. Do not reuse historical Lighthouse numbers as current measurements.

## Plan index

IDs F01–F16 preserve audit traceability. I01–I03 cover the additional improvements. Each item appears once in this index; chunk order below determines execution order.

| ID | Issue / plan file | Priority | Effort | Dependencies | Status |
|---|---|---|---|---|---|
| F01 | [Restore the /work route](./01-work-route.md) | High | Small | — | Complete |
| F02 | [Unify publication state and public route catalogs](./02-publication-and-route-catalog.md) | High | Medium | [F01](./01-work-route.md) | Complete |
| F03 | [Preserve CMS service sections during generation](./03-cms-service-sections.md) | High | Small | — | Complete |
| F06 | [Separate fallback coverage from CMS release readiness](./06-cms-release-readiness.md) | Medium | Medium | [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md) | Complete |
| F08 | [Normalize known public canonical paths](./08-canonical-path-normalization.md) | Medium | Small | [F02](./02-publication-and-route-catalog.md) | Complete |
| F05 | [Make no-JavaScript fallbacks readable](./05-noscript-contrast.md) | Medium | Small | — | Complete |
| F07 | [Clarify private, preview and error-page indexing](./07-private-preview-and-404-indexing.md) | Medium | Small | — | Complete |
| F09 | [Restore About page heading structure](./09-about-heading-and-semantics.md) | Medium | Small | — | Complete |
| F12 | [Complete mobile menu and route focus behavior](./12-mobile-navigation-and-focus.md) | Medium | Small | — | Complete |
| F10 | [Use authentic and category-relevant portfolio media](./10-authentic-category-media.md) | Medium | Medium | — | Complete |
| F04 | [Expand public HTML rendering incrementally](./04-public-html-expansion.md) | High | Large | [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md), [F05](./05-noscript-contrast.md), [F06](./06-cms-release-readiness.md), [F10](./10-authentic-category-media.md) | Ready for verification |
| F11 | [Provide crawlable discovery for intended photography](./11-image-discovery.md) | Medium | Medium | [F02](./02-publication-and-route-catalog.md), [F04](./04-public-html-expansion.md), [F10](./10-authentic-category-media.md) | Ready for verification |
| F13 | [Measure and improve public-page performance](./13-performance-and-core-web-vitals.md) | Medium | Medium | — | In progress |
| F14 | [Support route-specific social previews](./14-social-preview-metadata.md) | Low | Medium | [F02](./02-publication-and-route-catalog.md), [F10](./10-authentic-category-media.md) | Not started |
| F15 | [Preserve authored metadata descriptions](./15-authored-meta-descriptions.md) | Low | Small | — | Not started |
| F16 | [Extend trustworthy sitemap modification dates](./16-sitemap-freshness.md) | Low | Medium | [F02](./02-publication-and-route-catalog.md), [F06](./06-cms-release-readiness.md) | Not started |
| I01 | [Publish original session case studies](./17-original-session-case-studies.md) | Medium | Large | [F04](./04-public-html-expansion.md), [F10](./10-authentic-category-media.md) | Not started |
| I02 | [Verify business identity and structured-data facts](./18-business-identity-and-schema-verification.md) | Low | Small–Medium | — | Not started |
| I03 | [Record production SEO acceptance and ongoing monitoring](./19-production-validation-and-monitoring.md) | Medium | Medium | All F01–F16 and I01–I02 (final closure only) | Not started |

## Chunk checklists

Start with F01. Within a chunk, take ready items in the listed order; independent items can be scheduled separately without bypassing prerequisites. Numbered filenames preserve audit IDs and are not a separate execution order.

### Chunk 1 — Routing and content correctness

**Status:** Complete for implementation tracking\
**Completion:** 5 / 5

- [x] [F01](./01-work-route.md) — Restore the /work route — Complete; implementation and local validation passed, deployment verification remains a follow-up
- [x] [F02](./02-publication-and-route-catalog.md) — Unify publication state and public route catalogs — Complete for implementation tracking; deployed acceptance remains a follow-up
- [x] [F03](./03-cms-service-sections.md) — Preserve CMS service sections during generation — Complete for implementation tracking; deployed content parity remains a follow-up
- [x] [F06](./06-cms-release-readiness.md) — Separate fallback coverage from CMS release readiness — Complete for implementation tracking; deployed candidate/hosting acceptance remains a follow-up
- [x] [F08](./08-canonical-path-normalization.md) — Normalize known public canonical paths — Complete for implementation tracking; Vercel redirect acceptance remains a follow-up

### Chunk 2 — Indexing and usability

**Status:** Complete for implementation tracking\
**Completion:** 4 / 4

- [x] [F05](./05-noscript-contrast.md) — Make no-JavaScript fallbacks readable — Complete for implementation tracking; deployed visual/keyboard checks remain a follow-up
- [x] [F07](./07-private-preview-and-404-indexing.md) — Clarify private, preview and error-page indexing — Complete for implementation tracking; deployed/preview headers and Search Console remain follow-ups
- [x] [F09](./09-about-heading-and-semantics.md) — Restore About page heading structure — Complete for implementation tracking; deployed/screen-reader checks remain a follow-up
- [x] [F12](./12-mobile-navigation-and-focus.md) — Complete mobile menu and route focus behavior — Complete for implementation tracking; deployed and manual accessibility review remain follow-ups

### Chunk 3 — Rendering, media and metadata

**Status:** In progress\
**Completion:** 1 / 7

- [x] [F10](./10-authentic-category-media.md) — Use authentic and category-relevant portfolio media — Complete for implementation tracking; studio approval and deployed media checks remain pending
- [ ] [F04](./04-public-html-expansion.md) — Ready for verification: all planned families implemented; CMS-strict HTML smoke and all 98 production path checks passed on `7a8fe9a`, including Stories, Contact, Privacy and Terms; manual acceptance remains
- [ ] [F11](./11-image-discovery.md) — Ready for verification: image/gallery links, public photo exclusions, cap guard and no-interaction checker implemented; local release/browser/crawl checks passed; deployment/content acceptance remains
- [ ] [F13](./13-performance-and-core-web-vitals.md) — In progress: Booking fixes verified in production; three mobile samples show CLS 0.00344 and LCP 7.07s; image discovery, broader profiling and field acceptance remain open
- [ ] [F14](./14-social-preview-metadata.md) — Support route-specific social previews
- [ ] [F15](./15-authored-meta-descriptions.md) — Preserve authored metadata descriptions
- [ ] [F16](./16-sitemap-freshness.md) — Extend trustworthy sitemap modification dates

### Chunk 4 — Content growth and ongoing verification

**Status:** Not started  
**Completion:** 0 / 3

- [ ] [I01](./17-original-session-case-studies.md) — Publish original session case studies
- [ ] [I02](./18-business-identity-and-schema-verification.md) — Verify business identity and structured-data facts
- [ ] [I03](./19-production-validation-and-monitoring.md) — Record production SEO acceptance and ongoing monitoring

## Completion dashboard

| Chunk | Items | Complete | Remaining | Status |
|---|---:|---:|---:|---|
| 1 — Routing and content correctness | 5 | 5 | 0 | Complete for implementation tracking |
| 2 — Indexing and usability | 4 | 4 | 0 | Complete for implementation tracking |
| 3 — Rendering, media and metadata | 7 | 1 | 6 | In progress |
| 4 — Content growth and ongoing verification | 3 | 0 | 3 | Not started |
| **Overall** | **19** | **10** | **9** | **1 in progress, 2 ready for verification, 6 not started** |

**Recommended next task:** deploy [F11 image discovery](./11-image-discovery.md), then run the HTML, path and new image-discovery smoke checks and review real photography/lightbox behavior. [F11 evidence](./evidence/f11-image-discovery-2026-09-10.json) records local validation and the production baseline of 64 genuine photos plus 3 demo placeholders; the 100-photo cap is currently non-blocking. Complete F04 manual content/browser acceptance separately; its [automated production checks passed](./evidence/f04-final-families-production-2026-09-09.json). F13 Booking production comparison is [recorded](./evidence/f13-booking-production-2026-09-09.md); LCP image discovery remains the next experiment. Totals remain **10 / 19 complete** for implementation tracking.

## Parallel execution

Tasks are not all serial. Dependency gates still apply; implementation completion does not replace content-owner or deployed acceptance.

| Workstream | Can proceed now | Gate / coordination |
|---|---|---|
| Rendering — F04 | Complete manual content/browser acceptance of the deployed final four pages | Automated production HTML and path checks passed on `7a8fe9a`; review approved content, no-JavaScript visibility, themes and interactions |
| Performance — F13 | Prepare a controlled earlier-discovery experiment for the Booking background; deployed CLS comparison passed | Compare against the 9 September baseline; coordinate public HTML/CMS changes with F04 |
| Metadata — F14, F15, F16 | Social previews, authored descriptions and sitemap dates | Existing implementation prerequisites are met; use approved imagery and coordinate edits to shared SEO/prerender files |
| Business facts — I02 | Verify identity and structured-data facts | Requires authoritative business/content-owner confirmation |
| Monitoring — I03 | Setup and baseline collection | Final closure waits for every prerequisite |
| Image discovery — F11 | Deploy and verify implemented discovery changes | Run HTML/path/image checks using the matching public CMS inventory; content owner approves real photography and exclusions |
| Case studies — I01 | Collect approved sessions and draft content | Publication depends on F04, original media and client permission |

Suggested practical split: continue F04 while F13 measurement and I02 verification run independently; handle F14/F15/F16 as a coordinated metadata workstream. Parallel work does not require deploying all changes together.

## Execution defaults and dependency rules

- Keep CMS-authored service sections, including intentionally empty arrays; never restore legacy static chapters to fill an intentional gap.
- Distinguish a successfully loaded empty/unpublished catalog from an unavailable CMS. Preserve intentional offline fallback and separately validate CMS-backed release readiness.
- Complete catalog/content consistency before public-HTML expansion. Release rendering changes one page family at a time.
- Normalize only known public marketing routes; preserve private opaque tokens and query values.
- Use approved original media for portfolio/session claims and factual content for schema. Do not invent clients, venues, dates, profiles or approvals.
- Measure performance before selecting optimizations. Reuse existing React/Vite utilities, tests and CMS workflows; no framework migration or new SEO dependency is planned.
- Relevant additional system work is identified in individual files. Backend contracts and production facts must be inspected before their implementation; this documentation task does not change those systems.
- I03 monitoring setup and baseline collection may start immediately. Its dependencies gate final program closure, not starting measurements.
- Keep related historical plans as context. New follow-up findings do not erase completed historical work.

## Release criteria

Apply gates to the changed subsystem; do not require unrelated backend, schema or social checks for a small heading fix. Record non-applicable checks with a reason.

- [ ] Required focused tests and typechecks pass for the implemented change.
- [ ] Relevant build/lint checks and hosted release checks pass for the release candidate.
- [ ] Applicable browser checks cover direct URLs, SPA navigation, mobile/desktop and failure states.
- [ ] Candidate initial HTML, rendered DOM, title, robots, canonical, sitemap and genuine 404 behavior agree.
- [ ] HTML-rendering changes preserve no-JS content, safe snapshots, hydration and mocked enquiry behavior.
- [ ] Deployed behavior and actual CMS content are verified separately from local/static fixtures.
- [ ] Applicable owner/manual/external acceptance checks have recorded evidence.
- [ ] Rollback target and stop conditions are recorded before promotion.
- [ ] Master and individual statuses, evidence records and totals agree.

Current commands (spec files and test commands were removed at the user’s request; earlier test results remain historical evidence):

```sh
npm run typecheck
npm run check:release
npm run seo:smoke
npm run seo:html-smoke -- --require-cms
npm run build:cms
# Required candidate gate: supply saved artifact, full commit, deployment ID and report.
npm run check:cms-release -- --base-url CANDIDATE_ORIGIN --expected-catalog CATALOG_FILE --expected-commit FULL_SHA --deployment-id DEPLOYMENT_ID --report REPORT_FILE
```

`check:release` now runs typecheck, lint and build. The former browser and spec suites are no longer present. Release/build commands can regenerate artifacts and public sitemap/robots files; inspect those diffs in the future implementation change. Smoke commands contact the configured deployed origin and must not be presented as already executed by writing this plan.

## Status maintenance

Allowed item statuses:

| Status | Meaning |
|---|---|
| Not started | Remediation has not begun; writing its plan does not count |
| In progress | Assigned remediation/investigation is underway |
| Ready for verification | Implementation and applicable local checks pass; deployment/manual gates remain |
| Blocked | A specific blocker, responsible role and next action are recorded |
| Complete | This item's required acceptance criteria and evidence gates pass |

When an item changes status:

1. Update its header, verification-stage table and dated progress log.
2. Update the matching master-index status and chunk checklist checkbox.
3. Count only `Complete` items toward completion; recalculate chunk and overall totals.
4. Set a chunk to Complete only when all its items are Complete. An unopened chunk stays Not started; an active incomplete chunk is In progress. Use Blocked for a chunk only when none of its remaining items can progress, and record why.
5. Update the recommended next ready task and record the change below.
6. Retain prior dated evidence. Link sanitized artifacts; never store secrets, customer payloads, private tokens or signed URLs.
7. Record continuing Search Console/ranking/field-data observations as follow-ups; ranking gains are not technical release gates. Required unresolved external acceptance keeps the affected item open.

## Documentation integrity checklist

The creator validates these separately from remediation completion:

- Exactly one README and 19 item files exist.
- All IDs appear once in the plan index and once in a chunk checklist.
- Every item has a master backlink, source evidence, dependencies, checkboxes, acceptance criteria, verification and progress log.
- Relative file links resolve and hard dependencies contain no cycles.
- All initial remediation statuses are Not started and all remediation checkboxes are unchecked.
- Only this new documentation directory is changed.

## Program log

| Date | Event | Completed remediation | Next action |
|---|---|---:|---|
| 2026-09-07 | Created master and 19 linked issue/improvement plans from the conversation audit | 0 / 19 | Assign F01 and begin Chunk 1 after baseline recheck |
| 2026-09-07 | F01 implemented and Ready for verification: 19 library, 38 SEO and 43 browser tests plus typecheck/focused lint passed; Chunk 1 In progress | 0 / 19 (1 ready for verification) | Frontend engineer: deployed F01 acceptance; F03 is independently ready; SEO/site owner: Search Console follow-up |
| 2026-09-07 | Marked F01 Complete at the user’s request for implementation tracking; synchronized item status, chunk checkbox and totals. Deployment/Search Console evidence remains pending | 1 / 19 | Begin F02; retain F01 deployment and external follow-ups |
| 2026-09-07 | F02 implemented and Ready for verification: shared publication catalog, build seed and retired output cleanup; check:release and 58 browser tests passed | 1 / 19 (1 ready for verification) | Frontend/CMS engineers: F02 deployed catalog/404 acceptance; F03 is the next independent implementation task |
| 2026-09-07 | Marked F02 Complete at the user’s request for implementation tracking; recorded subsequent removal of spec files and test commands without rewriting historical results | 2 / 19 | Begin F03; retain F01/F02 deployment follow-ups |
| 2026-09-07 | F03 implementation complete: preserved section images in fallback HTML; six loader/generated-route cases and 12 JS/no-JS browser checks passed; no spec files added | 3 / 19 | Begin F06; Frontend engineer retains F03 deployed content parity follow-up |
| 2026-09-07 | F06 implementation complete: strict CMS provenance gate, all-route initial HTML fingerprints and saved-artifact release acceptance; local fixture builds and JS/no-JS checks passed with no specs added | 4 / 19 | Begin F08; release owner retains candidate/production, hosting identity and deploy-hook follow-ups |
| 2026-09-08 | F08 implementation complete: catalog-scoped public redirects and client replacement; release checks and 120 local cases passed. Chunk 1 implementation complete | 5 / 19 | Begin F05; retain F08 deployed middleware/redirect and external canonical follow-ups |
| 2026-09-08 | F05 implementation complete: readable no-JS normal/404 pages, focus styling and poster layering; release/browser/visual checks passed | 6 / 19 | Begin F07; retain F05 deployed visual/keyboard follow-up |
| 2026-09-08 | F07 implementation complete: private noindex headers and clean 404 metadata; release/config/HTTP/browser checks passed, robots policy preserved pending indexing review | 7 / 19 | Begin F09; retain F07 deployed/preview and Search Console gates |
| 2026-09-08 | F09 implementation complete: visible About H1 with preserved H2/H3 sections; typecheck/lint and 21 browser cases passed | 8 / 19 | Begin F12; retain F09 deployed and screen-reader review |
| 2026-09-08 | F12 implementation complete: modal mobile menu and destination route focus; release and fixture browser checks passed | 9 / 19 | Begin F10; retain F12 deployment and manual accessibility gates |
| 2026-09-08 | F10 implementation complete: honest empty portfolio states and category-scoped media; release and 48 browser checks passed | 10 / 19 | Begin F04; retain studio approval and deployed media acceptance gates |
| 2026-09-08 | F04 homepage increment implemented locally with shared rendering, public media snapshots and isolated private shell | 10 / 19 | Verify homepage candidate/production before expanding hubs; F04 remains In progress |
| 2026-09-08 | F04 services/packages hubs implemented locally; published cards and empty states rendered with shared hydration | 10 / 19 | Deploy/verify hubs before wedding/newborn package-category rendering |
| 2026-09-08 | F04 wedding/newborn package rendering implemented locally with public offer snapshots and scoped media | 10 / 19 | Deploy/verify this pair before expanding remaining package categories |
| 2026-09-08 | Corrected master dashboard to 10 implemented / 9 remaining (F04 active, eight not started); added dependency-based parallel workstreams | 10 / 19 | User reports wedding/newborn HTML smoke and all 98 path checks passed; retain manual acceptance and continue F04 |
| 2026-09-08 | F04 remaining seven package categories implemented locally; F13 production lab baseline started in parallel | 10 / 19 | Deploy/verify package expansion; use F13 measurements to prioritize the next performance change |
| 2026-09-08 | F13 recorded 15 production mobile Lighthouse samples across five page families; Booking median LCP 8.62s and CLS 0.629 identify the first investigation | 10 / 19 | Investigate Booking insertion/layout and lazy LCP image, then compare a scoped fix; field data and interaction profiling remain pending |
| 2026-09-08 | User reported both production smoke checks passed for package expansion; implemented catalog-driven F04 rendering and focused F13 Booking fix in parallel | 10 / 19 | Deploy latest changes; validate custom CMS lifecycle/content and repeat Booking performance measurements. Both items remain In progress |
| 2026-09-08 | F04 Gallery initial HTML implemented locally with shared portfolio snapshot, visible no-JS images and empty/unavailable handling | 10 / 19 | Deploy/verify Gallery with both smoke tools and manual media/lightbox checks; then continue remaining core public families |
| 2026-09-08 | User reported both production smoke checks passed after Gallery/middleware deployment; F04 Work HTML implemented and verified locally | 10 / 19 | Deploy/verify Work and review actual featured photos/lightbox; then continue About/Stories/Contact/legal families |
| 2026-09-08 | F04 About initial HTML implemented with public staff/process snapshots and preserved heading hierarchy; local release, browser and failure checks passed | 10 / 19 | Deploy/verify Work/About and review real content/media; then continue Stories/Contact/legal families |
| 2026-09-08 | Direct F04 production verification failed: middleware HTTP 500 persisted across Work and About deployments; emitted Node ESM import bug reproduced and repaired locally | 10 / 19 | Deploy runtime repair, verify served commit and rerun both smoke tools before browser acceptance |
| 2026-09-09 | Verified production recovery on `aa0f0ca`: CMS-strict HTML and 98 path checks passed; Work/About/admin HTML return 200 | 10 / 19 | Continue Stories/Contact/legal rendering; retain manual acceptance and F13 performance measurements |
| 2026-09-09 | F13 verified deployed Booking fixes on `90a068e`; three comparable mobile samples: CLS 0.62908 → 0.00344, LCP 8.62s → 7.07s, score 51 → 74 | 10 / 19 | Continue CMS/JS background-discovery experiment; broader performance and field acceptance remain pending |
| 2026-09-09 | Completed F04 Stories, Contact, Privacy and Terms implementation; release checks, 84 local browser cases and 40 snapshot/content rejection cases passed | 10 / 19 | F04 Ready for verification: deploy and run updated smoke checks, then complete manual acceptance |
| 2026-09-09 | Verified final F04 families in production on `7a8fe9a`: CMS-strict HTML and 98 path checks passed; four direct HTTP/source probes confirmed matching roots and snapshots | 10 / 19 | Complete manual content/browser acceptance, then close F04 and proceed to F11 |
| 2026-09-10 | Implemented F11 crawlable image links, broader Gallery navigation, photo exclusions, cap guard and image-discovery smoke tool; local release, 24 browser, 15 crawler and 10 build/lifecycle cases passed | 10 / 19 (F04 and F11 ready for verification, F13 in progress, 6 not started) | Deploy F11, run all three smoke checks and complete content/browser acceptance; F04 manual acceptance remains separate |
