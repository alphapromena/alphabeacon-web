# Stack — versions, packages, commands, flavors, first run

> Operational truth. If a command here is wrong, fixing this file is a P1 task.

## Runtime & languages

| Tool       | Version                                                   | Pinned by            |
| ---------- | --------------------------------------------------------- | -------------------- |
| Node       | 22.x in CI (`.nvmrc`); `engines` allows ≥22 for local dev | `.nvmrc` + `engines` |
| TypeScript | 5.x strict                                                | `tsconfig.json`      |

## Package manager

`pnpm@9` via `packageManager`; lockfile committed; **never bypass it**. All
dependencies are public — no private registry, no token.

## Key dependencies (and why)

| Package                                                | Role                                    | Why this one (see decisions.md)                                              |
| ------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| `react` 19 + `vite`                                    | SPA + build                             | one framework; marketing routes pre-rendered at build                        |
| `tailwindcss` v4                                       | styling                                 | CSS-variable theming maps design.md tokens                                   |
| shadcn/ui (CLI-managed) + `lucide-react`               | component system + icons                | the shadcn **skill** gives the agent correct APIs; base library **radix**    |
| `react-router`                                         | routing + guards                        | SPA route table in `src/routes.tsx`                                          |
| `react-hook-form` + `@hookform/resolvers`              | forms                                   | pairs with shadcn `Field`/`FieldGroup`; zod schemas from `src/data/types.ts` |
| `zod`                                                  | form schemas + entity types             | declared locally; nothing is parsed from a wire                              |
| `@fontsource-variable/dm-sans` + `@fontsource/ibm-plex-sans-arabic` | the visitor world's type | self-hosted woff2 — the marketing port needs DM Sans (opsz + italic) and IBM Plex Sans Arabic (400/500/600), and the zero-network law forbids Google Fonts (D-M2-E, design.md 7.4) |
| `sonner`                                               | toasts                                  | shadcn's toast host                                                          |
| `vitest` + `@playwright/test` + `@axe-core/playwright` | unit/component/e2e + a11y               | fixture-driven state specs; goldens                                          |
| Lighthouse CI                                          | perf/a11y budgets                       | W7 gate                                                                      |
| `aws-cdk-lib`                                          | `infra/` deploy (S3 + CloudFront + ACM) | uniform with the other repos                                                 |

## Commands (copy-paste ready)

| Action                                     | Command                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| install                                    | `pnpm install`                                                                                      |
| run dev                                    | `pnpm dev`                                                                                          |
| shadcn — add / search / docs / diff / info | `pnpm dlx shadcn@latest add <c>` · `… search <q>` · `… docs <c>` · `… diff` · `… info --json`       |
| install the AI skill (once, committed)     | `pnpm dlx skills add shadcn/ui`                                                                     |
| test — all / single                        | `pnpm test` / `pnpm test <path>`                                                                    |
| e2e — state specs / goldens / axe          | `pnpm e2e` / `pnpm e2e --grep @golden` / `pnpm e2e --grep @axe`                                     |
| e2e — a LIVE round (HSN-0910/D)            | `$env:VITE_API_BASE_URL="<dev base>"; $env:E2E_API_ENV="dev"; pnpm e2e --grep live-` (refused without `E2E_API_ENV=dev`) — one file, by hand. The two-round gate itself is `pnpm gate` (below); the retired per-file serial runner is kept only as `Docs/qa/gate-0910/gate/legacy-live-round.sh` for the §4 side-by-side |
| **THE GATE (GATE-0910)**                   | `pnpm gate` — keep-awake → `verify:all` → the seven checks over the report → one production build served by one `vite preview` the runner owns by pid → round 1 (lane A in parallel, lane B serial) → round 2, the gate → every red classified (network-lost re-run 3/3) → the record under `Docs/qa/<series>/gate/<run>/` (series = the branch name minus `feat/`; `--series <name>`). Flags: `--workers 4` · `--rounds 2` · `--lanes A,B` · `--only <files>` · `--skip-static` / `--skip-live` · **`--funded`** (the nine dormant tests on the funded QA org — the founder's word, per run) · **`--media`** (paid renders — the founder's word, per run) · `--pool` (§3.4, the shared lane-A org; off) · `--legacy-verify` (the old six-step verifies). Reads `VITE_API_BASE_URL` from `.env.local` and the funded creds from the QA-creds store itself; sets `E2E_API_ENV=dev` and runs `assertNotProduction` in front of every live step |
| lint / format / typecheck                  | `pnpm lint` / `pnpm format` / `pnpm typecheck`                                                      |
| static guard (also in CI)                  | `pnpm guard:static`                                                                                 |
| observe the live proxy shapes (INT-6)      | `pnpm smoke:alphastudio` (needs `VITE_API_BASE_URL`; `LIVE_MEDIA=1` adds one paid render)            |
| probe HSN-0902's three doors (Phase 0)     | `pnpm probe:hsn-0902` (needs `VITE_API_BASE_URL`; zero spend; APPENDS to `Docs/api/alphastudio-shapes.md`) |
| probe HSN-0910's five doors (Phase 0)      | `pnpm probe:hsn-0910` (needs `VITE_API_BASE_URL`; zero spend; writes `Docs/qa/hsn-0910/phase0/` and APPENDS to `Docs/api/alphastudio-shapes.md`; `-- --render` re-renders from the record; `-- --motion-supplement --owner <email>` reuses an EXISTING zero-wallet org) |
| observe the billing shapes (BIL-0902)      | `pnpm probe:billing` (needs `VITE_API_BASE_URL`; zero spend; writes `Docs/api/billing-shapes.md`)   |
| lighthouse budgets                         | `pnpm lh`                                                                                           |
| build                                      | `pnpm build`                                                                                        |
| deploy                                     | `pnpm run deploy --stage <dev\|staging\|prod>` (plain `pnpm deploy` is shadowed by a pnpm built-in) |
| the suites once (GATE-0910 §3.1)           | `pnpm verify:all [--skip-e2e]` — lint, typecheck, guard-static, unit, build, the STATIC e2e, each once; writes `.gate/reports/verify.json` (+ `unit.json`, `e2e.json`) with the tree hash |
| phase verify                               | `pnpm verify:w<NN>` — asserts over `.gate/reports/verify.json` for THIS tree (a missing or stale report FAILS with "run `pnpm verify:all`"; nothing is re-run), then its own tree assertions and its manual list; `--rerun` (or `VERIFY_LEGACY=1`) is the old six-step chain, kept until retired |

