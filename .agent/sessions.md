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

### 2026-07-28 12:45 — W2 shipped: marketing, auth, onboarding; verify:w02 green

- Did: built M1, A1–A5 and N3 on branch `w/02-marketing-auth-onboarding`.
  M1 is the full landing page (hero with a rendered product frame, social proof,
  four features, how-it-works, pricing, FAQ, CTA, footer) pricing from the same
  `usePlans()` Billing reads. Auth: a shared `AuthLayout`, a password meter with
  a live checklist, signup with the duplicate-email state, sign-in with a real
  lockout countdown, verify-email with a resend cooldown and expired-link
  recovery, and reset with non-enumerating copy plus the invalid-token path.
  A5 is the five-step wizard ending in "Start pipeline", which activates
  scheduling rather than soft-saving; the custom-tone sheet (I4's component,
  first of its three entry points) returns with the tone selected and the step
  intact. N3 resumes at the step actually reached. Added the `visitor` dataset —
  the only signed-out world — and wired the Authed / SignedOutOnly guards.
- Phase: W2
- Files: `src/features/{marketing,auth,onboarding,settings,system}/*`,
  `src/data/{provider.tsx,types.ts,datasets/visitor.ts}`, `src/lib/messages.ts`,
  `src/routes.tsx`, `e2e/onboarding.spec.ts`, `scripts/verify-w02.ts`,
  `package.json`
- Decisions: see decisions.md — no Arabic UI, and the two costs it does and
  does not defer (2026-07-28)
- Verify: verify:w02 green on every automated step (lint, typecheck, 134 unit
  tests, guard-static, build, the cap-declared-once check, deliverables, and 16
  e2e including the @golden signup → verify → onboard → dashboard walk and axe
  over marketing + both auth screens).
- Notes: two real bugs found by the specs. (1) axe caught the social-proof strip
  dimmed with `opacity-60`, which drops real text below AA — replaced with the
  muted token. (2) `page.goto` reloads the SPA and therefore rebuilds the default
  dataset, so any e2e that deep-links after switching worlds silently tests the
  wrong tenant; the spec now navigates only through in-app links and documents
  why. Also removed the W1-era skipped "marketing pages scan clean" placeholder,
  now that real marketing axe coverage exists.
- Next: W3 — Dashboard, Today queue, draft detail, media panel, schedule dialog
  (D1–D5).

### 2026-07-28 15:50 — W3 shipped: the review queue (D1–D5); verify:w03 green

- Did: built the queue on branch `w/03-today-queue`. Reducer first: draft
  approve/reject/edit, the media job lifecycle with real credit holds, and
  per-channel publish results — all status changes routed through one
  `transitionDraft` helper so the state machine is enforced once. D2 groups
  drafts by slot and computes every action from `canTransition`; D3 adds the
  timestamped timeline and judge score; D4 is Studio's composer draft-scoped,
  with the credit arithmetic on screen and an insufficient-credits refusal that
  preserves the prompt; D5 publishes per channel, showing a needs-reauth channel
  disabled with the fix inline while the others still go out. D1 gained the
  quick-links grid (mirroring the rail) and feed filters. Added the
  `low-credits` dataset, derived from `active` so only the money differs.
- Phase: W3
- Files: `src/features/today/*` (7 files), `src/features/dashboard/dashboard-screen.tsx`,
  `src/data/{provider.tsx,datasets/low-credits.ts,review-queue.test.ts}`,
  `src/routes.tsx`, `e2e/{today-queue.spec.ts,datasets.ts}`,
  `scripts/verify-w03.ts`, `package.json`, `.agent/open-items.md`, `CLAUDE.md`
- Decisions: none new
- Verify: verify:w03 green on every automated step (lint, typecheck, 145 unit
  tests, guard-static, build, the structural approval-gate check, the e2e
  navigation-rule check, deliverables, and 24 e2e including the @golden approve
  walk and axe over the queue and draft detail).
- Notes: the approval gate now has a STRUCTURAL check, not just a behavioural
  one — `verify-w03` reads `draft-card.tsx` and fails if the media control is
  rendered from a hand-rolled status comparison or carries `disabled`, because a
  test cannot tell "absent by the machine" from "absent by coincidence". The W2
  navigation rule is likewise enforced by the verifier now, and the dataset
  switcher moved into a shared `e2e/datasets.ts` (the old copy broke when asked
  to activate the dataset that was already active). Also removed a duplicate
  `h1` on D2 — the shell's top bar already titles the screen.
- Open items: `.agent/open-items.md` now carries the W1 screen-reader walk plus
  the three W2 manual checks, all still unsigned; W3 adds two more.
- Next: W4 — Calendar, schedule config, event sources, connections (C1–C4, B1–B3).

### 2026-07-29 07:50 — W4 shipped: calendar, scheduling, sources, connections; verify:w04 green

