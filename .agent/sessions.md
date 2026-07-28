# Session log

What happened, newest at the bottom. Claude adds one entry after every reply that
changes code or makes a decision (see rule 6 in `CLAUDE.md`).

**Format for each entry:**

```
### YYYY-MM-DD HH:MM — one-line summary
- Did: what changed, in a line or two
- Phase: W<NN> (from web-plan.md)
- Files: `path/one`, `path/two`   (or "none")
- Decisions: none   (or: see decisions.md — <title>)
- Verify: not run | lint+typecheck+test green | verify:wNN green
- Next: what's left, or "nothing"
```

---

### 2026-07-19 00:00 — Project scaffolded from the starter

- Did: web-plan.md + CLAUDE.md + .agent/ docs created; no code yet
- Phase: pre-W0
- Files: `web-plan.md`, `CLAUDE.md`, `.agent/*`
- Decisions: see decisions.md — all founding entries dated 2026-07-19 (own repo, real-API-last, mode-in-two-files, shadcn-via-skill)
- Verify: not run
- Next: W0 — Foundation (Vite+React, shadcn init + `skills add shadcn/ui`, tokens from design.md, MSW mock mode, mode guard, CI)

### 2026-07-23 00:00 — Consistency pass: rename + ticket streaming propagated

- Did: rename propagated; dropped `VITE_FORGE_URL` entirely — the browser holds no platform host and no platform credential beyond the single-use ticket. Mock SSE driver now mocks both hops (register + consume) incl. expired/consumed-ticket scenarios; W8 wiring + Verify rewritten (CORS exact-match, replayed ticket rejected, no token sent to the platform). Fixed a stray code fence at the end of decisions.md
- Phase: pre-W0 (docs only)
- Files: `web-plan.md`, `.agent/{context,architecture,stack,decisions,sessions}.md`
- Decisions: see decisions.md — no platform host/credential in the web; CSP + token storage
- Verify: not run (docs only)
- Next: W0 — Foundation

### 2026-07-23 01:00 — Replanned as a static build (W0–W7); API removed entirely

- Did: rewrote `web-plan.md` around committed data in `src/data/` (types, entity
  modules, datasets, `DataProvider`) with no network layer — dropped MSW, the API
  and SSE clients, `VITE_API_MODE`, the mode guard, TanStack Query, the contracts
  package and its registry token, and the W8 wiring phase. Added `guard-static` +
  a zero-network e2e assert, `/dev/datasets` + `/dev/states` switchers, a local
  `draft-status.ts` and `messages.ts`, and a scripted `compose-player.ts` in
  place of the SSE stream. Rewrote `.agent/architecture.md`; updated CLAUDE.md,
  context, stack, conventions. Recorded what integration will cost (plan §13).
- Phase: pre-W0 (docs only)
- Files: `web-plan.md`, `CLAUDE.md`, `.agent/*`
- Decisions: see decisions.md — the web is a fully static app; strict CSP
- Verify: not run (docs only)
- Next: W0 — Foundation + shadcn + the skill + the data layer

### 2026-07-27 15:00 — W0 foundation built end to end; verify:w00 green

- Did: scaffolded the whole repo on branch `w/00-foundation`. Vite 7, React 19,
  strict TS, Tailwind v4. shadcn init (CLI v4, base **radix**, preset nova) with
  37 `ui/` components and the shadcn/ui skill (`.agents/skills/` plus a
  `.claude` symlink). `tokens.css` with a **provisional** OKLCH palette
  (design.md is missing from this workspace — flagged, see decisions).
  Self-hosted variable fonts via @fontsource (bundled). Data layer: `types.ts`,
  entities, `fresh` and `active` datasets, `DataProvider` hooks,
  `draft-status.ts`, `messages.ts`. Minimal AppShell, seeded D1 dashboard, M1
  placeholder, `/dev/datasets`, `/dev/states`. `guard-static` plus local ESLint
  rules (no-raw-color, no-network, no-entity-imports). Playwright smoke with the
  zero-network fixture, axe, reduced-motion. CI workflow, gitleaks, CDK
  `ABW-<stage>-Web` (synth passes). Renamed the domain type `EventSource` to
  `CalendarSource` after guard-static correctly flagged the Web-API collision.
- Phase: W0
- Files: whole repo (first code commit); doc fixes: `web-plan.md` (§2 skills
  path), `.agent/stack.md` (deploy command shadowed by pnpm built-in; Node
  engines wording)
- Decisions: see decisions.md — provisional palette; fonts via @fontsource;
  next-themes; shadcn CLI v4 layout (all 2026-07-27)
- Verify: verify:w00 green on all automated steps (lint, typecheck, 25 unit
  tests, guard-static + both canaries, build, e2e 5/6 passed 1 skipped-for-W2).
  Manual items open: canary PR blocked (needs GitHub repo), staging URL (needs
  AWS + domain/cert) — web-plan.md §7 manual steps 1–2.
- Next: manual steps 1–2 (GitHub repo, domain + cert); provide `design.md` to
  replace the provisional palette; then W1 — the AB design layer.

### 2026-07-27 15:40 — W1 design layer shipped; verify:w01 green

