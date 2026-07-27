# Conventions — naming, shadcn rules, design law, testing

> The house rules. Agents follow these over their own habits.
> Lint/format configs are the law; this file explains the spirit + what tools can't check.

## Naming

| Thing | Convention | Example |
|-------|------------|---------|
| files | kebab-case | `today-queue.tsx`, `use-approve.ts` |
| components | PascalCase | `ClaimChip`, `AppShell` |
| hooks | `use…` camelCase | `useComposeStream` |
| types / contracts | PascalCase | `DraftStatus` |
| constants | SCREAMING_SNAKE | `MAX_POSTS_PER_DAY` |
| CSS variables | shadcn set, kebab | `--primary`, `--radius` |
| feature folders | area name | `features/studio/` |
| branches | `w/NN-slug` · `fix/<slug>` | `w/03-today` |
| commits | Conventional Commits | `feat(today): approval-gated media entry` |
| test tags | `@golden` · `@axe` | on Playwright specs |

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

- Fonts: Space Grotesk (display) / Geist (UI) / Geist Mono (numbers via
  `MonoNumber`). Tokens in `styles/tokens.css` (OKLCH, light+dark). App is
  light+dark; **marketing is light-only**.
- Status is never color-only (`StatusBadge` = icon + text). Destructive dialogs
  name their consequence. Action labels persist through their flow (Approve →
  Approved…). Custom tones render identically to presets.
- Motion: signal-sweep + beacon-pulse live in `ab/` and are **removed** under
  `prefers-reduced-motion` (Playwright asserts). Contrast ≥ AA.
- Honesty: the approval-gated media entry is **absent** pre-approval (never
  disabled-teasing); guardrail-flagged content shows flagged, not hidden;
  limited analytics get the honesty note, not a broken chart; "Syncing…" never a
  stale zero.

## Static rules (the whole build)

- The app makes no network calls. There is no endpoint, base URL, or token to
  wire — `guard-static` fails the build and the e2e network assert fails the run.
- Screens read data only through `DataProvider` hooks; entity modules under
  `src/data/entities/` are composed into datasets, never imported by features.
- Every screen must be fully exercisable via `/dev/datasets` + `/dev/states` — if
  a state needs a code change to appear, add a dataset or a record instead.
- In-memory mutations are session-scoped and reset on refresh. Never build a
  screen that implies durable persistence.

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
