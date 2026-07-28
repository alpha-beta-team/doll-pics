# SEO-02 — Replace Seeded and Stock Media

**Priority:** P0  
**Effort:** Large  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Every prominent public photograph represents genuine Doll Pictures work, is delivered through R2/ImageKit, and includes accurate context that supports local and image-search relevance.

## Current evidence

- The production API returns 19 published photo records, all with `seed/*` storage keys and Picsum variants.
- Homepage gallery fallbacks, hero slides, service images, story scenes, and prerendered service galleries use Pexels.
- Current CMS hero records are treated as legacy and replaced with frontend fallbacks.
- The gallery does not yet provide credible evidence of work performed by the studio.

## Content prerequisites

- [ ] Select client-approved portfolio images with documented publication permission.
- [ ] Choose at least one flagship hero image.
- [ ] Collect genuine shoot type, city/venue, year, and short context for each image.
- [ ] Agree on newborn/client privacy rules before uploading.
- [ ] Prepare a balanced initial collection across wedding, maternity, newborn, milestone, cake smash, and family work.

## Work plan

### CMS taxonomy and uploads

- [ ] Create or correct CMS categories matching the public service taxonomy.
- [ ] Upload originals through the production admin so storage keys use R2/ImageKit.
- [ ] Add a useful title and descriptive alt text to every published image.
- [ ] Record genuine location and year when client permission allows.
- [ ] Mark only the strongest representative images as featured.
- [ ] Set deliberate gallery order rather than relying on upload date.

### Replace every stock surface

- [ ] Replace homepage hero slides.
- [ ] Replace homepage featured-work and gallery imagery.
- [ ] Replace service navigation cards.
- [ ] Replace service-page and package-page fallback images.
- [ ] Replace story-scene images.
- [ ] Replace behind-the-scenes stock images with real team/process media.
- [ ] Replace booking CTA imagery.
- [ ] Replace team portraits under SEO-04.
- [ ] Replace generic sitewide OG imagery if a stronger real brand photograph is available.

### Code and data cleanup

- [ ] Remove or retire the legacy hero-slide filtering once production content is valid.
- [ ] Ensure API failures do not silently present stock work as the studio portfolio.
- [ ] Remove Pexels/Picsum seed data from production seed/migration paths.
- [ ] Keep demo-only fixtures explicitly separated from production seed scripts.
- [ ] Remove published `seed/*` photo documents after real replacements are verified.
- [ ] Decide whether static fallbacks should be real local assets or an honest empty state.

## Acceptance criteria

- [ ] No published production photo uses a `seed/*` key.
- [ ] No indexable page presents Pexels or Picsum as Doll Pictures work.
- [ ] The hero, gallery, service cards, service pages, and package pages use real studio images.
- [ ] Every published portfolio image has accurate alt text.
- [ ] Images have dimensions and responsive variants.
- [ ] Images load from the configured ImageKit/R2 delivery origin.
- [ ] Client privacy/publication requirements are documented and satisfied.
- [ ] Empty CMS data produces an honest empty state or approved real fallback.

## Verification

- [ ] Query `/api/photos` and confirm zero seed keys.
- [ ] Crawl rendered pages and search for `pexels.com` and `picsum.photos`.
- [ ] Test hero, gallery, and lightbox on mobile and desktop.
- [ ] Verify broken-image and API-failure behavior.
- [ ] Run Lighthouse after the final hero asset is selected.

## Likely files/systems

- Production CMS `/admin/photos`, hero, services, story scenes, and behind-the-scenes
- `src/data/content.ts`
- `src/data/service-pages.json`
- `src/data/package-pages.json`
- `src/contexts/SiteDataContext.tsx`
- `src/components/`
- Backend seed and migration scripts
- R2 and ImageKit

## Dependencies

The studio must supply real media and confirm publication rights. SEO-05 and SEO-09 should not finalize until this plan provides the real hero and portfolio assets.
