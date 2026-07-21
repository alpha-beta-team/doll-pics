# 1. SEO

[← Back to master audit](./README.md)

**Site:** [https://dollpictures.in](https://dollpictures.in)

---

## Summary

Not a pure empty-shell CSR risk. Build runs `vite build && tsx scripts/prerender.ts`. Live Googlebot fetches unique title/description/canonical/OG/JSON-LD per route, with noscript body copy on service pages. `robots.txt` + `sitemap.xml` are present and accurate.

---

## Findings

### 1. Not pure CSR — prerender mitigates crawler emptiness

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `package.json` build → `vite build && tsx scripts/prerender.ts`; live `/wedding-photography-erode` returns unique title, FAQPage + Service JSON-LD, and noscript `<h1>` |
| **Fix** | Keep prerender in CI; add a smoke check that `dist/{route}/index.html` contains the expected `<title>` after every deploy. |

### 2. Homepage H1 is brand-poetic, not keyword-aligned

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | [https://dollpictures.in/](https://dollpictures.in/) — H1 “We don't take photographs.” (`src/components/sections/Hero.tsx` ~214–218). Title tag is strong: “Wedding & Baby Photography in Erode”. |
| **Fix** | Keep the poetic line as a display span, but make H1 (or a visually hidden H1) match the SEO heading in `src/data/seo-pages.json` (“DOLL PICTURES” / wedding & baby photography in Erode). |

### 3. Meta, canonical, OG, Twitter are unique per route

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `index.html` defaults; runtime `applyPageSeo` in `src/lib/seo.ts`; prerender injects per-route head. OG image `public/og-share.jpg` is 1200×630. |
| **Fix** | No structural fix needed — optionally add per-service `og:image` when CMS photos are real. |

### 4. robots.txt + sitemap present; GSC verification meta present

| | |
|--|--|
| **Severity** | Low |
| **Reference** | [https://dollpictures.in/robots.txt](https://dollpictures.in/robots.txt) — Disallow `/admin/`; [sitemap](https://dollpictures.in/sitemap.xml) lists 15 URLs. `google-site-verification` in `index.html` L10. Submission to Search Console cannot be verified from code. |
| **Fix** | Confirm sitemap is submitted in Google Search Console and monitor Coverage for the 6 `*-photography-erode` URLs. |

### 5. Structured data coverage is strong

| | |
|--|--|
| **Severity** | Low |
| **Reference** | PhotographyBusiness + WebPage + BreadcrumbList + Service + FAQPage on service pages (verified live on `/wedding-photography-erode`). |
| **Fix** | Add AggregateRating / Review only after real local testimonials replace placeholders (fake reviews in schema would be worse). |

### 6. URL structure is clean and semantic

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `SERVICE_PATHS` in `src/lib/navigation.ts` — e.g. `/maternity-photography-erode`. www→apex 308 in `vercel.json`. Unknown paths return HTTP 404 via `/404.html`. |
| **Fix** | None required for structure; avoid changing Erode slugs once they start ranking. |

### 7. LCP depends on third-party Pexels + ~273KB main JS

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | Hero preload to `images.pexels.com` (`index.html` L30–38); main bundle `/assets/index-*.js` ~273KB. Route/section lazy loading exists in `App.tsx` + `Site.tsx`. |
| **Fix** | Self-host the LCP hero WebP on `dollpictures.in` (same sizes as preload); enable Brotli/gzip if not already at CDN edge. |

### 8. Generic before/after alt text

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `src/components/sections/BeforeAfter.tsx` — `alt="Before"` / `alt="After"` |
| **Fix** | Use descriptive alts, e.g. “Unedited wedding portrait” / “Color-graded wedding portrait by DOLL PICTURES”. |

### 9. Homepage prerender body is noscript-only (empty `#root`)

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | Live `/` HTML: `<div id="root"></div>` + short noscript. Meta/JSON-LD are in `<head>` (good for Google). Non-JS scrapers see thin body. |
| **Fix** | Optionally expand homepage noscript with services list + internal links (mirror service-page prerender depth). |

---

## Related

- [Master audit](./README.md)
- [Marketing](./marketing.md)
- [Content](./content.md)
- [User Engagement](./user-engagement.md)
