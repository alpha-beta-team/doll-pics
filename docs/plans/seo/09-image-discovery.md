# SEO-09 — Add Image Discovery and Image Sitemap Support

**Priority:** P2  
**Effort:** Medium  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Google can reliably discover genuine portfolio images delivered from ImageKit/R2 and associate them with relevant service, gallery, and case-study landing pages.

## Current gap

- The public sitemap does not contain image entries.
- Gallery and CMS images are largely discovered after JavaScript/API execution.
- Current production photo records are seeded, so image sitemap work would promote placeholder assets if implemented now.
- ImageKit is a separate delivery origin and should be monitored as part of image indexing.

## Preconditions

- [ ] SEO-01 has restored public sitemap delivery.
- [ ] SEO-02 has removed all seed/Picsum/Pexels portfolio content.
- [ ] Relevant page-to-photo category relationships are accurate.
- [ ] SEO-08 has established case-study landing pages, if included in the first image sitemap.

## Work plan

### Page-to-image mapping

- [ ] Map homepage featured images to the homepage only when representative.
- [ ] Map gallery images to `/gallery`.
- [ ] Map category photos to the matching service pages.
- [ ] Map case-study images to their specific story pages.
- [ ] Exclude unpublished, private, seed, data-URI, and placeholder images.
- [ ] Avoid listing the same image under irrelevant pages.

### Sitemap generation

- [ ] Add the Google image namespace to the XML sitemap.
- [ ] Add `<image:image>` and `<image:loc>` for published image URLs.
- [ ] Include accurate title/caption data only when useful and supported.
- [ ] Use stable, crawlable ImageKit URLs.
- [ ] Keep route and image data generation bounded and cacheable.
- [ ] Add sitemap tests for escaping and invalid URL exclusion.

### Landing-page image signals

- [ ] Use standard `<img>`/`picture` elements with a fallback `src`.
- [ ] Keep descriptive alt text.
- [ ] Place images near relevant textual context.
- [ ] Add page-specific `og:image`.
- [ ] Add `primaryImageOfPage` where a clear representative image exists.
- [ ] Avoid generic logo images as the main page image.

### Search Console

- [ ] Verify or add the ImageKit delivery property when practical.
- [ ] Submit the image-enabled sitemap.
- [ ] Monitor image-search impressions and crawl errors.

## Acceptance criteria

- [ ] Sitemap validates with the image namespace.
- [ ] Only genuine, published photographs are listed.
- [ ] Every image is associated with a relevant canonical landing page.
- [ ] Every listed image URL returns HTTP 200 to crawlers.
- [ ] No `seed/*`, Pexels, Picsum, localhost, data URL, or private asset appears.
- [ ] Page-specific OG/primary images are relevant and high resolution.
- [ ] Search Console accepts the sitemap without image errors.

## Verification

- [ ] Parse the XML in automated tests.
- [ ] Compare sitemap image URLs with published CMS photo records.
- [ ] Sample-check image response status and content type.
- [ ] Inspect rendered `<picture>`/`<img>` markup.
- [ ] Monitor Google Images performance after recrawling.

## Likely files/systems

- `photography-cms-backend/src/sitemap/`
- Photo/category/case-study services
- `src/components/ResponsiveImage.tsx`
- `src/lib/seo-core.ts`
- ImageKit/R2
- Google Search Console

## Dependencies

Do not implement before real media replaces seeded assets; otherwise the sitemap will strengthen discovery of the wrong images.
