# Doll Pictures: Erode local search strategy

Review date: 7 September 2026. Scope: current frontend source, direct HTTP checks of all 32 production sitemap URLs, mobile Chrome rendering of home, newborn, wedding, contact and wedding packages, exploratory public searches, and Google documentation. No application code, CMS content, profile or deployment was changed by this review.

## Current assessment

The website has a useful technical foundation and existing destinations for local service and price intent. The owner confirms that Google Search Console and a verified Google Business Profile are both set up. Their reports were not accessed in this review. Actual organic performance remains unmeasured: Search Console, Google Business Profile performance, GA4 reports, qualified lead attribution and field Core Web Vitals were not available. Public search surfaced the homepage and a third-party Doll Pictures directory listing. This does not establish Google index coverage or Erode-localized rankings.

The earlier `seo-report-2026-09-07.md` describes a different deployment. The current production entry script is `/assets/index-DziDFG19.js`. The newborn HTML pilot is now live; the earlier report's all-pages-empty-root finding is superseded by the observations below. Local uncommitted work also adds wedding and maternity to the rendering scope; these two pages still had empty roots in the production responses checked here.

| Check | Current observation | Action |
|---|---|---|
| Public routes | All 32 sitemap URLs returned 200, with page titles, descriptions, self-canonicals and index/follow metadata | Preserve this coverage |
| Initial HTML | Newborn has 72,674 characters inside root and 23 image elements; the other 31 pages have empty roots with fallback text in noscript | Extend meaningful HTML to wedding, maternity, home and package pages; verify production after rollout |
| Structured data | LocalBusiness, WebPage and route-dependent Service/BreadcrumbList/FAQPage JSON parse | Keep accurate and aligned with visible content; presence is not rich-result eligibility |
| Missing route | Sample unknown URL returns 404 | Preserve genuine missing-page responses |
| Assets | `/images/services/maternity.jpg`, `/images/services/newborn.jpg`, `/images/services/family.jpg` return 404 | Repair any references; omit unavailable decorative previews |
| Rendered cards | Newborn and wedding have Birthday/Fashion image elements with empty src values | Fix CMS-to-card fallback handling |
| Content labels | Home selected stories are DSC01131 and DSC01078; wedding image alternatives include DSC04317 and DSC04304 | Use accurate session titles and descriptive alt text |
| Internal conversion links | Newborn main content has no package links | Add a clear contextual link to `/newborn-packages-erode`; reciprocate from packages |
| Pricing | Wedding packages publish multiple tiers and inclusions | Improve comparison and ordering; do not recommend adding already-present prices |
| Business identity | Contact and business schema show URT TOWERS, Perundurai Road, Teachers Colony, Palayapalayam, Erode | Verify map pin and consistent identity across official profiles |
| Opening hours | Friday closes at midnight; Saturday includes midnight–8:30 am | Owner must confirm these unusual hours before correction |
| Official profiles | Rendered business schema has no sameAs; local socials are empty | Add confirmed official profile URLs |
| Admin | Exact and nested admin routes return 200 without X-Robots-Tag; Vercel config omits admin noindex headers | Correct public-shell indexing signals; preserve authentication |
| Sitemap dates | No lastmod elements | Add only reliable content-modification dates; lower priority |
| Mobile sample | Home, newborn, wedding and contact had no page-level JS exceptions or horizontal document overflow | Limited smoke evidence, not speed or accessibility certification |
| Measurement | GA tag observed; source supports service, phone, WhatsApp and lead events | Verify receipt and actual booking attribution in accounts |

