# Public service discovery rollout — 2026-09-07

PR: https://github.com/alpha-beta-team/doll-pics/pull/3
Implementation: `4947df166bde53effae3166dcdd3a6c140373808`, plus `e9312935c15f7339e5cd162bb5d8d779428c160b` for delayed-CMS reveal timing.

## Changes

- Shared service previews preserve the existing card layout and navigation when photographs are absent or fail. Available fallback photographs must carry an explicit matching public category; no extra API requests or new stock images are introduced.
- Seven confirmed missing `/images/services/` assets are excluded before HTML rendering: maternity, newborn, family, toddler, baby-shower, ear-piercing and kids-photography JPGs. Existing configured stock images were not replaced or expanded.
- Homepage stories, gallery captions and lightboxes, service imagery and initial HTML share camera-filename cleanup, preserving authored titles and descriptions.
- Closing service actions link to matching published package destinations, including the live plural toddler category slug. Unpublished package categories stay out of snapshots; an entirely unpublished response does not restore default category links.
- The service-grid reveal observer now mounts with the asynchronously loaded cards, preventing transparent cards when CMS navigation arrives after the listing. A delayed-response regression test covers this case.
- Opening hours, enquiry submission contracts and the three-service HTML scope are unchanged. No backend or stored CMS records changed.

## Local and hosted validation

- `check:release`: app/node typechecks, 19 library tests, 79 admin tests, 38 SEO/rendering tests, lint and production build passed. Existing lint/build warnings remain.
- `test:browser`: 39 passed with no retries. Includes image failures and recovery, category-safe fallback, responsive sources, decorative alt text, cleaned homepage/gallery labels, mobile/desktop layouts and the existing hydration/enquiry suite.
- `test:html`: 29 passed, including no-JavaScript HTML, original heading retention, seeded CMS outage behaviour, partial-resource recovery, cross-service navigation, visual parity and mocked single enquiry/lead events.
- GitHub Actions: https://github.com/alpha-beta-team/doll-pics/actions/runs/34115615609 — passed.
- Initial browser fixture failures were corrected: fixture-only sizing classes were outside Tailwind's content scan, and responsive WebP sources belong on `picture source`, not the fallback `img`. Assertions remain strict; no retries or error suppression added.

## Preview environment

Final preview deployment: `dpl_Cs5yorLtY38NeedHT4MBZqeDAQQs`.
URL: https://doll-pictures-erode-1fc17bxrz-kaarmuhilans-projects.vercel.app
Branch-specific public `VITE_API_URL`: https://doll-backend-27n8.onrender.com/api

Strict hosted HTML validation passed for all three services and route exclusions with current CMS snapshots. All 20 final hosted browser cases passed across 390px and 1440px; visible service cards and package actions were reviewed in screenshots.

The existing backend CORS policy returns an allowed origin for `https://dollpictures.in`, but not the Vercel preview host. Direct preview browsing therefore cannot fully exercise client-loaded CMS sections. Hosted browser QA routes production-origin frontend requests to the preview deployment, while reading unchanged live public CMS responses. This verifies the candidate without changing backend CORS or production routing. Final production browsing must be direct.

Only read-only requests are allowed during hosted browser QA. Enquiry submissions are tested locally against mocks.

## Production acceptance

PR #3 merged as `633bf951176086aca0e2dccf3f3ba43422aa15bf` after final preview acceptance and hosted CI success. Production deployment: `dpl_AvYQskUL9eV345oHEnhQDmNDFXm1`, serving `/assets/index-B-Nn6d4e.js` on all three rendered service routes. Both production smoke commands passed: 32 canonical routes, sitemap/robots/true 404 checks; three CMS-backed rendered services, snapshots, metadata and route exclusions. All 20 direct production browser cases passed at 390px and 1440px, including initial HTML with JavaScript disabled, original heading retention after hydration, decoded hero images, modal opening, cross-service navigation, clean gallery descriptions, usable service cards and the live toddler package destination. No page exceptions or horizontal overflow were detected. Production screenshots were reviewed; rollback was not required.
Rollback reference before this increment: `dpl_J8kQeZNJ1znE6227CBYBdKAStkzW`, serving `/assets/index-DRTpfIjm.js`.

## Evidence

- [Final preview observations](evidence/service-discovery-2026-09-07/preview.json)
- [Mobile homepage text card](evidence/service-discovery-2026-09-07/preview/home-390.png)
- [Mobile services card](evidence/service-discovery-2026-09-07/preview/services-390.png)
- [Desktop services card](evidence/service-discovery-2026-09-07/preview/services-1440.png)
- [Mobile package actions](evidence/service-discovery-2026-09-07/preview/newborn-baby-390-js.png)
- [Desktop package actions](evidence/service-discovery-2026-09-07/preview/newborn-baby-1440-js.png)

The temporary preview automation credential was revoked after verification; the project has zero remaining automation bypass credentials.

- [Direct production observations and served asset](evidence/service-discovery-2026-09-07/production.json)
- [Production general SEO smoke](evidence/service-discovery-2026-09-07/production-seo-smoke.txt)
- [Production CMS HTML smoke](evidence/service-discovery-2026-09-07/production-html-smoke.txt)
- [Production mobile card](evidence/service-discovery-2026-09-07/production/services-390.png)
- [Production desktop card](evidence/service-discovery-2026-09-07/production/services-1440.png)
- [Production mobile package actions](evidence/service-discovery-2026-09-07/production/newborn-baby-390-js.png)
- [Production desktop package actions](evidence/service-discovery-2026-09-07/production/newborn-baby-1440-js.png)

These post-deployment evidence files are saved in the local workspace. The implementation is merged and deployed; the PR description also records the final production acceptance.
