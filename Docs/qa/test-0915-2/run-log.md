# TEST-0915-2 — run-log (written as the session runs)

Branch `feat/shell-0915`, every fix its own commit prefixed `TEST-0915-2:`. Deployment ids live here only; `.agent/` carries commit SHAs.

## Phase 0 — pre-flight

| Step | Result |
|---|---|
| 0.1 tips (from origin) | main = live = `f3d5a83`; fix/followups-0915 = `be0535c` (on main); feat/shell-0915 = `2274244` (on be0535c); linear (`merge-base --is-ancestor` both ways). feat/motion-0914 = `f3d5a83`, untouched. |
| 0.1 port 5199 | nothing listening |
| 0.1 API base | `.env.local` holds one key, `VITE_API_BASE_URL`, a Lambda function URL on eu-west-2 — the dev base `Docs/api/environments.md` names as "today's only API"; `E2E_API_ENV=dev` will front every live step. |
| 0.2 branch | working on `feat/shell-0915`, tree clean |
| 0.3 cheap checks on `2274244` | see below |

### 0.3 — cheap checks on `2274244` (`Docs/qa/test-0915-2/preflight/`)

| check | result |
|---|---|
| lint · typecheck · guard-static | clean |
| unit | 829 / 829 in 74 files (matches) |
| static e2e, one worker | 118 passed / 1 failed / 90 skipped in 393 s — the one red `entry-flow.spec.ts:129` "sign-in locks out after repeated failures and counts down", a 30 s click timeout on the Sign in button; alone at one worker the file is 6/6 with that case in 2.1 s (`entry-flow-alone.log`). Item 70's shape and one of its four named cases: bucket d. With it, 119 of 119 — the numbers reproduce. |

## Phase 1 — the vercel.json regression

**Reading.** `ae2d741`'s `ignoreCommand` diffed `HEAD^..HEAD`. Vercel builds only the pushed HEAD, so a push whose last commit is docs-only is read as docs-only and canceled while the code commits under it never deploy; every merge here ends on a close-out docs commit, so the fast-forward of `main` would have left `2.malaky.ai` on `f3d5a83`'s bundle. The Part A/B proofs never saw it because each push carried one commit.

**Fix.** One line in `vercel.json`, the exclusion list untouched:
`base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"; git rev-parse --verify --quiet "$base^{commit}" >/dev/null || exit 1; git diff --quiet "$base" HEAD -- . <the six exclusions> && exit 0 || exit 1`
Vercel's docs (project-configuration/vercel-json; system-environment-variables): exit 0 ignores the build, 1 continues it; `VERCEL_GIT_PREVIOUS_SHA` is the SHA of the last successful deployment and is exposed only when an ignored build step is configured. `^{commit}` is deliberate: `rev-parse --verify` on a bare 40-hex SHA answers 0 whether or not the object is in the clone, so without it a shallow clone that lacks the base would have skipped instead of built.

**Local exit matrix** (HEAD = `2274244`, the docs tip, before the fix commit): unset → HEAD^ fallback → 0; base `5f01310` → 0 (docs only between them, correct); base `be0535c` → 1; base `f3d5a83` → 1; base = HEAD → 0; a 40-hex SHA not in the clone → 1; `nonsense` → 1. After the fix commit, base `5f01310` flips to 1 because `vercel.json` is in the diff.

**Proof (a) plan.** This run-log update is the docs-only commit on top of the fix; both go up in one push. The deployment for the docs HEAD must be READY (built), because its base is the branch's last successful deployment `5f01310` and the diff carries `vercel.json`. Its bundle: `5f01310` serves `index-BWF0pF0M.js` / `index-Crfna5rg.css` (read from its preview); no source changed in this push, so an identical hash is the expected outcome and the READY state, not the hash, is the proof — recorded as such.

## Phase 2 — known items before the gate

| item | result |
|---|---|
| 66b | Probe on fresh org 2275 (`phase2/probe-66b.log`): `POST /orgs/2275/brand/voices` named "Brand voice" twice → 201 and 201 (requests `411f9532…`, `16e7d6ce…`); the wire lists two rows. Uniqueness has NOT landed; the two-row proof stands, nothing changes. |
| 63 | known red, waiting on Hasan; not chased |
| 58 | noted at gate time |
| 79 / 70 | bucket d by shape, isolated re-run on sight (70 already seen once above) |

