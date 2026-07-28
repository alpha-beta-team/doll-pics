# SEO-08 — Publish Genuine Shoot Case Studies

**Priority:** P1  
**Effort:** Large  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

The site earns local and long-tail relevance through genuine, useful shoot stories containing real photographs, first-hand expertise, and contextual internal links.

## Current gap

The site has service and package landing pages but no individual project/case-study pages. The current Stories page is primarily testimonial-oriented, and most portfolio content lacks real venue, event, process, and client context.

## Content policy

- Publish only first-hand work by Doll Pictures.
- Obtain client permission and protect children/newborn privacy.
- Do not create thin city pages by replacing only the city name.
- Do not invent venues, rituals, dates, client quotes, or outcomes.
- Write for prospective clients; search terms support the content rather than drive repetition.

## Pilot scope

Publish three strong pilot stories before building a larger CMS:

1. One Erode/Tamil Nadu wedding.
2. One newborn or baby session.
3. One maternity, milestone, cake-smash, or family session.

Use the pilot to validate traffic, enquiries, editorial effort, and whether a dedicated CMS model is justified.

## Page template

Each case study should include:

- [ ] Unique descriptive URL and title.
- [ ] Clear H1 with shoot type and genuine location/venue.
- [ ] Client-approved introduction and session goals.
- [ ] 8–20 optimized real images.
- [ ] Accurate captions/alt text where useful.
- [ ] Details about the approach, lighting, timeline, setup, or rituals.
- [ ] Practical advice for clients planning a similar session.
- [ ] Genuine quote when approved.
- [ ] Links to the relevant service and package pages.
- [ ] Booking CTA.
- [ ] Breadcrumbs, canonical, OG image, and appropriate structured data.

## Work plan

### Architecture decision

- [ ] Start with version-controlled content or define a minimal case-study CMS model.
- [ ] Support slug, title, description, H1, body sections, date, location, category, images, publish state, and `updatedAt`.
- [ ] Ensure draft pages are not indexable or present in the sitemap.
- [ ] Add route resolution and prerendering.

### Discovery and linking

- [ ] Add published case studies to the sitemap.
- [ ] Link from homepage featured work.
- [ ] Link from matching service and package pages.
- [ ] Add a browsable stories/portfolio index.
- [ ] Add related-story links without circular boilerplate.

### Editorial workflow

- [ ] Define owner/editor approval.
- [ ] Create a client-consent checklist.
- [ ] Create a pre-publication fact check.
- [ ] Record the actual last significant update date.
- [ ] Review Search Console performance after indexing.

## Acceptance criteria

- [ ] At least three genuine pilot case studies are published.
- [ ] Every page contains unique first-hand copy and real photographs.
- [ ] Every page is internally linked and appears in the sitemap.
- [ ] Drafts are inaccessible to search engines.
- [ ] Mobile performance remains acceptable despite image volume.
- [ ] Every page has a clear path to enquiry.
- [ ] No near-duplicate location/doorway page is created.

## Verification

- [ ] Crawl each story without JavaScript and with rendered JavaScript.
- [ ] Validate status, title, description, canonical, H1, image URLs, and internal links.
- [ ] Check mobile layout and image loading.
- [ ] Inspect each URL in Search Console.
- [ ] Track impressions, clicks, engagement, and enquiries by landing page.

## Likely files/systems

- New or extended story/case-study data model
- `src/App.tsx`
- `src/pages/`
- `scripts/prerender.ts`
- `src/lib/seo-core.ts`
- Backend sitemap
- CMS admin if the pilot proves ongoing publishing value

## Dependencies

SEO-02 must supply real media, and SEO-03 must establish the public business identity. The studio must provide accurate shoot facts and permissions.
