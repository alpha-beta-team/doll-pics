# SEO-03 — Unify Business Identity and NAP

**Priority:** P0  
**Effort:** Medium  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

The business name, address, phone, WhatsApp number, and owned profiles are consistent across the website, structured data, CMS, Google Business Profile, social profiles, and important directory listings.

## Current evidence

- Static SEO/schema phone: `+91 99945 55673`.
- Live CMS phone: `+91 95975 62337`.
- Live CMS WhatsApp: `+919597562337`.
- Names vary between `DOLL PICTURES`, `Doll Pictures`, and `Doll Pictures by Ramya Vignesh`.
- Structured data currently uses the full name as both `name` and `alternateName`.

## Required owner decision

Before editing code or profiles, document:

- [ ] The exact real-world/GBP business name.
- [ ] The primary public phone number.
- [ ] The WhatsApp number.
- [ ] The public studio address and map pin.
- [ ] Public opening hours.
- [ ] The primary email address.
- [ ] The official Instagram, Facebook, YouTube, and Google Business Profile URLs.

## Recommended identity mapping

| Surface | Value strategy |
|---|---|
| GBP and `PhotographyBusiness.name` | Full real-world business name |
| `alternateName` | Recognized short brand, if genuinely used |
| SEO title suffix | Short brand for concise titles |
| Navbar/logo/footer | Real customer-facing brand |
| Phone/address/hours | Exact canonical NAP |

## Work plan

### Website and CMS

- [ ] Update production Site Content.
- [ ] Update `seo-pages.json`.
- [ ] Update static `index.html` fallbacks.
- [ ] Update frontend default site content.
- [ ] Update backend seed defaults and environment documentation.
- [ ] Update all `tel:`, WhatsApp, email, address, map, footer, legal, and booking surfaces.
- [ ] Ensure prerendered structured data and runtime structured data resolve to the same identity.
- [ ] Add accurate opening hours and map URL only if confirmed.

### External profiles

- [ ] Update Google Business Profile.
- [ ] Update Instagram and other owned social profiles.
- [ ] Correct high-value directory and wedding-platform listings.
- [ ] Remove or merge duplicate profiles where ownership is confirmed.
- [ ] Use the same website canonical URL everywhere.

### Guardrails

- [ ] Create one typed/configured canonical identity source for frontend fallbacks.
- [ ] Add a build check that flags unexpected phone numbers and brand variants.
- [ ] Prevent production seed scripts from restoring obsolete contact details.

## Acceptance criteria

- [ ] One canonical name, address, phone, and WhatsApp mapping is documented.
- [ ] Static HTML, JSON-LD, rendered footer/navbar, and CMS API agree.
- [ ] Google Business Profile and the website agree.
- [ ] `name` and `alternateName` are purposeful, not duplicates.
- [ ] All phone and WhatsApp links open the correct destination.
- [ ] No obsolete phone number remains in production code, CMS data, or owned profiles.

## Verification

```bash
rg -n '99945|95975|DOLL PICTURES|Doll Pictures' src index.html public README.md
curl -sS https://photography-cms-backend.onrender.com/api/site-content
curl -sS https://dollpictures.in/ | grep -E 'telephone|alternateName|og:site_name'
```

Also verify the live Google Business Profile manually after its updates are approved.

## Dependencies

This plan is blocked until the owner confirms which phone and exact real-world name are canonical. SEO-07 should use the resulting identity mapping.
