# SEO-06 — Make Sitemap Modification Dates Accurate

**Priority:** P1  
**Effort:** Medium  
**Status:** In progress — safe omission live; route-specific restoration pending
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Sitemap `lastmod` values represent the last significant change to each page, remain stable between requests, and change only when relevant content changes.

## Original issue

The backend sitemap assigns `new Date()` to every URL on every request. This reports that all 23 pages changed every day, regardless of their actual content.

## Implementation status

Completed locally on 30 Jul 2026:

- [x] Removed the request-time `new Date()` value from every sitemap URL.
- [x] Omitted `lastmod` until a trustworthy date exists for each route.
- [x] Removed `changefreq` and `priority`, which Google ignores.
- [x] Added regression tests proving that unchanged CMS routes produce stable XML.
- [x] Backend tests and production build pass.
- [x] Deploy the safe-omission CMS backend change.
- [x] Verify that the production sitemap no longer contains manufactured dates.

This is intentionally a safe first phase. `lastmod` will not return automatically.
Restore it only through the route-specific work below; never restore a shared
request date, deployment date, or current date across every URL.

## Strategy

Implement the smallest truthful version first:

1. Omit `lastmod` where no reliable source exists. **Implemented locally.**
2. Add route-specific dates only when they can be derived accurately.
3. Remove `priority` and `changefreq` unless retained for non-Google consumers; Google ignores them. **Implemented locally.**

## Restoration trigger

Restore `lastmod` only when all of the following are true:

- The relevant CMS models expose reliable `updatedAt` or publication timestamps.
- Each canonical route can be mapped to only the content that materially affects it.
- Unpublished, private, seed, analytics, counter, and routine footer changes are excluded.
- Repeated sitemap requests remain byte-for-byte stable when content is unchanged.
- Tests prove that changing one record updates only its relevant route or routes.
- Routes without a trustworthy timestamp continue to omit `lastmod`.

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

- [x] Remove request-time dates from sitemap generation.
- [x] Omit `lastmod` as the safe baseline.
- [x] Remove `changefreq` and `priority`.
- [x] Add baseline tests for stable XML and metadata omission.
- [ ] Expose or query only required `updatedAt` values.
- [ ] Avoid N+1 database queries while generating the sitemap.
- [ ] Produce W3C-compatible dates.
- [ ] Keep a stable value across repeated requests with unchanged data.
- [ ] Add unit tests for date selection and omission.

### Search Console

- [ ] Verify dates after SEO-01 restores delivery.
- [ ] Monitor whether updated pages are recrawled normally.

## Acceptance criteria

- [x] Two local sitemap builds with unchanged content return identical XML.
- [ ] After restoration, two requests with unchanged content return identical route-specific `lastmod` values.
- [ ] Updating one package category changes only its relevant page date.
- [ ] Updating a gallery image changes only relevant gallery/work dates.
- [x] Routes without a trustworthy date omit `lastmod`.
- [ ] No future dates are emitted.
- [ ] Sitemap XML remains valid.

## Verification

- [x] Generate the sitemap twice in a unit test and compare it.
- [ ] Update a test record and assert only expected routes change.
- [x] Run backend unit tests and production build.
- [x] Validate the production sitemap after deployment for the safe-omission phase.

Production verification on 7 Aug 2026 found 24 canonical URLs and zero
`<lastmod>` elements, confirming the safe-omission phase is live.

## Likely files/systems

- `photography-cms-backend/src/sitemap/sitemap.service.ts`
- Site Content, package category, package, photo, testimonial, and team models/services
- Backend sitemap tests
- Google Search Console

## Dependencies

SEO-01 must restore public sitemap delivery before production verification.
