# Three-service public HTML rollout

The existing React/Vite build renders newborn, wedding and maternity into `#root` using the same ServicePage and route tree as the browser. `src/lib/publicHtmlRoutes.ts` is the shared scope registry. Homepage, packages and other service pages retain their existing rendering. No server runtime, backend contract or database change is required.

## Rendering and recovery

The response contains service headings, lead, available published CMS sections, category imagery, studio details, navigation, and phone/WhatsApp links. Interactive galleries and the enquiry modal attach during hydration. Without JavaScript, direct contact links remain available.

A version-1, script-safe public snapshot seeds the matching route. The page component is loaded before hydration; the browser's first render matches the build before restoring the saved theme. Successfully seeded resources do not immediately refetch. Cover and gallery failures are independent: missing resources retain existing bounded browser recovery without discarding available imagery. Invalid or cross-route snapshots fall back to the client renderer.

A successfully fetched publication list gates which registered services receive rendered HTML. A CMS outage may use existing static defaults; unavailable category imagery is omitted rather than replaced with unrelated portfolio work. Unknown/private CMS fields are excluded. Existing canonical, sitemap, 404 and private routing behavior is retained.

Snapshots represent build-time content. Publish CMS changes and rebuild/redeploy to refresh both initial and hydrated content. Production acceptance requires current CMS-backed content, even though offline fallback is still supported.

## Automated checks

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run test:browser
npm run seo:smoke
npm run seo:html-smoke -- --require-cms
```

`test:browser` includes the public HTML suite; `test:html` runs only that suite. Both use a temporary production build, a local read-only CMS fixture and intercepted enquiries/analytics. No real enquiries or notifications are sent. The existing GitHub release workflow runs the full release and browser checks.

Coverage includes all three services at 390px and 1440px: usable no-JS content and images, hydration preserving the original heading, saved theme restoration, CMS outage behavior, form validation and one mocked enquiry/lead event, cross-service navigation, malformed snapshots, gallery/FAQ interactions, and exclusion of private/unpublished content. Individual service/viewport visual comparisons produce before/after screenshots. Review those images in addition to geometry/image-order assertions.

Tests drain active mocked route handlers before closing pages/contexts, including failure cleanup. They do not hide request errors or use retries to mask failures.

`seo:smoke` verifies the sitemap, baseline metadata and true 404. `seo:html-smoke` additionally parses the HTTP response and requires real service content inside `#root`, a matching route marker and valid snapshot, consistent metadata/structured data, contact/navigation links and available snapshot imagery. It rejects noscript-only shells and snapshot leakage on excluded routes. Both must pass for release acceptance.

Preview example:

```sh
npm run seo:html-smoke -- --require-cms --base-url https://YOUR-PREVIEW-HOST
```

`--base-url` (or `SEO_CHECK_BASE_URL`) changes where requests go. Canonicals are checked against `VITE_SITE_URL`, defaulting to `https://dollpictures.in`, independently of the preview hostname. Supply environment variables explicitly for smoke commands; the new checker does not load local .env files. Output names failed routes and exits nonzero on failure.

Vercel's intentional preview `X-Robots-Tag: noindex` is allowed on a different fetch origin; a blocking HTTP robots header on the canonical production origin still fails. Protected previews require authenticated access. The checker also exports its runner with an injectable fetch function for authenticated automation; keep credentials in request headers restricted to that host and out of URLs, logs and artifacts.

The HTML validator is also run against the actual isolated fixture build by Playwright, not only synthetic unit fixtures. No minimum image count is imposed when media is legitimately empty. Use `--require-cms` for preview and production acceptance: it additionally requires loaded CMS site content and a published target service. The default mode remains useful for verifying intentional offline fallback builds.

## Controlled freshness acceptance

The fixture server accepts `PUBLIC_HTML_FIXTURE_FILE` pointing to a temporary JSON copy of `tests/public-html/fixtures.json`. This supports an isolated CMS edit/rebuild check without altering tracked fixture content or production CMS data:

1. Run the default fixture build and verify the build-authored service heading in both initial and hydrated HTML.
2. Stop that server; copy the fixture JSON to a temporary location and change a published service heading there.
3. Start `PUBLIC_HTML_FIXTURE_FILE=/absolute/temporary/fixture.json node scripts/test-public-html-server.mjs`. It rebuilds before serving on port 4180 with fixture CMS on 4191.
4. Verify the changed heading in the response, snapshot and hydrated page, and run the HTML smoke against `http://127.0.0.1:4180`.
5. Stop the server and discard the temporary file. This is QA freshness evidence, not proof of a production CMS edit.

For real-content acceptance, build a separate candidate with the public API used by the deployed frontend and `SEO_REQUIRE_CMS=true`. Confirm all three service records are published, site content is marked loaded, and output matches the available public CMS sections/media. A passing static-fallback build alone does not establish this.

## Hosted rollout and stop conditions

1. Push the focused branch and require hosted release checks to pass.
2. Inspect the Vercel preview built from that commit. Confirm the three route snapshots and current CMS content, mobile/desktop no-JS content, hydration, enquiry modal opening and navigation. Mock any submissions.
3. Prove the controlled QA content edit/rebuild described above.
4. Release through the existing Vercel workflow. Record the commit, deployment identifier and served entry script.
5. Run both smoke commands on production. Recheck all three clean URLs with JavaScript enabled/disabled, including available image loading and mobile overflow. Keep homepage/private-route/404 checks.
6. Stop on incorrect service content, missing published content, hydration errors, routing regressions or broken interactions. Restore the previous verified deployment if production is affected.

Completion requires live evidence for all three routes. Local tests, a preview build, Search Console inspection and production acceptance are separate records. Search rankings are not a release criterion. Do not expand rendering to additional routes as part of this increment.