- Did: built `src/components/ab/` on branch `w/01-design-layer`. Signature
  motion first: `motion.tsx` (BeaconDot, SignalSweep) opting in through a single
  `data-ab-motion` attribute that `globals.css` disables wholesale under
  `prefers-reduced-motion`, so new motion cannot skip the guarantee. Full
  AppShell on the shadcn sidebar: collapsing 72px icon rail, the eight nav items
  in screens4 order, the beacon dot next to Today, org identity footer, top bar
  with title/context, notification bell (N1 quick glance), theme toggle, account
  menu, and the persistent plan/credit chip. Compositions: StatusBadge (+ draft,
  connection, job families), ClaimChip with `use-count-up`, StatCard, PageHeader,
  SlotChip, ToneBadge, EmptyState, ErrorState, five skeleton patterns,
  ConfirmDialog, the toast vocabulary, and the RHF+zod form layer. Rebuilt D1
  onto those primitives. `/dev/kitchen-sink` renders every primitive; added
  `e2e/design-layer.spec.ts` and `scripts/verify-w01.ts`.
- Phase: W1
- Files: `src/components/ab/*` (15 components + tests), `src/features/dev/dev-kitchen-sink.tsx`,
  `src/features/dashboard/dashboard-screen.tsx`, `src/styles/{tokens,globals}.css`,
  `src/lib/format.ts`, `src/app.tsx`, `src/data/provider.tsx` (session actions),
  `src/test/setup.ts`, `eslint.config.js`, `e2e/{design-layer.spec.ts,smoke.spec.ts}`,
  `scripts/verify-w01.ts`, `package.json`
- Decisions: see decisions.md — palette AA corrections; the `data-ab-motion`
  contract; RTL cleanup in setup.ts; `ignoreRestSiblings` (all 2026-07-27)
- Verify: verify:w01 green on all automated steps (lint, typecheck, 66 unit
  tests, guard-static, build, raw-color canary, 8 e2e incl. axe in light+dark,
  the reduced-motion sweep, the named-validation-message check and the keyboard
  walk, 1 skipped-for-W2). Manual items open: visual pass of the kitchen sink
  against design.md (still absent), and a real screen-reader walk.
- Notes: three bugs surfaced and were fixed at the source, not the call site.
  (1) axe caught `--muted-foreground` at 4.38:1 on muted surfaces, then
  `--success` at 4.47:1 and `--destructive` at 3.98:1 as small text on their own
  10% tints — the status-badge pattern; all darkened in `tokens.css`.
  (2) Testing Library never registers auto-cleanup when vitest runs without
  `globals`, so the DOM leaked between tests in a file — fixed centrally.
  (3) The rail's screen-reader text nearly duplicated D1's stat-card label;
  reworded so two surfaces do not read as the same control. Also made the
  count-up test deterministic (was racing jsdom's rAF clock at 2.8s of a 3s
  timeout) by driving the frames directly.
- Next: W2 — marketing + auth + onboarding (M1, A1–A5, N3).

### 2026-07-28 09:00 — Real brand palette + Barlow from the Alpha MENA kit; design.md written

- Did: read `Alpha MENA Branding Kit.pdf` (palette, Barlow, logo rules) and
  replaced the provisional system with the real brand. Wrote `design.md` as the
  visual system of record. Rebuilt `tokens.css` in OKLCH from the kit, switched
  the type stack to Barlow (Geist Mono kept for figures), rebranded the logo
  mark and favicon, and set the wordmark in Barlow caps per the kit's logo rule.
  Added `src/styles/tokens.test.ts`: it parses the real CSS, resolves OKLCH the
  way a browser does (sRGB gamut clamping, gamma-space alpha compositing) and
  asserts 49 contrast pairs, so the palette is guarded by a test rather than by
  review.
- Phase: W1 (brand pass; W2 not started, awaiting the visual review)
- Files: `design.md` (new), `src/styles/{tokens.css,globals.css,tokens.test.ts}`,
  `src/components/ab/app-shell.tsx`, `src/features/marketing/marketing-home.tsx`,
  `public/favicon.svg`, `e2e/smoke.spec.ts`, `scripts/verify-w01.ts`,
  `screens4.md` (font row), `package.json`
- Decisions: see decisions.md — real brand palette split by role; Barlow replaces
  Space Grotesk + Geist Sans; the palette is guarded by a test (all 2026-07-28)
- Verify: verify:w01 green on every automated step (lint, typecheck, 115 unit
  tests incl. 49 contrast assertions, guard-static, build, raw-color canary,
  8 e2e incl. axe in light + dark). Manual item open: the human visual pass.
- Notes: the kit's signature pink #FF1E57 fails AA as small text (3.77:1 on
  white, 3.24:1 on its own 10% tint), so the brand is split by role rather than
  diluted — `--brand` keeps the logo/gradient/glow/display type, `--primary`
  (#B1204A, the kit's deep rose darkened 0.017) takes all interactive text.
  Six tokens needed adjustment for AA; `design.md` Part 1.4 lists each with its
  reason. GitHub/domain/cert deliberately deferred at the user's request.
- Next: user's visual pass on /dev/kitchen-sink in both themes, then W2.