- Did: built C1–C4 and B1–B3 on branch `w/04-calendar-connections`. Started with
  `lib/timezone.ts`, which measures a zone's offset through `Intl` rather than
  tabulating rules, so a wall-clock slot resolves to the right instant on both
  sides of a DST change; Amman (fixed UTC+3 since 2022) and New York are tested
  together precisely because one moves and one does not. C1 reuses the W2
  pipeline fields rather than copying them, and holds edits locally so the
  sticky save bar and the router-level dirty guard are honest. C2 keeps a
  Google source's calendar choices when its token dies. C3 renders month and
  week, tints event days, and shows post-publish reach. C4 adds the event card,
  the same-day skip undo, and the performance section. B1 shows all four
  connection statuses with per-permission switches and the Facebook Page picker;
  B2 lists scopes and names what disconnecting costs; B3 handles success,
  denied, failed and already-connected as routed steps. Added the
  `needs-reauth` dataset.
- Phase: W4
- Files: `src/features/calendar/*` (5), `src/features/connections/*` (3),
  `src/lib/timezone.ts` + test, `src/data/{provider.tsx,types.ts,
datasets/needs-reauth.ts,entities/drafts.ts,calendar-connections.test.ts}`,
  `src/routes.tsx`, `e2e/calendar-connections.spec.ts`, `scripts/verify-w04.ts`,
  `package.json`, `.agent/open-items.md`
- Decisions: none new
- Verify: verify:w04 green on every automated step (lint, typecheck, 195 unit
  tests, guard-static, build, the structural Syncing check, the e2e navigation
  rule, deliverables, and 34 e2e).
- Notes: four real bugs, all found by tests rather than by reading.
  (1) The slot sheet held a SNAPSHOT of the slot, so skipping left it rendering
  its pre-skip self — it now derives from live provider state by id.
  (2) No slot in any world was skippable, because every slot already had
  drafts; the active dataset now carries upcoming empty slots, which is what a
  running pipeline actually looks like. A reachability sweep in the unit suite
  now fails if any W4 state becomes unreachable.
  (3) axe caught `opacity-50` on out-of-month day cells dropping date numerals
  to 2.37:1 — the third time dimming real text has broken AA in this codebase,
  so out-of-month days now recede via the surface instead.
  (4) `needs-reauth` only cleared metrics on one channel, so the aggregate still
  had a number and the "Syncing…" state was unreachable.
  Also: the schedule settings screen had no in-app route from a populated
  calendar — reachable only from the empty state, i.e. not reachable by anyone
  who already had a schedule. Added a toolbar link.
- Next: W5 — Studio + billing (E1–E4, H1–H4).

### 2026-07-29 08:10 — W5 shipped: Studio + billing (E1–E4, H1–H4); verify:w05 green

- Did: built Creative Studio and Billing on branch `w/05-studio-billing`.
  Started with `lib/params-schema.ts`, which turns a model's capability JSON
  Schema into form fields, and diversified the catalog so the four models
  publish genuinely different shapes (two enums; bounded int + float; a NUMERIC
  enum plus a boolean; free text plus a titled field). `params-form.tsx` renders
  from that and names no model or parameter anywhere. Extracted the composer
  into `use-composer.ts` + `composer.tsx` and rewrote D4 to render the SAME
  body inside its dialog — media-panel.tsx is now ~70 lines because the tool is
  shared. E1 gallery (kind + plan filters, gated models shown not hidden), E3
  jobs (beacon dot while running, origin tags), E4 asset detail (attach picker
  filtered to approved-or-later, generate-similar, delete confirm). H1–H4 with
  the ledger showing held rows distinctly, and the `past_due` banner in the
  shell gating generation and publishing product-wide. Added the `past-due`
  dataset.
- Phase: W5
- Files: `src/features/studio/*` (4), `src/features/billing/billing-screens.tsx`,
  `src/features/today/media-panel.tsx` (rewritten onto the shared composer),
  `src/lib/params-schema.ts` + test, `src/lib/draft-status.ts`,
  `src/data/{provider.tsx,types.ts,datasets/past-due.ts,studio-billing.test.ts,
  entities/studio-models.ts}`, `src/components/ab/app-shell.tsx`,
  `src/routes.tsx`, `e2e/studio-billing.spec.ts`, `scripts/verify-w05.ts`
- Decisions: none new (the state-machine edge below is recorded in
  `draft-status.ts` itself, next to the transition table it changes)
- Verify: verify:w05 green on every automated step (lint, typecheck, 212 unit
  tests, guard-static, build, four structural checks, and 42 e2e).
- Notes: two real findings.
  (1) A MODELING GAP the attach picker exposed: `approved → media_ready` was
  not a legal transition, so attaching an existing asset was impossible. There
  are genuinely two routes to media — generate one (via `media_pending`) or
  attach one that already exists and was already paid for — and the machine
  only had the first. Edge added, with the reasoning beside the table.
  (2) A REGRESSION my own refactor caused, caught by a W3 test: with no model
  pre-selected, the composer started with empty params, so a required field was
  unset and Generate sat disabled for a reason nobody could see. Params are now
  seeded for whichever model is effectively selected, including the implicit
  first one.
  `verify-w05` adds four structural checks, the sharpest being that D4 and E2
  must both render the shared `ComposerBody` and neither may grow its own params
  form — the day someone copies the body to tweak it, the phase fails.
- Next: W6 — compose, analytics, settings, system (F1, G1–G2, I1–I7, N1, N2, N4).