**Proof (a), attempt 1.** `8dfc022` (docs on top of `d827693`) went **ERROR** on Vercel before any build step: "`vercel.json` schema validation failed: `ignoreCommand` should NOT be longer than 256 characters" (no build log). The command moved into `scripts/vercel-ignore.sh`, exclusion list verbatim; `vercel.json` calls `bash scripts/vercel-ignore.sh`. Local matrix through the script: unset → HEAD^; base `5f01310` → 1 (the script and vercel.json are in the diff); `be0535c`, `f3d5a83` → 1; a SHA absent from the clone → 1. Attempt 2 is the next push: this line as the docs-only commit on top.

**Proof (a), attempt 2 — READY.** Push `fbb8789` (the script) + `96e1c25` (docs) together: the deployment for the docs HEAD `96e1c25` went BUILDING → **READY** in 41 s (`dpl_2prJUwoSLXq4ipXKimr6eU1ZEABi`, branch alias for feat/shell-0915). Its bundle is `index-BWF0pF0M.js` / `index-Crfna5rg.css` — identical to `5f01310`'s (`dpl_4N6SNXUsWqzEpX2FekdmqXdLonC1`), as it must be: no source changed between them; the READY state of a docs-tipped push is the proof, and the differing-bundle half of (a) falls to the next push that carries source (Phase 5's fixes, or the merge itself in Phase 6 step 3).

## Phase 3 — gate 1 on the tip (`96e1c25`, record `Docs/qa/test-0915-2/gate/20260915-180958/`)

Wall time 18:09:59Z → 18:31:52Z, 22 min. **Static half through the runner, GREEN:** verify:all PASS in 486 s (the e2e step at `--workers=1`, `Running 209 tests using 1 worker` — proof G), unit 829 / 829 in 74 files, static e2e 119 / 0 / 90, the seven `verify:wNN` PASS. **Live round 1, one worker:** 22 files, 13 green, 9 red → RED. Every red classified before anything was touched:

| spec (case) | bucket | cause | action | request |
|---|---|---|---|---|
| `live-media-capabilities:338` five references | c (item 58) | 400 `bad_request` today, not 502 — the flap, the other way | none; annotated | `8c8bb992-ecfb-405f-b413-2129e4257b37`, 18:24Z |
| `live-video-duration:86` durationS 999 | c (item 63) | 402 at the wallet, not 400 | none | in the log |
| `live-invite-org:106`, `live-team:116` | **a** (D-FIX-0915-A) | the specs' `signOut` helper expected the M2 hero headline; a sign-out re-renders the current route signed out, and on an authed route the guard now answers `/login` ("Welcome back"). On `/` it is `RootGate`, still the marketing home — two landings by construction. | helpers accept either front door, cited; green alone: invite-org 3/3, team 6/6 | commit `2dc7c45` |
| `live-wallet:76`, `live-media-upload:58` (login), `live-billing:62`, `live-brand-rules:72`, `live-generate:50` (signup) | d | from 18:24Z the round's submits (Sign in, Create account) answered nothing inside their 20 s: the page still on the form, no alert, no toast (error contexts). Green alone, one worker each: wallet 4/4, media-upload 3/3, billing 7/7, brand-rules 4/4, generate 1/1 (`gate1-isolation/`). Shape: the API under the round's burst, not the code; filed as item 81. | isolated re-runs recorded; gate 2 decides | — |

Bucket b: none. Nothing in the round pointed at the persistent shell: every spec that navigates inside the app (auth-401, brand, country, knowledge, notifications, proposals, schedule-repair, scheduling, studio, onboarding) was green in the round.

## Phase 4 — targeted proofs on the live app (`Docs/qa/test-0915-2/phase4/`)

