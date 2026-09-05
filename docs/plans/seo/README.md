# SEO Remediation — Master Plan

**Created:** 28 Jul 2026  
**Source:** Live-site and codebase SEO review  
**Scope:** `doll-pics`, `photography-cms-backend`, production hosting, Google Search Console, and Google Business Profile

## Objective

Strengthen organic and local-search visibility by fixing crawl discovery first, removing placeholder trust signals, establishing one business identity, improving mobile loading, and then expanding the site with authentic, indexable photography content.

This plan does not include building a full SEO CMS. Core SEO remains version-controlled, while frequently changed service, package, media, and business content continues to use the existing CMS.

## Baseline

| Check | 28 Jul 2026 result |
|---|---|
| Public `/sitemap.xml` | 404 HTML response; zero sitemap URLs |
| Backend sitemap | 200 XML; 23 canonical URLs |
| Production photo records | 19 published records; all `seed/*` / Picsum |
| Mobile Lighthouse | Performance 69, SEO 100, Accessibility 96 |
| Mobile lab LCP | 8.6 seconds |
| Canonical phone in static SEO | `+91 99945 55673` |
| Phone returned by live CMS | `+91 95975 62337` |
| Production build/typecheck | Passing |

## Plan index

| ID | Priority | Plan | Effort | Status | Depends on |
|---|---|---|---|---|---|
| SEO-01 | P0 | [Restore public sitemap delivery](./01-sitemap-delivery.md) | M | Completed — public delivery verified 5 Sep 2026; operational follow-ups tracked separately | — |
| SEO-02 | P0 | [Replace seeded and stock media](./02-authentic-media.md) | L | Not started | Content/assets from studio |
| SEO-03 | P0 | [Unify business identity and NAP](./03-business-identity-nap.md) | M | Completed — core identity and GBP alignment verified 5 Sep 2026; operational follow-ups tracked separately | — |
| SEO-04 | P0 | [Remove placeholder social proof and claims](./04-social-proof-cleanup.md) | M | Monitoring — public cleanup live; authentic replacements pending | Client/team verification for future content |
| SEO-05 | P1 | [Improve hero loading and Core Web Vitals](./05-hero-core-web-vitals.md) | L | Not started | SEO-02 |
| SEO-06 | P1 | [Make sitemap modification dates accurate](./06-sitemap-lastmod.md) | M | In progress — safe omission live; route-specific restoration pending | SEO-01 |
| SEO-07 | P1 | [Create a concise title and brand strategy](./07-title-brand-strategy.md) | M | Not started | SEO-03 |
| SEO-08 | P1 | [Publish genuine shoot case studies](./08-shoot-case-studies.md) | L | Not started | SEO-02, SEO-03 |
| SEO-09 | P2 | [Add image discovery and image sitemap support](./09-image-discovery.md) | M | Not started | SEO-01, SEO-02, SEO-08 |
| SEO-10 | P2 | [Resolve accessibility and page-experience findings](./10-accessibility-page-experience.md) | M | Not started | — |

## Recommended execution order

### Wave 1 — Stop active damage

1. SEO-01: restore `/sitemap.xml`.
2. SEO-03: choose and synchronize the canonical business identity and phone.
3. SEO-04: remove unverified testimonials, people, statistics, and broken media.
4. Start SEO-02: upload real portfolio assets and remove seeded records.

### Wave 2 — Improve search presentation and loading

1. Finish SEO-02.
2. SEO-05: make the first real hero image fast and stable.
3. SEO-07: shorten titles while preserving the full business entity name.
4. SEO-06: correct `lastmod` after sitemap delivery is stable.
5. SEO-10 can run in parallel with the development work.

### Wave 3 — Grow qualified organic traffic

1. SEO-08: publish real shoot stories and locally relevant proof.
2. SEO-09: expose those real photographs through image sitemap data.
3. Review Search Console query and landing-page data before creating additional service or location pages.

## Release gates

No wave is complete until its applicable gates pass:

- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] `npm run lint` has no new errors
- [ ] Production smoke checks pass for status, title, canonical, robots, and sitemap
- [ ] Mobile Lighthouse is run three times and the median is recorded
- [ ] Google Search Console URL Inspection confirms the deployed HTML
- [ ] CMS production data has been reviewed by a human, not only seeded by a script

## Success measures

Measure progress monthly in Search Console and Google Business Profile:

- Valid sitemap fetch with all intended canonical URLs
- Indexed service, package, and case-study pages
- Growth in non-branded impressions for Erode photography queries
- Growth in branded impressions and clicks
- Organic landing-page enquiries, calls, and WhatsApp clicks
- Mobile Core Web Vitals moving to “Good”
- Image-search impressions after genuine portfolio publication
- Consistent name, address, and phone across owned and third-party profiles

## Status maintenance

Update the plan table when work begins or finishes:

- `Not started`
- `In progress`
- `Blocked`
- `Complete`
- `Monitoring`

When completing a plan, record the deployment URL/date, verification evidence, and any follow-up item inside that plan.
