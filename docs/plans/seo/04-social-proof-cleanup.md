# SEO-04 — Remove Placeholder Social Proof and Claims

**Priority:** P0  
**Effort:** Medium  
**Status:** Monitoring — cleanup live; owner verified published reviews, like counts, and Stories page; team/process content pending
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Public testimonials, team profiles, statistics, awards, and behind-the-scenes claims are genuine, attributable, and supported by evidence.

## Original findings (historical)

- Production testimonials include Tuscany, Kyoto, and Paris placeholder stories.
- The team endpoint includes placeholder profiles and a record named `111`.
- Two team image URLs point to `localhost`.
- Published statistics claim 500+ weddings, 10 years, 2M memories, 98% happy clients, and 25 awards.
- Some behind-the-scenes content is stock imagery without descriptions.

## Work plan

### Immediate production cleanup

- [x] Unpublish placeholder international testimonials.
- [x] Preserve the remaining client testimonial as a draft until publication consent is recorded.
- [x] Unpublish every unverified or broken team profile; the previously reported `111` record was no longer present.
- [x] Remove every `localhost` media URL from public API responses by unpublishing affected profiles.
- [x] Hide sections that do not yet have credible content.

### Evidence review

- [x] Unpublish all statistics until an internal evidence note exists for each one.
- [x] Remove vague or unverifiable metrics from public display.
- [x] Remove “awards” from public display until each award can be named and evidenced.
- [x] Remove the years-of-experience claim until the actual start date is confirmed.
- [x] Remove ratings and review text from public display until source and consent are verified.

### Replace with authentic proof

- [ ] Publish real team names, roles, biographies, and portraits.
- [ ] Publish client-approved testimonials with accurate session type/location.
- [ ] Add genuine studio/process photographs and descriptions.
- [ ] Link to Google reviews where appropriate without copying unsupported ratings into schema.
- [ ] Add dates or project context when it improves credibility.

### Prevent recurrence

- [x] Remove social-proof demo fixtures from production seed data.
- [x] Make production seeding idempotent without restoring examples.
- [x] Add production validation rejecting `localhost` and loopback public media URLs.
- [x] Add clear “draft/unpublished” defaults for new CMS records.
- [x] Document the review-consent and content-approval workflow.

## Acceptance criteria

- [x] No placeholder testimonial is returned by the production public API.
- [x] No testimonial is public until genuine content and approval are confirmed.
- [x] No unverified team record is public.
- [x] No public API asset URL contains `localhost`.
- [x] No statistic is public without documented evidence.
- [x] Empty proof sections hide cleanly.
- [x] Production seeding cannot recreate demo claims.
- [x] No self-serving aggregate-rating schema is added.

## Verification

- [x] Review public testimonial, team, stats, and behind-scenes API responses.
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

## Implementation record

Implemented on 7 Aug 2026:

- Moved 4 testimonials, 5 statistics, 4 stock behind-the-scenes items, and 2
  team profiles to draft status in production. Records were retained for review,
  not deleted.
- Removed all fabricated proof/claim fallbacks from the frontend.
- Removed stock Mixkit fallback substitution from behind-the-scenes cards.
- Made empty proof sections render nothing and changed the empty Stories copy to
  explain that client feedback is published only after approval.
- Removed social-proof records from backend production seeds.
- Added localhost/loopback public-media validation and filtering.
- Changed new admin records in these sections to start unpublished.
- Documented the approval workflow in `docs/content-approval.md`.

Production rollout verified on 7 Aug 2026:

- Frontend and backend commits were pushed to `main` and both deployments completed.
- All four public APIs returned empty arrays after cleanup.
- The deployed frontend bundle contains the approval-first empty Stories copy
  and no retired claim, placeholder-team, international-location, or localhost
  fallback markers.
- The deployed backend rejected a localhost team portrait with HTTP 400.

Remaining content work:

- Obtain consent/evidence and real portraits/process media before republishing
  any preserved draft or creating replacements.

## Verification update — 5 Sep 2026

- Current public API checks return three published testimonials (Kaarmuhilan, Rohini Jai, and Gopinath); public staff profiles, statistics, and behind-the-scenes lists are empty. The earlier all-empty API snapshot is historical.
- The owner confirmed the published reviews are genuine, verified their displayed like counts (50, 100, and 150), and confirmed the Stories page display was checked. These are owner confirmations, not independent source or browser verification.
- Website publication consent was not separately stated or documented in this exchange.
- Real team biographies/portraits and studio/process content remain future content work; empty sections can remain hidden. Google review linking and project context remain unchecked where applicable.
