# 2. Marketing

[← Back to master audit](./README.md)

**Site:** [https://dollpictures.in](https://dollpictures.in)

---

## Summary

Biggest blockers are trust and conversion, not meta tags. Live homepage shows placeholder package prices (₹1), stock Pexels portfolio with European locations, and fabricated Western testimonials. GA4 conversion events are wired; Meta Pixel and email capture are absent.

---

## Status / checklist

| # | Finding | Status |
|---|---------|--------|
| 1 | Placeholder package pricing | **Resolved in backend** — no frontend change |
| 2 | Fabricated social proof | **Code done** — empty fallbacks; section hidden when empty. **CMS ops:** remove any live fake testimonials in `/admin/testimonials` |
| 3 | Hero primary CTA is portfolio | **Code done** — Book is primary; Explore Work secondary |
| 4 | Booking shoot types omit baby services | **Code done** — shared `SHOOT_TYPE_OPTIONS` |
| 5 | Phone NAP inconsistency | **Defaults/schema OK** (`+91 99945 55673`). **CMS ops:** set Site Content phone + WhatsApp to this number (live footer may still show `95975…` until CMS sync) |
| 6 | Meta Pixel absent | **Code done** — set `VITE_META_PIXEL_ID` in production env |
| 7 | No email capture | **Code done** — tips opt-in checkbox + `email_capture` event |
| 8 | Location-weak hero subcopy | **Code done** — Erode / Tamil Nadu clause added |

### CMS ops remaining

1. `/admin/site-content` — phone `+91 99945 55673`, WhatsApp `+919994555673`
2. `/admin/testimonials` — delete fake Western entries; add real Erode/TN quotes when ready
3. Deploy env — set `VITE_META_PIXEL_ID` to your Meta Pixel ID

---

## Findings

### 1. Placeholder / broken package pricing on live site

| | |
|--|--|
| **Severity** | Critical |
| **Status** | Resolved in backend |
| **Reference** | [https://dollpictures.in/](https://dollpictures.in/) — packages previously showed “Package 1” at ₹1 and “Baby Shoot” Starting from ₹1,000 alongside ₹1,00,000 wedding package. |
| **Fix** | Bad rows removed in backend. No client-side price filter. |

### 2. Fabricated social proof destroys credibility

| | |
|--|--|
| **Severity** | Critical |
| **Status** | Code done; CMS ops pending if API still returns fakes |
| **Reference** | `src/data/content.ts` fallbacks emptied; `Testimonials.tsx` returns null when empty. |
| **Fix** | Replace with real Erode/TN client quotes in `/admin/testimonials`. |

### 3. Hero primary CTA is portfolio, not booking

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Code done |
| **Reference** | `src/components/sections/Hero.tsx` — primary Book a Consultation → `/booking`; secondary Explore Our Work → `/work`. |
| **Fix** | Done. |

### 4. Booking form shoot types omit core baby services

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Code done |
| **Reference** | `src/lib/shootTypes.ts` used by `BookingCTA.tsx` and `BookingsPage.tsx`. |
| **Fix** | Done. |

### 5. Phone number inconsistency across surfaces

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Defaults/schema synced; CMS ops pending |
| **Reference** | Canonical NAP: `+91 99945 55673` / WhatsApp `+919994555673` (`seo-pages.json`, `defaultSiteContent`, `index.html` JSON-LD). |
| **Fix** | In `/admin/site-content`, set phone + WhatsApp to the canonical values above. |

### 6. GA4 conversion events are wired; Meta Pixel absent

| | |
|--|--|
| **Severity** | Low |
| **Status** | Code done — enable via env |
| **Reference** | `src/lib/metaPixel.ts` + wiring in `src/lib/analytics.ts`. Env: `VITE_META_PIXEL_ID`. |
| **Fix** | Set pixel ID in Netlify/Vercel production env. |

### 7. No email capture or retargeting list

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Code done |
| **Reference** | Enquiry form tips opt-in appends `[Tips email: yes]` to message; fires `email_capture` GA4 event. |
| **Fix** | Done (uses enquiry email; admin sees opt-in flag in message). |

### 8. Value proposition is emotional but location-weak in first viewport

| | |
|--|--|
| **Severity** | Low |
| **Status** | Code done |
| **Reference** | Hero subcopy now includes Erode & Tamil Nadu. |
| **Fix** | Done. |

---

## Conversion funnel (current)

```
Landing (/) → Book Consultation (primary) | Explore Work | Service pages
     → WhatsApp FAB / tel / Booking modal
     → booking_start → generate_lead (+ optional email_capture)
```

**Friction points (remaining)**

- CMS phone may still differ from schema until Site Content is updated
- Testimonials section hidden until real CMS quotes exist
- Portfolio authenticity still under Content audit (Pexels / European locations)

---

## Related

- [Master audit](./README.md)
- [SEO](./seo.md)
- [Content](./content.md)
- [User Engagement](./user-engagement.md)
