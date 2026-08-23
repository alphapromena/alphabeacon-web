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
| lint / format / typecheck                  | `pnpm lint` / `pnpm format` / `pnpm typecheck`                                                      |
| static guard (also in CI)                  | `pnpm guard:static`                                                                                 |
| observe the live proxy shapes (INT-6)      | `pnpm smoke:alphastudio` (needs `VITE_API_BASE_URL`; `LIVE_MEDIA=1` adds one paid render)            |
| lighthouse budgets                         | `pnpm lh`                                                                                           |
| build                                      | `pnpm build`                                                                                        |
| deploy                                     | `pnpm run deploy --stage <dev\|staging\|prod>` (plain `pnpm deploy` is shadowed by a pnpm built-in) |
| phase verify                               | `pnpm verify:w<NN>`                                                                                 |

Agents: after any code change run **lint → typecheck → test** before "done";
before closing a phase run its `verify:wNN` and paste the output in the PR.

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
| `LIVE_MEDIA`        | shell, dev machine only   | `1` lets `smoke:alphastudio` and the live studio spec spend on ONE real render (D-INT-I). Never read by app code. |

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
