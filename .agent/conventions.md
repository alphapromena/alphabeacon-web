# Conventions — naming, shadcn rules, design law, testing

> The house rules. Agents follow these over their own habits.
> Lint/format configs are the law; this file explains the spirit + what tools can't check.

## Naming

| Thing             | Convention                 | Example                                   |
| ----------------- | -------------------------- | ----------------------------------------- |
| files             | kebab-case                 | `today-queue.tsx`, `use-approve.ts`       |
| components        | PascalCase                 | `ClaimChip`, `AppShell`                   |
| hooks             | `use…` camelCase           | `useComposeStream`                        |
| types / contracts | PascalCase                 | `DraftStatus`                             |
| constants         | SCREAMING_SNAKE            | `MAX_POSTS_PER_DAY`                       |
| CSS variables     | shadcn set, kebab          | `--primary`, `--radius`                   |
| feature folders   | area name                  | `features/studio/`                        |
| branches          | `w/NN-slug` · `fix/<slug>` | `w/03-today`                              |
| commits           | Conventional Commits       | `feat(today): approval-gated media entry` |
| test tags         | `@golden` · `@axe`         | on Playwright specs                       |

## Formatting & lint

Prettier + ESLint (commands in `stack.md`). Never hand-format against them.
**Fix, don't suppress**; a suppression needs a one-line justification. Extra
lint rules that are load-bearing: **no raw colors** (hex or Tailwind palette like
`bg-blue-500`) in `features/` or `ab/` — semantic tokens only; **no network APIs
anywhere** (`fetch`, `axios`, `XMLHttpRequest`, `EventSource`, `WebSocket`, or an
`http(s)://` literal under `src/`); **no direct imports of `src/data/entities/*`**
from `features/` — go through provider hooks; **no raw digits for meaningful
numbers** — wrap in `MonoNumber`.

## shadcn/ui rules (non-negotiable)

- Consult the **skill** first: `shadcn search`/`docs <component>` (or MCP) to get
  the real API before writing. Never invent props.
- Components enter ONLY via `pnpm dlx shadcn@latest add`. `src/components/ui/*`
  is **never hand-edited**. Customize by: (1) theme tokens, (2) component
  variants, (3) a wrapper in `src/components/ab/`. A kept divergence in `ui/`
  requires a `shadcn diff` note in `decisions.md`.
- Composition patterns the skill enforces: forms → `Field`/`FieldGroup` + RHF +
  contracts zod; option sets → `ToggleGroup`; empty states → `Empty`; toasts →
  `sonner`; dialogs/sheets/menus → the shadcn primitives (focus handling comes
  for free). Icons: `lucide-react` only.
- Prefer composing `ab/` wrappers over sprinkling primitive props across
  features — one opinion, one place.

## Design law (design.md is the source; never hardcode)

- Fonts: **Inter** — single family, proposed pending founder confirmation
  (`design.md` Part 2 is the source; numbers via `MonoNumber`,
  `tabular-nums`). Tokens in `styles/tokens.css` (OKLCH, light+dark). App is
  light+dark; M1 goes **light-canonical** with the rb/01 cinematic layer
  (design.md Part 5 amendment).
- Status is never color-only (`StatusBadge` = icon + text). Destructive dialogs
  name their consequence. Action labels persist through their flow (Approve →
  Approved…). Custom tones render identically to presets.
- Motion: signal-sweep + beacon-pulse live in `ab/` and are **removed** under
  `prefers-reduced-motion` (Playwright asserts). Contrast ≥ AA.
- Honesty: the approval-gated media entry is **absent** pre-approval (never
  disabled-teasing); guardrail-flagged content shows flagged, not hidden;
  limited analytics get the honesty note, not a broken chart; "Syncing…" never a
  stale zero.

## Network rules (the static rules, amended 2026-07-30 and 2026-08-17)

- Network code is legal ONLY in `src/api/client.ts` and `src/api/upload.ts`,
  and only in live mode (`VITE_API_BASE_URL` set). Features, `ab/`, `data/` —
  and the rest of `src/api/` — stay network-free; `ab/no-network`,
  `guard-static`, and the e2e assert all enforce it. No `http(s)://` literal
  anywhere in `src/`, `src/api/` included.
- **Never call AlphaProStudio directly** (Ward, 2026-08-17; decisions.md
  D-INT-A). Generation goes through our API's `/orgs/:orgId/alphastudio/*` with
  the normal Bearer session — no HMAC, no `x-aps-*`, no service key, no edge
  secret, and `guard-static` fails the build on any of those literals in code.
  The AlphaProStudio Postman *environment* must never be committed; the
  *collection* is committed and is the authority for the bodies the proxy
  forwards verbatim.
- **Proxy types come from observed JSON**, not from api.md's examples: capture
  with `pnpm smoke:alphastudio`, transcribe from
  `Docs/api/alphastudio-shapes.md`, keep unproven fields optional.
- `costUsdEstimate` and catalog `cost` are decimal STRINGS — display them,
  never `parseFloat` them for arithmetic.
- **Static mode is permanent.** Without the env var the app is exactly the
  static build: datasets, `/dev/datasets`, zero requests asserted by e2e.
- Screens read data only through `DataProvider` hooks; entity modules under
  `src/data/entities/` are composed into datasets, never imported by features.
  No screen may know which side of the seam its data came from.
- API-covered entities adapt in the data layer (`src/api/types.ts` → app
  types); fields the API lacks are never invented — disable honestly and log
  the gap in `.agent/open-items.md`.
- Every screen must remain fully exercisable via `/dev/datasets` +
  `/dev/states` in static mode — if a state needs a code change to appear, add
  a dataset or a record instead.
- Static-mode mutations are session-scoped and reset on refresh. The one
  durable record is the live-mode auth session (`src/api/session.ts`).

## Testing conventions

- `*.test.tsx` beside components; Playwright specs in `e2e/`.
- Must be tested: every screen's four data states (dataset/state-driven); the
  state-machine walk (every legal transition renders, no illegal one); the
  message-catalogue completeness over `lib/messages.ts`; every routed screen is
  axe-clean; reduced-motion removes animation; `guard-static` and the
  zero-network assert.
- Style: Arrange-Act-Assert; prefer role/label queries (Testing Library) over
  test ids; datasets over ad-hoc inline data; no brittle full-page snapshots.

## Comments & docs

Code shows **how**; comments explain **why**. `ab/` components and hooks get doc
comments. Behavior changes update `web-plan.md`/`.agent` in the same PR.

## Rules for Claude specifically

1. Smallest diff that completes the task — no drive-by refactors/reformatting.
2. Do not touch: `src/components/ui/*` by hand, `pnpm-lock.yaml` by hand.
   Changing `src/data/types.ts`, `lib/draft-status.ts`, or `lib/messages.ts` is a
   deliberate, reviewed change — they are the integration reconciliation points.
3. Run lint → typecheck → test before "done"; run `verify:wNN` before calling a
   phase done and paste its output in the PR.
4. If reality contradicts this file, flag it in the session log — don't silently
   invent a third style. Then fix the doc or the code, not neither.
