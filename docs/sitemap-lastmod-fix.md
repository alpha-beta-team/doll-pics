# Fix: sitemap `<lastmod>` missing on 29 of 32 URLs

## Problem

The live `https://dollpictures.in/sitemap.xml` has 32 URLs, but only 3 of them have a `<lastmod>`:

| URL | lastmod |
|---|---|
| /wedding-photography-erode | 2026-09-09T18:25:01.325Z |
| /family-photography-erode | 2026-09-09T10:04:44.494Z |
| /birthday-event-photography-erode | 2026-09-09T12:55:37.800Z |

The 9 other service pages, all 9 package pages and the 11 hub and legal pages have none.

This was still true after the `backfill-content-updated-at` migration was dry-run on 23 Nov and the frontend was rebuilt and deployed.

## How it works today

1. `doll-pics/scripts/prerender.ts` writes `dist/sitemap.xml` with `buildSitemapXml(siteUrl, sitemapPaths, lastmodByPath)` (around line 637).
2. `lastmodByPath` is built in `doll-pics/scripts/lib/seo-build.ts`, in `loadCmsOverlays()` (around lines 119–127). A path gets a date **only** if:
   - packages: the public `GET /package-categories` row has `contentUpdatedAt` as a string;
   - services: `siteContent.serviceNavLinks[].contentUpdatedAt` is a string.
3. In the backend, `contentUpdatedAt` is set **only** when a published page's SEO fields change:
   - `src/package-categories/package-categories.service.ts`, in `update()`;
   - `src/site-content/site-content.service.ts`, in `upsert()`.

   Records that haven't been edited since that field was added stay `null`, so those pages never get a date.
4. `doll-pics/scripts/lib/sitemap.mjs` drops a date that is missing, invalid or in the future.
5. If the build can't reach the API, `loadCmsOverlays()` logs `SEO build: … unavailable or invalid; using static fallback` and `lastmodByPath` stays empty.

## Step 1: Find out which cause applies (no code changes)

Run these in `photography-cms-backend` and `doll-pics`, and note the result of each.

```bash
# A. Which database does the backfill write to?
grep MONGODB_URI photography-cms-backend/.env

# B. Which API does the frontend build read from?
grep -E "API|VITE_" doll-pics/.env doll-pics/.env.local doll-pics/netlify.toml doll-pics/vercel.json

# C. Does the live public API return dates? (use the API base from B)
curl -s "$API_BASE/package-categories" | jq '.[] | {path, contentUpdatedAt}'
curl -s "$API_BASE/site-content" | jq '.serviceNavLinks[] | {path, contentUpdatedAt}, .updatedAt'

# D. Was the backfill applied? Run against the SAME database the API in B uses.
cd photography-cms-backend && npm run migrate:backfill-content-updated-at
```

How to read the results:

- **D still prints "Would set …" lines:** the backfill was never applied to that database. Run `npm run migrate:backfill-content-updated-at -- --apply`, then rebuild and deploy. Done.
- **D prints `0 package categories, 0 service links`, but C shows `null`:** the backfill went to a different database than the one the API uses, or the API serves cached responses. Fix the URI or restart the API, then rebuild.
- **C shows dates, but the deployed sitemap still has 3:** the deploy build couldn't reach the API. Check the deploy build log for `SEO build: … unavailable`, and make sure the deploy environment's API base matches B.

## Step 2: Code fix, so this can't happen again

Fall back to the record's own Mongo `updatedAt` whenever `contentUpdatedAt` is `null`. Both schemas use `@Schema({ timestamps: true })`, so `updatedAt` is always set. This makes the backfill unnecessary and covers any record created later.

### Backend: `src/package-categories/package-categories.service.ts`

In `findAllPublic()`, also select `updatedAt`:

```ts
.select('name slug path description seoTitle seoDescription heading lead order contentUpdatedAt updatedAt')
```

### Frontend: `doll-pics/src/shared/types/index.ts`

Add an optional `updatedAt?: string` to `PublicPackageCategory` and to `PublicSiteContent`, if they don't already have it.

### Frontend: `doll-pics/scripts/lib/seo-build.ts`, in `loadCmsOverlays()`

Replace the two `lastmodByPath` loops with:

```ts
const dateString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim() !== '');

for (const raw of packageCategories ?? []) {
  const link = getPublishedPackageNavLinks([raw])[0];
  const date = dateString(raw.contentUpdatedAt, raw.updatedAt);
  if (link && packagesByPath.has(link.path) && date) lastmodByPath[link.path] = date;
}
for (const raw of siteContent?.serviceNavLinks ?? []) {
  const link = getPublishedServiceNavLinks([raw])[0];
  const date = dateString(raw.contentUpdatedAt, siteContent?.updatedAt);
  if (link && servicesByPath.has(link.path) && date) lastmodByPath[link.path] = date;
}
```

Hub and legal pages (`/`, `/services`, `/packages`, `/gallery`, `/work`, `/about`, `/stories`, `/contact`, `/booking`, `/privacy`, `/terms`) have no CMS record, so leave them without a date. Don't stamp them with the build time: Google ignores `lastmod` values that change on every build.

### Optional: fail the CMS build loudly

In `doll-pics/scripts/prerender.ts`, just before the sitemap is written (around line 637), add:

```ts
if (String(process.env.SEO_REQUIRE_CMS).toLowerCase() === 'true') {
  const cmsPaths = [...packagesByPath.keys(), ...servicesByPath.keys()];
  const undated = cmsPaths.filter((path) => !lastmodByPath[path]);
  if (undated.length) throw new Error(`SEO build: no lastmod for CMS routes: ${undated.join(', ')}`);
}
```

This only runs in `npm run build:cms`, which sets `SEO_REQUIRE_CMS=true`.

## Step 3: Verify

1. Backend: `npm run build` (or your typecheck), then deploy or restart the API.
2. Re-run the `curl` checks from Step 1C. Package rows should now include `updatedAt`.
3. Frontend: `npm run build`, then:
   ```bash
   grep -c "<lastmod>" dist/sitemap.xml   # expect 21 (12 services + 9 packages)
   grep -c "<url>" dist/sitemap.xml       # expect 32
   ```
4. Deploy, then check `https://dollpictures.in/sitemap.xml` for 21 `<lastmod>` entries.
5. In Search Console, resubmit the sitemap under **Sitemaps**.

## Done when

- The live sitemap has 32 URLs and 21 `<lastmod>` entries (all service and package pages).
- Every date is real (when the CMS record was last saved) and none is in the future.
- The hub and legal pages have no `<lastmod>`.
