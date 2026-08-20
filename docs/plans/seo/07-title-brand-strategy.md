# SEO-07 — Create a Concise Title and Brand Strategy

**Priority:** P1  
**Effort:** Medium  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Every indexable page has a concise, unique, intent-aligned title while structured data and business profiles retain the full canonical business identity.

## Current evidence

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

- [ ] Use SEO-03’s approved canonical name and short brand.
- [ ] Assign clear semantics to `businessName`, `siteName`, and `brandByline`.
- [ ] Keep the structured-data entity consistent with Google Business Profile.

### Rewrite core titles

- [ ] Homepage: lead with wedding/baby photography and Erode.
- [ ] Gallery/work: describe portfolio intent.
- [ ] Services/packages: retain category and Erode where useful.
- [ ] About: emphasize Ramya Vignesh and the Erode studio.
- [ ] Stories: use client stories/reviews only when real proof exists.
- [ ] Booking: focus on booking a photography session in Erode.
- [ ] Privacy/terms: keep simple legal titles.

### Align CMS titles

- [ ] Review all six service titles.
- [ ] Review all seven package-category titles.
- [ ] Standardize capitalization and separators.
- [ ] Keep CMS fallback and build-time JSON titles aligned.

### Headings and descriptions

- [ ] Make the homepage visible hero copy clearly communicate service and location.
- [ ] Keep poetic copy as supporting text rather than the only page-topic signal.
- [ ] Remove awkward repeated full-brand phrases from descriptions.
- [ ] Ensure each description is unique and useful to a searcher.

### Automated checks

- [ ] Detect duplicate titles/descriptions.
- [ ] Warn on unusually long or empty titles.
- [ ] Verify title, H1/topic copy, canonical, and OG title per route.
- [ ] Include CMS overlay pages in the check.

## Acceptance criteria

- [ ] All indexable routes have unique titles and descriptions.
- [ ] Full business name remains correct in structured data.
- [ ] Short brand is used consistently as the title suffix.
- [ ] Homepage and key service titles lead with user intent.
- [ ] `name` and `alternateName` are distinct when an alternate name exists.
- [ ] No title is mechanically duplicated between unrelated routes.
- [ ] Prerendered and runtime metadata agree.

## Verification

- [ ] Build all 23 indexable routes.
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
