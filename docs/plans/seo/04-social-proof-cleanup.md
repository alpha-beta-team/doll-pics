# SEO-04 — Remove Placeholder Social Proof and Claims

**Priority:** P0  
**Effort:** Medium  
**Status:** Not started  
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Public testimonials, team profiles, statistics, awards, and behind-the-scenes claims are genuine, attributable, and supported by evidence.

## Current evidence

- Production testimonials include Tuscany, Kyoto, and Paris placeholder stories.
- The team endpoint includes placeholder profiles and a record named `111`.
- Two team image URLs point to `localhost`.
- Published statistics claim 500+ weddings, 10 years, 2M memories, 98% happy clients, and 25 awards.
- Some behind-the-scenes content is stock imagery without descriptions.

## Work plan

### Immediate production cleanup

- [ ] Unpublish or delete placeholder international testimonials.
- [ ] Verify the remaining client testimonial and obtain publication consent.
- [ ] Unpublish placeholder team members and the `111` record.
- [ ] Fix or remove every `localhost` media URL.
- [ ] Hide sections that do not yet have credible content.

### Evidence review

- [ ] Create an internal evidence note for every public statistic.
- [ ] Replace vague or unverifiable metrics with defensible figures.
- [ ] Remove “awards” unless each award can be named and evidenced.
- [ ] Confirm years of experience against the actual start date.
- [ ] Ensure ratings and review text match real client feedback.

### Replace with authentic proof

- [ ] Publish real team names, roles, biographies, and portraits.
- [ ] Publish client-approved testimonials with accurate session type/location.
- [ ] Add genuine studio/process photographs and descriptions.
- [ ] Link to Google reviews where appropriate without copying unsupported ratings into schema.
- [ ] Add dates or project context when it improves credibility.

### Prevent recurrence

- [ ] Separate demo fixtures from production seed data.
- [ ] Make production seeding idempotent without restoring examples.
- [ ] Add production validation rejecting `localhost` public media URLs.
- [ ] Add clear “draft/unpublished” defaults for new CMS records.
- [ ] Document the review-consent and content-approval workflow.

## Acceptance criteria

- [ ] No placeholder testimonial is publicly visible.
- [ ] Every public testimonial is genuine and approved.
- [ ] Every team record represents a real current team member.
- [ ] No public asset URL contains `localhost`.
- [ ] Every public statistic has documented evidence.
- [ ] Empty proof sections hide cleanly.
- [ ] Production seeding cannot recreate demo claims.
- [ ] No self-serving aggregate-rating schema is added.

## Verification

- [ ] Review public testimonial, team, stats, and behind-scenes API responses.
- [ ] Search the rendered DOM for `Tuscany`, `Kyoto`, `Paris`, `111`, and `localhost`.
- [ ] Test the About and Stories pages with empty and populated data.
- [ ] Confirm all public media URLs return HTTP 200.

## Likely systems

- CMS testimonials, team, stats, and behind-the-scenes screens
- Backend seed data and public DTOs
- `src/data/content.ts`
- `src/components/stories/`
- `src/components/about/`
- `src/components/sections/`

## Dependencies

The owner must identify real team members, approve valid business claims, and confirm testimonial permissions.
