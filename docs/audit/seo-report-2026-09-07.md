# Doll Pictures — SEO investigation and improvement report

**Audit date:** 7 September 2026  
**Website:** https://dollpictures.in  
**Scope:** Production website, all 32 sitemap URLs, five rendered mobile pages, local frontend source, and current Google guidance. This is an investigation report; no application code, CMS content, or deployment was changed.

## Assessment

Doll Pictures has a useful SEO foundation: distinct service and package URLs, unique page metadata, business schema, published pricing, and relevant Erode service content. The best next investment is to make the existing content and photography reliably available in initial HTML, fix image/content quality gaps, and build verifiable local authority.

The site does **not** need an immediate framework migration, a new set of duplicate service pages, or more schema simply for its own sake. Local source already contains a newborn-page HTML-rendering pilot, but that implementation was not present in the production response checked during this audit.

No numerical SEO score or traffic forecast is assigned. Search Console, Business Profile, GA4 reports, backlink data, and real-user Core Web Vitals were not available. Consequently, this report does not claim that pages are absent from Google's index, that rankings have fallen, or that a particular issue has caused lost traffic.

## Verified baseline

| Check | Production observation | Interpretation |
|---|---|---|
| Sitemap coverage | 32 URLs; all returned 200; all match the local expected route list | No missing expected route in this snapshot |
| Titles and descriptions | 32 unique titles and 32 unique descriptions | Keep the existing route-specific approach |
| Canonicals and robots metadata | Each sitemap page has its own canonical and `index, follow` | Basic indexability signals are in place |
| Redirects | HTTP, www homepage, and `/services/` returned 308 to their canonical variants | Sampled normalization works |
| Missing page | `/seo-audit-missing-20260907` returned 404 | Sampled unknown path is not a soft 404 |
| Initial page content | All 32 pages have empty `#root`; fallback headings/text/links are in `noscript` | Main experience remains dependent on JavaScript |
| Structured data | LocalBusiness and WebPage throughout; BreadcrumbList, Service and FAQPage where applicable; JSON parsed successfully | Syntax presence is verified, not Google rich-result eligibility |
| Mobile rendering | Home, newborn, wedding, wedding packages and contact rendered at 390×844 without page-level JS exceptions or horizontal document overflow | Useful smoke evidence, not a complete accessibility/device test |
| Analytics | GA tag script observed; source has page, service, phone, WhatsApp and lead events | Collection accuracy and lead attribution still need account verification |

Evidence: [crawl results](evidence/seo-2026-09-07/crawl.json) and [rendered page observations](evidence/seo-2026-09-07/rendered-pages.json). Production entry script observed: `/assets/index-jTF06OO3.js`.

## Prioritized findings

### 1. High: Publish meaningful page HTML, starting with the existing pilot

**Evidence:** All 32 production pages return `<div id="root"></div>`. The homepage has approximately 59 words in its noscript fallback; newborn has 209; wedding has 216. With JavaScript, the sampled newborn and wedding pages display substantially more content, navigation and photography. Counts describe rendering differences, not a required SEO word count.

