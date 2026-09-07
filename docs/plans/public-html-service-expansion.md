# Wedding and maternity public HTML expansion

Implemented 2026-09-07. The explicit rendering registry now includes newborn, wedding and maternity only. All three reuse the existing ServicePage, version-1 snapshot structure and a single build-time Vite instance. Shared CMS overlays load once; each service's cover and gallery load independently using the existing category mapping, 30-photo limit and retry policy.

Snapshot parsing requires a registered matching route, supported version, public data collections, service links and route-specific media. Invalid snapshots use the existing client renderer. Successful snapshot resources remain cached for the provider lifetime: publishing CMS changes still requires a rebuild/redeployment. No backend API, database, permissions, pricing, page layouts or production enquiry behavior changed. Homepage and package rendering remain outside this release.

## Validation

- Static-fallback release checks: typecheck, 15 library tests, 79 admin tests, 23 SEO/rendering tests, lint and production build passed. Lint retains six existing Fast Refresh warnings.
- 24 isolated production-browser tests passed: all three routes at mobile/desktop widths with JavaScript disabled; hydration and saved theme during a CMS outage; one mocked enquiry and lead event per service; service-to-service navigation, metadata, media, enquiry defaults and page/service analytics; malformed snapshot recovery, gallery/lightbox and native FAQ interactions; exclusions for private and other public routes.
- Before/after screenshots compare the same fixtures and bundle in client-only versus hydrated rendering at 390px and 1440px. Heading geometry and gallery image order match; screenshots are written into Playwright test-results. These are fixture comparisons, not live-CMS visual approval.
- A separate local preview build against the current public CMS successfully rendered three sections per route and category photos: newborn 17, wedding 6, maternity 5. This establishes build-time CMS availability, not hosted deployment.
- Fixtures intercept analytics and enquiries. The test browser's public hostname is routed to the local test server; no real enquiries or tracking requests are sent.

## Release gates

Push the focused branch and require hosted release checks before merging/deploying. Inspect the hosted preview and production raw HTML for the new bundle, correct route snapshot/canonical, and current CMS content. Verify mobile/desktop content without JavaScript, hydration, enquiry modal opening and cross-service navigation without submitting a real enquiry.

Stop on wrong content, hydration errors, routing regressions or broken interactions. Restore the previous deployment/commit if needed. A controlled CMS edit followed by rebuild is still a separate acceptance check and must not be replaced by merely comparing unchanged CMS content. Do not expand further until release acceptance passes.
