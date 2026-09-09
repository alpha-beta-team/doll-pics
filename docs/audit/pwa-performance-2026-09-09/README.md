# Doll Work PWA performance changes — 9 September 2026

## Implementation status

All four groups are implemented locally across `doll-pics` and `photography-cms-backend`. No production deployment, database mutation, migration, hosting-plan change or real message/payment operation was performed.

1. **Startup bundles:** login, Today, authentication/password/access handling stay eager. Other admin pages load on demand, within a loading/error boundary that preserves navigation. The four removed Today sections remain absent.
2. **Workspace API:** `GET /api/admin/work/today?view=workspace` returns only date, tomorrow, timezone, followUps, newEnquiries, todayShoots and tomorrowShoots. `view=full` and omitted view preserve the full API and scheduled summaries. Invalid views return 400. Workspace mode skips payment candidates, delivered-review candidates and occasion/consent queries before execution; five remaining query calls run concurrently. No data is deleted or truncated.
3. **Startup recovery:** session verification and workspace reads have 15-second deadlines, including body decoding. Transient failures retain credentials while protected content stays gated. Retry is manual. Authentication invalidation (401/403) clears credentials. Context-owned persistence and generation checks prevent late verification/login/password responses from restoring a cancelled session. Login establishes its verified response without duplicate `/auth/me`.
4. **PWA shell:** the build emits `pwa-build.json`, a release-specific worker and an immutable private HTML shell. The precache walks only static dependencies of the entry/admin/employee/kiosk chunks, plus required styles/fonts/icons. Deferred admin pages and API responses are excluded. Navigation preload is enabled; navigation falls back after 3 seconds with a cached shell or shows a retry page after 15 seconds without one. Clean-URL redirected precache HTML is normalized before responding to private navigation. Failed installs discard only their incomplete cache. Updates wait for existing controlled tabs to close and retain the current/previous owned caches.

## Measured results

The baseline includes the requested Today section removal but precedes the four performance changes. Both builds were served locally with gzip and identical HTTP cache rules. Chromium used a 390×844 mobile viewport, 1.6 Mbps download, 150 ms latency and 4× CPU slowdown. Each build had five fresh contexts; each context ran a cold launch followed by a warm launch. Service workers were blocked for this comparison so all network requests obeyed page-level throttling; worker behavior has separate browser coverage.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Median cold launch to login | 2,771 ms | 1,765 ms |
| Median warm launch to login | 409 ms | 397 ms |
| Compressed startup JavaScript bodies | 336,018 bytes | 149,443 bytes |

Startup JavaScript fell **55.5%**, exceeding the 35% target. Median cold launch improved **36.3%**. These are lab login measurements, not production authenticated startup timings or a phone guarantee. Auth/Today latency is deliberately recorded as null in `benchmark.json`; no production credentials were used. The subsequent worker redirect fix does not change these JavaScript bundles.

## Verification

- Frontend release gate: typecheck, lint, middleware runtime check, Vite build and public prerender. Lint completed with 0 errors and 9 non-blocking Fast Refresh warnings.
- HTTP/worker tests: 11 scenarios covering timeout, cancellation, body deadline, timer cleanup, installation failure, owned cache retention, preload, navigation deadlines, offline fallback and API/private-response exclusion.
- Browser suite: 25 scenarios covering auth recovery/invalid sessions/password entry, races with logout and replacement login, no duplicate verification, refresh failure, permissions, all deferred-module imports, missing chunk recovery, follow-up operations, booking form, payment report, crop/upload and actual PDF bytes. Worker scenarios cover first-install executable caching, offline protected-access gating, employee/kiosk shells, waiting upgrades and failed updates. Four public routes have HTML/hydration smoke checks.
- Backend: build plus 10 focused tests, including full/workspace result parity, skipped query branches, invalid views, scheduled payment summaries and date/review/occasion rules.
- Browser feature operations use intercepted synthetic APIs; upload and follow-up requests never reach production. Opening the WhatsApp composer does not send a message.

Reproduce:

```sh
# Frontend
npm run check:release
npm run test:pwa
npm run test:pwa:browser
node scripts/benchmark-pwa.mjs /path/to/baseline-dist /path/to/candidate-dist

# Backend, from photography-cms-backend
npm run build
node --test -r ts-node/register src/work/work-workspace.spec.ts src/work/work-date.spec.ts src/work/review-due.spec.ts src/work/occasions.service.spec.ts
```

`npm run build` and `npm run prerender` now generate the PWA artifacts after prerender. Deploy the whole generated `dist` directory; do not copy the source `public/admin-sw.js` directly. Its build placeholder intentionally cannot install. The Playwright fixture server's worker-update controls are test-only and never enter deployed build output.

## Rollout and rollback gates

1. Review the bundle, workspace, recovery and worker groups separately. The current working trees contain the combined candidate; they have not been promoted as four production releases.
2. Deploy backend workspace support first. Verify an authorized full/default request still contains payments/reviews/occasions and the workspace request has exactly its seven fields. Compare query timings using the same account/date. Scheduled summaries must retain payment counts.
3. Publish the frontend candidate to a preview using a real production build. Verify its asset filenames and `pwa-build.json`, startup bytes, deep links and permission behavior. Serve the immutable shell through the actual hosting platform's clean-URL behavior.
4. Test on an installed phone: fresh install, warm reopen, slow connection, offline startup, expired session and a release upgrade while an older tab is open. Close all controlled tabs/windows to permit activation; no automatic reload is intended. Private data must remain inaccessible until authentication is verified online.
5. Only promote after preview/phone gates pass. Record five cold/warm authenticated launches with separate auth/Today request durations. Verify production hosting/API behavior and Render plan before attributing any residual delay to a cold start.
6. Roll back frontend behavior by publishing the previous application with a newly generated worker version, rather than overwriting cache contents or forcing reloads. The full default backend contract allows old clients to keep working. Keep workspace support deployed while new clients remain active.

Still pending: preview/production deployment verification, authenticated production API/database timings, the real installed-phone check and production monitoring. Local results do not establish those outcomes.