**Why it matters:** Crawlers must execute JavaScript to receive the full experience. Google can render JavaScript, so an empty root is not proof of an indexing failure. However, reliable prerendering reduces that dependency and exposes important image and navigation markup earlier. [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

**Recommended action:** Finish the production rollout of the existing newborn pilot, then extend it to wedding, maternity, priority package pages and the homepage. Reuse the current React components and public CMS snapshot. Include the visible heading, substantive service copy, initial gallery images, contextual links and enquiry contact links in normal HTML.

**Source:** `scripts/prerender.ts:503` onward and `docs/plans/public-html-rendering.md`. The local pilot is explicitly limited to `/newborn-baby-photography-erode`.

**Acceptance:** Direct GET contains the real page inside `#root`; mobile content works with JS disabled; hydration preserves content and navigation; QA enquiry flow works; a CMS edit followed by rebuild appears in both initial and rendered content. Keep canonical, 404 and private-route checks. Local tests alone do not prove deployment.

### 2. High: Repair missing images and improve portfolio relevance

**Evidence:** These production URLs independently returned HTTP 404:

- `/images/services/maternity.jpg`
- `/images/services/newborn.jpg`
- `/images/services/family.jpg`

They also appeared in the rendered image inventory. Some other incomplete images were lazy-loaded or had not been requested, so they are not classified as broken.

The homepage's selected stories displayed `DSC01131` and `DSC01078`. Wedding gallery image alternatives included camera identifiers such as `DSC04304`. The wedding package page also contained images labelled as baby-shower sessions, indicating a category-relevance issue to investigate in the CMS selection/fallback path.

**Recommended action:** Replace missing defaults with existing, relevant Doll Pictures images or omit unavailable decorative previews. Review CMS gallery categorization. Give selected work meaningful titles and descriptive alternative text based on the actual image; add accurate session context where permission allows. For example, a real newborn studio session can have a descriptive title instead of its camera filename. Do not invent venues or client details.

Keep empty alternative text for genuinely decorative images. Do not treat every empty `alt` as a defect. Preserve working asset URLs; mass-renaming existing images is lower value than fixing titles, captions and relevance. [Google image guidance](https://developers.google.com/search/docs/appearance/google-images).

**Acceptance:** Referenced images return image content with HTTP 200; priority galleries contain the correct service; selected cards no longer use camera filenames; primary portfolio images appear in initial HTML.

### 3. Medium: Correct admin indexing signals at the HTTP layer

**Evidence:** Both `/admin` and `/admin/bookings` returned HTTP 200 with initial `index, follow`, a homepage canonical, and no `X-Robots-Tag`. The local Vercel configuration sets noindex headers for employee, kiosk and quotation routes but omits admin routes. Robots disallows `/admin/`, which does not cover the exact `/admin` URL.

**Recommended action:** Serve `X-Robots-Tag: noindex` for exact and nested admin routes, and avoid injecting public homepage SEO into the admin shell. Keep authentication intact. Check Search Console for any already indexed private-route URLs.

Robots blocking is not an indexing-removal mechanism, and a blocked crawler cannot observe a new noindex directive. If a URL is already indexed, coordinate a crawlable noindex response on its non-sensitive login shell or authenticated HTTP handling rather than assuming that adding both rules solves removal. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

**Acceptance:** Exact and nested admin HTTP responses carry the intended indexing signal; no private route enters the sitemap. This finding concerns public shell metadata, not evidence of exposed booking data.

### 4. Medium: Strengthen local identity and verify unusual business details

**Evidence:** The rendered contact page and business schema consistently show the Erode address and phone. They also advertise Friday 10 am–midnight and Saturday midnight–8:30 am, then 10 am–8:30 pm. These may be intentional, but need owner verification. Initial business schema had no `sameAs`; local identity data contains only the site's own URL under official profiles.

**Recommended action:** Verify the studio map pin and opening hours against actual operations and the Google Business Profile. Add only confirmed official social/profile URLs. Ensure name, address, phone, hours and service information agree across the website, Business Profile and genuine listings. Keep the real business name; do not insert extra keywords into the Business Profile name.

Ask clients for honest reviews through the normal post-delivery workflow, respond to reviews, and publish recent real work with permission. Seek relevant links from venues, planners and vendors through genuine collaborations. No review messages were sent during this audit.

Business Profile verification, categories, review quality and local visibility were not assessed through account access. Google describes local ranking in terms of relevance, distance and prominence; website changes alone do not control all three. [Google local ranking guidance](https://support.google.com/business/answer/7091?hl=en).

### 5. Medium: Improve page intent and original proof without duplicating existing content

**Evidence:** Service pages already have Erode-focused H1s and useful experience sections. The homepage H1 is emotional branding; its service/location wording appears elsewhere. The contact H1 is similarly poetic. Wedding packages already show real price tiers and inclusions, so “add pricing” would be an inaccurate blanket recommendation.

**Recommended action:** Make the homepage's visible primary heading or immediately adjacent prominent heading explicitly communicate “Wedding & Baby Photography in Erode,” retaining the existing brand line as supporting copy. Give contact a clear studio/contact heading. This is a clarity improvement, not a claim that exact-match H1 text guarantees rankings.

Keep each service page focused on choosing that service; keep its package page focused on comparing cost and inclusions. Link the service explanation to its matching package page and relevant examples. For newborn, add confirmed practical details such as session duration, available setups, what parents bring and delivery expectations. For weddings, clarify coverage hours, staffing, deliverables, travel and package differences where commercially appropriate.

Publish original session case studies with client permission: genuine setting, photography approach, selected images, planning details and links to the relevant service/package. The sitemap currently contains service/package/core pages, with no individual session-story URLs. There is a `/stories` reviews page, so extend its content purpose deliberately or introduce a clearly distinct journal structure.

Avoid producing near-identical pages for every city listed in the service area. Expand beyond Erode only where real work and useful local information justify a separate page.

### 6. Medium: Establish performance and lead baselines before further optimization

**Evidence:** Responsive ImageKit transforms and code splitting already exist. Sampled mobile pages rendered successfully, but this audit did not run Lighthouse or obtain CrUX/Search Console field measurements. No current LCP, INP or CLS failure is asserted. Existing older audit bundle-size and Pexels-hero claims should not be reused as current measurements.

**Recommended action:** Measure homepage, newborn, wedding and wedding packages on mobile. Use field data when available, and repeated Lighthouse runs under consistent conditions for diagnosis. Prioritize the measured LCP element, correct image sizing, preload/first-image agreement, unnecessary image downloads and CMS request delays. Do not remove visual work solely to chase an aggregate score.

Target field p75 LCP ≤2.5 seconds, INP ≤200 ms and CLS ≤0.1. [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

Validate GA4 page views and existing lead events in DebugView using QA submissions. Separate phone/WhatsApp clicks from confirmed enquiries and completed bookings. They are different outcomes.

### 7. Low: Improve freshness signals and correct outdated SEO advice

The production sitemap has no `lastmod` values. Local generation supports them, so trace CMS modification dates into the build and include only accurate content-change dates. Missing lastmod is an opportunity, not an invalid sitemap; never stamp every URL with today's date on every build.

The existing `docs/audit/seo.md` is partly outdated: it cites 15 sitemap URLs, an older hero component and historic bundle information. Use this dated report for the current baseline.

Its suggestion to add AggregateRating after real reviews needs qualification: self-serving LocalBusiness reviews do not qualify for Google's review stars, even when genuine or embedded through a third party. Likewise, FAQ markup should not be sold as a rich-result growth opportunity for this photography website. Keep useful FAQs for visitors. [Google review guidance](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful), [Google FAQ eligibility](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

## Search opportunity and content map

These are intent hypotheses based on existing services, not measured keyword volumes or validated ranking positions.

| Search intent | Existing destination | Best improvement |
|---|---|---|
| Wedding photographer in Erode | `/wedding-photography-erode` | Real wedding examples, coverage explanation, relevant package link |
| Wedding photography cost/packages in Erode | `/wedding-packages-erode` | Clear package differences, hours, delivery and travel terms |
| Newborn/baby photoshoot in Erode | `/newborn-baby-photography-erode` | Publish HTML pilot, practical parent guidance, real session examples |
| Maternity photoshoot in Erode | `/maternity-photography-erode` | Studio/outdoor options, styling and authentic portfolio |
| Cake smash/first-birthday photoshoot | `/cake-smash-photography-erode` | Theme examples, inclusions and planning information |
| Studio location/contact | `/contact` | Clear heading, verified hours, directions and consistent identity |

An exploratory search surfaced Aalayam, Sri Sandeep Studio, Krowm and Kousik Photography. Their public pages illustrate useful comparison points: local studio detail, service categorization and package explanation. This is not an Erode-localized Google ranking study. Doll Pictures already has comparable service architecture and price information; original proof and reliable delivery are more defensible next improvements than copying competitors. References: [Aalayam](https://www.aalayamphotography.com/about-us), [Sri Sandeep Studio](https://srisandeepstudio.com/), [Krowm](https://krowmstudios.com/), [Kousik Photography](https://www.kousikphotography.com/).

## Proposed execution order

| When | Owner | Deliverable | Completion evidence |
|---|---|---|---|
| Week 1 | Developer + content owner | Fix three missing image defaults, review category mismatches, replace camera titles; correct admin response signals | HTTP/image checks and rendered page inspection |
| Week 1 | Developer | Roll out existing newborn HTML pilot using current CMS data | Production HTML, no-JS and hydration acceptance |
| Week 1 | Business/marketing owner | Verify hours/map/profile details; establish Search Console and GA4 baselines | Account-level records and a dated baseline |
| Weeks 2–3 | Developer + editor | Expand HTML rendering to priority routes; improve headings and contextual service-to-package links | Deployed route checks and crawl comparison |
| Weeks 2–4 | Editor/photographer | Publish two substantive real-session case studies and enrich top service pages | Original approved content linked from relevant pages |
| Weeks 3–4 | Developer | Measure performance and fix the highest measured bottleneck | Comparable lab runs and field monitoring |
| Ongoing | Business/marketing owner | Honest review workflow, current work, relevant partnerships | Qualified organic enquiries and booking attribution |

## Measurement and limits

Record Search Console non-brand impressions, clicks, CTR, query/page combinations, selected canonicals and indexing exclusions before changes. Submit or confirm the current sitemap, then inspect representative service and package URLs. A sitemap submission is not proof of indexing.

Track organic landing page → enquiry → qualified lead → booking, alongside Business Profile calls and website visits. Review technical delivery immediately; review search trends over subsequent weeks using comparable periods and seasonality. Set growth targets only after a baseline is available.

Search Console/GBP ownership and configuration, Google-rendered HTML, current search positions, backlinks, conversion event receipt and real-user speed remain unverified. Public search returned the homepage, but search results do not establish an exhaustive Google index count. No live form was submitted and no production changes were made.
