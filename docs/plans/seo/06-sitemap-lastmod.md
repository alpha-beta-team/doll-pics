# SEO-06 — Make Sitemap Modification Dates Accurate

**Priority:** P1  
**Effort:** Medium  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Sitemap `lastmod` values represent the last significant change to each page, remain stable between requests, and change only when relevant content changes.

## Current evidence

The backend sitemap assigns `new Date()` to every URL on every request. This reports that all 23 pages changed every day, regardless of their actual content.

## Strategy

Implement the smallest truthful version first:

1. Omit `lastmod` where no reliable source exists.
2. Add route-specific dates only when they can be derived accurately.
3. Remove `priority` and `changefreq` unless retained for non-Google consumers; Google ignores them.

## Work plan

### Define significant updates

- [ ] Document what counts as a significant update for each route type.
- [ ] Exclude analytics, counters, routine footer changes, and request time.
- [ ] Include material title, description, body, package, service, FAQ, or portfolio changes.

### Map route dates

- [ ] Core static pages: derive from the deployed content revision or omit.
- [ ] Service pages: use the Site Content document update time when the matching service record changes.
- [ ] Package pages: use the relevant package-category/package update time.
- [ ] Gallery/work: use the latest published relevant photo update.
- [ ] Stories/about: use relevant testimonial/team/content update times.
- [ ] Privacy/terms: use their actual content revision date.

### Backend implementation

- [ ] Expose or query only required `updatedAt` values.
- [ ] Avoid N+1 database queries while generating the sitemap.
- [ ] Produce W3C-compatible dates.
- [ ] Keep a stable value across repeated requests with unchanged data.
- [ ] Add unit tests for date selection and omission.

### Search Console

- [ ] Verify dates after SEO-01 restores delivery.
- [ ] Monitor whether updated pages are recrawled normally.

## Acceptance criteria

- [ ] Two consecutive sitemap requests with unchanged content return identical `lastmod` values.
- [ ] Updating one package category changes only its relevant page date.
- [ ] Updating a gallery image changes only relevant gallery/work dates.
- [ ] Routes without a trustworthy date omit `lastmod`.
- [ ] No future dates are emitted.
- [ ] Sitemap XML remains valid.

## Verification

- [ ] Snapshot the sitemap twice on the same day and diff it.
- [ ] Update a test record and assert only expected routes change.
- [ ] Run backend unit tests.
- [ ] Validate the production sitemap after deployment.

## Likely files/systems

- `photography-cms-backend/src/sitemap/sitemap.service.ts`
- Site Content, package category, package, photo, testimonial, and team models/services
- Backend sitemap tests
- Google Search Console

## Dependencies

SEO-01 must restore public sitemap delivery before production verification.
