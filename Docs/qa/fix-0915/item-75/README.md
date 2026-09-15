# Item 75 — a 401 lands on login, every time (ORDER-FIX-0915)

**Probe finding.** The 401 handler (`src/data/provider.tsx`, `onUnauthorized`)
purges the session, dispatches `live/sessionCleared`, toasts and pushes
`/login`. The provider's update re-renders the CURRENT authed route with the
cleared session first, and `Authed` (`src/routes.tsx`) answered a signed-out
render with `<Navigate to="/" replace />`, which superseded the handler's push:
a token revoked mid-session, or dead at boot on an authed route, landed on the
marketing home with no toast on screen (TEST-0915 proof I). No returnTo
mechanism exists anywhere in the app (grep: none), so none is added.

**Fix.** `Authed` sends an unauthenticated visitor to `/login`, never to `/`.
The handler is unchanged; the two navigations agree. `SignedOutOnly` unchanged.

**Unit tests (red before the fix).**
- `src/routes.test.tsx` — the guard's three cases in a declarative
  `MemoryRouter` (a data router cannot navigate under jsdom: Node's Request
  refuses jsdom's AbortSignal). Two red before.
- `src/data/session-breach.test.tsx` — the handler end to end with the network
  stubbed (a stored session, every request answers 401): booting on `/`, and
  booting on `/billing`. The second red before.
- `unit-before-fix.log` (3 of 5 red, all `expected '/' to be '/login'`),
  `unit-after-fix.log` (5/5).

**Live proof (the order's bounded exception).** `e2e/live-auth-401.spec.ts`,
lane A, one fresh QA org per run, zero spend, `E2E_API_ENV=dev`, `--workers=1`,
the file alone. Five runs — the first four red on the SPEC's own defects,
never on the fix:

| run | org | result | why |
|---|---|---|---|
| 1 | 2269 | test 2 red | the Team tab, already loaded, made no request after the revoke — no 401 to meet (`live-auth-401-run1.log`) |
| 2 | 2270 | test 2 red | the sign-in sync's tail met the 401 before the spec's click; the app was already on login, the rail gone, the click waited 150 s (`artifacts-run2/`) |
| 3 | 2271 | test 2 red | the same breach; the 5 s best-effort click outlived the toast, so the spec looked too late (`artifacts-run3/`) |
| 4 | 2272 | test 2 red | network-idle did not cover the app's deferred reads (countries, media assets); same shape as run 2 (`artifacts-run4/`) |
| 5 | 2273 | **4 / 4 in 30 s** | a toast observer installed after sign-in, the click dispatched best-effort, the end state asserted (`live-auth-401-run5.log`, `.json`) |

Run 5's 401s (the server's request ids, from the envelopes):
- test 1 (expired at boot on `/`): `619c2340…`, `6132a224…`, `cbd0f0b2…`, `7c6b35da…`
- test 2 (revoked mid-session, on Settings): `0ae65499…` (`media/assets`), `467dbfcf…` (`event-sources/countries`)
- test 3 (dead token at boot on `/billing`): `dda5ead9…`, `d5bf8bf3…`, `bfef7b0b…`, `dc11d843…`

Each ended on `/login` with "Your session ended. Sign in again to continue.",
the Sign in button up and no session left in either storage.

**Cheap checks on this tree.** `lint.log` clean · `typecheck.log` clean (after
one `Array.from` in the spec: the e2e tsconfig has no `dom.iterable`) ·
`guard-static.log` 377 files clean · `unit.log` 822 / 822 in 73 files ·
`static-e2e.log` **116 passed / 0 failed / 89 skipped** in 341 s, one worker
(`Running 205 tests using 1 worker`; 85 skipped + the 4 new live tests).