Google can render JavaScript, so empty roots do not prove indexing failure. Prerendering makes content and photography accessible earlier and to crawlers that do not execute JavaScript. [Google JavaScript guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Positioning and keyword map

The owner wants to target all photography categories. Give every category a useful service destination, relevant work and a booking path. Sequence technical rollout by current implementation readiness, then allocate content effort using actual impressions, enquiries, booking value and capacity. Newborn/maternity/milestones offer a connected repeat-customer opportunity without replacing wedding, family, ceremony or fashion priorities. This is a business hypothesis, not measured keyword demand or a claim of lower competition.

All phrases below are research candidates. No monthly search volumes, keyword difficulty or ranking positions were measured. Group related phrases on the same useful page rather than creating a page for every variation.

| Intent | Candidate phrases | Existing destination |
|---|---|---|
| Studio discovery | photography studio in Erode; photographers in Erode; photo studio Palayapalayam | Homepage and contact |
| Newborn | newborn photography Erode; newborn baby photoshoot Erode; newborn photoshoot studio Erode | `/newborn-baby-photography-erode` |
| Maternity | maternity photoshoot Erode; pregnancy photoshoot Erode | `/maternity-photography-erode` |
| Wedding | wedding photographers Erode; candid wedding photography Erode; wedding photography and videography Erode | `/wedding-photography-erode` |
| Pre-wedding | pre wedding photoshoot Erode; pre wedding photography packages Erode | `/pre-wedding-packages-erode`, supported by wedding service content |
| Price comparison | wedding photography packages Erode; newborn photoshoot price Erode; maternity photoshoot cost Erode | Matching wedding/newborn/maternity package pages |
| Milestones | baby photoshoot Erode; six month baby photoshoot Erode; baby milestone photography Erode | `/baby-milestone-photography-erode` with clear links to newborn and toddler options |
| First birthday portraits | cake smash photoshoot Erode; first birthday photoshoot Erode | `/cake-smash-photography-erode` |
| Birthday coverage | birthday event photographer Erode | `/birthday-event-photography-erode` |
| Local ceremonies | baby shower photography Erode; valaikappu photography Erode; seemantham photography Erode | `/baby-shower-photography-erode` |
| Family ceremonies | ear piercing ceremony photography Erode; kathukuthu photography Erode | `/ear-piercing-photography-erode` |
| Family | family photography Erode; family portrait studio Erode | `/family-photography-erode` and `/family-packages-erode` |
| Toddlers | toddler photoshoot Erode; toddler baby photography Erode | `/toddler-baby-photography-erode` and `/toddler-baby-shoot-packages-erode` |
| Kids | kids photography Erode; children photoshoot Erode | `/kids-photography-erode` |
| Fashion | fashion photography Erode; model portfolio photoshoot Erode | `/fashion-photography-erode`, where portfolio services are actually offered |

Test Tamil phrases such as “ஈரோடு குழந்தை போட்டோஷூட்”, “ஈரோடு திருமண புகைப்படம்”, and “ஈரோடு வளைகாப்பு போட்டோகிராபி” in genuine Tamil captions, FAQs and professionally reviewed copy. These are unvalidated language/search hypotheses. Build full Tamil pages only when useful content and maintenance are supported; do not insert a block of repeated translated keywords.

Use Palayapalayam, Teachers Colony and Perundurai Road naturally in studio directions because they match the published address. Consider Perundurai, Bhavani, Chithode, Gobichettipalayam or Pallipalayam only where the studio actually serves clients. Distinguish Perundurai Road from Perundurai town. Publish regional case studies when real work supports them; do not imply branches or manufacture near-identical town pages.

## Google Business Profile and local demand

1. The owner confirms the profile is verified. Audit the actual business name, precise pin, contact number, hours and the most accurate available business categories. Choose categories based on the real business; avoid keyword stuffing the profile name.
2. Add the actual services and matching website destinations where the profile permits links. Use a tagged website link such as `?utm_source=google&utm_medium=organic&utm_campaign=gbp` to distinguish profile traffic in analytics.
3. Add current, permission-cleared portfolios and practical studio photos: entrance, signage, interior and available setups. A regular weekly update is a manageable editorial routine, not a guaranteed ranking factor.
4. Request an honest Google review consistently after delivery, using the profile's review link or QR code. Invite feedback from all clients, without rewards, rating requirements or filtering unhappy clients. Reply personally.
5. Keep genuine local listings consistent. Explore credited portfolio collaborations with Erode venues, makeup artists, planners, maternity boutiques, baby stores and cake makers. Agree permission and credits; avoid paid link packages.

Google identifies relevance, distance and prominence as local ranking factors. Profile completeness, reviews and relevant mentions help address parts of that picture; expanding service-area text cannot move the physical studio closer to searchers. [Local ranking guidance](https://support.google.com/business/answer/7091?hl=en), [business representation guidance](https://support.google.com/business/answer/3038177?hl=en), [review guidance](https://support.google.com/business/answer/3474122?hl=en).

## Improve the website's evidence and booking clarity

- Retain the brand line but make the homepage's prominent service promise explicit: “Wedding & Baby Photography in Erode.” Support it with the actual Palayapalayam studio location.
- Add a relevant package link beside service enquiry buttons. The newborn page is an immediate opportunity. Keep service pages about experience and evidence, and package pages about cost and inclusions.
- Replace camera filenames with accurate descriptions. A suitable title could be “Newborn studio session in Erode” if it describes the real work. Describe the actual subject, pose and setting in alt text; do not repeat location keywords mechanically. [Google image guidance](https://developers.google.com/search/docs/appearance/google-images).
- Add approved real-session stories with a stable URL, curated photographs, practical planning detail and links back to the service/package. Protect client and child privacy through publication permission.
- Answer concrete booking questions: session duration, number of setups, outfits/props supplied, parent participation, edited images, delivery timeline and price inclusions. Publish only confirmed details.
- Review package presentation: the wedding page inserts a generic “Wedding Photography — Starting from ₹1,00,000” entry among named tiers. Confirm its intended role and make comparison/order clearer.
- Existing source includes Pexels fallback images, including some alt text implying Doll Pictures authorship. Replace such portfolio fallbacks with real work or neutral presentation; this review did not establish that those stock fallbacks were currently shown in the sampled live galleries.

Exploratory competitors offer useful comparison points: [Kousik Photography](https://www.kousikphotography.com/) explains service style and packages; [Little Shots by Hema](https://littleshotsbyhema.com/) organizes maternity/newborn stages and care messaging. These observations do not establish their Google positions in Erode or prove that those elements cause rankings.

## First 90 days

| Period | Practical deliverables | Evidence of progress |
|---|---|---|
| Days 1–14 | Finish priority HTML rollout; fix images/titles; verify hours/profile identity; add service-to-package links; baseline accounts | Live HTML and image checks; accurate profile; dated Search Console and lead baseline |
| Days 15–30 | Enrich newborn, maternity and wedding pages first alongside their HTML rollout; publish two permission-cleared local session stories; establish review request routine | Specific useful content, contextual links and genuine reviews |
| Days 31–60 | Extend content and package-link checks to family, toddler, kids, milestone, cake smash, birthday, ceremonies and fashion; publish two more real stories or planning guides; pursue relevant vendor collaborations; improve measured mobile bottlenecks | Complete category coverage, relevant referral mentions and comparable performance measurements |
| Days 61–90 | Compare query/page results and qualified enquiries; improve pages with impressions but weak click-through or conversion | Search and booking outcomes, not just traffic |

Suggested editorial topics: newborn session preparation at the Erode studio; maternity styling and studio options; what Doll Pictures wedding packages include; a genuine wedding at a named Erode venue; first-birthday cake-smash themes from actual sessions; a real valaikappu celebration.

Measure non-brand Search Console impressions/clicks, CTR and page/query combinations; inspect representative indexed URLs and Google-selected canonicals. Track Business Profile calls, directions and website clicks separately from website form leads. Validate existing GA4 events, then connect qualified enquiries and bookings to their source. Phone/WhatsApp clicks are intent signals, not confirmed bookings.

No current speed score is assigned. Obtain mobile field Core Web Vitals where available and repeat lab measurements consistently for diagnosis. Target good field performance around LCP 2.5 seconds, INP 200 ms and CLS 0.1. [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

Owner inputs still needed: genuine operating hours, official profile URLs, account-level performance reports and permission-cleared local portfolio material. Start with the last three months of Search Console query/page data and Business Profile performance, comparing the previous period and prior year where available. This strategy does not promise positions, search volume or lead growth without a baseline.
