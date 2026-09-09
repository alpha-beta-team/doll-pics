# F13 Booking production comparison — 9 September 2026

**Status: In progress.** The Booking layout fix is deployed and the repeated large footer shift is absent from the new samples. LCP still needs work; this does not close F13.

[Portable Lighthouse evidence](./f13-booking-production-2026-09-09.json) · [Original baseline](./f13-production-baseline.md).

## Deployment and method

The production catalog and Booking entry were checked before and after collection at 05:52:07–05:53:38 UTC. Both checks identified commit `90a068e4d4f53cc3415f9d56dacc03f1d0e73532`, built `2026-09-09T03:48:59.891Z`, and `/assets/index-DyvfbbA_.js`. Booking returned HTTP 200. This supersedes the plan's earlier description of the fixes as local-only.

Three serial mobile Lighthouse **12.8.2** runs used host Chrome **152.0.0.0**, Node **20.20.2**, 412×823, DPR 1.75, simulated 150ms RTT / 1638.4Kbps, and 4× CPU slowdown. Every `configSettings` value matches the original Booking baseline. Each invocation uses fresh browser/storage; all three runs are retained, without runtime errors or warnings. No builds or other browser work were started by this task during collection. Existing host processes, including system indexing, and CDN/network conditions remain uncontrolled. Browser regression checks ran after Lighthouse collection.

The baseline deployment was `85cbd29`. The new deployment includes other rendering/admin changes, so the LCP and aggregate score differences are observations across deployments, not an isolated effect of image priority. The prior controlled local experiment independently supports the loading-space fix's effect on the footer shift.

## Mobile lab results

Values are independent metric medians, not a single selected report.

| Metric | 8 September baseline | 9 September deployed result |
|---|---:|---:|
| Performance score | 51 | 74 |
| LCP | 8.62s | 7.07s |
| LCP range | 7.74–8.91s | 6.98–7.28s |
| CLS | 0.62908 | 0.00344 |
| TBT | 60ms | 32ms |
| FCP | 2.53s | 1.78s |

All three new CLS values are 0.003442. Lighthouse identifies only a small font-related shift in the italic heading span; no footer shift is listed. LCP remains the same Wedding background image, now rendered with `loading="eager"` and `fetchpriority="high"`; its responsive 960w source is requested at High priority in every sample.

The LCP discovery audit confirms that the image is **still not discoverable in initial HTML**. The route's lazy JavaScript and `/api/booking-backgrounds` response precede image discovery. Modeled resource load delay is **5.08–5.35s (71–76% of modeled LCP)**. These modeled phase values are distinct from the raw request timing and unthrottled insight breakdown retained in the JSON. TBT is a lab diagnostic and is not field INP.

## Deployed headers

Actual GET responses reported Brotli (`content-encoding: br`) for Booking HTML and the public entry. HTML was `public, max-age=0, must-revalidate`; the hashed entry was `public, max-age=14400, must-revalidate`. Booking's Vercel cache changed from MISS to HIT between checks; the entry was HIT. Cloudflare was DYNAMIC for HTML and MISS for the entry. These observations apply to the captured responses, not every edge/resource. They do not contradict the older gzip observations under different negotiation/cache conditions.

## Production browser checks

Six cases passed in Chromium with normal motion at 390×900 and 1440×900:

- Booking: first image eager/high priority and loaded, subsequent background rotation loaded with lazy/default priority, enquiry opened and closed with Escape, FAQ expanded, and no horizontal overflow.
- Gallery CTA: real background loaded with lazy/default priority, enquiry opened and closed with Escape, and no horizontal overflow.
- Booking query prefill: package label and Wedding category appeared, and Escape closed the form.

No page errors occurred in the Booking/Gallery route cases. No forms were submitted; backend mutation interception recorded zero attempted writes. Booking screenshots were inspected at both widths for visible photography and CTA layout. This is focused regression evidence, not a comprehensive image-quality/accessibility audit or an interaction timing profile.

Initial Gallery probes timed out waiting for a below-fold image before content settled. Waiting for the dynamic page to settle and then scrolling to its CTA passed at both widths. Earlier failures are retained in the JSON as probe limitations; Gallery behavior during initial loading still belongs to broader profiling.

## Next action and limits

Frontend engineer: prepare a controlled experiment making the first approved Booking background discoverable earlier through the existing public HTML/data flow, with matching responsive preload and rendered sources. Measure against this new baseline, preserve Gallery's lazy loading and background rotation, and coordinate with active F04 snapshot work. Do not hardcode a CMS photo or lower image quality to improve a score.

Desktop Lighthouse, full menu/gallery/lightbox/enquiry interaction profiling, shared CSS tradeoff, other route experiments, and URL/origin field CWV remain open. PSI/CrUX/Search Console were not queried in this increment; the earlier PSI 429 is historical. Missing field data is not a failure.

Reproduce the three samples serially, keeping the baseline browser/tool settings and checking the deployment before/after:

```sh
F13_OUTPUT="$(mktemp -d)"
for sample in 1 2 3; do
  npx --yes lighthouse@12.8.2 https://dollpictures.in/booking \
    --only-categories=performance --chrome-flags='--headless=new' \
    --output=json --output-path="$F13_OUTPUT/booking-$sample.json" --quiet
done
```

Raw reports and browser screenshots from this increment are in `/tmp/doll-f13-booking-2026-09-09`; selected portable evidence is checked in. No application code was changed and no deployment or enquiry submission was performed in this increment.
