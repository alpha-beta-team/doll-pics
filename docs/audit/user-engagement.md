# 4. User Engagement

[← Back to master audit](./README.md)

**Site:** [https://dollpictures.in](https://dollpictures.in)

---

## Summary

First-time visitors can reach Services and Booking in under three clicks. Mobile layout at 390×844 works. Gaps are accessibility (form labels, skip link), below-fold pop-in from null Suspense fallbacks, and GA4 funnel analysis that needs account access.

---

## Findings

### 1. Navigation is clear within 3 clicks

| | |
|--|--|
| **Severity** | Low |
| **Reference** | Mobile: hamburger → Services / Booking. Desktop: `NAV_LINKS` + Services dropdown (`src/components/Navbar.tsx`). Contact FAB always available (`ContactFabs.tsx`). |
| **Fix** | None urgent; consider sticky Book CTA in mobile header for fewer taps. |

### 2. Mobile layout works at 390×844

| | |
|--|--|
| **Severity** | Low |
| **Reference** | Browser resize test on live `/` — stacked CTAs, hamburger, readable hero. Custom cursor disabled on coarse pointers (CSS). |
| **Fix** | Verify HorizontalGallery swipe affordance on real devices (scroll snap). |

### 3. Booking form lacks visible labels

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | `src/components/sections/BookingCTA.tsx` L163–200 — placeholders only; success/error states exist. No `aria-label` on fields. |
| **Fix** | Add `<label>` for each control (or `aria-label`) to meet WCAG 3.3.2. |

### 4. No skip-to-content link

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | No skip / `#main-content` pattern found. Navbar is fixed `h-20`. |
| **Fix** | Add skip link targeting `<main>` on `Site` and `ServicePage`. |

### 5. Loading states: spinner on lazy routes; homepage sections use null fallback

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `App.tsx` `PublicLoading` spinner; `Site.tsx` `Suspense fallback={null}` — possible content pop-in below fold. |
| **Fix** | Use a minimal skeleton for first below-fold section (FeaturedWork) to reduce layout jump. |

### 6. Session/bounce analytics not inspectable from codebase

| | |
|--|--|
| **Severity** | Medium |
| **Reference** | GA4 fires when `VITE_GA_MEASUREMENT_ID` is set on production origin (`src/lib/analytics.ts`). No access to GA4 UI from this audit. |
| **Fix** | In GA4 Explore: funnel Landing → `view_service` → `booking_start` → `generate_lead`; flag high-exit pages. |

### 7. Reduced-motion CSS present; contrast on muted text may fail AA

| | |
|--|--|
| **Severity** | Low |
| **Reference** | `text-ink-200/90` and `/60` on dark hero/footer — likely borderline for small text. `prefers-reduced-motion` handled in global CSS. |
| **Fix** | Bump supporting body to ≥ ink-200 solid (no `/60`) for paragraphs under 18px. |

---

## Interactive states checklist

| Area | Status |
|------|--------|
| Hover on CTAs / nav | Present |
| Booking modal success | Present |
| Booking modal error | Present |
| Empty testimonials / packages | Relies on CMS/fallback data (placeholder risk) |
| Lazy route loading spinner | Present |
| Homepage section skeleton | Missing (`fallback={null}`) |
| Keyboard Escape on FAB / Services dropdown | Present |

---

## Related

- [Master audit](./README.md)
- [SEO](./seo.md)
- [Marketing](./marketing.md)
- [Content](./content.md)
