# Doll Pictures — Page Speed Analysis

Audit date: 9 August 2026  
Page: `https://dollpictures.in/`  
Profile: Lighthouse 13.4.1, emulated Moto G Power, Slow 4G, initial page load

## Executive summary

The homepage is visually stable and does little blocking work, but its main hero image is discovered too late. This produces a poor Largest Contentful Paint (LCP) of **5.6 seconds** even though the image already uses `loading="eager"` and `fetchpriority="high"`.

The primary defect is a mismatch between the image preloaded in the initial HTML and the image actually rendered as the homepage hero. The initial document preloads Pexels image `265722`, while the rendered LCP image is Pexels image `5759215`. Because the real hero `<img>` is created by React after the main JavaScript downloads and executes, Lighthouse reports that the request is not discoverable in the initial document.

The second major issue is the request waterfall. Homepage data requests begin after JavaScript, and non-visible homepage data is fetched soon after the critical CMS requests. On the tested Slow 4G connection, the longest chain reaches **2,620 ms**. These calls can compete with the hero image and extend the critical loading window.

## Results

| Metric | Result | Assessment | Recommended target |
| --- | ---: | --- | ---: |
| First Contentful Paint | 2.0 s | Needs improvement | ≤ 1.8 s |
| Largest Contentful Paint | 5.6 s | Poor | ≤ 2.5 s |
| Total Blocking Time | 30 ms | Good | ≤ 200 ms |
| Cumulative Layout Shift | 0.062 | Good | ≤ 0.10 |
| Speed Index | 2.1 s | Good | ≤ 3.4 s |

The results show a focused problem: rendering stability and main-thread responsiveness are healthy, while the largest above-the-fold image arrives too late.

## Findings

### P0 — The LCP preload targets the wrong image

Evidence:

- `index.html` preloads `photos/265722/...`.
- The first fallback hero in `src/data/content.ts` is `photos/5759215/...`.
- The Lighthouse LCP element is the `5759215` image.
- The production HTML contains an empty `<div id="root"></div>` rather than a server-rendered hero image.
- `src/components/home/HomeExperience.tsx` creates the hero `<img>` only after React runs.

The preload consumes early bandwidth without accelerating the actual LCP resource. `eager` and `fetchpriority="high"` help only after the browser discovers the rendered image, so they do not correct this mismatch.

Recommended fix:

1. Make the initial HTML preload exactly the same URL, format, `imagesrcset`, and `imagesizes` used by the first rendered hero.
2. Generate this preload during the build from the same hero source used by the application; do not maintain a separate hard-coded URL.
3. Prefer rendering the first hero `<picture>/<img>` in the initial HTML. Full SSR is not required if the build injects a stable static hero shell that React hydrates or replaces safely.
4. If the CMS controls the first hero, fetch that value at build/deploy time or expose it through an edge-generated HTML response. Keep a stable fallback if the CMS is unavailable.

Acceptance check: Lighthouse's “Request is discoverable in initial document” item must pass, and the old `265722` preload must not be present on the homepage.

### P0 — The hero source can change during the LCP window

`SiteDataProvider` initially exposes fallback slides, then replaces them after `/site-content`, `/hero-slides`, and `/package-categories` finish. `HomeExperience` renders directly from that changing array. Unlike the unused older `sections/Hero.tsx` implementation, the active homepage hero does not lock the initial image during the LCP window.

Changing the first slide can invalidate an in-progress download, create a new LCP candidate, or make the HTML preload incorrect again.

Recommended fix:

- Establish one immutable `initialHero` for the first paint.
- Do not replace it until the image has painted and the LCP observation window has safely passed.
- Apply CMS changes to later carousel slides immediately, but defer changing slide zero until after initial rendering.

### P1 — API work forms a long post-JavaScript request chain

The screenshot shows the main bundle completing before the CMS calls begin. The critical bootstrap then requests three endpoints, after which the homepage schedules additional buckets:

- `/api/site-content`: 1,163 ms
- `/api/hero-slides`: 1,409 ms
- `/api/package-categories`: 1,165 ms
- `/api/story-scenes`: 1,824 ms
- `/api/stats`: 1,815 ms
- `/api/testimonials`: 1,835 ms
- `/api/behind-scenes`: 1,822 ms
- `/api/photos?featured=true`: 2,384 ms
- `/api/photos?limit=24`: 2,620 ms
- `/api/packages`: 2,300 ms

Most responses are only a few kilobytes, so latency and request count matter more than transfer size. The similar 1–2.6 second timings also suggest backend/origin latency is significant; that is an inference and should be confirmed with server timing and cold/warm tests.

Recommended fix:

1. Keep only content required above the fold in the critical path.
2. Start stories, statistics, testimonials, behind-the-scenes, packages, and gallery calls after the hero has loaded or when their sections approach the viewport.
3. Do not rely on `requestIdleCallback` alone: it can run while the network is still busy. Gate non-critical fetches on the hero `load` event, `window.load`, or section intersection.
4. Consider a cacheable `/api/home` response for the small homepage datasets, or embed a bootstrap JSON payload in the initial document.
5. Add CDN/edge caching and appropriate `Cache-Control`/revalidation for public CMS content.

### P1 — All carousel images are mounted immediately