Served: the gate's own live build (`dist/`, entry `index-Crboq77r.js`, the dev host inlined once) on a local port; `scripts/probe-test-0915-2-live.ts` (new, the record's probe) and TEST-0915's `probe-test-0915-live.ts --proofs C`. Three passes — the first two red on the probe's own assumptions (the live Generate composer has no Prompt field; a fresh org has no balance; the login chunk's button read too early; a second signup on a signed-in page bounces to the Dashboard; arrival markers) — every row below is from the pass that measured it (`phase4-live.md`, `phase4-live2.md`, `phase4-live3.md`).

| proof | result | evidence |
|---|---|---|
| A · frame boundaries | PASS — signed out, `/` and the four marketing paths wear `.mk-world` and no rail; the auth pages wear neither; signed in, all 19 app routes render one `main`, one rail, one rail indicator, no marketing world; `/pricing` and `/privacy` still marketing while signed in. Break: the frame world rendering its outlet without `AppFrame` throws "AppShell renders under AppFrame — the signed-in world's layout route mounts the chrome once (item 77)…" into React Router's default ErrorBoundary on `/today` (dev server), then reverted, `routes.tsx` clean. | `phase4-live.md` A rows, `a-*.png`, `a-break-no-frame.png` |
| B · identity live | PASS in both modes — the indicator tagged on the Dashboard is the same node through Today, Billing, Calendar, Settings; the rail and the main the same nodes; one of each at every stop (orgs 2311, 2314). Route arrivals: see the live3 row. | `b-walk-*.png` |
| C · first light | plays once on a fresh account and never on a reload (org 2312: 2287 ms; org 2315: 2239 ms) — **over the 2000 ms ceiling both times**. Mechanism: the moment closes on a 1800 ms `setTimeout`, and live the workspace sync's re-renders land inside that window, so the timer fires late. Not this stack's regression (the moment and the live sync predate it; the live duration was never held to the ceiling) — filed as item 82, for a ruling. | `c-first-light-mid.png` |
| C · the moments that need a draft | NOT REACHABLE at zero spend: a fresh org's wallet is empty by construction ("No balance yet — subscribe"), a run is refused with 402, so no draft exists to approve. Generating's stage lines, the approve settle + sweep, §5.7 and the Approve toast samples stand on the built app in static mode (TEST-0915 proof E, `Docs/qa/fix-0915/item-76`) and the gate's `live-generate` on the funded org exercised a generation live. | `c-generate-outcome.png` |
| C · tone sample, skeleton | the skeleton on a live reload of Today mounts `role="status" aria-busy="true"` at the true start and paints 241 ms after mount (4 ms polling); the tone sample: see the live3 row. | |
| D · contrast in motion, live | every app route scans clean (axe wcag2a/aa) inside the frame right after a client-side arrival, 19 of 19; clean with first light on screen, with a toast up, on the Generate screen; the "Brand voice saved" toast description **13.62:1 at +41/+88/+166/+403 ms from its mount** (toast 2045 ms after Save — the wire's own time); under reduced motion the toast is at opacity 1 and `matrix(1, 0, 0, 1, 0, 0)` from its first sample. | `c-toast-live.png`, `d-reduced-toast.png` |
| E · item 75 by eye | PASS ×3 — expired at boot on `/`, revoked mid-session on Settings (`POST /auth/logout` 204, request `e52b2dd0…`), dead token on a direct load of Billing: each lands on `/login` with "Your session ended…", the session purged, the Sign in button up. | `e-1-expired-at-boot.png`, `e-2-revoked-mid-session.png`, `e-3-dead-token-billing.png` |
| F · item 73 live | PASS ×3 — the refused PATCH never says saved and the toast carries the field message; the `role="alert"` with the request id, the draft and the Save button still on screen 3 s later; the wire holds what it held (request `a3334c31…`, org of `qa+…a`). | `proofs-t2-item73.md`, `proof-c-*.png` |
| G · item 74 | PASS — gate 1's static half: `Running 209 tests using 1 worker`, verify:all PASS, the runner handed `--workers 1` down. | `gate/20260915-180958/static/verify-all.log` |
| H · nothing paid, wires at 0 | PASS — orgs 2317, 2319, 2320: voices, tones, sources, topics, schedules all 0 on the wire; the gate's `live-create-visual` skipped all (no `--funded`); `live-billing`'s 402 on the unfunded org green alone; no `--funded`, nothing on 936 / 1867 / 619, 1813 only through the gate's own files. | `phase4-live3.md` |

**Live3 rows.** Route arrivals, proof E's clock on the production build with the wire measured from resource timing: Today 5 / 5 / 6 ms (no wire), Calendar 4 / 4 / 4 ms, Billing 799 / 892 / 935 ms of which the wire is 797 / 891 / 932 (three reads on mount) → **the shell's own share 1–3 ms**; Studio's and Settings' markers were not found on this org's screens (the arrival could not be read; the identity walk covers both). Every hop that painted a skeleton had a wire wait ≥ 645 ms behind it; none flashed. The shell's share is under the static dev-server range (22–67 ms) — no regression. The tone sample rewrites beside the picker (two tones, org 2318). First light on org 2318: 2196 ms.
