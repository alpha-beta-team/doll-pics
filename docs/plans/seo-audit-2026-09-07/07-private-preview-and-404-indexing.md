# F07 — Clarify private, preview and error-page indexing

**Audit ID:** F07  
**Priority:** Medium  
**Effort:** Small (1–3 hours plus hosting checks)  
**Status:** Complete\
**Responsible role:** Frontend/release engineer  
**Assigned owner:** Frontend/release engineer\
**Chunk:** 2 — Indexing and usability  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Private shells and error documents have deliberate initial indexing signals; preview behavior is verified.

## Audit baseline evidence

- [`vercel.json:12`](../../../vercel.json#L12) — Private routes rewrite to the public shell; admin has no matching HTTP noindex header.
- [`netlify.toml:23`](../../../netlify.toml#L23) — Alternate-host private rewrites and headers need equivalent review.
- [`src/admin/AdminApp.tsx:48`](../../../src/admin/AdminApp.tsx#L48) — Admin noindex is applied by a client effect.
- [`public/robots.txt:3`](../../../public/robots.txt#L3) — Slash-suffixed exclusions do not cover exact roots.
- [`scripts/prerender.ts:454`](../../../scripts/prerender.ts#L454) — 404 generation leaves homepage canonical/social/schema from the template.

The audit confirmed configuration gaps, not current private-data exposure or live preview indexability.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Preserve authentication and private data controls. No blanket noindex on production public pages. Never lowercase or log quotation tokens. Robots blocking is not an indexing-removal mechanism.

## Dependencies and related plans

**Prerequisites:** None.

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [public-html-rendering](../public-html-rendering.md)

## Ordered checklist

- [x] Add exact /admin and nested admin X-Robots-Tag noindex rules in Vercel and equivalent maintained Netlify rules.
- [x] Verify exact/nested employee, kiosk and quotation behavior and ensure these URLs remain excluded from public catalogs.
- [x] Clean generated 404 head: retain error title/description/noindex, remove homepage canonical and public-page JSON-LD, and remove misleading social URL/title values.
- [x] Document Vercel’s default preview HTTP noindex mechanism and the unresolved target-specific verification gate; do not claim dashboard/live-preview verification.
- [x] Preserve the existing robots policy until Search Console review is available. Existing private-shell indexing remains unverified; the site owner must review it before deciding whether to allow crawling of non-sensitive noindex shells.
- [x] Add response/config regressions for public indexability, private roots, nested routes and genuine 404.

## Acceptance criteria

- [x] Exact/nested admin responses carry HTTP noindex before JavaScript runs.
- [x] Public canonical routes remain indexable and unknown routes return genuine 404.
- [x] 404 initial metadata does not describe or canonicalize to the homepage.
- [x] Preview indexing controls have an evidence record or an explicit unresolved external gate.

## Verification

### Local

No spec files were added. Local fixture and temporary browser checks accompany the existing release command.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
# After deploying F07:
npm run seo:html-smoke -- --require-cms --base-url https://dollpictures.in
npm run seo:smoke
```

- [x] Typecheck, lint (0 errors; 8 existing warnings) and offline build passed.
- [x] Eight exact/nested private paths have matching Vercel/Netlify declarations and passed the local HTTP fixture adapter with noindex/no-store and no redirects.
- [x] The extended HTML smoke passed 30 checks, including private HTTP noindex and clean initial 404 metadata. Public catalog membership excludes private roots.
- [x] Eight browser cases checked initial/no-JS and JavaScript error/public metadata, plus SPA navigation from a rendered service to an error and back to a public page. Canonicals and business schema return on the public page; no runtime errors occurred.
- [x] Three negative cases confirmed that the checker rejects injected homepage canonical, social URL and JSON-LD in an error document.
- [x] Recorded [sanitized local evidence](./evidence/f07-local-verification.json). Fixture header emulation is not evidence of hosted header matching.

### Deployment

Frontend/release engineer: deploy F07, run the commands above, and inspect headers/initial HTML using synthetic private paths and a random unknown URL. Confirm the active Vercel production and preview targets; check Netlify if that maintained configuration is in active use. No production or hosting configuration was changed during local implementation.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Requires hosting access for preview configuration and Search Console for existing private-shell indexing. Never treat Disallow plus noindex as guaranteed removal.

- [ ] Frontend/release engineer: provide a preview URL and verify protection or HTTP noindex, plus any active Netlify target. SEO/site owner: review private URLs in Search Console before any robots policy change. Both remain pending.

## Rollout and rollback

Revert only affected hosting/header changes if public pages are blocked; restore the previous verified deployment and recheck public robots/canonicals immediately.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Exact/nested private headers on both hosts, clean generated/client 404 metadata, and extended HTTP smoke |
| Local remediation validation | Passed | Release checks, configuration/HTTP adapter, error/public browser navigation and negative metadata regressions |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Complete is used for implementation tracking, consistent with prior items. Deployment, preview and Search Console checks remain explicit external gates and are not certified by local results.

## Behavior and remaining hosting checks

- `/admin`, `/employee`, `/kiosk`, `/quotation` and each nested family receive `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer` in both maintained configurations. Exact quotation roots now also use the existing private shell rewrite. Authentication, token values and public catalogs were not changed.
- Private shells continue to use the existing generic app shell; their initial indexing directive is the HTTP header. This does not imply private data is exposed, and noindex does not replace access controls.
- Generated 404 HTML retains its error title, description, noindex and F05 readable fallback, while removing homepage canonical, social tags and JSON-LD. Client error metadata follows the same policy. The business-schema effect runs only on published routes and restores the entity after returning from an error.
- Vercel documents automatic preview `X-Robots-Tag: noindex` in its [response-header documentation](https://vercel.com/docs/headers/response-headers). This is the intended platform mechanism; the current project’s preview header/protection and custom-domain behavior require deployed verification. No blanket production noindex rule was added.
- `robots.txt` and its generator remain unchanged. Existing private-page indexing is unknown without Search Console access. Blocking a crawler can prevent it from observing noindex; do not treat the combination as guaranteed removal. The site owner must decide any policy change using actual indexing evidence.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

| 2026-09-08 | F07 implementation complete: private root/nested header parity, clean initial/client 404 metadata and regression checks | Local release, 30 HTML smoke, 8 header/config, 8 browser and 3 negative cases passed; no specs added | Frontend/release engineer: deployed/preview headers; site owner: Search Console and robots decision |
