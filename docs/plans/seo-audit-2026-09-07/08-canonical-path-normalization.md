# F08 — Normalize known public canonical paths

**Audit ID:** F08  
**Priority:** Medium  
**Effort:** Small (2–4 hours)  
**Status:** Complete\
**Responsible role:** Frontend engineer  
**Assigned owner:** Frontend engineer\
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Known marketing URL variants resolve to one intended route and canonical.

## Audit baseline evidence

- [`src/pages/Site.tsx:78`](../../../src/pages/Site.tsx#L78) — Section selection uses a case-sensitive raw pathname.
- [`src/lib/seo-core.ts:136`](../../../src/lib/seo-core.ts#L136) — Current normalization only trims a trailing slash.
- [`src/lib/navigation.ts:19`](../../../src/lib/navigation.ts#L19) — Known section keys are lowercase.
- [`vercel.json:3`](../../../vercel.json#L3) — Hosting already declares clean URLs and no trailing slash.

The audit browser probe at /Services rendered homepage content with canonical https://dollpictures.in/Services.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Normalize through the public catalog only. Preserve opaque tokens, private identifiers and query values. Do not lowercase arbitrary unknown URLs or redirect every unknown path to home.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [01-sitemap-delivery](../seo/01-sitemap-delivery.md)
- [07-title-brand-strategy](../seo/07-title-brand-strategy.md)

## Ordered checklist

- [x] Resolve case/trailing-slash variants against the normalized public catalog from F02.
- [x] Apply the same canonical pathname before page selection, metadata generation and internal link construction.
- [x] Add hosting redirects for known public variants using the existing hosting mechanism; preserve query parameters.
- [x] Use replace-style client navigation for known variants that enter through SPA navigation.
- [x] Test /services and /Services, /work, a service, a package, trailing slashes, tracking parameters and unknown routes.
- [x] Assert quotation tokens and other private identifiers remain unchanged.

## Acceptance criteria

- [x] Known variants display the intended content and a lowercase canonical without query/fragment.
- [x] Middleware HTTP adapter and SPA transitions agree locally; actual Vercel redirect acceptance remains a deployment follow-up.
- [x] Unknown routes retain 404 behavior and private tokens remain byte-for-byte unchanged.

## Verification

### Local

No spec files were added. Temporary fixtures exercised the resolver, middleware, HTTP redirects and Chromium.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
# After deploying F08:
npm run seo:paths-smoke -- --base-url https://dollpictures.in
npm run seo:html-smoke -- --require-cms --base-url https://dollpictures.in
```

- [x] Typecheck, lint (0 errors; 8 existing warnings), and offline production build passed.
- [x] Eleven resolver cases and 36 middleware cases covered catalog matching, unavailable/invalid/empty manifests, private/encoded paths and safe fall-through. POST does not redirect.
- [x] The HTTP fixture adapter passed 62 public variant/query and unknown/private checks using the actual middleware function.
- [x] Eleven Chromium cases covered five public destinations with no-JS HTTP redirects and SPA replacement/back navigation, plus unknown-path noindex preservation. Service/package/CMS-only destinations were included.
- [x] Recorded [sanitized local evidence](./evidence/f08-local-verification.json). This is local code plus an HTTP adapter, not the Vercel runtime or deployed CMS.

### Deployment

Frontend/release engineer: deploy this change, run `seo:paths-smoke` and the existing CMS HTML smoke, and check HTTP/www/slash/case chains. Confirm Vercel recognizes the root middleware and its catalog request succeeds, including any protected preview target. Verify no loop, query loss or private-token/slash mutation.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Search Console selected canonicals require external review; source configuration alone cannot prove consolidation.

- [ ] SEO/site owner: review selected canonicals in Search Console after deployment. Pending; no ranking or consolidation result is claimed.

## Rollout and rollback

Revert variant redirects and their resolver together if loops or private-route changes occur.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Shared catalog resolver, public route gate, Vercel middleware and path smoke command |
| Local remediation validation | Passed | Release checks, 11 resolver + 36 middleware + 62 HTTP + 11 browser cases; evidence linked above |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Complete is used for implementation tracking, consistent with F01–F03/F06. Deployed Vercel behavior and Search Console review remain explicit follow-ups.

## Implementation details

- `publicCanonicalPath` resolves only case and one trailing-slash variant of an existing catalog destination. Unknown URLs, encoded paths, repeated slashes and private roots are not rewritten.
- The public layout redirects with React Router `replace` before mounting the selected page and its metadata hooks. It preserves query, fragment and navigation state. CMS aliases wait for publication loading; internal links already use F02's normalized catalog.
- Root `middleware.ts` sends HTTP 308 for GET/HEAD aliases. Core destinations need no fetch; other public candidates consult the deployed `public-catalog.json`. Invalid, empty or unavailable catalogs do not authorize guessed CMS redirects. No new dependency or environment variable was added.
- Removed the global `trailingSlash: false` setting so private/unknown slash variants are no longer normalized globally. Existing clean URLs, www redirect, private rewrites and headers remain intact.
- `seo:paths-smoke` verifies all published case/slash variants, query preservation, and synthetic private/unknown paths after deployment. It is separate from the existing smoke until F08 is deployed.
- Middleware follows [Vercel's Routing Middleware API](https://vercel.com/docs/routing-middleware/api). Its real hosting integration must be checked after deployment; local adapter evidence does not certify platform behavior.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

| 2026-09-08 | F08 implementation complete: catalog-based case/slash resolution, replace navigation, scoped HTTP redirects and deployment smoke | Local release checks and 120 resolver/middleware/HTTP/browser cases passed; no specs added | Frontend/release engineer: deploy and verify Vercel redirect chains; SEO owner: selected canonicals follow-up |


### Middleware build compatibility follow-up — 8 September 2026

The user supplied Vercel build diagnostics TS2835/TS2339/TS2732 plus an Edge runtime deprecation warning. Root `tsconfig.json` contained only project references; the bundler/JSON settings existed only in child configs. Vercel's compiler reads root options and defaults to NodeNext when `module` is missing ([compiler source](https://github.com/vercel/vercel/blob/main/packages/node/src/typescript.ts)).

Added explicit ESNext/bundler and JSON module options to the root config. Added `tsconfig.middleware.json` extending those root settings and included it in `npm run typecheck`, so release checks exercise the middleware's configuration. Set middleware `config.runtime` to `nodejs` following [Vercel's API](https://vercel.com/docs/routing-middleware/api#specify-runtime); matching, canonical resolution, query preservation and exclusions remain unchanged.

Local validation: reproduced six fallback import/type diagnostics, then zero with root compiler options; all 27 direct GET/HEAD/POST, public/private, invalid-catalog and unavailable-catalog cases passed. Full `check:release` passed with existing lint/chunk warnings. No spec files, deployment or production verification. Next gate: redeploy, confirm middleware diagnostics/deprecation warning are absent, then run both production smoke tools. Implementation count remains unchanged.


### Runtime follow-up — 8 September 2026

Production verification subsequently returned `MIDDLEWARE_INVOCATION_FAILED` HTTP 500. The prior bundler-mode compiler check cleared diagnostics but did not exercise emitted Node JavaScript. A direct local emitted-module import reproduced `ERR_MODULE_NOT_FOUND` on the extensionless middleware import. The import graph now uses `.js` extensions and the JSON `with { type: 'json' }` attribute required by [Node ESM](https://nodejs.org/api/esm.html); root settings use NodeNext with JSON support. The child Vite configs retain bundler mode.

Added `npm run check:middleware` to `check:release`; it compiles, loads and exercises native emitted ESM without tsx/Vite resolution hooks. All 27 cases and full release passed locally. [Live failure and local-repair evidence](./evidence/f04-production-verification-2026-09-08.json). Exact provider logs and deployment recovery remain unverified; redeploy and run both production smoke tools. Prior local-only success is not evidence of live runtime compatibility.


### Production recovery — 9 September 2026

[Production checks](./evidence/f04-production-recovery-2026-09-09.json) passed on commit `aa0f0ca`: CMS-strict HTML smoke and all 98 canonical-path checks, plus HTTP 200 for Work/About/admin enquiries. The admin response retains noindex. The previous middleware invocation failure is no longer reproduced by these requests; authenticated app interactions remain outside this HTTP verification.
