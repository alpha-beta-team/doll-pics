# SEO-10 — Resolve Accessibility and Page-Experience Findings

**Priority:** P2  
**Effort:** Medium  
**Status:** Not started  
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
