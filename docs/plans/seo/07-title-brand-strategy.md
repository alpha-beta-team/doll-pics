# SEO-07 — Create a Concise Title and Brand Strategy

**Priority:** P1  
**Effort:** Medium  
**Status:** Implemented locally — deployment and Search Console verification pending
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Every indexable page has a concise, unique, intent-aligned title while structured data and business profiles retain the full canonical business identity.

## Original findings (historical)

- Core page titles now repeat `Doll Pictures by Ramya Vignesh`.
- Homepage title is 68 characters and puts the long brand before the service/location intent.
- Service and package titles still use the shorter `Doll Pictures` suffix.
- `siteName`, `businessName`, and `alternateName` no longer serve distinct purposes.
- Several descriptions are long enough that Google may select or truncate different snippet text.

## Proposed rules

- Full real-world name belongs in GBP and `LocalBusiness.name`.
- A genuine short brand belongs in `alternateName`, `WebSite.name`, and title suffixes.
- Put the primary page intent before the brand on service/search landing pages.
- Keep titles unique, natural, and accurate; do not optimize to a rigid character count.
- Avoid forcing the full byline into every description and heading.

## Work plan

### Identity mapping

- [x] Use SEO-03’s approved canonical name and short brand.
- [x] Assign clear semantics to `businessName`, `siteName`, and `brandByline`.
- [x] Keep the structured-data entity consistent with Google Business Profile.

### Rewrite core titles

- [x] Homepage: lead with wedding/baby photography and Erode.
- [x] Gallery/work: describe portfolio intent.
- [x] Services/packages: retain category and Erode where useful.
- [x] About: emphasize Ramya Vignesh and the Erode studio.
- [x] Stories: use client stories/reviews only when real proof exists.
- [x] Booking: focus on booking a photography session in Erode.
- [x] Privacy/terms: keep simple legal titles.

### Align CMS titles

- [x] Review all 12 currently published CMS service titles.
- [x] Review all nine currently published CMS package-category titles.
- [x] Standardize capitalization and separators.
- [x] Keep CMS fallback and build-time JSON titles aligned.

### Headings and descriptions

- [ ] Make the homepage visible hero copy clearly communicate service and location.
- [ ] Keep poetic copy as supporting text rather than the only page-topic signal.
- [x] Remove awkward repeated full-brand phrases from descriptions.
- [x] Ensure each description is unique and useful to a searcher.

### Automated checks

- [x] Detect duplicate titles/descriptions.
- [x] Warn on unusually long or empty titles.
- [ ] Verify title, H1/topic copy, canonical, and OG title per route.
- [x] Include CMS overlay pages in the check.

## Acceptance criteria

- [x] All indexable routes have unique titles and descriptions.
- [x] Full business name remains correct in structured data.
- [x] Short brand is used consistently as the title suffix.
- [x] Homepage and key service titles lead with user intent.
- [x] `name` and `alternateName` are distinct when an alternate name exists.
- [x] No title is mechanically duplicated between unrelated routes.
- [ ] Prerendered and runtime metadata agree.

## Verification

- [x] Build all 32 current indexable routes using production CMS overlays.
- [ ] Extract and compare title, description, H1/topic, canonical, and OG title.
- [ ] Inspect the live homepage and six service URLs in Search Console.
- [ ] Monitor title rewrites and CTR after recrawling.

## Likely files/systems

- `src/data/seo-pages.json`
- `src/data/service-pages.json`
- `src/data/package-pages.json`
- `src/lib/seo.ts`
- `src/lib/seo-core.ts`
- CMS Site Content and package categories
- `index.html`

## Dependencies

SEO-03 must first confirm the canonical full name and approved short brand.

## Implementation and validation — 5 Sep 2026

- Rewrote core titles to use intent first and the short `Doll Pictures` suffix; synchronized initial HTML title, OG and Twitter fallbacks. Simplified repeated full-name wording in core descriptions and topic copy.
- Canonical identity mapping already distinguishes `businessName`/`brandByline` (full name) from `siteName` (short brand); preserved it.
- Reviewed production CMS titles: 12 services and nine package categories already use the short brand and Erode intent. No production CMS mutation was needed. Added Erode to the generated package-title fallback.
- Prerender now rejects empty or duplicate titles/descriptions across the resolved catalog, including CMS-only routes, and warns on titles over 70 characters without imposing a hard length limit.
- Nine focused metadata/identity tests pass; changed-file ESLint and diff checks pass. Production build with strict CMS mode succeeds for 32 routes. Generated HTML checks confirm title/OG/Twitter agreement, canonical URL, description and H1 presence on all 32 routes.
- Existing homepage source already includes visible Wedding/Baby/Family and Erode topic labels. Visual/browser verification and runtime DOM comparison were not performed.
- Full `test:seo` remains blocked by an unrelated pre-existing `social-proof.spec.ts` import of the removed `teamMembers` export.
- Remaining: deploy frontend; verify live metadata and rendered page topics, then inspect key URLs in Search Console and monitor title rewrites/CTR after recrawling.
