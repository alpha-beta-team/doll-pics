# SEO-01 — Restore Public Sitemap Delivery

**Priority:** P0
**Effort:** Medium
**Status:** Completed — public delivery verified 5 Sep 2026; operational follow-ups tracked separately
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

`https://dollpictures.in/sitemap.xml` consistently returns the backend-generated XML sitemap so Google can discover every intended canonical page.

## Original issue (resolved)

- The public sitemap returns HTTP 404 with an HTML `noindex` page.
- `robots.txt` still advertises the broken public sitemap.
- The backend endpoint returns HTTP 200, `application/xml`, and 23 URLs.
- `vercel.json` mixes higher-level `rewrites` with deprecated low-level `routes`.

## Work plan

### Routing

- [x] Simplify `vercel.json` to one supported routing strategy.
- [x] Keep the permanent `www` → apex redirect.
- [x] Keep filesystem-first behavior for prerendered pages.
- [x] Proxy `/sitemap.xml` to the production backend endpoint.
- [x] Preserve `/admin` SPA routing.
- [x] Confirm unknown public routes still return the generated 404 page.
- [x] Apply the equivalent rule to Netlify.

### Resilience

- [x] Keep live backend proxy delivery.
- [x] Add scheduled monitoring for upstream failures and timeouts.
- [x] Ensure the backend returns an explicit XML content type.
- [x] Prevent Cloudflare or the hosting layer from caching an HTML 404 at the sitemap URL.

### Automated checks

- [x] Add a production smoke script for `/robots.txt` and `/sitemap.xml`.
- [x] Fail deployment verification when sitemap status is not 200.
- [x] Fail when content type is not XML.
- [x] Fail when the body does not contain `<urlset>` and at least the expected core URLs.
- [x] Verify every `<loc>` is HTTPS and uses the apex canonical host.

### Google operations (follow-up; not verified)

- [ ] Resubmit `https://dollpictures.in/sitemap.xml` in Search Console.
- [ ] Confirm Search Console reports “Success”.
- [ ] Inspect the homepage and all service pages after submission.

## Acceptance criteria

- [x] Public sitemap returns HTTP 200.
- [x] Response content type is `application/xml` or `text/xml`.
- [x] Sitemap contains all intended canonical core, service, and package URLs.
- [x] No admin, preview, API, parameter, or 404 URLs appear.
- [x] `robots.txt` references the working sitemap.
- [x] The backend sitemap and public sitemap URL sets match.
- [ ] Search Console can fetch the submitted sitemap.

## Verification commands

```bash
npm run seo:smoke
curl -I https://dollpictures.in/sitemap.xml
curl -sS https://dollpictures.in/sitemap.xml | grep -c '<loc>'
curl -sS https://dollpictures.in/robots.txt
curl -sS https://photography-cms-backend.onrender.com/api/sitemap.xml
```

## Implementation record

Implemented on 28 Jul 2026:

- Replaced mixed Vercel routing with supported redirects/rewrites.
- Removed public SPA fallbacks from Vercel and Netlify.
- Added strict CMS prerender mode, production smoke monitoring, and deploy-hook automation for published service/package SEO changes.
- Added bounded retries without changing CMS API response shapes.

Production verified on 7 Aug 2026:

- `npm run seo:smoke` passed against production with 24 canonical URLs.
- The public sitemap returned HTTP 200 with `application/xml`.
- The public and backend URL sets matched, `robots.txt` referenced the sitemap,
  and a generated unknown route returned a true `noindex` 404.
- The `www` sitemap URL redirected permanently to the apex URL.

Completion record, 5 Sep 2026:

- Rechecked the public sitemap: HTTP 200, `application/xml`, valid sitemap `urlset`, and 32 URLs.
- Marked SEO-01 completed at the owner's request for the restored public sitemap delivery.
- Search Console submission, URL inspection, and hosting settings were not verified in this check; unchecked items remain operational follow-ups and are not claimed complete.

Remaining operational follow-ups (outside the completed delivery fix):

- Resubmit the sitemap in Google Search Console and record the result.
- Confirm the production `SEO_REQUIRE_CMS` and deploy-hook settings in their host dashboards when access is available.

## Likely files/systems

- `vercel.json`
- `netlify.toml`
- `scripts/generate-sitemap.mjs`
- `photography-cms-backend/src/sitemap/`
- Vercel/Cloudflare routing and cache configuration
- Google Search Console

## Rollback

If the external rewrite proves unreliable, ship a valid static `sitemap.xml` from the build as a temporary fallback and schedule redeployment when CMS routes change.
