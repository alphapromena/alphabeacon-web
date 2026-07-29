# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-07-29, after W5._

---

## In one paragraph

`alphabeacon-web` is a **fully static** React SPA — every screen in
`screens4.md`, rendered from typed data committed under `src/data/`, with **no
network calls of any kind** (enforced twice: `guard-static` fails the build, and
every Playwright run asserts zero requests). Phases **W0–W5 are built and
verified**; **W6 is next**, then W7 hardening. There is no backend and no
integration work in this repo by design — that is a separate plan, written
later (`web-plan.md` §13 records what it will cost).

## Where the code is

|                  |                                                 |
| ---------------- | ----------------------------------------------- |
| Working branch   | `w/05-studio-billing` — **contains everything** |
| `main`           | still at the docs commit, **6 commits behind**  |
| Uncommitted work | none                                            |

Every phase branch was cut from the previous one, so they stack linearly:

```
main  ──  w/00-foundation ── w/01-design-layer ── w/02-marketing-auth-onboarding
      ──  w/03-today-queue ── w/04-calendar-connections ── w/05-studio-billing ← HEAD
```

**Decide before continuing:** `web-plan.md` §9 says each phase merges via PR on
green, but there is no GitHub remote yet (manual step 1, still parked), so
nothing has merged. Either fast-forward `main` to `w/05-studio-billing`, or
create the remote and open PRs retroactively. Until then, **`main` is empty of
product code** — anyone checking it out will think nothing was built.

## Phase status

| Phase                                    | Screens                          | State                                                        |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| W0 Foundation                            | —                                | Done · `verify:w00` green                                    |
| W1 Design layer                          | —                                | Done · `verify:w01` green                                    |
| — Brand pass                             | —                                | Done — real Alpha MENA palette + Barlow, `design.md` written |
| W2 Marketing/auth/onboarding             | M1, A1–A5, N3                    | Done · `verify:w02` green                                    |
| W3 Review queue                          | D1–D5                            | Done · `verify:w03` green                                    |
| W4 Calendar + connections                | C1–C4, B1–B3                     | Done · `verify:w04` green                                    |
| W5 Studio + billing                      | E1–E4, H1–H4                     | Done · `verify:w05` green                                    |
| **W6 Compose/analytics/settings/system** | **F1, G1–G2, I1–I7, N1, N2, N4** | **Next**                                                     |
| W7 Hardening + ship                      | —                                | Not started                                                  |

Current totals: **213 unit tests** (20 files), **42 e2e**, all green.

## What W6 needs (from `web-plan.md` §9)

- **F1** — on-demand generate, driven by `src/lib/compose-player.ts`, which
  **does not exist yet**: a timer-driven token player replaying canned scripts
  (`src/data/compose-scripts.ts`, also not yet written). Five scripts must all
  render: happy, flagged mid-stream, failed→recovery preserving partial text,
  stopped, rate-limited.
- **G1/G2** — analytics overview and channel detail. The shadcn `chart`
  component is installed but has never been used; `AnalyticsSeries` already
  carries labels/reach/engagement/followers and the `limited` flag for the
  honesty note.
- **I1–I7** — settings. Note **I4 already exists** as
  `src/features/settings/tone-editor.tsx` (built in W2, used by onboarding and
  C1); W6 adds its third entry point (I3 tones library) rather than rewriting it.
- **N1, N2, N4** — bell dropdown (a quick-glance version is already in
  `AppShell`), 404 (exists), offline banner (new).
- Routes currently stubbed by `PlaceholderScreen`: `/analytics`, `/settings`,
  `/settings/tones`, `/generate`.

## Rules that have bitten, and will again

These are learned the hard way; each cost a debugging cycle.

1. **`page.goto` in e2e reloads the SPA**, which rebuilds the DEFAULT dataset.
   After switching worlds, navigate **only through in-app links**. Enforced by
   every `verify:wNN` from W3 onward. Use `activateDataset` from `e2e/datasets.ts`.
2. **The shell's `h1` renders during the loading skeleton**, so it is not a
   readiness signal. Wait for `[aria-busy="true"]` to reach 0 before counting
   anything on a screen.
3. **Never dim real text with `opacity`** — it has broken WCAG AA three times
   (marketing logos, calendar day numerals, and nearly the auth panel). Recede
   via the surface or the `muted-foreground` token instead.
4. **Sheets and dialogs must read live provider state**, not a snapshot taken
   when they opened. Hold an id and look the record up, or the panel renders a
   stale version of what the user just changed.
5. **`vitest` runs without `globals`**, so Testing Library's auto-cleanup never
   registers — `src/test/setup.ts` does it explicitly. Component files may not
   export non-components (fast-refresh rule); put hooks and pure helpers in a
   sibling `.ts`.
6. **Scripts under `scripts/` must not import app source.** `tsconfig.node.json`
   has no `@/` alias, and dragging `src/` into it breaks typecheck repo-wide.
   Assertions about data belong in the unit suite.

## Design laws with automated enforcement

Beyond lint and typecheck, each `verify:wNN` runs **structural** checks that
read source, because these failure modes pass behavioural tests:

- Media entry points are rendered from `canTransition`, never a hand-rolled
  status comparison, and are never `disabled` (W3).
- An unreported metric is `undefined`, never `0` — the "Syncing…" rule (W4).
- D4 and E2 must both render the shared `ComposerBody`; neither may grow its
  own params form (W5).
- The params form is generated from each model's JSON Schema; it may not name a
  model or a parameter (W5).
- The credit balance is summed from the ledger; no entity may store one (W5).
- `past_due` gates from the shell, and refuses generation and publishing (W5).
- The palette is guarded by `src/styles/tokens.test.ts` — 49 contrast
  assertions, including the `bg-X/10 text-X` badge pattern.

## Open manual gates

**Eleven checks across W1–W5 remain unsigned** — see `.agent/open-items.md`.
None block the next phase; all block launch. The oldest and most important is
the **W1 screen-reader walk of the app shell**, explicitly flagged by the
reviewer as "not to be discovered at launch."

## Still parked (needs a human)

1. **GitHub repo** — blocks the W0 verify item "a canary PR is blocked by every
   check", and blocks the PR-per-phase workflow the plan describes.
2. **Domain + ACM certificate** — blocks "staging URL serves the shell". The
   CDK stack (`infra/`, `ABW-<stage>-Web`) synthesises but has never deployed.
3. **Arabic**: recorded as decided, not pending — UI stays English; Arabic
   _content_ would need only a font fallback and `dir="auto"`, while Arabic
   _chrome_ is the expensive retrofit. Reopen only on a decision to localize.

## Orientation for a new session

Read in this order: `CLAUDE.md` (rules) → this file → `.agent/conventions.md` →
the last entry in `.agent/sessions.md`. Then `screens4.md` for the screen you
are about to build and `design.md` for how it should look.

Useful commands (full list in `.agent/stack.md`):

```bash
pnpm dev                 # http://localhost:5173
pnpm verify:w05          # the last completed phase; --skip-e2e for a fast pass
pnpm lint && pnpm typecheck && pnpm test
```

`/dev/datasets` switches tenant worlds, `/dev/states` forces loading and error,
`/dev/kitchen-sink` shows every design-layer primitive in both themes.
