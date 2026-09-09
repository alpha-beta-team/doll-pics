# F04 — Expand public HTML rendering incrementally

**Audit ID:** F04  
**Priority:** High  
**Effort:** Large (1–3 weeks in increments)  
**Status:** Ready for verification — implementation, local validation and automated production checks passed; manual acceptance pending\
**Status updated:** 9 September 2026 — final four pages verified in production on `7a8fe9a`; manual content/browser review remains\
**Responsible role:** Frontend engineer with content reviewer  
**Assigned owner:** Frontend implementation; frontend/content reviewer for deployment acceptance\
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority public routes deliver substantive content in normal initial HTML and retain working hydration.

## Audit baseline evidence

- [`src/lib/publicHtmlRoutes.ts:2`](../../../src/lib/publicHtmlRoutes.ts#L2) — Only newborn, wedding and maternity are registered for rendered public HTML.
- [`src/entry-public-server.tsx:13`](../../../src/entry-public-server.tsx#L13) — The existing server entry renders the shared React page.
- [`scripts/prerender.ts:503`](../../../scripts/prerender.ts#L503) — Build rendering is restricted to the registered services.
- [`src/main.tsx:43`](../../../src/main.tsx#L43) — Valid snapshots hydrate; other pages use client mounting.

The audited existing dist contained three populated public roots and 29 empty roots. Those artifact counts are baseline observations, not proof of deployed coverage.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Reuse React 18, Vite and existing components. No framework migration, request-time server, crawler-specific output or private-route prerendering. Omit unavailable media rather than borrowing unrelated work.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md), [F05](./05-noscript-contrast.md), [F06](./06-cms-release-readiness.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [public-html-rendering](../public-html-rendering.md)
- [public-html-service-expansion](../public-html-service-expansion.md)

## Ordered checklist

- [x] Generalize route renderer and snapshot selection beyond a ServicePage-only assumption; preserve route/version validation and public field allowlists.
- [x] Render the homepage first, including meaningful heading, approved media, contact and service discovery links.
- [x] Render /services and /packages hubs next using the authoritative public catalog.
- [x] Render package-category pages next, beginning with wedding and newborn, then the remaining intended published package routes — all nine standard categories implemented; automated production checks passed in the 9 September recovery record; manual content acceptance remains.
- [x] After verifying the current package increment, derive service and package-category rendering eligibility from the authoritative published CMS catalog instead of a manually maintained URL registry. Newly created eligible routes must receive full initial HTML on rebuild/redeploy without route-specific code edits; preserve route-family selection, snapshot validation, public field allowlists and private/reserved-path exclusions.
- [x] Render all eligible published services using the shared service component and catalog-driven selection — local validation and automated production checks passed; manual content acceptance remains.
- [x] Render the gallery's initial content using its existing component — local validation and automated production checks passed; manual content/browser acceptance remains.
- [x] Render Work using its existing FeaturedWork component — local validation and automated production checks passed; manual content/browser acceptance remains.
- [x] Render About using its existing components and public staff/process snapshots — local validation and automated production checks passed; manual content/browser acceptance remains.
- [x] Render Stories/Contact and legal pages using their existing components — Stories, Contact, Privacy and Terms implemented, locally verified and confirmed in production on `7a8fe9a` on 9 September 2026.
- [ ] Release each page family separately; disable observer-only hiding in initial HTML and match the first browser render to its snapshot.
- [x] Exercise light/dark preference restoration, malformed snapshots, stale assets, independent CMS/media failures and route transitions — local checks recorded per family, including the final four pages below; deployed review remains separate.
- [x] Prove a controlled QA content change reaches generated HTML and hydrated content after rebuild before expanding the next family — controlled local rebuild evidence recorded for CMS-backed families, including edited reviews and Contact media. Legal copy is source-authored.

## Acceptance criteria

- [x] Each released family has meaningful heading, copy and crawlable links inside #root without JavaScript — production CMS-strict HTML smoke passed on `7a8fe9a`, including the final four pages.
- [ ] Initial and hydrated content agree with the approved catalog and available CMS content.
- [ ] A newly published custom service and package category, absent from the code registry, render matching headings, content, links and validated snapshots after rebuild; package offers and photos stay scoped to their category. Both deployed smoke tools discover and verify these routes from the catalog.
- [ ] Controlled QA publish, edit, unpublish/delete and republish checks prove rebuilt HTML, hydration, navigation and sitemap stay consistent; retired routes return true 404 and unpublished, conflicting or reserved paths never become renderable. Record the rebuild/deploy trigger and retain F06 freshness/provenance gates; CMS edits alone do not rewrite deployed HTML.
- [x] Enquiry interactions work with mocked submissions; no hydration mismatches or private snapshot leakage occur — local fixture/browser evidence recorded; no real enquiry sent.
- [ ] Each increment has recorded preview and production acceptance before the next family expands.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run seo:html-smoke -- --base-url https://YOUR-CANDIDATE-URL
npm run seo:paths-smoke -- --base-url https://YOUR-CANDIDATE-URL
```

- [x] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence — per-family evidence linked below.
- [x] Complete the scenario-specific local checks above; explain any non-applicable check — final-family evidence records 84 browser cases, 40 rejection cases and explicit verification limits. Deployment/manual acceptance remains separate.

### Deployment

Run both smoke tools against each released candidate and production; extend validators as route coverage expands. Record commit, deployment, source provenance and served entry asset.

- [x] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target — production URL, build timestamp, commit and HTTP/source evidence recorded below; separate preview hosting and production browser/manual review remain unverified.

### External

Inspect representative URLs in Search Console after release. Google indexing and ranking observations are separate from HTML/hydration acceptance.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Roll back the affected route-family deployment or registry increment to the previous verified build; preserve earlier proven families and source data.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete; ready for verification | All planned families implemented: home, hubs, published services/package categories, Gallery, Work, About, Stories, Contact, Privacy and Terms |
| Local remediation validation | Passed | Earlier family evidence below; [final-family evidence](./evidence/f04-final-families-local-verification.json): release check, strict/optional HTML smoke, 84 browser cases, 40 snapshot/content rejection cases and controlled rebuilds |
| Preview/production acceptance | Automated production checks passed; manual review pending | [Final-family production evidence](./evidence/f04-final-families-production-2026-09-09.json): CMS-strict HTML smoke and all 98 path checks passed on `7a8fe9a`; Stories, Contact, Privacy and Terms return HTTP 200 with matching rendered roots/snapshots. Separate preview and manual browser/content acceptance remain unverified |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |


### Increment 1 — homepage (8 September 2026)

- Added `/` to the explicit public rendering registry. The entry selects the existing Site or ServicePage component; browser hydration selects the matching component. Snapshot path/version validation now handles the root path and validates home image collections. Home media is mapped to public fields only, preserving authored alt text and category tags; successful resources are seeded independently.
- Initial home HTML contains its heading, introduction, available CMS hero/portfolio media, contact links and published service discovery. Observer/entrance hiding is disabled within rendered home roots, matching the first client render. Existing visitor theme restoration remains intact. Stock fallbacks are not restored when media is unavailable.
- Private Vercel/Netlify rewrites now use `app-shell.html`, a separate empty React shell with noindex and no public snapshots/catalog or structured data. The app-shell route name is reserved from CMS publication. The shell also permits repeat standalone prerendering without nesting an earlier home root; public generation explicitly restores indexable robots metadata.
- Temporary Vite rendering disables client dependency discovery; the normal frontend build remains unchanged. No spec files added, no CMS writes, no deployment performed.
- `check:release` passed with eight existing lint warnings; no canceled-build message.
- Local evidence: empty-media and edited-CMS fixture production builds; eight JS/no-JS mobile/desktop light/dark cases; five failure/navigation modes; three existing service hydration checks; snapshot rejection; mocked enquiry submission; raw HTML smoke including exclusions and repeated prerender. Malformed snapshots use normal client mounting and may show fallback copy while the CMS is unavailable. Missing entry assets retain readable initial HTML but cannot provide JavaScript interactions.

**Release boundary:** The homepage is the only newly added family. This plan requires preview/production acceptance for each family before expanding the next. Frontend reviewer: deploy the candidate, record its commit/deployment ID, run both smoke tools, and verify home content/hydration with actual approved CMS media. Content reviewer: confirm the published images. Then proceed to `/services` and `/packages` hubs. Search Console observation follows release. Overall F04 stays In progress; the master completion total does not increase.

### Deployment correction — 8 September 2026

Production smoke reported 404 for all eight private root/nested probes. Read-only verification confirmed `/app-shell` returns 200. The Vercel rewrite destinations incorrectly used `/app-shell.html` with `cleanUrls: true`; [Vercel documentation](https://vercel.com/docs/project-configuration/vercel-json#rewrites) requires extensionless destinations. All eight destinations now use `/app-shell`. Netlify retains its file destinations.

The local fixture adapter previously hardcoded the private shell and therefore missed this configuration error. It now resolves declared rewrite destinations and rejects HTML-extension destinations under cleanUrls. Production acceptance remains pending redeployment and both smoke checks; the observed private-route regression does not count as a passed deployment gate.

Correction validation: fixture production build, script syntax check, diff check and HTML smoke passed, including all eight private probes. No deployment performed.

### Increment 2 — services and packages hubs (8 September 2026)

User authorized the next increment after reporting deployed homepage HTML/path smoke success. That report is distinct from manual homepage visual acceptance.

- `/services` and `/packages` are now in the explicit render registry. ServicesHub eagerly loads the existing Services section inside the shared Site shell; the server and initial browser use the same component and Suspense structure. Packages uses its existing page directly.
- Both hubs render the authoritative catalog's published cards, descriptions and links. A successful empty package catalog shows an honest empty state and contact link. Optional service preview imagery retains its existing safe fallback. This increment does not add package pricing tables or package-category rendering.
- Initial hub headings/cards are visible without observer JavaScript. Hub snapshot validation rejects malformed card fields and cross-route snapshots. Existing service snapshots, private shell rewrites and public metadata remain covered by the HTML smoke check.
- Local fixtures passed 32 combined populated/edited-and-empty JS/no-JS checks at 390px/1440px with stored-theme variants, including card navigation/back. JavaScript restores both themes; no-JavaScript retains the build-time dark theme. Six additional API/media, malformed snapshot and missing-entry-asset cases passed. Mocked enquiry submissions succeeded once per hub, with no external writes. Controlled service copy appeared in rebuilt HTML. No spec files added.
- [Verification evidence](./evidence/f04-hubs-local-verification.json). Changes are local and uncommitted; no deployment acceptance claimed.

**Next release gate:** deploy the hubs, run HTML smoke with `--require-cms` and path smoke, and inspect their no-JavaScript content, themes, published cards and enquiry flow. Record deployment ID/commit and content review. Then begin wedding/newborn package-category pages. F04 remains In progress and totals remain 10 / 19.

Final hub release check passed with eight existing lint warnings. All six final fallback render artifacts passed the HTML validator.

### Increment 3 — wedding and newborn package pages (8 September 2026)

User authorized this increment after reporting deployed hub HTML/path smoke success. Manual visual acceptance is a separate gate.

- Added only `/wedding-packages-erode` and `/newborn-packages-erode`; registration still requires the route in the published package catalog. Unpublished/retired targets remain excluded.
- Server and browser select the existing PackageCategoryPage. Snapshots include explicitly allowlisted public offers and category-scoped media; extra raw CMS fields are not embedded. The package resource is seeded only when loaded successfully. Strict CMS builds fail if the offers endpoint is unavailable; successful empty arrays remain valid and display the existing enquiry state. Generated snapshots are validated before output is written.
- Package imagery uses the category query from the authoritative catalog and the scoped snapshot rather than a general-gallery pool. Tagged photos from unrelated categories are rejected. Explicit package category slugs take precedence over display names; legacy missing-slug names and the toddler plural alias remain supported.
- Initial headings, price cards and portfolio grids are visible without observer JavaScript. HTML smoke now checks package metadata, names, prices, inclusions and empty states.
- Local checks: empty-offer build/HTML smoke, controlled populated rebuild, 16 mobile/desktop JS/no-JS and stored-theme browser cases, six failure/malformed/stale-asset cases, mocked enquiry, field-allowlist and malformed/private snapshot checks. JavaScript restores light/dark preference; no-JavaScript retains build-time dark. `check:release` passed with existing lint warnings. [Evidence](./evidence/f04-package-pilot-local-verification.json).

**Next gate:** deploy this pair and verify actual CMS prices, inclusions, category photos, enquiry/navigation, no-JavaScript visibility and both themes; run both deployed smoke tools and record commit/deployment. Then expand the remaining intended package categories. This pair is local and uncommitted; no production acceptance claimed. F04 stays In progress and totals remain 10 / 19.

### Increment 4 — remaining standard package categories (8 September 2026)

User authorized F04 expansion and F13 measurements in parallel after reporting both deployed smoke checks passed for wedding/newborn packages.

- Added pre-wedding, maternity, baby milestone, cake smash, family, baby shower and toddler baby shoot to the existing explicit registry. All nine standard package routes now use the established PackageCategoryPage renderer and validated public snapshots.
- No renderer, pricing, snapshot, media or hosting behavior was rewritten. The published catalog still gates each registered route. Future custom CMS routes need a separate registry review; registration does not force an unpublished page live.
- Release check and fixture HTML smoke passed. Chromium checked nine categories × JS/no-JS × 390px/1440px × stored light/dark preference (72 cases), with pricing/inclusion, category-image, visibility, overflow, enquiry-dialog and back-navigation assertions. JavaScript restores both themes; no-JavaScript retains build-time dark.
- Additional checks covered each publication gate, private exclusion, the toddler plural alias, intentionally unavailable cake-smash photography and an empty baby-shower offer list. No spec files or CMS writes. [Evidence](./evidence/f04-all-packages-local-verification.json).

**Next gate:** deploy the latest seven routes and run both smoke commands against the candidate/production. Manually compare actual prices, inclusions and category photos and check no-JavaScript, themes and navigation. Then expand the remaining published services and subsequent public-page families. F04 remains In progress; this change is local and uncommitted.

### Planned increment — catalog-driven service and package rendering (8 September 2026)

Originally added as pending at the user's request; implemented locally in Increment 5 below: make newly published CMS services and package categories eligible for full initial HTML without adding each URL to code. Follow the current package deployment gate, coordinate publication rules with F02 and rebuild freshness with F06, and extend hydration and smoke validators alongside the renderer. Validate new custom routes and their publication lifecycle with controlled QA data before production acceptance. This planning addition does not complete F04 or change the master completion count.

### Increment 5 — catalog-driven rendering (8 September 2026)

User reported production HTML smoke and all 98 path checks passed for the previous package expansion, then authorized this work alongside a separate F13 Booking agent.

- Build selection, server component selection, browser hydration and HTML smoke coverage now use the published catalog. New eligible service and package URLs no longer require registry edits. Historical constants remain only as retired-route smoke probes and service media aliases.
- Snapshot parsing reconstructs the catalog from its normalized sources and rejects inconsistent derived links, conflicts, unsupported/private paths and cross-route media. The service media category resolver is shared between build and browser so existing aliases and new label-derived categories stay consistent.
- Local checks passed: combined `check:release` (eight existing lint warnings and existing chunk warnings), strict CMS HTML smoke, 16 custom-route browser cases across JS/no-JS, mobile/desktop and light/dark preferences, nine malformed snapshot cases and missing-snapshot smoke rejection.
- Controlled rebuilds verified authored service edits and package prices, service unpublication plus package deletion (files removed, true HTTP 404, sitemap/navigation removed), and republishing. Strict HTML smoke passed after each stage. No spec files, live CMS writes or deployments. [Evidence](./evidence/f04-catalog-rendering-local-verification.json).

**Next gate:** deploy and run both smoke commands; verify a controlled new service/category and content/media parity through the CMS rebuild workflow. Automatic rendering happens at build time; deploy-hook delivery remains an F06 acceptance check. Then proceed to gallery and subsequent core public families. F04 remains In progress.

### Increment 6 — Gallery initial HTML (8 September 2026)

Implemented at the user's explicit request. Earlier catalog-driven rendering and F13 deployment acceptance remain separate pending gates; no production success is inferred from local checks.

- `/gallery` uses an eager GalleryPage wrapper around the existing GalleryPortfolio and Site shell for matching server/browser markup. The build fetches the same public 100-photo endpoint and maps only the portfolio view fields into a route-validated snapshot.
- Photos, responsive sources, authored labels/captions, dimensions and navigation are present in initial HTML. Rendered Gallery images do not depend on an onLoad opacity change, and their placeholders cannot obscure no-JavaScript content. Existing lightbox, layout and booking CTA behavior are retained.
- Successful snapshots seed the Gallery state without refetching the 100-photo endpoint on hydration. A successful empty list shows the existing empty message; unavailable/malformed responses show an honest retry state, with browser retry available. Strict CMS builds and smoke checks reject unavailable gallery data, while allowing successful empty collections.
- Shared smoke validation now checks Gallery image count, source/alt, captions and empty/unavailable states. Snapshot validation rejects malformed dimensions/sources, foreign media and cross-route payloads.
- Final release check passed with existing warnings; eight populated browser cases cover JS/no-JS, mobile/desktop and both stored themes; six browser cases cover empty, unavailable and edited rebuilds. Eight malformed snapshots were rejected. Strict HTML smoke passed for populated/empty/edited builds, and optional smoke passed for unavailable output. Mobile no-JavaScript screenshot inspected. [Evidence](./evidence/f04-gallery-local-verification.json). No spec files or external writes.

**Next gate:** deploy, run both production smoke commands, and review actual Gallery images, captions/alt text, no-JavaScript visibility, themes, lightbox and enquiry. Then continue Work/About/Stories/Contact/legal families. F04 remains In progress; total stays 10 / 19.

### Increment 7 — Work initial HTML (8 September 2026)

User reported both production smoke commands passed after the Gallery/middleware changes, then explicitly authorized Work rendering.

- `/work` now uses an eager WorkPage wrapper around the existing FeaturedWork section and Site shell. Build and hydration use the existing featured-photo mapping, preserving public image sources, alt text, titles, category and location/year fields.
- The build loads `/photos?featured=true` and seeds only the featured resource for Work. Successful hydration does not request the same collection again. Empty lists remain empty; unavailable responses render the honest portfolio-unavailable message and remain eligible for browser retry. Strict CMS builds and smoke checks reject unavailable featured data.
- Work reveal styles are made visible in initial HTML so no-JavaScript visitors see its heading and cards. The existing layout, lightbox and navigation are retained. Other page-family snapshot resources remain excluded.
- Validation: release check passed with existing warnings; strict HTML smoke passed for populated, empty and edited builds; optional smoke passed for unavailable output; eight populated JS/no-JS × mobile/desktop × stored-theme cases plus six empty/unavailable/edited browser cases passed. Eight malformed snapshot cases were rejected. Mobile no-JavaScript screenshot inspected. [Evidence](./evidence/f04-work-local-verification.json). No spec files, live CMS writes or deployment.

**Next gate:** deploy and run both production smoke tools; review actual featured photos/captions, no-JavaScript visibility, themes, lightbox and enquiry. Then proceed to About, Stories, Contact and legal pages. F04 remains In progress and the completion count stays 10 / 19.

### Increment 8 — About initial HTML (8 September 2026)

User authorized the next F04 increment after About was identified as the next page. Work deployment evidence remains pending and is not inferred from this authorization.

- `/about` now renders and hydrates the existing About component, preserving its F09 heading hierarchy, story, mission, team and process sections. Observer-dependent hiding is disabled for this rendered page's reveal elements.
- The build reads `/staff-profiles` and `/behind-scenes`. Snapshot mapping selects only public name/job title/bio/photo and title/image/video/description fields. No raw staff/admin metadata is embedded. Loaded resources seed the provider independently, avoiding duplicate requests while allowing unavailable resources to retry in the browser.
- Successful empty lists omit their sections. An unavailable collection cannot discard the other collection or the story/mission. Strict CMS build and smoke checks reject unavailable collections; optional builds retain an honest partial page without invented staff/process records.
- Release check passed with existing warnings. Eight populated browser cases cover JS/no-JS, mobile/desktop, both stored themes, video-dialog open/Escape/focus return and navigation. Eight further cases cover empty collections, each independent failure and edited story/biography rebuilds. Nine malformed/cross-route/resource snapshots rejected. Private-field sentinels absent. Mobile no-JavaScript screenshot inspected. [Evidence](./evidence/f04-about-local-verification.json).

**Next gate:** deploy and run both smoke tools; review approved biographies, photos, story, headings, no-JavaScript visibility, themes, enquiry and real video playback. Fixture dialog checks do not prove playback. Continue Stories, Contact and legal pages afterward. F04 remains In progress; total stays 10 / 19. No spec files or external writes.

### Production verification attempt — 8 September 2026

At the user's request, ran both smoke tools directly against `https://dollpictures.in`. Both failed. The public catalog remained accessible and identified build commit `5b3a6e43a522a6820e2b6923a7fbc4b61e056bab` (Work), created `2026-09-08T15:11:00.404Z`, with 32 paths and successful CMS provenance. Local HEAD `881e48c3a18cd32b96556882c4e5a9fedc7c612c` includes About and was not deployed. Direct Work/About/Gallery requests returned HTTP 500 with `MIDDLEWARE_INVOCATION_FAILED`; canonical variants and true-404 checks also failed. No deployed HTML/browser acceptance is claimed.

A local emitted-JavaScript reproduction failed to import the middleware's extensionless module path. Corrected middleware/shared imports for native Node ESM, added the required JSON import attribute, and switched root compilation to NodeNext. `check:release` now executes a durable emitted-runtime check: 27 redirect/exclusion/failure cases and the full release passed. This repairs a demonstrated local startup failure consistent with the production symptom; the provider runtime stack was unavailable and deployment is still required to confirm recovery. [Evidence](./evidence/f04-production-verification-2026-09-08.json).

**Immediate next gate:** deploy the middleware repair, confirm the served commit, rerun both smoke commands and then perform browser/no-JavaScript review. Keep F04 In progress. No deployment was performed during this verification.

**Same-session deployment update:** a recheck at `2026-09-08T15:40:34.947Z` identified About commit `881e48c3a18cd32b96556882c4e5a9fedc7c612c`, built `2026-09-08T15:37:51.342Z`. About is now deployed, but its response still returns HTTP 500 / `MIDDLEWARE_INVOCATION_FAILED`. Both smoke tools were rerun against this newer deployment and failed. The runtime repair remains local.

### Production recovery verified — 9 September 2026

Reran both production smoke tools with correctly separated `--require-cms --base-url` flags. CMS-strict HTML validation and all 98 path checks passed against `https://dollpictures.in`. The build manifest identifies commit `aa0f0ca33020a498d0638ba5627d8247525071ad`, built `2026-09-08T16:22:56.914Z`, with 32 published paths. Direct Work, About and admin/enquiries requests returned HTTP 200; admin retained `X-Robots-Tag: noindex, nofollow`. This supersedes the prior middleware HTTP failure for automated deployment checks. [Evidence](./evidence/f04-production-recovery-2026-09-09.json).

Manual real-content, media/video, accessibility and browser acceptance remain separate; no authenticated admin action or enquiry submission was tested. Continue Stories, Contact and legal rendering. F04 remains In progress; totals unchanged.

### Final planned families — 9 September 2026

User requested completion of the remaining implementation together. Stories, Contact, Privacy and Terms now use their existing components for matching initial HTML and browser hydration. The shared core-route map drives rendering eligibility and full-content smoke coverage; service/package eligibility remains catalog-driven. Existing legal wording and its revision date are preserved.

- Stories loads public testimonials at build time and projects only name, role, avatar, rating, text, likes and reply into the snapshot. Successful empty collections retain the existing approval/empty message. Missing resources remain empty and eligible for browser recovery; strict CMS builds reject unavailable collections. Ratings, likes and text shapes are validated before hydration. Raw CMS metadata is omitted.
- Contact seeds its existing featured photograph from the public featured endpoint and requests that resource on client-only visits or recovery. The contact methods, labelled fields and links are present without JavaScript. The form stays disabled until hydration enables its existing submission handler, with a readable phone/email/WhatsApp alternative. Mocked error/retry/success behavior passed; no real enquiry was sent.
- Privacy and Terms include all existing article sections and links in initial HTML. Their initial and hydrated components match. The four pages do not use observer-only hiding for their main content.
- `check:release` passed, including middleware runtime validation; eight existing lint warnings and existing bundle-size warnings remain. CMS-strict HTML smoke passed for populated, empty and edited fixtures. Strict builds rejected unavailable review/featured collections; optional builds and browser recovery passed independently. Forty malformed snapshot/missing-content cases were rejected. Eighty-four browser cases covered four pages, JS/no-JS, mobile/desktop, stored themes, navigation, mocked enquiry, controlled edits, missing snapshots/assets and independent resource failures. Mobile no-JavaScript Stories/Contact screenshots inspected. [Evidence](./evidence/f04-final-families-local-verification.json).

**Next gate:** deploy this candidate and run both updated smoke commands, then review approved reviews/photos/legal copy, no-JavaScript content, themes and interactions on the deployed pages. Earlier production success does not verify these additions. F04 is **Ready for verification**; final closure and master completion totals await deployment/manual acceptance. No spec files, CMS writes or deployment were added during this increment.

### Final-family production checks passed — 9 September 2026

After the user reported both smoke checks passing, reran the CMS-strict HTML smoke and all 98 path checks against `https://dollpictures.in`; both exited successfully. The served catalog identifies commit `7a8fe9a9c6e7b01ae25297587cdffefd4b1f3006`, built `2026-09-09T09:14:02.712Z`, with 32 published paths. Direct requests at `2026-09-09T09:20:18.562Z` confirmed HTTP 200, substantive content and one matching snapshot for each of Stories, Contact, Privacy and Terms. [Evidence](./evidence/f04-final-families-production-2026-09-09.json).

Automated deployment acceptance is now recorded for the final families. The pasted `3.` shell error was a numbered-list label entered as a command and did not affect either smoke result. Manual production content/browser review and approval remain pending; no real enquiry was submitted. F04 stays **Ready for verification**, with no increase to completed totals until the remaining acceptance is recorded.
