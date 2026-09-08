# F06 — Separate fallback coverage from CMS release readiness

**Audit ID:** F06  
**Priority:** Medium  
**Effort:** Medium (1–2 developer days)  
**Status:** Complete\
**Responsible role:** Frontend/release engineer  
**Assigned owner:** Frontend/release engineer\
**Chunk:** 1 — Routing and content correctness  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Release evidence distinguishes a complete offline fallback from current CMS-backed content.

## Audit baseline evidence

- [`scripts/lib/seo-build.ts:122`](../../../scripts/lib/seo-build.ts#L122) — Missing API configuration returns empty overlays.
- [`scripts/lib/seo-build.ts:146`](../../../scripts/lib/seo-build.ts#L146) — CMS errors are caught while static fallback remains available.
- [`scripts/prerender.ts:81`](../../../scripts/prerender.ts#L81) — SEO_REQUIRE_CMS runs required-route coverage validation.
- [`scripts/check-public-html-deployment.ts:151`](../../../scripts/check-public-html-deployment.ts#L151) — The existing HTML smoke supports --require-cms.
- [`README.md:133`](../../../README.md#L133) — README documents intentional static fallback during outages.

With SEO_REQUIRE_CMS=true and both CMS endpoints mocked as 503, the audit catalog still passed coverage with 32 static routes. This is not proof that intentional fallback should be removed.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Keep availability fallback and existing fixture data. Spec files and test commands were removed at the user’s request; do not recreate them. Do not expose secrets or introduce production writes.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [public-html-rendering](../public-html-rendering.md)
- [cms-resilience](../cms-resilience.md)

## Ordered checklist

- [x] Document separate coverage and content-readiness meanings; reconcile environment-example wording with actual outage behavior.
- [x] Carry explicit per-source availability/provenance from the catalog through relevant build and snapshot validation.
- [x] Retain non-strict local/offline checks; make CMS-backed candidate acceptance a separate required release check.
- [x] Extend the existing --require-cms validator as published route coverage expands; check CMS-only routes and applicable content markers, not just route count.
- [x] Cover missing configuration, malformed/empty responses, partial endpoint failure, stale fallback and complete successful responses.
- [x] Record candidate commit, public origin, deployment ID and content comparison; demonstrate a QA edit/rebuild reaches both initial and hydrated content.

## Acceptance criteria

- [x] A static-only build may pass fallback checks but cannot be reported as a CMS-verified release.
- [x] Valid empty collections are distinguished from unavailable sources.
- [x] Required CMS-only routes and content are checked without weakening canonical or private-route exclusions.

## Verification

### Local

No spec files were added. Temporary scripts and read-only local fixture servers exercised the failure matrix, actual builds, validator and Chromium.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run build:cms
npm run check:cms-release -- --base-url https://candidate.example.com \
  --expected-catalog ./candidate-public-catalog.json \
  --expected-commit FULL_40_CHARACTER_COMMIT_SHA \
  --deployment-id HOSTING_DEPLOYMENT_ID --report ./cms-release-report.json
```

The offline release command passed. Strict prerenders and the complete acceptance CLI were exercised against local fixtures; the candidate URL above is an example, not a checked deployment. Save the expected manifest from the exact build being deployed, independently of the fetched candidate manifest.

- [x] Record changed behavior, command outcomes, commit and fixture/browser evidence in [the local verification artifact](./evidence/f06-local-verification.json).
- [x] Cover unavailable/malformed/partial CMS, valid empty collections, invalid published rows, conflicts, stale artifacts, altered initial HTML, canonical/private/sitemap failures, and complete responses.
- [x] Change newborn and CMS-only editorial content in QA fixtures, rebuild, and observe the edit in initial HTML and the JavaScript DOM. Verify React attaches to the original heading with no hydration errors for both revisions.

### Deployment

Release owner: run `check:cms-release` with the independently saved candidate artifact against candidate and production; run `seo:smoke` on production. The gate checks every published initial HTML file; only the three registered service routes currently have server-rendered roots. Deployment ID is operator-supplied and must be matched to the commit/URL in the hosting dashboard.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Hosting environment values and deploy-hook behavior require dashboard or deployed evidence. No current production readiness is assumed.

- [ ] Release owner: verify hosting variables, deployment ID/commit, deploy-hook behavior and a material QA CMS edit on the deployed target; record the results before promotion. Pending; no hosting dashboard or production CMS was changed.

## Rollout and rollback

Keep the previous CMS-verified deployment if candidate readiness fails; do not disable production availability fallback to hide the distinction.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | Complete | Strict CMS build gate, per-source diagnostics/snapshot checks, full-route HTML fingerprints, expected-artifact acceptance and documented release commands |
| Local remediation validation | Passed | Typecheck/lint/offline build, loader matrix, fixture builds, CLI checks and JS/no-JS content parity; see evidence artifact |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending follow-up | Release owner: hosting settings, deploy hooks, deployment identity and deployed QA edit/hydration |

Complete is used for implementation tracking, consistent with F01–F03. This does not certify a deployed CMS release: candidate/production and hosting checks remain explicit follow-ups.

## Implemented behavior and limits

- `SEO_REQUIRE_CMS=true` now requires successful service and package publication sources before prerender output. Empty arrays (and the legacy optional service array) remain valid. Unavailable or invalid responses fail; invalid published records and ambiguous paths/slugs also fail. Non-strict builds still emit safe fallback output.
- `public-catalog.json` carries per-source status, rejected/conflict counts, checkout commit, creation time, canonical origin and SHA-256 of every emitted public HTML file. Snapshot validation checks source/resource consistency; the renderer retains original source failure reasons.
- `--require-cms` now checks all published paths and their initial HTML fingerprints, including CMS-only routes and packages, in addition to active rendered-service snapshots. Canonical, indexing, sitemap and private/404 checks remain active.
- `check:cms-release` requires the expected build manifest, full candidate commit, hosting deployment ID and output report. It rejects stale or changed artifacts even if the route count is unchanged. Save the manifest from the same build output that is deployed; rebuilding creates a different artifact.
- Deployment ID is recorded as operator-supplied, not independently verified hosting identity. Git HEAD alone cannot prove a clean working tree. CI remains an offline availability/build check; hosting promotion enforcement is a release-owner follow-up.
- Exact HTML fingerprints intentionally reject byte-changing hosting transforms. Optional gallery media availability is outside this publication-source gate. Broader SSR expansion and live browser acceptance remain separate work.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |

| 2026-09-07 | F06 implementation complete: separated CMS readiness from offline coverage; added saved-artifact acceptance for every public route | Local release checks, fixture matrix, edited/rebuilt content and Chromium evidence passed without adding spec files | Release owner: run required candidate/production gate with real build artifact and verify hosting identity/configuration |
