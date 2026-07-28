# SEO-01 — Restore Public Sitemap Delivery

**Priority:** P0
**Effort:** Medium
**Status:** In progress — implementation complete, production rollout pending
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

`https://dollpictures.in/sitemap.xml` consistently returns the backend-generated XML sitemap so Google can discover every intended canonical page.

## Current evidence

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
- [ ] Confirm unknown public routes still return the generated 404 page.
- [x] Apply the equivalent rule to Netlify.

### Resilience

- [x] Keep live backend proxy delivery.
- [x] Add scheduled monitoring for upstream failures and timeouts.
- [x] Ensure the backend returns an explicit XML content type.
- [ ] Prevent Cloudflare or the hosting layer from caching an HTML 404 at the sitemap URL.

### Automated checks

- [x] Add a production smoke script for `/robots.txt` and `/sitemap.xml`.
- [x] Fail deployment verification when sitemap status is not 200.
- [x] Fail when content type is not XML.
- [x] Fail when the body does not contain `<urlset>` and at least the expected core URLs.
- [x] Verify every `<loc>` is HTTPS and uses the apex canonical host.

### Google operations

- [ ] Resubmit `https://dollpictures.in/sitemap.xml` in Search Console.
- [ ] Confirm Search Console reports “Success”.
- [ ] Inspect the homepage and all service pages after submission.

## Acceptance criteria

- [ ] Public sitemap returns HTTP 200.
- [ ] Response content type is `application/xml` or `text/xml`.
- [ ] Sitemap contains all intended canonical core, service, and package URLs.
- [ ] No admin, preview, API, parameter, or 404 URLs appear.
- [ ] `robots.txt` references the working sitemap.
- [ ] The backend sitemap and public sitemap URL sets match.
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

Pending production work:

- Configure `SEO_REQUIRE_CMS=true` in frontend production builds.
- Create the production Vercel deploy hook and store it in backend `FRONTEND_DEPLOY_HOOK_URLS`.
- Deploy backend then frontend, purge any cached `/sitemap.xml` 404, and run `npm run seo:smoke`.
- Resubmit the sitemap in Google Search Console and record the result.

## Likely files/systems

- `vercel.json`
- `netlify.toml`
- `scripts/generate-sitemap.mjs`
- `photography-cms-backend/src/sitemap/`
- Vercel/Cloudflare routing and cache configuration
- Google Search Console

## Rollback

If the external rewrite proves unreliable, ship a valid static `sitemap.xml` from the build as a temporary fallback and schedule redeployment when CMS routes change.
