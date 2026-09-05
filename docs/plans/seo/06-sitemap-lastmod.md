# SEO-06 — Make Sitemap Modification Dates Accurate

**Priority:** P1  
**Effort:** Medium  
**Status:** In progress — service/package revision tracking implemented locally; deployment and other route types pending
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

## Implementation update — 5 Sep 2026

Implemented a first route-specific restoration for service and package landings. This does not complete the gallery/work/stories/about tracking items above.

### Significant updates and date sources

- Service links now store a server-owned `contentUpdatedAt`. Publication, title, description, heading, intro, path, label, image and section-content changes advance only the matching link's date. Footer/contact changes, unchanged submissions, section IDs, icons, and link reorder do not advance it. The timestamp is stored with the content write rather than generated during sitemap requests.
- Package categories store `contentUpdatedAt` for published category content changes. Published package creation, content changes, moves, unpublishing and deletion advance affected published category dates; drafts and unchanged values do not. Package mutations request a frontend rebuild through the existing deploy hook service.
- Legacy records retain missing dates until a tracked material update occurs. No migration invents historical dates. Invalid/future dates are omitted.
- Core/static/legal pages and gallery/work/stories/about still omit dates because their complete material-change history is not tracked. Do not substitute generic model `updatedAt` values or deployment dates.

### Delivery and rollout

- Backend sitemap emits explicit service/category revision dates without extra per-route reads.
- The public sitemap is also emitted by the frontend prerender build. Its CMS loader now carries these explicit dates into `dist/sitemap.xml`; merely deploying the backend is insufficient.
- Deploy backend first, then frontend. Make a real material service or package edit and verify only the relevant landing dates change after the generated site deploys. Repeated reads must retain identical dates. Existing records without tracked revisions should continue to omit them.
- Backend and frontend builds passed; focused tests cover stable XML, missing/invalid/future dates, isolated service updates, package moves/removals, draft/no-op exclusions, and static sitemap date serialization.
- Not deployed or verified against a live material edit. Direct database/seed writes bypass application revision tracking; audit those separately before relying on their resulting dates. Gallery/portfolio and frontend-authored content revisions require additional tracking before this broader plan can be marked complete.
