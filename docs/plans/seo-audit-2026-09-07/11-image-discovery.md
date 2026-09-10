# F11 — Provide crawlable discovery for intended photography

**Audit ID:** F11  
**Priority:** Medium  
**Effort:** Medium (2–4 developer days)  
**Status:** Ready for verification — production engineering checks passed; content-owner acceptance pending\
**Responsible role:** Frontend/CMS engineer with content reviewer  
**Assigned owner:** Frontend implementation; content owner for publication approval\
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority approved photography has a normal HTML discovery path without requiring clicks to reveal its only reference.

## Audit baseline evidence

- [`src/pages/ServicePage.tsx:527`](../../../src/pages/ServicePage.tsx#L527) — Only six gallery images initially render before expansion.
- [`src/pages/ServicePage.tsx:692`](../../../src/pages/ServicePage.tsx#L692) — Show more is interaction-driven.
- [`src/components/gallery/GalleryPortfolio.tsx:28`](../../../src/components/gallery/GalleryPortfolio.tsx#L28) — The main gallery is capped at 100 photos.
- [`src/lib/api.ts:169`](../../../src/lib/api.ts#L169) — Current public photo query exposes featured, limit and category, not pagination.

The collection cap is a completeness defect only if the intended published collection exceeds it. Interactive lightboxes need not each become indexed pages.

These references describe the audit baseline. Current implementation and verification results are recorded below; historical completion alone does not complete this item.

## Boundaries

Keep bounded responsive downloads and existing gallery interactions. Do not dump every original image into initial HTML or add empty/duplicate SEO pages. Treat image sitemap support as supplemental.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F04](./04-public-html-expansion.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [09-image-discovery](../seo/09-image-discovery.md)
- [08-shoot-case-studies](../seo/08-shoot-case-studies.md)

## Ordered checklist

- [x] Inventory intended published images versus initial HTML discovery and document whether the 100-photo limit truncates the intended collection.
- [x] Keep a curated representative gallery in each rendered public page and link to broader approved work.
- [x] Keep substantive session-level discovery in I01; it is deferred and is not a prerequisite for this increment.
- [x] Pagination is not applicable to the measured 64-photo intended collection. Preserve the bounded query and reject a full 100-record response in strict builds; document a stable backend pagination contract before extending it.
- [x] Supplemental image sitemap: not applicable; none introduced. All intended photos already have Gallery HTML references, and canonical page sitemap behavior is unchanged.
- [x] Local no-interaction crawl and inventory comparison passed; tested the 99/100/101 boundary. Repeat the crawl against the new deployment.

## Acceptance criteria

- [ ] Each priority image intended for search has an accessible HTML page reference or appropriate supplemental discovery entry.
- [x] The first gallery view remains bounded and usable without JavaScript; local and live production browser checks passed.
- [x] The cap is explicitly non-blocking for the measured intended collection; future full responses stop strict builds pending completeness review.
- [x] No private, unpublished, broken or duplicate-canonical destinations were found in the current production discovery output: all 64 image responses, 32 public pages and 98 path checks passed.

## Verification

### Local

The release gate, fixture HTML/crawl checks, 24 browser cases, 15 crawler/exclusion cases, 8 service-preview/diagnostic cases and 10 build/lifecycle states passed. [Evidence](./evidence/f11-image-discovery-2026-09-10.json) separates local mocked responses from six real public image response samples. No spec files were added.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
```

- [x] Record changed behavior, outcomes and fixture/browser evidence. Implementation was committed as `527d2b1cf98affccfb77b5b6accc11e487f18ed2` and verified in production on 10 September 2026.
- [x] Complete local scenario checks and record pagination/image-sitemap decisions above.

### Deployment

These commands passed against production on 10 September 2026 for commit `527d2b1cf98affccfb77b5b6accc11e487f18ed2`. The image check was run with `--image-sample 100`, verifying all 64 current genuine photos. [Saved production evidence](./evidence/f11-production-2026-09-10.json) also records 12 live browser cases. Rerun against the matching CMS API after subsequent deployments.

```sh
npm run seo:html-smoke -- --require-cms --base-url https://dollpictures.in
npm run seo:paths-smoke -- --base-url https://dollpictures.in
npm run seo:images-smoke -- \
  --base-url https://dollpictures.in \
  --api-url https://doll-backend-27n8.onrender.com/api \
  --report ./image-discovery-report.json
```

The image check follows normal public anchors from Home without executing JavaScript, compares Gallery HTML against the public photo inventory, checks canonical destinations/exclusions and samples six image responses. Use `--image-sample 100` to check every discovered photo in the current bounded collection. A CMS publication change needs a successful rebuild/deploy before its HTML inventory matches; this check detects missing newly published photos or stale removed photos. Do not use a local CMS inventory to check production HTML.

The new production crawl finds 64 genuine photos and 64 matching image links in Gallery initial HTML, with no missing IDs or excluded destinations. All 32 public pages were crawled. The three demo photo records remain in the public CMS response but are absent from rendered discovery output; stock service teaser images are also excluded. No new image sitemap needs separate acceptance.

- [x] Record production URL, build timestamp, commit and HTTP/DOM/browser evidence. Preview hosting and the Vercel deployment ID were not separately inspected; the served public catalog matches the F11 implementation commit.

### External

Search Console image-search data and indexing are follow-up observations; client permission and approved collection scope come from the content owner.

- [x] Pending follow-ups recorded: content owner confirms intended photos/client approval and reviews the real gallery after deployment; SEO owner records Search Console image-search observations after indexing has had time to update.

## Rollout and rollback

Revert this frontend increment if the new image links or exclusions regress approved content or gallery interactions. Preserve canonical pages and the existing page sitemap; no image sitemap was introduced.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Deployed | `527d2b1cf98affccfb77b5b6accc11e487f18ed2`: image anchors, full-gallery links, shared exclusions, strict cap guard and `seo:images-smoke` |
| Local remediation validation | Passed | Release gate, fixture HTML smoke, 24 browser cases, 15 crawl/exclusion cases and 10 build/lifecycle states; see linked evidence |
| Preview/production acceptance | Engineering verification passed; content-owner acceptance pending | All three production smoke checks passed; 64 real image responses and 12 live Chromium cases verified. [Evidence](./evidence/f11-production-2026-09-10.json); approved collection scope remains for the content owner |
| External checks | Pending | Content owner confirms approved collection; SEO owner monitors image indexing. Pagination and supplemental image sitemap are currently not applicable |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |
| 2026-09-10 | Implemented normal image links and broader Gallery discovery; filtered demo/unpublished records and guarded the build cap | [Local and production-baseline evidence](./evidence/f11-image-discovery-2026-09-10.json); 64 genuine photos, 3 placeholders, cap non-blocking | Deploy, run HTML/path/image smoke checks and obtain content/browser acceptance; Ready for verification |
| 2026-09-10 | Verified deployed F11 on `527d2b1`: all three production smoke checks and 12 live browser cases passed | [Production evidence](./evidence/f11-production-2026-09-10.json): 64 genuine photos, 64 image links, all 64 image responses valid, 32 crawled pages and 98 path checks | Content owner confirms approved collection/exclusions; Search Console observations remain a later follow-up |

### Inventory and implementation contract — 10 September 2026

The user authorized F11 after F04 implementation and automated production checks passed; F04 manual acceptance remains a separate follow-up. Treat the currently published public CMS photo collection as the intended technical discovery set, excluding known seed/stock placeholders; content-owner approval remains a separate check. No CMS publication flags are changed.

Production build `be8e09fafb6bb3e05093686870e08e09d1c2e386` (built `2026-09-10T02:50:11.735Z`) serves 67 gallery photos. At `2026-09-10T02:54:13.491Z`, both public `/photos` (unlimited metadata inventory) and `/photos?limit=100` returned the same 67 IDs, all present in Gallery initial HTML. Three are known `seed/*` Picsum placeholders, leaving 64 genuine published photos. The 100-photo cap is therefore non-blocking for the measured intended collection. Public backend source applies `isPublished: true`, sorts by `order` and descending `createdAt`, and clamps an explicitly requested limit to 100; it has no pagination contract.

This increment retains the bounded 100-photo frontend query and six-photo service preview. It filters seed/stock/unpublished records from public portfolio mapping and rejects stock service teaser images in the shared preview selector, adds ordinary image anchors with the existing JavaScript lightbox as enhancement, and adds prominent service/package links to `/gallery`. A no-interaction crawl compares initial HTML images with the existing public `/photos` inventory and samples image responses. Strict CMS builds must stop at a full 100-record gallery response until completeness is reviewed; if the intended set exceeds the cap, document and implement a stable backend pagination contract with real page anchors before extending the frontend query. No pagination API is introduced for the current 64-photo set.

No supplemental image sitemap is needed for this increment because every intended photo already has a normal Gallery HTML reference; the existing canonical page sitemap remains the discovery entry point. I01 remains the later home for substantive session stories, without fabricated photo-only SEO pages. [Google's image guidance](https://developers.google.com/search/docs/appearance/google-images) and [crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) support standard image markup and real anchors. [Image sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps) remain supplemental if a future collection needs them.

The new crawler was also run against the old production deployment: it found all 64 genuine Gallery photos, but correctly failed for missing image anchors, the three seed Gallery records, two stock service teaser assets repeated across pages, and missing broader Gallery links. The teaser assets are outside the 67-photo inventory. The updated selector uses genuine category media or the existing text fallback; 8 focused preview/diagnostic checks and the final fixture crawl/browser checks passed. That historical baseline is preserved; the later [production verification report](./evidence/f11-production-2026-09-10.json) records the passing deployed result.

### Production browser acceptance — 10 September 2026

Gallery, Wedding service and Wedding package pages passed 12 live Chromium cases at 390/1440 px with JavaScript on/off. Verified real image navigation without JavaScript, full-gallery navigation, lightbox next/Escape/focus restoration after hydration, service expansion/collapse where available, no horizontal overflow and no page/hydration errors or failed/excluded image requests. Three initial automation clicks occurred before the asynchronous React page module attached and correctly followed the native image link; those cases passed after waiting for the actual click handler. No application change was required. Mobile screenshots were visually reviewed. These checks establish production behavior; they do not establish client permission or replace content-owner approval.
