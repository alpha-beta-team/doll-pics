# Three-service public HTML rollout: completed

Verified 7 September 2026. [PR #2](https://github.com/alpha-beta-team/doll-pics/pull/2) is merged.

## Production release

- Merge commit: `42f2fe54e361cbdecc7ede853fa226c5d4299230`.
- Verified PR head: `19ae14c384b19ffc6e26ee9335f96d6c6a25f63a`.
- Production deployment: `dpl_3bYfQYQnfBEPaFtiSB2JEB6U4W9H` (READY).
- Served entry script: `/assets/index-DRTpfIjm.js`.
- Website: https://dollpictures.in.
- Previous production retained for rollback: `dpl_2omLmX4YYsdTNEJu7uyv7zQsbWq1`, commit `c2e8629177abf17cb1d8292940a52e430d30a00b`. No rollback was needed.

All three routes now contain their service content and a valid CMS-backed snapshot inside the initial HTML:

| Route | Image elements inside initial root | Hydration |
|---|---:|---|
| `/newborn-baby-photography-erode` | 23 | Original heading retained |
| `/wedding-photography-erode` | 23 | Original heading retained |
| `/maternity-photography-erode` | 22 | Original heading retained |

Image counts include repeated placements and shared components; they are not unique portfolio-image counts.

## Acceptance evidence

- [Hosted release checks](https://github.com/alpha-beta-team/doll-pics/actions/runs/34110825842) passed for the final PR head, including full release checks and browser tests.
- The browser suite passed 29/29 with no retries or suppressed request errors. Eleven focused deployment-validator tests cover malformed/empty/cross-route state, schema/metadata, preview canonicals/noindex, exclusions, HTTP status and strict CMS acceptance.
- All six fixture before/after screenshot pairs (three services, 390px/1440px) were visually inspected alongside geometry and gallery-order assertions. Unrelated fixture card fallbacks are identical in both modes; no production portfolio content was edited.
- A controlled temporary-fixture CMS edit followed by rebuild changed all three headings in initial and hydrated HTML. Modals opened and no page exceptions occurred. Production CMS records were not changed.
- The final authenticated preview (`dpl_7wmMLKVQF7rXQehSDS3ULKsEn61T`) passed strict CMS validation and all 12 browser cases. [Preview observations](evidence/public-html-rollout-2026-09-07/preview.json).
- Production passed all 12 browser cases: three routes at 390px and 1440px, with JavaScript on/off. Content and hero images loaded; no document overflow, page exceptions or hydration errors were observed. Hydrated modals opened and cross-service navigation reached the correct canonical. [Production observations](evidence/public-html-rollout-2026-09-07/production.json).
- `npm run seo:smoke` passed for all 32 canonical sitemap URLs, robots reference and genuine 404.
- `npm run seo:html-smoke -- --require-cms` passed for all three services, their metadata/schema/snapshots, and excluded public/private/missing routes.
- Live submissions were blocked. Form submission, validation and single lead-event behavior were verified against mocks only.

`sameHeading: false` in no-JavaScript evidence is expected: the browser-side observer is disabled. Every JavaScript-enabled case retained the original heading node.

## Configuration and cleanup

The Vercel `VITE_API_URL` setting was production-only. A preview setting scoped to `feat/public-html-services` now points at the same public CMS (`https://doll-backend-27n8.onrender.com/api`), enabling genuine preview content. Production configuration was unchanged.

Vercel intentionally applies `X-Robots-Tag: noindex` on preview hosts. The validator permits that only when the request origin differs from the canonical public origin; production indexing blocks still fail. `--require-cms` prevents a useful static fallback from being mistaken for a CMS-backed release.

Vercel CLI's temporary automation credential was revoked after preview verification; the project again has zero automation bypass credentials. The isolated QA fixture server was stopped. No credentials are included in these artifacts.

The rendering scope remains newborn, wedding and maternity. Homepage, packages, other services, business hours, image titles and unrelated SEO work were not expanded by this release. Search Console live URL inspection is a follow-up indexing check, not evidence of ranking improvement.