Agents: after any code change run **lint → typecheck → test** before "done";
before closing a phase run `pnpm verify:all` then its `verify:wNN` and paste the
output in the PR; the gate of a series is `pnpm gate` and its record.

## Environments / flavors

| Flavor  | Purpose                    | How to select                 |
| ------- | -------------------------- | ----------------------------- |
| local   | all development            | `pnpm dev`                    |
| dev     | deployed preview           | `pnpm deploy --stage dev`     |
| staging | gates + Lighthouse budgets | `pnpm deploy --stage staging` |
| prod    | live static site           | gate approval                 |

## Environment variables

Exactly **one** reaches the app, and it is the mode switch:

| Variable            | Where                     | Effect                                                                 |
| ------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `.env.local` (gitignored) | present → live mode for API-covered entities; absent → fully static |
| `LIVE_MEDIA`        | shell, dev machine only   | `1` lets `smoke:alphastudio`, the live studio spec and `probe:hsn-0910 -- --funded-proofs` spend on real renders (D-INT-I). Never read by app code. |
| `E2E_FUNDED_RUNS`   | set by `pnpm gate --funded` only | `1` lets the nine tests that stay skipped on an unfunded fresh org switch to the funded QA org for THIS run (item 60, the founder's word per run): `skipUnlessFunded` honours a spec's opt-out unless it is set. Never read by app code. |
| `E2E_ORG_POOL` · `E2E_POOL_EMAIL` · `E2E_POOL_PASSWORD` | set by `pnpm gate --pool` only (OFF by default) | The lane-A org pool (GATE-0910 §3.4): the runner mints one org at round start; a file that opted in (`signUpAndEnter(…, { pool: true })`) signs into it instead of minting. Off until the founder rules; the answer to the crowded dev tenant, not a speed trick. |
| `E2E_API_ENV`       | shell, per LIVE run       | REQUIRED for a live run, and `dev` is the only value accepted: `e2e/global-setup.ts` and `signUpAndEnter` refuse to mint QA companies anywhere else (HSN-0910/D, `Docs/api/environments.md`). Never read by app code. |
| `PROD_API_BASE_URL` | the QA-creds store (User-scope env var), optional | When set, a live run whose `VITE_API_BASE_URL` equals it is refused whatever `E2E_API_ENV` says. No URL literal in source. Never read by app code. |
| `QA_FUNDED_EMAIL` · `QA_FUNDED_PASSWORD` | **the QA-creds store** = this dev machine's USER-scope environment variables, set once with `[Environment]::SetEnvironmentVariable('<name>', '<value>', 'User')` in PowerShell (a shell opened afterwards inherits them; for one run, export both to the `pnpm e2e` process). Never in `.env.local`, never committed. | The designated FUNDED QA org's owner sign-in — MINTED 2026-09-03 at M-BIL-1 (/auto): org **1813**, `qa+1788440509919@alphapromena.com`, funded by ONE real test-mode checkout (card 4242, Stripe invoice `in_1UBaHlKy5r44oOSRSZXHynCY`; BIL-0902/R §4). When both are set, the generating TEXT specs run there instead of self-skipping on a zero wallet (`skipUnlessFunded` in `e2e/live-setup.ts`). Media renders stay behind `LIVE_MEDIA`. `probe:hsn-0910` reads them from the User scope itself for its read-only §3.4 walk (a shell opened before they were set does not inherit them). Never read by app code. |

Read in exactly one file (`src/api/config.ts`). Never hardcoded, never
committed — the guard's http-literal ban enforces that. Static mode (no env
var) is the default, the demo, and the e2e test bed, and must keep working
forever. The CDK stage name passed to `pnpm deploy` remains the only other
build input.

## First run (fresh machine)

1. Node 22 via nvm → `nvm use`; `corepack enable`.
2. `pnpm install` → `pnpm dev` → open the printed URL. Static mode needs no
   `.env` and no token; for live mode create `.env.local` with
   `VITE_API_BASE_URL` (ask a teammate for the deployed URL — it is never
   committed).
3. Sanity: `/dev/datasets` switches tenant states and `/dev/states` forces the
   loading and error presentations; `pnpm test` passes; toggle dark mode and
   reduced-motion and the shell behaves.

## CI (summary)

Fast set per PR (< 8 min): lint (incl. no-raw-color), typecheck, unit +
component tests, **`guard-static`**, build, gitleaks + audit. Screen suites per
PR touching `features/`: dataset/state-driven specs + axe for the affected
screens, each asserting **zero network requests**. Full set nightly + gates:
entire Playwright matrix, `@golden` walks, Lighthouse budgets (W7), bundle
budget, `shadcn diff` cleanliness. Merge blocked by the
fast set + one review. Watch in GitHub Actions; failures → `#alphabeacon-ci`.
