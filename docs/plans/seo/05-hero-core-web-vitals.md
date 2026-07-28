# SEO-05 — Improve Hero Loading and Core Web Vitals

**Priority:** P1  
**Effort:** Large  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

The first viewport displays a real studio hero quickly and stably, without waiting for CMS cold starts or downloading mismatched/preloaded images.

## Baseline

One production mobile Lighthouse run on 28 Jul 2026:

- Performance: 69
- LCP: 8.6 s
- FCP: 2.8 s
- CLS: 0.043
- TBT: 30 ms
- Estimated unused JavaScript: about 98 KiB

Lab results vary; record the median of three runs and compare against Search Console field data.

## Current evidence

- `index.html` preloads a legacy Pexels image.
- The rendered LCP image is a different frontend fallback.
- Current production CMS hero slides are filtered as legacy.
- All carousel slides are represented in the hero component and the carousel starts automatically.
- The critical bootstrap waits for Site Content, hero slides, and package categories.
- Seven font files and third-party scripts contribute to the initial request graph.

## Work plan

### Establish a stable LCP asset

- [ ] Complete SEO-02’s real flagship hero selection.
- [ ] Store/deliver it through ImageKit/R2.
- [ ] Generate mobile-appropriate responsive sizes.
- [ ] Ensure width, height, aspect ratio, and crop are explicit.
- [ ] Use the same URL in initial markup, preload, and the first rendered slide.

### Remove request-discovery delay

- [ ] Render the first hero without waiting for the CMS request.
- [ ] Generate the hero preload from the same build-time or cached content source.
- [ ] Remove the obsolete hard-coded Pexels preload.
- [ ] Add preconnect only for origins needed by the real first viewport.
- [ ] Ensure the LCP image is eager with `fetchpriority="high"`.
- [ ] Ensure non-active hero slides are not fetched initially.

### Stabilize the carousel

- [ ] Keep the first image unchanged through the LCP observation window.
- [ ] Prefer starting autoplay after user interaction, idle time, or a safe delay.
- [ ] Respect reduced-motion settings.
- [ ] Do not let later carousel images become new LCP candidates.
- [ ] Verify manual controls remain keyboard-accessible.

### Reduce initial work

- [ ] Audit which critical API requests are actually needed before first paint.
- [ ] Defer packages, testimonials, gallery, stats, and non-visible sections.
- [ ] Split or lazy-load below-fold homepage code where beneficial.
- [ ] Reduce unused JavaScript without regressing navigation.
- [ ] Review the number and weights of initially loaded fonts.
- [ ] Measure the cost of GA4 and Cloudflare scripts without breaking analytics.

### Performance guardrails

- [ ] Add a repeatable Lighthouse command/documentation.
- [ ] Record three-run median for mobile.
- [ ] Add a performance budget for initial JS and LCP image bytes.
- [ ] Monitor field Core Web Vitals in Search Console after deployment.

## Acceptance criteria

- [ ] The first hero is genuine Doll Pictures work.
- [ ] The preload and rendered LCP image are the same asset.
- [ ] Lighthouse reports the LCP request as discoverable in initial HTML.
- [ ] Median mobile lab LCP is at or below 2.5 s, or improves by at least 50% pending field confirmation.
- [ ] Median mobile performance score is at least 85.
- [ ] CLS stays at or below 0.1.
- [ ] TBT stays below 200 ms.
- [ ] Search Console field data trends toward “Good” after sufficient traffic.

## Verification

```bash
npm run build
npm run preview
npm exec --yes lighthouse -- https://dollpictures.in/ --only-categories=performance,seo
```

Also inspect the browser Network and Performance panels at a mobile viewport with cache disabled.

## Likely files/systems

- `index.html`
- `src/components/home/HomeExperience.tsx`
- `src/components/ResponsiveImage.tsx`
- `src/contexts/SiteDataContext.tsx`
- `src/lib/images.ts`
- CMS hero slides
- ImageKit/R2

## Dependencies

SEO-02 must provide the final real hero image before preload and delivery work can be finalized.
