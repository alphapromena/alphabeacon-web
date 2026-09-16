# NIGHT-0916 — run-log (written as the night runs)

Branch `feat/night-0916` from `main` `29e7368` (serving code commit `3b5d72c`). One item per commit, prefixed with the order name. A hard stop skips the order: reset to the last green tip, patch under `skipped/`, log, next order.

## Phase 0 — pre-flight

| Step | Result |
|---|---|
| tips (origin) | main = live = `29e7368`; feat/shell-0915 = `29e7368`; the fetch failed once on DNS (`Could not resolve host: github.com`) and answered on the retry |
| port 5199 | free |
| API base | `.env.local` → the dev Lambda (environments.md's only API); `E2E_API_ENV=dev` on every live step |
| branch | `feat/night-0916` at `29e7368` |
| baseline cheap checks | `preflight/` — see below |

### Phase 0.3 — baseline

`preflight/checks.log`: lint, typecheck, guard-static clean; unit **829 / 829** in 74 files; static e2e **119 passed / 0 failed / 90 skipped** at one worker (6.1 min). The baseline of TEST-0915-2 reproduced.

A stray from the last session, `Docs/qa/test-0915-2/post-deploy/` (the smoke script and its screenshots), was untracked; committed first as `f8778c9` (docs only) so the tree hash the gate records is the tree.

## Order 1 — item 81, the submit that hangs

### Probe (`order-1/probe-burst-8.log`)

Eight signups fired at once against the dev API, then eight logins: every signup answered **201 in 3.9–4.6 s**, every login 403 (unverified) in ~0.5 s; no 429, no hang, request ids on the record. A plain burst of the width the gate makes does not reproduce the hang. Then, with no interception at all, the FIRST run of the new live spec (`order-1/live-timeout-alone-run1.log`, `run1-signup-no-answer/`) saw a real signup POST get no answer inside 15 s — the client's new limit fired on the product's own signup at ~21:01Z — and the run straight after answered in 3.1 s (`probe` line in `live-timeout-alone.log`). So the hang is real, live, intermittent and not width-driven: the request is **pending, not dead** (the browser was still waiting when the client gave up). That is the wire side; **81 stays open, annotated for Ward** with the timestamps here.

### Fix (one line)

Every request gets a 15 s limit; past it the seam fails like a network failure with its own code (`timeout`) and the catalogue sentence "The server did not answer. Try again." — alert, toast, button re-enabled, draft kept, no retry. The runner spaces lane file starts by 8 s.

### Commits

| SHA | Item |
|---|---|
| `4c27be3` | client limit (`AbortController`, a caller's signal still forwards), `ApiErrorCode` `'timeout'`, `MESSAGES.errors.noAnswer`, auth alert case; unit on the client (red first: 10 of 27 with a fetch that never resolves, then 27/27), seam tests on six writes (`src/data/timeout-surfaces.test.tsx`), live spec `e2e/live-timeout.spec.ts` (lane A) |
| `1a4cc65` | `pnpm gate --spacing <s>` (default 8, 0 switches off, negative refused — proven: `--spacing -1` throws before anything starts); a pause before every file start after the first, in each lane |

### Proof numbers

| Proof | Result |
|---|---|
| unit, red before (`unit-before-fix.log`) | 10 failed of 27 |
| unit, after (`unit-after-fix.log`) | 27 / 27 |
| live spec alone, run 1 | red — the real signup got no answer in 15 s (the wire, see probe) |
| live spec alone, run 2 (`live-timeout-alone.log`) | **2 / 2** — the held login says the sentence at ~15 s, keeps the email, Sign in enabled, one request held; the next sign-in lands on Dashboard |
| round time before | gate 1 lane A 620 s / lane B 150 s; gate 2 655 s / 365 s (TEST-0915-2) |
| round time after | measured by TEST-0916 (17 files → ≤16 pauses of 8 s per lane) |
| cheap checks (`order-1/checks/`) | see below |

Decision **D-NIGHT-0916-A** — a request the server never answers is a failure the client makes at 15 s, with its own code and sentence, handled exactly like a network failure; the runner never fires signups back to back.

Mishap on the record: `gate.ts` has no `--help`; the call to read its usage started a real gate (static half only) and was killed within a minute, before any live file ran. No org was made; `.gate/runs/20260915-210622` deleted.

### Cheap checks (`order-1/checks/`)

lint, typecheck, guard-static clean; unit **840 / 840** in 75 files (829 + 11 new); static e2e **119 passed / 0 failed / 92 skipped** at one worker, 6.0 min (the two new live cases skip in static mode). **Last green tip: `1a4cc65`.**

## Order 2 — item 83, where a deliberate sign-out lands

### Probe

The sign-out action only cleared the session (`purgeSession` + `live/sessionCleared`); the route re-rendered signed out and its guard answered — login on an authed route (D-FIX-0915-A), the marketing home on `/`. Two landings, and which one depended on where the person stood. A first cut that only REQUESTED the navigation to `/` before the purge still landed on login in the unit test (4 of 8 red, `order-2/unit-before-fix.log` is the pure before, without the fix): the router's navigation is a React transition, and the purge — a plain state update — rendered first, so the guard saw a signed-out authed route before the router committed `/`.

### Fix (one line)

A deliberate sign-out revokes on the screen the person is on, moves to `/` through the router AND waits for the router to commit that location (the world layout reports every committed path to the data layer's door, `src/lib/navigation.ts`; no timer), then purges — so the route that renders signed out is RootGate, the marketing home, from every route. The forced sign-out (401) keeps its own push to login.

### Commits

| SHA | Item |
|---|---|
| `5fc614d` | `src/lib/navigation.ts` (door: `configureNavigation`, `navigateTo`, `reportCommittedPath`, `setCommitReporter`), `NavigationCommit` in `WorldLayout`, sign-out and sign-out-everywhere navigate-and-await-commit first (`src/data/auth.ts`), unit `src/data/sign-out-landing.test.tsx` (deliberate from Today, Billing, Settings, Dashboard → `/`; forced from the three authed routes → `/login`), the two helpers of 2dc7c45 tightened back to the single landing, two live cases appended to `e2e/live-auth-401.spec.ts` (deliberate sign-out from Settings and Billing → the M2 hero, session gone) |

### Proof numbers

| Proof | Result |
|---|---|
| unit, red before (`order-2/unit-before-fix.log`) | 4 failed of 8 (every deliberate case landed on `/login`) |
| unit, after (`order-2/unit-after-fix.log`) | 8 / 8 |
| live `live-auth-401.spec.ts` alone, run 1 (`live-auth-401-alone-run1-login-no-answer.log`, `run1-login-no-answer/`) | 4 of 6 green; case 4's LOGIN (before the sign-out under test) got no answer in 15 s at ~21:23Z — the wire, item 81's shape, on the record for Ward |
| live, run 2 | the API health probe answered nothing for 98 s at 21:24–21:26Z: `fetch failed` on every probe, and GitHub and 2.malaky.ai were unreachable from this machine in the same minute — the machine's network, not the wire; the run is retried when the network is back (see below) |
| live, run 3 (`order-2/live-auth-401-alone.log`, 21:35Z) | **6 / 6** — the two deliberate sign-outs land on the M2 hero with the session gone (6.8 s and 6.7 s) |

Decision **D-NIGHT-0916-B** — a deliberate sign-out lands on the marketing home from every route; the action moves to `/` and waits for the router to commit it before the session clears; the forced sign-out lands on login (D-FIX-0915-A stands).

### Cheap checks (`order-2/checks/`)

lint, typecheck, guard-static clean; unit **848 / 848** in 76 files (+8); static e2e **119 passed / 0 failed / 94 skipped** at one worker, 6.0 min (the two new live cases skip in static mode). **Last green tip: `5fc614d`.**

Network note: the machine lost all outbound HTTP from ~21:24Z to 21:30:53Z (the API health probe, GitHub and 2.malaky.ai all failed together; 8 probes of 15 s). Nothing of the wire in it.

## Order 3 — returnTo

### Probe

Before: a guard sent a signed-out visit to `/login` and remembered nothing; the 401 handler pushed `/login` and remembered nothing; the sign-in screen navigated to `/` on success. A deep link, or a token that died on a screen, always came back to the Dashboard.

### Fix (one line)

One owned key in sessionStorage (`ab-return-to`, `src/lib/return-to.ts`): the guard and the 401 handler write the intended app path (pathname + search) before they navigate to login; the sign-in screen reads it once, clears it, and goes there, or to `/` when there is none; only an app route is kept (one leading slash, same origin, never a marketing or auth path, never protocol-relative or absolute); a deliberate sign-out clears it; signup and verify never read it; storage that throws is absent.

Found on the way (live run 1, `order-3/live-auth-401-alone-run1.log`, `run1-deep-link-landed-on-root/`): the sign-in's own render — the session established mid-submit — made `SignedOutOnly` fire its signed-in redirect to `/`, which raced the screen's navigation to the remembered path and won. The redirect is now decided when the auth screen MOUNTS (a signed-in visitor still bounces; a session that appears while the screen is up is the screen's own sign-in, and the screen navigates). Reproduced in jsdom first: `order-3/unit-race-before-fix.log` (red against the old redirect), green after.

### Commits

| SHA | Item |
|---|---|
| `5f1d32f` | `src/lib/return-to.ts` + `return-to.test.ts` (validation, 33 cases incl. storage that throws), guard write (`Authed`), handler write (`provider.tsx`), sign-in consume (`signin-screen.tsx`), sign-out clear (`auth.ts`), `SignedOutOnly` decided at mount, `src/data/return-to-flow.test.tsx` (guard write ×2, handler write, login consume ×4 incl. the race, sign-out clears, verify ignores), two live cases (5, 6) appended to `e2e/live-auth-401.spec.ts` |

### Proof numbers

| Proof | Result |
|---|---|
| unit, red before (`order-3/unit-before-fix.log`, the seams' file against the tree without the fix) | 6 failed of 8 |
| unit, race case red before (`unit-race-before-fix.log`) | 1 failed of 1 |
| unit, after (`unit-after-fix.log` + the race case) | 33 + 9 = **42 / 42** |
| live `live-auth-401.spec.ts` alone, run 1 (`live-auth-401-alone-run1.log`) | 6 of 8; case 5 landed on `/` — the redirect race above |
| live, run 2 (`live-auth-401-alone.log`, 21:46Z) | **8 / 8** — deep link `/billing` → sign in → `/billing` (5.3 s), token dead on `/settings/organization` → sign in → back there (8.2 s) |

Rule 2 note: the validation test needs absolute URLs to reject; they are assembled from their scheme (`'https:' + '//…'`) so `src/` carries no `http(s)://` literal. Scope note: returnTo lives in sessionStorage — it survives a refresh of the same tab and never reaches a new one. A sign-in that lands on N3 (no workspace) leaves the key in place; it is cleared by the next deliberate sign-out or overwritten by the next guard write.

Decision **D-NIGHT-0916-C** — the intended app path is remembered once, before the navigation to login, under one key in sessionStorage; the sign-in consumes it; nothing else reads it; the auth screens' signed-in redirect is decided at mount.

### Cheap checks (`order-3/checks/`)

lint, typecheck, guard-static clean; unit **890 / 890** in 78 files (+42); static e2e **119 passed / 0 failed / 96 skipped** at one worker, 6.2 min (the two new live cases skip in static mode). **Last green tip: `5f1d32f`.**

## Order 4 — item 82, first light under the ceiling

### Probe (`order-4/first-light-before-1.json`, `probe-before.log`; the built app on a preview server, page-time ms from the verify submit)

| | verify answers | workspace create lands | overlay mount | first paint | greeting | Dashboard h1 | ring `animationend` | overlay removed | **paint → removed** |
|---|---|---|---|---|---|---|---|---|---|
| before, run 1 | 1178 | 3408 | 3411 | 3434 | 3836 | 4519 | 4318 | 6021 | **2587** |

Where the extra came from: the 1800 ms `setTimeout` was armed in the mount effect (3411) and due at ~5211; the overlay left the DOM at 6021 — the dismissal's re-render queued ~800 ms behind the workspace sync's, whose reads were landing right then (`/me/orgs` 4213→5974, `/me` 4212→6362, `members` →7065, `invites` →7619; every read 1.7–3.4 s on the wire tonight). The ring's own animation ended at +884 ms from paint, as designed; the greeting appeared at +402. So the moment itself is on time; the leaving was not — it waited on React getting to the dismissal.

Arming to first paint: the overlay mounted 3 ms after the workspace create landed (RootGate has the org from that moment) and painted 23 ms later; the Dashboard's heading arrived 1.1 s after the paint (its own sync).

### Rule applied (D-NIGHT-0916-D)

The overlay first paints only when the workspace is in the state the product renders from (the gate waits for `org.exists`, deciding once per arming, the account's flag written only when it plays); the clock starts at the first paint — two animation frames after mount — and runs a fixed `FIRST_LIGHT_MS` (1800); at its end the node hides itself synchronously and only then tells the app, so a landing sync delays the unmount but never the leaving; if the sync is not done, the overlay still leaves and the screen shows its own state under the 220 ms skeleton rule. No timer from arming. Once-per-account and storage-that-throws untouched.

### Commits

| SHA | Item |
|---|---|
| `1452bda` | `first-light.tsx` (clock from first paint, self-hide at the end), `first-light-gate.tsx` (waits for the workspace), four new unit cases (clock from paint, hidden before `onDone`, skip hides at once, gate waits then plays), live lane-A case `e2e/live-first-light.spec.ts` (paint → gone under 2000 ms; never on a reload), lane entry |

### Proof numbers

| Proof | Result |
|---|---|
| unit, red before (`order-4/unit-before-fix.log`) | 4 failed of 18 |
| unit, after (`unit-after-fix.log`) | 18 / 18 |
| probe after (`first-light-after-1.json`, built app) | mount 3579, paint 3588, Dashboard h1 3884, ring end 4484, removed 5402 → **paint → removed 1814 ms** with 20 sync reads (1.1–3.0 s each) landing inside the moment |
| live case alone (`live-first-light-alone.log`, 22:05Z) | **1 / 1** — mount 6941, paint 6955, gone 8757 → **seen 1802 ms**; no overlay on the reload |
| probe runs that never reached the moment | before run 2, before-b, after runs 1 (first attempt) and 2 (second attempt): the product's signup got no answer in 15 s — see the wire note |

Wire note for Ward (item 81, annotated): with the product's signup POST answering in 1.5–2.8 s from node throughout, five of seven product signups from the preview build between 21:54Z and 22:04Z hit the client's 15 s limit ("The server did not answer. Try again." on the form, `first-light-*-stopped.png`). A direct timing at 22:02:3xZ found the cause's shape: the CORS **preflight** `OPTIONS /auth/signup` for origin `localhost:5197` answered `200` in **17,931 ms**, then 357 / 367 / 398 ms on the next three; `localhost:5199` 375 ms; the POSTs right after 1.5–1.7 s. One request pending 15–30 s, then normal — not width-driven, and it happens to OPTIONS as well as POST. Timestamps: signup hangs at ~21:01Z (order 1 run 1), ~21:23Z (order 2 run 1, a login), 21:54:57Z, 21:56:22Z, 21:59:22Z, 22:01:52Z, 22:04:16Z.

### Cheap checks (`order-4/checks/`)

lint, typecheck, guard-static clean; unit **894 / 894** in 78 files (+4); static e2e **119 passed / 1 failed / 96 skipped** at one worker, 8.6 min — the one red was the new live case itself, which lacked the `test.skip(!API_BASE, …)` guard every live file carries and so ran against nothing in static mode (`order-4/checks/static-e2e.log`). Fixed in `e3ed7b1` (the guard, nothing else); proven at file level in static mode: 1 skipped. The first launch of these checks went red on lint before anything ran, on a probe script I had parked in the git-ignored `.gate/` folder, which `pnpm lint` sweeps (`order-4/checks-lint-red-probe-file/`); the file was removed and the checks relaunched. **Last green tip: `e3ed7b1`** (the full static suite at `1452bda` minus the one guarded case; nothing else in the tree changed between the two).

## Order 5 — item 78, a refused topic write

### Probe (`order-5/live-topics-refused-run1.log`, `run1-error-context.md`)

Live, one fresh org, the topic POST refused at the browser with a 400 in the contract's envelope (message + request id in header and body). After the refusal, measured 2.5 s later: **chip gone, no alert, 12 reads** — the seam had dispatched the chip optimistically, resynced on the refusal, and the server's list came back over it; the screen never looked at the result (`onChange={(next) => void brand.setTopics(next)}`). So item 78 reproduces exactly as item 73 described for the brand voice.

### Fix (one line)

Item 73's rule at the topics seam: a refused write never resyncs (the `catch` no longer calls `resync()`); the chip stays; the screen looks at the result and shows the wire's message with the request id in the same alert the brand voice uses, plus the toast; a landed write clears the alert and resyncs once.

### Commits

| SHA | Item |
|---|---|
| `a7be9b7` | `src/data/brand.ts` (`setTopics` catch: no resync), `src/features/settings/sources-screen.tsx` (result handled; alert with message + request id), seam test `src/data/topics-refused.test.tsx` (refused: chip dispatched, no `live/resync`, message + request id; landed: exactly one resync), live lane-A case `e2e/live-topics-refused.spec.ts`, lane entry |

### Proof numbers

| Proof | Result |
|---|---|
| live, before (`live-topics-refused-run1.log`) | `{"chipVisible":false,"alertVisible":false,"alertText":"","readsAfterRefusal":12}` |
| unit, red before (`unit-before-fix.log`, the seam test against the tree without the seam change) | 1 failed of 2 |
| unit, after (`unit-after-fix.log`) | 19 / 19 across the seam test, the timeout seams and the settings screens |
| live, after (`live-topics-refused-alone.log`, 22:22Z) | **2 / 2** — `{"chipVisible":true,"alertVisible":true,"alertText":"Topic refused by the prober­equest probe-78-request","readsAfterRefusal":0}`; the next topic lands, the alert clears, a reload shows the landed one and not the refused one |

Network note: the runner's warm-up saw `fetch failed` on five probes (22:19–22:20Z) before the wire answered — the machine's outbound dropped again for ~50 s, as at 21:24Z.

Decision **D-NIGHT-0916-E** — item 73's rule is the rule for every write seam: a refused write never resyncs; what the person typed stays; the screen says why with the request id; a landed write resyncs once. Item 78 closes.

### Cheap checks (`order-5/checks/`)

lint, typecheck, guard-static clean; unit **896 / 896** in 79 files (+2); static e2e **119 passed / 0 failed / 99 skipped** at one worker, 6.0 min (the three new live cases skip in static mode). **Last green tip: `a7be9b7`.**

## Order 6 — the login right panel

### Probe (`login/before-measure.json`, `login/probe-before.log`, `login/before-*.png`; the built app on a preview server, static mode)

| at | Sign in button | email input | H1 / panel headline | form centre / panel copy centre | checkbox box / label box | accent-painted elements | `[data-ab-motion]` | axe |
|---|---|---|---|---|---|---|---|---|
| 1440×900 | radius **18px**, 36px tall | radius **18px**, 32px tall | 30px / 30px | **482 / 781** | x 564 (16×16) / x 140 (216×19), same row | `a "Forgot password?"`, `button "Sign in"`, `a "Create an account"`, the panel's `span "."` | none | clean at rest |
| 1024×768 | 18px / 36px | 18px / 32px | 30 / 30 | 416 / 636 | x 456 / x 40 | the same four | none | clean |
| 390×844 | 18px / 36px | 18px / 32px | 30 / 30 | 454 / (no panel) | x 350 / x 24 | the three in the form | none | clean |

Against the six findings: (1) the panel's copy sits at the bottom (`justify-end`), 300 px below the form's centre at 1440 — not one optical centre; (2) three accent elements in the form (the two links share the button's ink) plus the panel's full stop; (3) the checkbox sits at the END of its row, 400 px from its label's start — not beside it; (4) the button is a pill (18 px on 36 px) and so are the inputs (18 px on 32 px) — the finding says 8 px, and both go there; (5) the panel headline is 30px, the H1 30px — already not larger; (6) the wordmark is `malaky-logo-white.png` at 32 px, untouched. No ambient figure exists: the panel carries a static gold bloom only. Reduced motion changes nothing today (nothing moves).

### Fix (one line)

The panel carries the beacon at rest — static concentric gold rings at 7/10/14/20% around one accent core that is always there, and one breathing layer on the new `--ambient-period` token (20 s) that carries `data-ab-motion` and so does not exist under reduced motion — behind copy that now shares the form column's exact rhythm (a wordmark-high row, the same gap, a block centred in the rest); the form keeps one accent element (Sign in), its two links step down to foreground-with-underline, the checkbox sits beside its label on the start side, and button and inputs take the small radius (8 px).

Ambient is not a moment (D-NIGHT-0916-F): the family lives in a new section 10 after the guarantee block, outside the four moments' section the fifth-family guard reads, on one token and no colour of its own. The taxonomy test gained three cases (`src/styles/motion-scale.test.ts`: one ambient family outside the moments block; on the one ambient token, which is not a member of the scale, no literal duration; no colour). The moments guard still bites: a fake `[data-ab-motion='fifth-thing']` placed inside section 9 turned "there are FOUR" red (`login/guard-fifth-family-bites.log`: 1 failed of 23), then reverted.

Not touched, by ruling: the panel's accent full stop (D-THEME-0913-C, the website's idiom — a question for the founder below, since the beacon's core is now a second accent-inked figure on the panel), the wordmark (item 68's order decides), the gold bloom.

### Commits

| SHA | Item |
|---|---|
| `60be807` | `tokens.css` (`--ambient-period`), `globals.css` (section 10, `ab-ambient-breathe`, `[data-ab-motion='ambient-beacon']`), `auth-layout.tsx` (panel rhythm + beacon figure), `signin-screen.tsx` (links, checkbox beside label via `Controller` + `Label`, radii), `motion-scale.test.ts` (+3), static spec `e2e/login-panel.spec.ts` (licensed by D-NIGHT-0916-F) |

### Proof numbers (`login/after-measure.json`, `login/probe-after.log`, `login/after-*.png`; before: `before2-*`)

| at | button / input radius | form centre / panel copy centre | checkbox / label x | accent-painted (form) | `[data-ab-motion]` | axe rest / mid-breath | FCP before → after | interaction before → after |
|---|---|---|---|---|---|---|---|---|
| 1440×900 | 8px / 8px (were 18/18) | **482 / 483** (was 482 / 781) | **140 / 164** (was 564 / 140) | `button "Sign in"` only (the focused input's ring, the core and the panel stop are not controls) | `ambient-beacon` 20 s, display block | clean / clean | 444 → 460 ms | 480 → 467 ms |
| 1024×768 | 8 / 8 | 416 / 417 | 40 / 64 | the same | the same | clean / clean | 432 → 432 | 437 → 442 |
| 390×844 | 8 / 8 | 454 / (no panel) | 24 / 48 | the same | the same | clean / clean | 436 → 412 | 442 → 437 |
| 1440, reduced motion | 8 / 8 | 482 / 483 | 140 / 164 | the same | `ambient-beacon`: animation none, **display none**; rings and core still | clean | 436 → 424 | 441 → 426 |

| Proof | Result |
|---|---|
| style guards (`pnpm exec vitest run src/styles`) | 145 / 145 (23 in the motion file, +3) |
| guard bites (`guard-fifth-family-bites.log`) | 1 failed of 23 with a fake fifth family in the moments block; green on revert |
| static spec alone (`login/static-login-panel.log`) | **3 / 3** — panel (rings, core, breathing layer on 20 s; axe at rest and at +3 s), form (one accent, checkbox beside label, 8 px), reduced motion (breathing layer display none, rings and core still, axe) |
| no app frame on the auth page | rail absent at every size (probe `rail false`) |
| screenshots | `login/after-1440.png`, `after-1024.png`, `after-390.png`, and the reduced variants |

Decision **D-NIGHT-0916-F** — the login panel's beacon is ambient: not a moment, one family (`ambient-beacon`) on one token (`--ambient-period`) outside the moments block, vanishing under reduced motion; the login form has one accent element; the static login spec is licensed by this decision.

### Cheap checks (`order-6/checks/`)

lint, typecheck, guard-static clean; unit **899 / 899** in 79 files (+3); static e2e **122 passed / 0 failed / 99 skipped** at one worker, 6.3 min (the three new static cases run; the live ones skip). **Last green tip: `60be807`.** Six orders complete, none skipped.

# TEST-0916 — the testing session on `feat/night-0916`

## Pre-flight

| Step | Result |
|---|---|
| tip under test | `feat/night-0916` = `60be807` (orders 1–6 complete; last green tip after order 6's cheap checks below) |
| origin | main = live = `29e7368` (serving code `3b5d72c`); the branch is 12 commits ahead, none pushed yet |
| port 5199 | free at launch (the runner checks) |
| API | `.env.local` → the dev Lambda; `E2E_API_ENV=dev`; no `--funded`; throwaway orgs only |
| known items, buckets | 63 (999 → 402 at the wallet) and 58 (five references → 400/502 flapping): **bucket c**, for Hasan, not chased; 79 (deferred reads race a spec's next read): **bucket d**; 81 (hung submits): the client's 15 s limit and the runner's 8 s spacing are in — a hung submit now reads as the alert "The server did not answer. Try again." inside 15 s; any red of that shape is **bucket c under 81 for Ward** with request ids and times |
| 66b probe (`test-0916/preflight/probe-66b.log`, org 2361, 22:40Z) | `POST /orgs/2361/brand/voices` named "Brand voice" twice → **201 and 201** (requests `9f02e191…`, `5178c428…`); the wire lists two rows. Uniqueness has NOT landed; the two-row spec stands, nothing flips |
| gate command | `pnpm gate --series test-0916-gateN --workers 1 --rounds 1` (spacing 8 s by default), stdout outside the repo (`scratchpad/t3/gateN.out`), the runner's own record under `.gate/runs/<stamp>/` |

## Gate 1 (`Docs/qa/test-0916-gate1/gate/20260915-224502/`, 22:45–23:15Z, 30.3 min, one worker, one round, spacing 8 s)

**Static half:** verify:all PASS (457 s), w00–w06 PASS; unit **899 / 899** in 79 files; static e2e **122 / 0 / 99**.

**Live half:** 25 files — 13 green, 1 skipped-all (`live-create-visual`, LIVE_MEDIA unset), 11 red. Classified:

| File | Red | Bucket | Why |
|---|---|---|---|
| live-knowledge, live-media-capabilities, live-media-upload, live-notifications, live-proposals, live-studio, live-team, live-wallet | the first test's signup, 23:02:36Z–23:07:53Z: the form stayed on "Create your account" with the alert **"The server did not answer. Try again."** (the client's 15 s limit, order 1) | **d** — the machine's outbound dropped; not the code | `live-schedule-repair` in the same minutes: `apiRequestContext.post: connect ETIMEDOUT 51.24.30.245:443` (23:05:11Z), which the runner itself tagged **network-lost** and re-ran 3/3 green at 23:14–23:15Z once the network was back. The same loss happened at 21:24–21:30Z and 22:19–22:20Z tonight. A network witness (`scratchpad/t3/netwatch.log`, the API's health every 15 s) runs from 23:10Z on so any later red can be pinned |
| live-invite-org › losing membership falls back honestly | "Welcome back" not visible in 40 s at ~23:02Z — the sign-in page never loaded | **d** — the same window |
| live-video-duration › a bad durationS is refused with 400 BEFORE the wallet | `999` → **402**, expected 400 | **c** — item 63, known, waiting on Hasan |
| live-brand › sources and topics: scheme-less display, real persistence | the chip "single origin" not visible within 5 s after Enter, 22:59Z; the entry was consumed (textbox empty), no alert, "No topics yet" on screen | **see below** |

**live-brand, read closely.** The order of events in that test: add a source (its POST lands, the seam resyncs), then type a topic and press Enter — the seam dispatches the chip optimistically and POSTs. The page at the failure shows the source landed and the topic entry consumed, but no chip: the source write's **resync was still in flight** when the optimistic `topics/set` landed, and when it arrived it put the server's list (still empty) over the optimistic one; the chip returns only with the topic write's own resync. On tonight's wire (2–3 s per read) that gap exceeded the spec's 5 s. Pre-existing — the seam has dispatched optimistically and resynced on every write since INT-2; order 5 removed only the resync on a REFUSAL — and wire-timing dependent (`live-topics-refused` ran the same flow green at 22:57Z, and this test was green in both TEST-0915-2 gates). Not touched tonight: the fix is in the sync merge (an in-flight resync must not overwrite an optimistic write that has not resolved), a product change beyond the six orders. **Filed as item 87, for a ruling.** Bucket: **c** if gate 2 is green on it (wire timing over a real, pre-existing race), **b** if it repeats.

Gate 2 launched at 23:16:00Z on the same tip.

## Gate 2 (`.gate/runs/20260915-231601/`, 23:16Z–) — the static half INVALID by my own hand; the live half stands as evidence

**Static half:** verify:all's suites ran clean on lint, typecheck, guard-static, unit (899/899) and build; the static e2e was **121 / 1 / 99** — the one red `marketing.spec.ts › the demo request validates, then resolves locally and says so`: the validation line "That doesn't look like a website address" not visible within 5 s after an invalid website was typed (the marketing world, untouched tonight; green in gate 1 and in the six cheap-check runs of the night — the shape item 70 records for the static suite). Then w02–w06 read **"stale suite report (made for tree 838521dd, this tree is 33a96008)"** and w00/w01 cascaded to "lint FAIL": the tree changed during verify:all — **I appended gate 1's section to `Docs/qa/night-0916/run-log.md` at ~23:20Z while the gate was running**, and the runner's tree hash covers untracked files. The static half of this gate is void for that reason alone; the marketing red is re-tried by gate 3. Memory updated: nothing is written inside the repo while a gate runs.

**Live half:** kept as evidence for the live files (see the table under gate 3, where the same files run again on a frozen tree).

**Gate 2's live half (`Docs/qa/test-0916-gate2/gate/20260915-231601/`, 23:24–23:46Z, one worker, spacing 8 s):** 25 files — **22 green**, 1 skipped-all (`live-create-visual`, LIVE_MEDIA unset), 2 red, both known:

| File | Red | Bucket |
|---|---|---|
| live-video-duration › a bad durationS is refused with 400 BEFORE the wallet | `999` → **402** (expected 400) | **c** — item 63, for Hasan |
| live-media-capabilities › every granted capability: the document's example stops at the wallet (402) | `video-ads.generate` valid body → **400** `bad_request` "The media service rejected the request — check the body against the capability's schema", request `24b9522e-9e8d-4903-aebc-d41b142f76d5` (expected 402) | **c** — item 58, for Hasan |

Every file that went red in gate 1's network window is green here: live-knowledge 3/3, live-media-upload 3/3, live-notifications 1/1, live-proposals 1 + 4 skipped (zero wallet), live-schedule-repair 3/3, live-studio 3 + 1 skipped, live-team 6/6, live-wallet 4/4, live-invite-org 3/3 — and **live-brand 6/6**, which settles gate 1's `sources and topics` red as wire timing over the pre-existing race (item 87), bucket **c**. No signup failed; the network witness read `health 200` every 15 s from 23:10Z through the run.

## Gate 3 (`Docs/qa/test-0916-gate3/gate/20260915-234611/`, 23:46–00:15Z, 29.1 min, one worker, one round, spacing 8 s, the tree frozen)

**Static half:** verify:all PASS (455 s), w00–w06 PASS; unit **899 / 899** in 79 files; static e2e **122 / 0 / 99** — gate 2's marketing red did not recur (a flake, item 70's shape).

**Live half:** 25 files — **22 green**, 1 skipped-all (`live-create-visual`), 2 red, both known: `live-video-duration` (`999` → 402, item 63, bucket **c**) and `live-media-capabilities` (`video-ads.generate` valid body → 400 `bad_request` "The media service rejected the request", request `499f11e0-a3da-4acf-b5cb-b555102ea877`, item 58, bucket **c**). No bucket a, no bucket b. The network witness read `health 200` on every probe from 23:10Z to the end.

**Three gates side by side:**

| | Gate 1 | Gate 2 | Gate 3 |
|---|---|---|---|
| static | clean (899; 122/0/99) | VOID (my run-log write moved the tree hash) + one marketing flake | clean (899; 122/0/99) |
| live green | 13 | 22 | 22 |
| live red | 11 — 9 network-loss (d), 63 (c), live-brand (c, item 87) | 2 — 63, 58 (c) | 2 — 63, 58 (c) |
| verdict | not clean | not clean (static void) | **clean except c** → merge |

**Live proofs beyond the gate:** the login panel by eye and axe on the built app (`login/after-*.png`, `after-measure.json`: axe clean at rest, mid-breath and under reduced motion); deep link and 401 with returnTo (`live-auth-401` cases 5 and 6, 8/8 in all three gates); a deliberate sign-out from Settings and Billing (`live-auth-401` cases 4, every gate) and from Today (`test-0916/proofs/live-signout-today.log`, 1/1 at 00:16Z, the session gone); first light under the ceiling (`live-first-light` 1/1 in every gate; the probe's 1814 ms on the built app); the topics seam (`live-topics-refused` 2/2 in every gate); the 15 s message (`live-timeout` 2/2 in every gate); draft-dependent moments stay on the static and funded proofs. Merge follows.
