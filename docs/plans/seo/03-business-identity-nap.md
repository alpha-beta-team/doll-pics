# SEO-03 — Unify Business Identity and NAP

**Priority:** P0  
**Effort:** Medium  
**Status:** In progress — production CMS synchronized; frontend deployment and profile verification pending
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

Approved by the owner on 7 Aug 2026:

- [x] Real-world/GBP name: `Doll Pictures by Ramya Vignesh`.
- [x] Primary phone: `+91 99945 55673`.
- [x] WhatsApp: `+91 99945 55673` (`+919994555673` in E.164 form).
- [x] Studio address: `URT TOWERS, 139/4-D, Perundurai Rd, Teachers Colony, Palayapalayam, Erode, Tamil Nadu 638011`.
- [x] Public opening hours recorded from the supplied Google listing screenshot.
- [x] Primary email: `dollpictures2025@gmail.com`.
- [x] Confirmed owned URL: `https://dollpictures.in/`. No social profile URL was approved, so none is asserted in structured data or frontend fallbacks.

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

- [x] Update production Site Content.
- [x] Replace duplicated identity fields in `seo-pages.json` with the canonical identity source.
- [x] Update static `index.html` fallbacks.
- [x] Update frontend default site content and protect canonical fields from stale CMS values.
- [x] Update backend seed defaults and environment documentation.
- [x] Update all `tel:`, WhatsApp, email, address, map, footer, legal, and booking surfaces.
- [x] Ensure prerendered structured data and runtime structured data resolve to the same identity.
- [x] Add the confirmed opening hours and address-based Google Maps URL.

### External profiles

- [ ] Update Google Business Profile.
- [ ] Update Instagram and other owned social profiles.
- [ ] Correct high-value directory and wedding-platform listings.
- [ ] Remove or merge duplicate profiles where ownership is confirmed.
- [ ] Use the same website canonical URL everywhere.

### Guardrails

- [x] Create one typed/configured canonical identity source for frontend fallbacks.
- [x] Add tests that lock the approved name, phone, WhatsApp, email, structured data, and static HTML fallback.
- [x] Prevent production seed scripts from restoring obsolete contact details.

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

Implementation record, 7 Aug 2026:

- Added a version-controlled canonical identity source for frontend SEO and UI fallbacks.
- Added the supplied opening hours to the Contact page and local-business structured data.
- Kept `Doll Pictures` as the concise display brand while using the approved full name for the business entity.
- Updated backend seed defaults and added a dry-run-first identity migration.
- Applied the migration to production and verified the public CMS response uses the approved name, email, phone, and WhatsApp number with no unconfirmed social profiles.
- Frontend typecheck, SEO tests, production build, and lint completed with no errors; backend build and all 96 tests passed.

The owner-decision blocker is resolved. Remaining rollout work:

- Deploy the frontend changes and the backend seed/migration guardrails.
- Verify the rendered site, live CMS response, Google Business Profile, and owned listings.
- Add social profile URLs later only after the owner explicitly confirms them.

SEO-07 can now use `Doll Pictures by Ramya Vignesh` as the full entity name and `Doll Pictures` as the concise display/title brand.
