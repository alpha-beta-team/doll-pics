# F04 — Expand public HTML rendering incrementally

**Audit ID:** F04  
**Priority:** High  
**Effort:** Large (1–3 weeks in increments)  
**Status:** In progress — homepage increment implemented locally\
**Responsible role:** Frontend engineer with content reviewer  
**Assigned owner:** Frontend implementation; frontend/content reviewer for deployment acceptance\
**Chunk:** 3 — Rendering, media and metadata  
**Baseline:** Conversation audit, 7 September 2026, repository revision `ff8e0ad`

[← Master checklist](./README.md)

## Outcome

Priority public routes deliver substantive content in normal initial HTML and retain working hydration.

## Current evidence

- [`src/lib/publicHtmlRoutes.ts:2`](../../../src/lib/publicHtmlRoutes.ts#L2) — Only newborn, wedding and maternity are registered for rendered public HTML.
- [`src/entry-public-server.tsx:13`](../../../src/entry-public-server.tsx#L13) — The existing server entry renders the shared React page.
- [`scripts/prerender.ts:503`](../../../scripts/prerender.ts#L503) — Build rendering is restricted to the registered services.
- [`src/main.tsx:43`](../../../src/main.tsx#L43) — Valid snapshots hydrate; other pages use client mounting.

The audited existing dist contained three populated public roots and 29 empty roots. Those artifact counts are baseline observations, not proof of deployed coverage.

Evidence describes the audit baseline, not a fresh deployment check. Recheck these code references before implementing; existing historical plan completion does not complete this new item.

## Boundaries

Reuse React 18, Vite and existing components. No framework migration, request-time server, crawler-specific output or private-route prerendering. Omit unavailable media rather than borrowing unrelated work.

## Dependencies and related plans

**Prerequisites:** [F02](./02-publication-and-route-catalog.md), [F03](./03-cms-service-sections.md), [F05](./05-noscript-contrast.md), [F06](./06-cms-release-readiness.md), [F10](./10-authentic-category-media.md)

Historical context (retain its original records; do not copy old statuses into this item):

- [public-html-rendering](../public-html-rendering.md)
- [public-html-service-expansion](../public-html-service-expansion.md)

## Ordered checklist

- [x] Generalize route renderer and snapshot selection beyond a ServicePage-only assumption; preserve route/version validation and public field allowlists.
- [x] Render the homepage first, including meaningful heading, approved media, contact and service discovery links.
- [ ] Render /services and /packages hubs next using the authoritative public catalog.
- [ ] Render package-category pages next, beginning with wedding and newborn, then the remaining intended published package routes.
- [ ] Render the other intended published services and the gallery's initial content; then work/about/stories/contact and legal pages using their existing components.
- [ ] Release each page family separately; disable observer-only hiding in initial HTML and match the first browser render to its snapshot.
- [ ] Exercise light/dark preference restoration, malformed snapshots, stale assets, independent CMS/media failures and route transitions.
- [ ] Prove a controlled QA content change reaches generated HTML and hydrated content after rebuild before expanding the next family.

## Acceptance criteria

- [ ] Each released family has meaningful heading, copy and crawlable links inside #root without JavaScript.
- [ ] Initial and hydrated content agree with the approved catalog and available CMS content.
- [ ] Enquiry interactions work with mocked submissions; no hydration mismatches or private snapshot leakage occur.
- [ ] Each increment has recorded preview and production acceptance before the next family expands.

## Verification

### Local

Commands below are for future remediation verification and were not run merely to create this plan. Run focused checks first; run full release gates only when relevant to the eventual change.

```sh
VITE_API_URL='' API_URL='' SEO_REQUIRE_CMS=false npm run check:release
npm run seo:html-smoke -- --base-url https://YOUR-CANDIDATE-URL
npm run seo:paths-smoke -- --base-url https://YOUR-CANDIDATE-URL
```

- [ ] Record the changed behavior, command outcomes, commit and relevant fixture/browser evidence.
- [ ] Complete the scenario-specific checks above; explain any non-applicable check.

### Deployment

Run both smoke tools against each released candidate and production; extend validators as route coverage expands. Record commit, deployment, source provenance and served entry asset.

- [ ] Record preview/production URLs, deployment date, commit, relevant HTTP/DOM evidence and any unverified hosting target.

### External

Inspect representative URLs in Search Console after release. Google indexing and ranking observations are separate from HTML/hydration acceptance.

- [ ] Record applicable external results or an explicit pending follow-up with responsible role and next action.

## Rollout and rollback

Roll back the affected route-family deployment or registry increment to the previous verified build; preserve earlier proven families and source data.

Promote through the existing release workflow only when this item's applicable gates pass. Use QA fixtures/mocked submissions for writes during verification. Stop if public content, canonical/indexing signals, hydration or protected behavior regress.

## Status and evidence record

| Stage | State | Evidence |
|---|---|---|
| Remediation implementation | In progress | Homepage added; three service routes retained. Hubs and remaining families are not expanded yet |
| Local remediation validation | Homepage passed | [Fixture evidence](./evidence/f04-home-local-verification.json): initial HTML, hydration, themes, failures, controlled rebuild, enquiry and exclusion checks |
| Preview/production acceptance | Pending | Requires deployed verification |
| External checks | Pending | Apply the requirements above; label non-applicable checks explicitly |

Update this header, this record, the master row, chunk checkbox and totals together. Use `Ready for verification` when implementation and required local checks pass but applicable deployment/manual checks remain. Use `Complete` only after this item's acceptance criteria pass; record non-gating ongoing observations separately. `Blocked` requires a blocker, responsible role and concrete next action.

## Progress log

| Date | Change | Evidence | Remaining blockers / next action |
|---|---|---|---|
| 2026-09-07 | Created the issue checklist; remediation remains Not started | Conversation audit at `ff8e0ad`; no new remediation evidence | Assign owner, recheck baseline, then follow prerequisites and ordered checklist |


### Increment 1 — homepage (8 September 2026)

- Added `/` to the explicit public rendering registry. The entry selects the existing Site or ServicePage component; browser hydration selects the matching component. Snapshot path/version validation now handles the root path and validates home image collections. Home media is mapped to public fields only, preserving authored alt text and category tags; successful resources are seeded independently.
- Initial home HTML contains its heading, introduction, available CMS hero/portfolio media, contact links and published service discovery. Observer/entrance hiding is disabled within rendered home roots, matching the first client render. Existing visitor theme restoration remains intact. Stock fallbacks are not restored when media is unavailable.
- Private Vercel/Netlify rewrites now use `app-shell.html`, a separate empty React shell with noindex and no public snapshots/catalog or structured data. The app-shell route name is reserved from CMS publication. The shell also permits repeat standalone prerendering without nesting an earlier home root; public generation explicitly restores indexable robots metadata.
- Temporary Vite rendering disables client dependency discovery; the normal frontend build remains unchanged. No spec files added, no CMS writes, no deployment performed.
- `check:release` passed with eight existing lint warnings; no canceled-build message.
- Local evidence: empty-media and edited-CMS fixture production builds; eight JS/no-JS mobile/desktop light/dark cases; five failure/navigation modes; three existing service hydration checks; snapshot rejection; mocked enquiry submission; raw HTML smoke including exclusions and repeated prerender. Malformed snapshots use normal client mounting and may show fallback copy while the CMS is unavailable. Missing entry assets retain readable initial HTML but cannot provide JavaScript interactions.

**Release boundary:** The homepage is the only newly added family. This plan requires preview/production acceptance for each family before expanding the next. Frontend reviewer: deploy the candidate, record its commit/deployment ID, run both smoke tools, and verify home content/hydration with actual approved CMS media. Content reviewer: confirm the published images. Then proceed to `/services` and `/packages` hubs. Search Console observation follows release. Overall F04 stays In progress; the master completion total does not increase.

### Deployment correction — 8 September 2026

Production smoke reported 404 for all eight private root/nested probes. Read-only verification confirmed `/app-shell` returns 200. The Vercel rewrite destinations incorrectly used `/app-shell.html` with `cleanUrls: true`; [Vercel documentation](https://vercel.com/docs/project-configuration/vercel-json#rewrites) requires extensionless destinations. All eight destinations now use `/app-shell`. Netlify retains its file destinations.

The local fixture adapter previously hardcoded the private shell and therefore missed this configuration error. It now resolves declared rewrite destinations and rejects HTML-extension destinations under cleanUrls. Production acceptance remains pending redeployment and both smoke checks; the observed private-route regression does not count as a passed deployment gate.

Correction validation: fixture production build, script syntax check, diff check and HTML smoke passed, including all eight private probes. No deployment performed.