`HomeExperience` maps up to five hero slides into full-viewport image elements. Later slides use `loading="lazy"`, but because their boxes occupy the viewport, browser heuristics may still fetch them early. Hidden carousel images can therefore compete with the LCP image on Slow 4G.

Recommended fix:

- Mount only slide zero initially.
- Mount/preload slide one after slide zero loads.
- Mount the remaining slides when the carousel starts or during a genuinely idle post-load period.
- Keep `fetchpriority="low"` on non-active slides.

### P1 — The initial HTML carries the complete CSS bundle

The verified production build reports:

- `dist/index.html`: **170.34 kB raw / 28.41 kB gzip**
- main JavaScript: **330.44 kB raw / 99.76 kB gzip**

The Lighthouse “Reduce unused CSS” audit independently reports:

- stylesheet transfer size: **25.3 KiB**
- estimated removable bytes: **22.2 KiB**
- estimated unused share: approximately **88%**

`vite.config.ts` disables CSS code splitting and inlines every emitted stylesheet. The homepage HTML consequently includes CSS for unrelated routes and admin image-editing components. Inlining removes one stylesheet request, but increases document download, decompression, and style parsing before first paint.

Recommended fix:

- Inline only a small critical stylesheet for the shell, navigation, and first hero.
- Restore CSS code splitting for route and admin styles.
- Load the remaining public stylesheet normally, and keep admin-only styles out of the visitor page.

This is a secondary FCP optimization. It should follow the LCP discovery and request-priority fixes.

### P2 — Three long main-thread tasks require identification

Lighthouse reports three long tasks, but the supplied capture does not show their individual scripts, start times, or durations. Their overall impact is currently limited because Total Blocking Time is only **30 ms**, well inside the good range.

Recommended follow-up:

- Expand the Lighthouse “Avoid long main-thread tasks” audit or record a Chrome Performance trace.
- Attribute each task to application JavaScript, analytics, style/layout work, or a third-party script before changing code.
- Prioritize a task only if it overlaps FCP/LCP or appears consistently across repeated tests.

### P2 — Font payload can be narrowed

The entry point imports eight WOFF2 faces across Cormorant Garamond and Inter. Only a subset is needed above the fold. The files are individually small (roughly 22–24 kB), but reducing early font demand can improve the borderline 2.0 second FCP.

Recommended fix:

- Preload only the one display face and one body face actually visible in the first viewport.
- Defer weights used only below the fold or in admin routes.
- Keep `font-display: swap`.

### P2 — Some images are delivered larger or less efficiently than necessary

The Lighthouse image-delivery audit reports two additional opportunities:

- A content image is delivered at **800×1000** but displayed at approximately **651×977**, with estimated savings of **12.8 KiB** from better responsive sizing.
- The navigation logo transfers **11.0 KiB** and has estimated savings of **10.0 KiB**. Lighthouse attributes approximately **9.5 KiB** of that opportunity to modern formatting or stronger compression.

The logo source, `public/logo-doll.png`, is a 96×96 RGB PNG weighing 11,219 bytes. `Navbar.tsx` renders it at 44×44 CSS pixels. The 96-pixel dimensions are appropriate for a roughly 2× display, so the main logo issue is encoding rather than dimensions.

Recommended fix:

- Create 48- and 96-pixel WebP or AVIF logo variants, keeping the PNG as a compatibility fallback in a `<picture>` element.
- Use long-lived immutable caching for versioned logo assets.
- Ensure content-image `srcset` includes a candidate near the actual rendered width and that `sizes` describes the layout accurately.
- Preserve sufficient resolution for device pixel ratio; do not reduce intrinsic dimensions based only on CSS pixels.

## Prioritized action plan

| Priority | Change | Expected effect |
| --- | --- | --- |
| 1 | Generate the correct first-hero preload and expose the first hero in initial HTML | Largest LCP improvement; removes the failed discovery audit |
| 2 | Freeze the initial hero and mount only the first carousel slide | Prevents duplicate/replacement downloads and bandwidth contention |
| 3 | Delay below-fold API and image traffic until after hero load or section intersection | Shortens the critical network window |
| 4 | Cache or consolidate public CMS responses | Reduces the 1–2.6 s API latency/request overhead |
| 5 | Split CSS and inline only critical homepage styles | Improves document/FCP cost |
| 6 | Attribute the three long tasks with a Performance trace | Identifies any remaining main-thread work overlapping LCP |
| 7 | Add correctly sized content-image candidates and modern logo variants | Saves roughly 20–23 KiB in the measured run |
| 8 | Reduce above-fold font faces | Small FCP and bandwidth improvement |

## Validation plan

After deployment:

1. Run at least three mobile Lighthouse tests with the same Slow 4G profile and compare the median.
2. Confirm the first hero request begins from the HTML preload scanner, before the main JavaScript completes.
3. Confirm there is no preload for an image that is not used in the initial viewport.
4. Confirm only one hero image and no below-fold CMS photo collections compete before LCP.
5. Target mobile LCP ≤ 2.5 s, FCP ≤ 1.8 s, TBT ≤ 200 ms, and CLS ≤ 0.10.
6. Review field Core Web Vitals after enough real-user data has accumulated; a single Lighthouse run is diagnostic, not a substitute for field data.

## Build verification

`npm run build` completed successfully on 9 August 2026. The build warning concerns large lazy chunks used by admin/PDF functionality; those chunks are not the primary cause of the homepage LCP result. No application code was changed as part of this analysis.
