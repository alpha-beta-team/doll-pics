# Public CMS failure handling

Implemented locally on 2026-09-06. Deployment and live CMS verification remain pending.

## Behavior

- Each CMS resource commits independently. A failed endpoint leaves its fallback or successful content in place; it cannot discard successful sibling responses.
- Public GETs have an 8-second deadline per attempt, including response-body reads. Network errors, timeouts, HTTP 408/429, and 5xx receive one retry after 300ms. A continuously stalled operation settles after approximately 16.3 seconds of active browser time. Other HTTP errors, invalid JSON, and cancellation do not retry.
- Enquiry POSTs and other writes are never automatically retried. Existing validation errors remain available to forms. No write deadline was introduced, since a lost response may follow a saved enquiry.
- Plain concurrent GETs share their pending promise; custom/signal-bearing requests have independent cancellation. Completed or failed promises leave the pending cache.
- Site content and package categories settle navigation loading independently of the hero. The initial build-time hero asset remains available while CMS hero loading stalls or fails. Existing preload/prerender/hero rendering is unchanged.
- Deferred resources remain route-aware. Navigation aborts requests the new route no longer needs, while shared requests continue. Unmount aborts all outstanding provider requests. Cancelled and obsolete responses cannot update state.
- Failed provider resources needed by the current route recover on navigation, reconnect (`online`), or window focus once the failure is at least five seconds old. Successful resources remain cached for the provider lifetime. There is no polling loop; each recovery starts another bounded GET operation.
- Service-page category covers and photo results commit independently and abort on navigation. These page-specific requests recover when the page effect reruns; provider focus/reconnect recovery does not cover them. The standalone gallery retains its existing Retry button and now ignores cancelled results.
- Provider diagnostics contain only the resource key, failure kind, and optional HTTP status. Response bodies, URLs, query strings, and customer values are omitted.

Empty successful responses retain existing collection-specific behavior: built-in navigation, story, and image fallbacks remain where appropriate; empty reviews, statistics, staff, and package results are respected. No synthetic social proof is introduced.

## Automated checks

Run from `doll-pics` after installing dependencies:

```sh
npm run test:lib
npm run test:browser
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
```

If Chromium is missing, run `npx playwright install chromium` first.

`src/lib/publicRequest.spec.ts` covers request sharing, retries, stalled body reads, bounded failure, cancellation, cache recovery, and single-attempt enquiry writes. `tests/browser/cms-resilience.spec.ts` mounts the actual React provider in Strict Mode with intercepted CMS APIs and observes state, requests, and aborts. Its ten cases cover critical/deferred partial failures, full outage, deadlines, navigation and unmount cancellation, stale results, reconnect/focus recovery, and a stalled hero.

These browser tests verify provider behavior against fixtures, not visual page layout, live CMS behavior, or real enquiry delivery. The release build uses static CMS fallback and is separate from production acceptance.

## Local validation recorded on 2026-09-06

- Typecheck passed; library tests 23/23 (including eight request tests), admin 78/78, SEO 16/16.
- Chromium resilience tests 10/10 passed.
- Release build passed, prerendering 33 files using static JSON fallback.
- The release run also repaired stale booking-fixture, role/navigation, and social-proof test expectations already described in the release-check roadmap. Runtime permissions were unchanged.

## Manual QA after deployment

1. On a local/QA homepage, block only `/api/stats` or return 503. Confirm navigation, hero, packages, and photos still load. Expect at most two attempts before a sanitized failure diagnostic.
2. Stall `/api/site-content` and `/api/package-categories`. Confirm loading settles after the bounded attempts and fallback navigation works. Stall only `/api/hero-slides`: navigation and deferred content should proceed while the build-time hero remains.
3. While homepage photos are pending, navigate to About. Confirm unneeded photo requests abort, shared resources continue, and returning home starts the missing requests again. Confirm no obsolete content appears.
4. Restore a failed endpoint and reconnect, navigate, or focus the window after five seconds. Confirm only failed resources required by the active route retry and replace their fallbacks.
5. In an isolated QA form with notification recipients safely configured, make the enquiry response fail and verify one POST per explicit submission. A lost response does not prove the enquiry was unsaved; check QA records before manually resubmitting.
6. Check homepage/service/gallery appearance on mobile and desktop, including empty CMS collections and the gallery Retry action. Verify the deployed frontend asset version before interpreting results.
