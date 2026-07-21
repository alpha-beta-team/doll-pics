# Doll Pictures — Site Audit

**Live site:** [https://dollpictures.in](https://dollpictures.in)  
**Stack:** Vite + React (CSR) with post-build prerender (`scripts/prerender.ts`)  
**Audited:** 12 Jul 2026

## Verdict

This is **not** a fragile empty-shell CSR SPA — prerender, unique per-route meta, and JSON-LD are solid. The real damage is live **trust and conversion**: fake European testimonials, stock portfolio locations, and ₹1 placeholder packages.

| Metric | Count |
|--------|------:|
| Critical findings | 4 |
| Medium findings | 11 |
| Low findings | 8 |
| Render strategy | CSR + prerender |

## Dimension reports

| Dimension | File | Focus |
|-----------|------|--------|
| [1. SEO](./seo.md) | `seo.md` | Rendering, meta, sitemap, schema, CWV, headings, alts |
| [2. Marketing](./marketing.md) | `marketing.md` | Value prop, CTAs, funnel, social proof, analytics |
| [3. Content](./content.md) | `content.md` | Keyword fit, depth, freshness, internal linking |
| [4. User Engagement](./user-engagement.md) | `user-engagement.md` | Nav, mobile, a11y, loading, bounce signals |

## Top 5 actions

1. **Critical** — Package placeholders (₹1 / “Package 1”) — **resolved in backend**
2. **Critical** — Replace fake testimonials in CMS + European stock portfolio (Content) — fallbacks emptied; section hidden when empty
3. **Medium** — Sync CMS phone/WhatsApp to `+91 99945 55673` — shoot types aligned in code
4. **Medium** — Book is now primary hero CTA; still consider self-hosting LCP hero image (SEO)
5. **Medium** — Form aria-labels + tips opt-in done; still add skip link + review GA4 funnel (Engagement)

## Method notes

- Codebase review of `App.tsx`, `src/lib/seo.ts`, prerender, analytics, content JSON
- Googlebot-style curl of `/`, `/packages`, `/wedding-photography-erode`, 404, sitemap, robots
- Live browser snapshot at desktop and 390×844 mobile
- Search Console submission and GA4 bounce rates not available without account access

## Severity legend

| Severity | Meaning |
|----------|---------|
| **Critical** | Blocks trust, rankings, or conversion now |
| **Medium** | Meaningful gap; fix in the next iteration |
| **Low** | Polish / monitoring; low immediate risk |
