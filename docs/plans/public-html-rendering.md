# Meaningful public HTML: newborn service pilot

Implemented locally on 2026-09-06 for `/newborn-baby-photography-erode`.

## What changed

The production build now renders the existing React service page into `#root` for this pilot. Its heading, lead, published CMS sections, available category imagery, studio details, navigation, and enquiry links are present before JavaScript executes. It retains the existing service-page layout and enquiry modal. Without JavaScript, WhatsApp and phone links provide enquiry options; the modal requires JavaScript.

Vite loads a Node rendering entry during prerendering. React renders the same route tree used in the browser with a static router, then `hydrateRoot` attaches the existing page to the browser router. No server runtime or framework migration is required. The pilot component is preloaded before hydration, so a lazy-loading spinner cannot replace the generated content.

The HTML embeds an escaped, versioned public view model. Site content and category responses already fetched by the SEO build are reused; service cover and photos load independently. Successful snapshot resources do not immediately refetch on hydration. Missing resources retain the existing bounded browser request/recovery behavior. A partial media failure retains the successful cover or gallery. The client restores the visitor's saved theme after its matching first render.

Only normalized public content is embedded. Unknown CMS fields and unpublished service links are excluded. Inline JSON and JSON-LD escape characters that could terminate script elements. Private routes, unknown routes, and all other public pages retain their existing rendering. A snapshot only hydrates its exact pilot route, including a trailing slash variant. Gallery reveal effects cannot hide server-rendered images when JavaScript is disabled.

Implementation references: [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot) and [Vite SSR](https://vite.dev/guide/ssr.html).

## CMS publication and freshness

- A successful CMS publication list must include the pilot before it receives React HTML. Existing catalog/sitemap fallback rules remain unchanged for other output.
- If CMS site content is unavailable, the pilot can render from the existing static defaults. Unavailable category imagery is omitted; unrelated or fabricated work is not substituted. Published CMS sections require CMS content to be available at build time.
- The initial view represents build-time content. Publish CMS changes and rebuild/redeploy the frontend to refresh the pilot snapshot. Successfully seeded resources remain cached for the provider lifetime; this is not live server rendering.
- The existing homepage poster/preload and all canonical, metadata, sitemap, and 404 generation paths remain in place.

## How to build and test

From `doll-pics`, with dependencies and Chromium installed:

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run test:html
```

The first command verifies a deterministic build with static CMS fallback. For a CMS-backed build, use the intended public API configuration and the existing deployment build command. Do not use fixture URLs in deployment settings.

`test:html` creates a temporary production build against a local read-only CMS fixture, serves clean URLs with directory-index resolution, and intercepts browser API requests. It covers:

- Visible initial content and loaded imagery with JavaScript disabled.
- Mobile/desktop hydration during a CMS outage, preservation of the original heading DOM, and saved-theme restoration.
- One mocked enquiry POST from the hydrated form, SPA navigation and return navigation, and no duplicate requests for seeded CMS resources.
- Script-safe snapshot text, exclusion of unpublished/unknown fields, private route rewrites, and the 404 page.

`npm run test:browser` includes this production HTML suite alongside any tests in `tests/browser`. The existing PR workflow therefore runs it. `npm run test:seo` includes offline rendering, partial media, serialization, and publication-guard checks. Builds and tests do not send real enquiries or notifications.

For manual local preview, run `npm run preview` after building and open `/newborn-baby-photography-erode/` **with the trailing slash**. Vite preview serves the SPA home shell for some extensionless directory URLs; this differs from directory-index hosting. Inspect the generated file directly at `dist/newborn-baby-photography-erode/index.html` when checking initial HTML.

## Local validation and remaining rollout

Revalidated on 2026-09-07: typecheck; library 15/15, admin 79/79, SEO 20/20; production-browser 6/6; lint with zero errors and six fast-refresh warnings; production build with 33 files. The fixture build is separate from the static-fallback release build and does not modify `dist`. Restored the missing browser and rendering tests. Updated stale role/navigation expectations to the current access catalog, renamed the social-proof test import to staffProfiles, and supplied the required booking source in its fixture; runtime permissions were not changed. Browser API requests and submissions are intercepted, and external browser requests are blocked. The six discovered browser tests belong to the pilot suite; this checkout currently has no tests in tests/browser.

Before broader rollout:

1. Deploy the frontend pilot with a current CMS snapshot and confirm the deployed asset version.
2. Request the clean pilot URL and confirm the response itself contains the service heading inside `#root`, the public snapshot, the correct canonical, and genuine published content.
3. Disable JavaScript and verify readable content, imagery, navigation, and phone/WhatsApp links on mobile and desktop.
4. Enable JavaScript and test the enquiry modal and navigation in isolated QA; confirm no hydration errors and no duplicate submissions.
5. Publish a harmless CMS content change, rebuild, and confirm both initial HTML and the hydrated page show the updated value. Check outage fallback and 404/private-route behavior on the actual host.
6. Expand to further service/package pages and the homepage only after the pilot's live acceptance passes. Other public pages still use the existing client render and noscript fallback.
