# GATE-0910 Phase 0 §2.3 — `vite preview` of a production build versus the dev server

**Answer: not identical, and the production build is the honest side.** One
live-auth test is red on the preview build twice and green on the dev server
minutes later; the cause is in the app, not in the server or the API.

## What was run (2026-09-10, `main` at `4d98942`, the dev API, zero spend)

| Run                   | Server                                                                                  | Result                                                                          | Log                      |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------ |
| preview run 1, 11:34Z | `vite preview` of `pnpm build` with `VITE_API_BASE_URL` inlined, port 5199 owned by pid | 2 passed, **1 failed** (test 3, 41.9 s), 4 not run (the file is `serial`); 65 s | `preview-probe-run1.log` |
| preview run 2         | the same build, a fresh preview process                                                 | 2 passed, **1 failed** (test 3, 41.9 s, the same wait), 4 not run; 59 s         | `preview-probe-run2.log` |
| dev-server control    | Playwright's own `pnpm dev --port 5199` (today's procedure)                             | **7 passed**, 75 s                                                              | `dev-control.log`        |

The failed test: "correct password + unverified email routes to the verify
screen, which finishes the job". Both preview runs waited 40 s for the
Dashboard heading; the DOM at failure (`run1-error-context.md`,
`run2-error-context.md`) shows N3 instead — "Name your workspace and we will
finish setting it up." with the Organization name box and a disabled "Create
my workspace" button.

## Why (read from the code, not guessed)

- `src/data/datasets/index.ts`: `DEFAULT_DATASET_ID` is `'visitor'` in a
  production build (`import.meta.env.PROD`) and `'active'` in dev — by design,
  since the 2026-08-19 incident.
- `src/features/auth/verify-email-screen.tsx`: after a good code, the screen
  creates the workspace from `org.name` if it is non-empty, then navigates
  to `/`, where the root gate routes to the product or to N3.
- `src/data/auth.ts`: the login-unverified path dispatches
  `live/pendingVerification` with the **email only**. The signup path carries
  the org name; a later login from a fresh browser cannot.
- So `org.name` on that path is the boot world's org name: the dev server's
  world is `active` = **"Atlas Roasters"**, the demo org — the dev server
  has been creating a workspace named after the demo and landing on the
  Dashboard. The production build's world is `visitor`, whose org name is
  `''` — no create, N3 asks for the name. That is the designed path (the
  screen's own comment: a session with no workspace goes to N3, "the surface
  built to retry exactly this").

The spec encodes the dev artefact ("verifying creates the workspace and lands
in the app"). The build users get — `1.malaky.ai`, the apex once cut over —
behaves as the preview did. Item 59 carries the two fixes for the founder's
word: the spec expects N3 and finishes through it; the app never takes a
workspace name from the demo world.

## What the preview build does the same

- The SPA fallback holds: a deep route (`/settings/organization`) answers
  200 `text/html`; the six other live-auth tests, including the signup →
  verify → Dashboard walk and the invite deep link, passed on the preview.
- The API base is inlined once in the served entry chunk
  (`assets/index-DH91FgkU.js`; a different hash from Vercel's
  `index-Ckpi_DKM.js` because Vercel also inlines `VITE_DEFAULT_DATASET`).
- `assertNotProduction` runs unchanged (the global setup is the same).

## What §3.3 must know

- **The trap-22 tripwire is blind on a preview server.** `assertServerMode`
  fetches `/src/api/config.ts`; the preview answers that path with the SPA's
  `index.html` (200 `text/html`), the regex finds no inlined value, and the
  guard returns without reading the mode. The runner therefore owns the
  server by pid, refuses a busy port instead of adopting it (as
  `preview-probe.sh` does), and a preview-aware tripwire reads the served
  entry chunk for the inlined host — the probe did exactly that ("api host
  inlined in the served entry: 1 time(s)").
- **The fallback the order names (a dev server per round) is not the right
  answer to this red.** It would keep proving a behaviour production does
  not have. The right answer is item 59; until it lands, a preview-served
  round carries one known, classified red.
- The production bundle takes 11 s to build after `tsc -b`; one build per
  round is cheaper than today's per-file dev-server starts.
