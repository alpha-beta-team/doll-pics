# F13 production lab baseline — 8 September 2026

Production commit: `85cbd29c60e3b92030b542a827c41ec96a38d309`, built `2026-09-08T12:49:15.936Z`. Manifest commit checked before and after collection. Public entry: `/assets/index-CLARWShD.js`. This production deployment predates the concurrent F04 remaining-category expansion.

[Selected Lighthouse metrics, LCP nodes/phases, layout-shift nodes, request waterfall and diagnostics](./f13-production-baseline.json).

## Method

Lighthouse **12.8.2**, installed transiently through `npx`, Chrome **152.0.0.0** headless on macOS, Node **20.20.2**. Mobile 412×823, DPR 1.75, simulated 150ms RTT/1638.4Kbps and 4× CPU slowdown. Fresh Chrome/storage per invocation; serial page loads with no URL blocking. The JSON preserves exact settings, timestamps, benchmark indices and each result. Eleven exploratory samples overlapping F04 build/browser work were discarded; retained runs start after 12:57:04UTC when that work stopped. CDN/network cache remains external and uncontrolled.

Three samples per page; values below are independent metric medians (not a single median report). LCP ranges show considerable run variability. These are diagnostic lab measurements, not user p75, INP or evidence of a measured improvement. Lighthouse scores can vary with network and host conditions: [Chrome documentation](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

| Route | Samples | Score | LCP median (range) | TBT median | CLS median |
|---|---:|---:|---:|---:|---:|
| `/` | 3 | 85 | 4.19s (2.41–8.95) | 55.0ms | 0.025 |
| `/newborn-baby-photography-erode` | 3 | 71 | 9.00s (2.26–9.74) | 50.0ms | 0.000 |
| `/wedding-packages-erode` | 3 | 98 | 1.45s (1.39–7.48) | 43.5ms | 0.000 |
| `/gallery` | 3 | 67 | 8.77s (8.43–8.80) | 49.0ms | 0.000 |
| `/booking` | 3 | 51 | 8.62s (7.74–8.91) | 60.0ms | 0.629 |

## Evidence and next experiments, in priority order

1. **Booking layout stability and LCP discovery.** The repeated large shift affects the footer when page content arrives; the second sample attributes 0.594 shift to the footer, with smaller font shifts. Its LCP is the booking background image with `loading="lazy"`, 6.56s modeled load delay in that sample. Reserve the loading section dimensions and investigate route-specific eager loading of the first above-fold booking image. `BookingCTA` is reused below other pages; do not globally make every booking background eager. Verify the exact insertion cause with a trace before changing it, and keep enquiry behavior intact.
2. **Gallery late image discovery; service/home render delay.** Gallery LCP is the first portfolio photo, with CMS/JS discovery preceding the image. Coordinate its future F04 snapshot work before independent data-loading changes. Service LCP is the animated H1 (`h1.hero-enter`), with render delay dominating the slow samples. Home LCP remains the Portraits hero image; its ranges and phase breakdown vary markedly. Profile animation/font/paint timing with a controlled trial before attributing these delays to a single cause. Preserve appearance, reduced motion and image quality.
3. **Remove unnecessary category-page data work only after consumer tracing.** Wedding hydration requests `/api/hero-slides`, `/api/photos?featured=true` and `/api/photos?limit=24` despite the category snapshot. `bucketsForPath` includes the generic media bucket on category routes. Requests are not duplicate exact URLs; generic data may overlap already seeded/category-specific needs. Trace consumers, then compare navigation and enquiry before narrowing the bucket. No change in this measurement increment.
4. **Review non-photographic transfer and font budget.** The manifest's `/logo-doll.png?v=20260810` costs about 358 KB in the observed waterfall, distinct from the small navigation logo. Seven font requests total about 169 KB in the first exploratory home capture, and font swaps produce a small home CLS. A correctly sized/maskable icon and tested font fallback metrics are candidates; retain brand appearance and install behavior.
5. **CSS and scripts: do not optimize from build warnings alone.** Home decoded HTML is 397,224 bytes, including 152,662 bytes inline styles. CSS coverage flags mostly unused rules on initial load, but Lighthouse estimates 0 ms LCP savings in the inspected reports. Test critical/shared stylesheet options against first and repeat navigation before replacing inline CSS. Public entry transfers about 109 KB; GA's tag about 173 KB. Admin and PDF chunks are absent from these initial public requests. No feature removal or analytics changes are justified merely by a byte warning.

## Compression, caching and hero verification

Live GET headers confirm **gzip** for both home HTML and entry JS. HTML: `public, max-age=0, must-revalidate`; hashed entry: `public, max-age=14400, must-revalidate`. Both showed Vercel HIT in the captured requests, while Cloudflare was DYNAMIC for HTML and MISS for that entry request. These are observations at this edge/time, not an assertion that every resource uses these policies.

The home preload contains 480/750/1100/1600w responsive sources and `imagesizes="100vw"`; the mobile hero request uses the 750w WebP with `isLinkPreload: true`, matching the rendered LCP image. There is no observed duplicate request for that selected hero source. Keep this agreement when experimenting.

## Reproduce

From the repository (does not edit package manifests or build files):

```sh
F13_OUTPUT="$(mktemp -d)"
for route in / /newborn-baby-photography-erode /wedding-packages-erode /gallery /booking; do
  label=$(printf '%s' "$route" | tr '/' '_')
  for sample in 1 2 3; do
    npx --yes lighthouse@12.8.2 "https://dollpictures.in$route" \
      --only-categories=performance --chrome-flags='--headless=new' \
      --output=json --output-path="$F13_OUTPUT/$label-$sample.json" --quiet
  done
done
```

Use the same browser/tool settings, stop builds and other browser workloads, verify the deployed manifest/asset, and retain every run rather than selecting the fastest. Compare metric distributions after one scoped change. Raw temporary reports from this run are in `/tmp/doll-f13-baseline`; portable selected evidence is checked into this folder, excluding screenshots and analytics request identifiers.

## Pending acceptance

- Desktop comparison and interaction traces for menu, gallery expansion, lightbox and enquiry; do not submit real enquiries while profiling.
- PSI API returned HTTP 429 quota exceeded. Field URL/origin LCP/INP/CLS and Search Console were **not accessed**. Site owner/SEO operator should provide authorized field reports or inspect PSI/CrUX when available; missing data is not a field failure.
- No application optimization, before/after measurement, image/accessibility regression verification or new deployment was performed for F13. Keep F13 **In progress**; next engineering increment is the booking shift/LCP investigation and controlled experiment.
