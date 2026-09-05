# SEO-10 — Resolve Accessibility and Page-Experience Findings

**Priority:** P2  
**Effort:** Medium  
**Status:** Implemented locally — manual desktop/theme checks and deployment pending
**Owner:** Unassigned

[← Master plan](./README.md)

## Outcome

Public pages provide readable contrast, accurate accessible names, reliable keyboard navigation, and stable interaction patterns without sacrificing the visual brand.

## Baseline

Production mobile Lighthouse on 28 Jul 2026:

- Accessibility: 96
- Failing checks: color contrast and visible-label/accessibility-name mismatch
- Best Practices: 77, including browser inspector issues and third-party-cookie warnings

## Work plan

### Reproduce and inventory

- [ ] Run Lighthouse on homepage, gallery, booking, service, package, about, and stories.
- [ ] Record each failing DOM node and route.
- [ ] Run keyboard-only navigation at mobile and desktop breakpoints.
- [ ] Check light and dark themes.
- [ ] Review reduced-motion behavior.

### Contrast

- [ ] Fix text/background combinations that fail WCAG contrast.
- [ ] Check gold text, muted copy, captions, disabled states, and text over photography.
- [ ] Preserve readable overlays as carousel images change.
- [ ] Test focus indicators against both themes.

### Names and controls

- [ ] Make accessible names contain the visible button/link label.
- [ ] Review icon-only carousel, close, theme, menu, and lightbox controls.
- [ ] Ensure labels and errors are associated with form fields.
- [ ] Ensure status/loading messages are announced appropriately.
- [ ] Remove conflicting or unnecessary ARIA.

### Navigation and motion

- [ ] Add or verify a skip-to-content link.
- [ ] Verify logical heading order and one primary visible page topic.
- [ ] Keep keyboard focus inside open modals/lightboxes and restore it on close.
- [ ] Pause or reduce autoplay for reduced-motion users.
- [ ] Ensure touch targets are usable on mobile.

### Media

- [ ] Keep descriptive alt text for meaningful portfolio images.
- [ ] Use empty alt text for intentionally decorative duplicate images.
- [ ] Verify no hidden carousel image announces irrelevant text.

## Acceptance criteria

- [ ] No Lighthouse contrast failure remains on audited public routes.
- [ ] No visible-label/accessibility-name mismatch remains.
- [ ] No critical or serious automated accessibility issue remains.
- [ ] Accessibility score is at least 98 on representative routes.
- [ ] All primary flows work with keyboard only.
- [ ] Focus is visible and correctly managed.
- [ ] Reduced-motion behavior prevents unnecessary autoplay/animation.
- [ ] No new SEO metadata, heading, or performance regression is introduced.

## Verification

- [ ] Run Lighthouse at least twice per representative route.
- [ ] Run an automated accessibility scanner if added to the project.
- [ ] Manually test keyboard, screen-reader labels, focus, and reduced motion.
- [ ] Test both themes and mobile/desktop layouts.

## Likely files/systems

- `src/index.css`
- `src/components/Navbar.tsx`
- `src/components/home/HomeExperience.tsx`
- `src/components/gallery/GalleryPortfolio.tsx`
- Booking/enquiry components
- Theme and motion hooks

## Dependencies

This plan can run in parallel, but hero/carousel checks should be reverified after SEO-05.

## Implementation and audit — 5 Sep 2026

Confirmed the production homepage baseline with headless mobile Lighthouse: accessibility 96, failing color contrast and visible-label/accessibility-name matching.

Changes implemented:

- Corrected the homepage introduction link name and removed redundant overriding names from portfolio and directions links so their visible text supplies the accessible name. Gallery controls retain the visible “View frame” label.
- Improved measured contrast on the homepage decorative number, gallery archive caption, shared footer, package navigation and package empty-state text; underlined the inline package contact link.
- Added a public skip-to-content link with focusable main targets and public-only keyboard focus outlines.
- Added enquiry-dialog initial focus, Tab/Shift+Tab containment, escaped-focus recovery and trigger restoration. Field errors now connect to their inputs and announce updates; associated the date label and enlarged the close target. Success and general errors are announced.
- Added hero slideshow pause/resume and reactive reduced-motion handling. Existing photo-lightbox focus handling was retained.

Validation:

- Local mobile Lighthouse audited homepage, gallery, booking, wedding service, wedding package, About and Stories; final scores are recorded in `10-accessibility-validation.md`. These are automated checks of the rendered local states, not proof of every populated CMS state or interaction.
- Focus-containment DOM regression test passed, covering initial focus, both Tab boundaries, escaped focus and return focus.
- Changed-file ESLint and production build passed. Full typecheck is blocked by an unrelated existing optional `source` field mismatch in `src/admin/bookingList.spec.ts:15`.
- No interactive browser was connected. Desktop/light-theme inspection, real keyboard/screen-reader checks, modal visual review and post-deployment validation remain unchecked. No claim of complete accessibility compliance is made.
