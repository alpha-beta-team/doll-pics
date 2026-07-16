# 3. Content

[← Back to master audit](./README.md)

**Site:** [https://dollpictures.in](https://dollpictures.in)

---

## Summary

Service landing pages (`*-photography-erode`) have solid local keyword depth. Homepage/fallback CMS content still reads like a global template: European portfolio locations, “worldwide” copy, and unverifiable stats. That fights the Erode + Tamil Nadu SEO positioning.

---

## Findings

### 1. Stock portfolio with European locations mismatches local brand

| | |
|--|--|
| **Severity** | Critical |
| **Reference** | `src/data/content.ts` `featuredWork`: locations “Tuscany, Italy”, “Santorini, Greece”, “Paris, France”. Service fallbacks also use Pexels. Live site renders these titles. |
| **Fix** | Replace with real DOLL PICTURES shoots; set location to Erode / TN cities; keep Pexels only as temporary CMS-empty fallbacks. |

### 2. “Worldwide / brands” copy fights local SEO positioning

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | `src/contexts/SiteDataContext.tsx` default footer/about blurb: “weddings, portraits, and brands worldwide.” SEO pages correctly emphasize Erode + Tamil Nadu (`src/data/seo-pages.json`). |
| **Fix** | Rewrite defaults to Erode-rooted, TN travel — never “worldwide” unless true. |

### 3. Service landing pages have solid keyword depth

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `src/data/service-pages.json` — ~3 sections + FAQs + related links per `*-photography-erode` URL. Better than thin CSR stubs. Example: [Wedding photography in Erode](https://dollpictures.in/wedding-photography-erode). |
| **Fix** | Add 1–2 unique local proof points per page (venues shot, languages, ritual familiarity) once real portfolio exists. |

### 4. Internal linking is discoverable

| | |
|--|--|
| **Severity** | Low |
| **Reference** | Footer Services → all 6 SEO pages; service `related[]` links; nav Services dropdown. No orphan indexable routes in sitemap. |
| **Fix** | Add contextual links from homepage Featured Work cards to matching service pages when categories align. |

### 5. Stats look unverifiable / template-like

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | `src/data/content.ts`: 500+ weddings, 2M memories, 25 awards — live “By The Numbers” section. Risk if not accurate. |
| **Fix** | Publish only defensible numbers (years in business, sessions this year) or remove awards until documented. |

### 6. Freshness signal is present but lastmod is build-date only

| | |
|--|--|
| **Severity** | Low |
| **Reference** | Hero eyebrow “Collection 2026”; sitemap `lastmod` from `scripts/generate-sitemap.mjs` (build date, e.g. 2026-07-11). |
| **Fix** | Optional: bump `lastmod` when `service-pages.json` or CMS gallery changes. |

---

## Keyword / audience fit

| Intent | Coverage | Notes |
|--------|----------|--------|
| Wedding photographer Erode | Strong | Dedicated page + title/H1/FAQ |
| Newborn / maternity / cake smash Erode | Strong | Dedicated SEO pages |
| Packages / pricing | Partial | Page exists; live prices look broken |
| Local social proof | Weak | Fake Western testimonials |
| Own portfolio authenticity | Weak | Pexels + European locations |

---

## Related

- [Master audit](./README.md)
- [SEO](./seo.md)
- [Marketing](./marketing.md)
- [User Engagement](./user-engagement.md)
