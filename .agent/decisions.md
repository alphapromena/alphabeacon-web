# Decisions

Why the project is built the way it is. One entry per real decision, newest at the
bottom. Keep each short. Don't rewrite old entries — if something changes later,
add a new entry that says it supersedes the old one.

**Format for each entry:**

```
### YYYY-MM-DD — the decision
- Why: the reason, 1–3 lines
- Instead of: the main alternative, and why not
```

---

### 2026-07-19 — Own repo, consuming published @alphabeacon/contracts

- Why: the frontend ships and deploys on its own cadence; a pinned contracts
  package gives it schemas, fixtures, mocks, and the state machine without
  coupling to the backend repo.
- Instead of: living in the backend monorepo — couples deploys and CI for no
  benefit now that contracts are published.

### 2026-07-19 — Real API is the FINAL phase (W8); everything else on mocks

- Why: the whole UI (every screen, every state, streaming) can be built and
  hardened against generated mocks, so frontend never blocks on backend and the
  integration is one controlled, domain-by-domain flip.
- Instead of: wiring endpoints as they appear — serialized, flaky, and it hides
  UI-state gaps behind backend gaps.

### 2026-07-19 — Mode known in exactly two files, guard-enforced

- Why: `mock`↔`real` must be invisible to screens; concentrating it in the REST
  and SSE clients (with a CI guard) keeps components pure and makes W8 a config
  flip, not a refactor.
- Instead of: per-call env checks — leaks mode into the UI and rots.

### 2026-07-19 — shadcn/ui via the CLI + the AI skill; ui/ never hand-edited

- Why: the skill (https://ui.shadcn.com/docs/skills) reads components.json and
  gives correct, project-aware component APIs on the first try; CLI-managed
  files stay upgradable via `shadcn diff`; opinions live in `ab/` wrappers.
- Instead of: hand-writing components or copy-pasting from memory — wrong APIs,
  unupgradable, inconsistent.

### 2026-07-19 — Tailwind v4 + OKLCH CSS variables mapped from design.md

- Why: shadcn theming is CSS-variable native; mapping design.md tokens once
  means features never hardcode values and dark mode is free.
- Instead of: bespoke CSS or hardcoded hex — drift from the design system.

### 2026-07-19 — TanStack Query only for server state; no global store

- Why: typed keys from contracts, cache invalidation, and no duplicated server
  state; URL holds view state. Simplicity beats a Redux-shaped app.
- Instead of: a global client store mirroring the server — stale-state bugs.

### 2026-07-19 — Buttons render from the imported state machine

- Why: importing `DraftStatus` + `canTransition` from contracts makes illegal
  actions literally unrenderable, matching the API and DB enforcement.
- Instead of: ad-hoc `if (status===…)` in components — drifts from the backend.

### 2026-07-19 — Scenario switcher + generated MSW as the state surface

- Why: whole-tenant scenarios reach all four data states on every screen without
  hand-editing fixtures; generated handlers keep mocks true to contracts.
- Instead of: bespoke per-screen mocks — inconsistent and unmaintainable.

### 2026-07-19 — Marketing pre-rendered light-only; app is a light+dark SPA

- Why: SEO + fast first paint for the funnel; the app needs both themes and rich
  interactivity. One Vite build handles both.
- Instead of: an SSR framework for the whole app — unneeded complexity for MVP.

### 2026-07-23 — The web holds no platform host and no platform credential (ticket flow)

- Why: compose now registers through the AlphaBeacon API, which relays
  `{streamUrl, ticket, expiresAt}`. `streamUrl` is absolute and arrives at
  runtime, so no AlphaProStudio host is baked into the build and the only
  platform credential the browser ever holds is a single-use ~60 s ticket.
  `lib/stream/client.ts` registers via `lib/api` then opens that URL; expired or
  already-consumed tickets fall back to `POST /generate`.
- Instead of: a `VITE_FORGE_URL` build var plus the user JWT sent to the platform
  — a longer-lived bearer credential in the browser and a second configured host
  for no benefit. (Supersedes the AlphaProForge naming and the direct-JWT stream.)

### 2026-07-23 — Session tokens stay out of `localStorage`; strict CSP on both origins

- Why: the honest residual risk in this design is XSS on the web origin lifting a
  token or a ticket — not the cryptography. So: access token in memory only,
  refresh via an httpOnly, SameSite cookie, and a strict `Content-Security-Policy`
  (no `unsafe-inline`, explicit `connect-src` for the API origin and the platform
  stream origin) shipped as a CloudFront response-headers policy and asserted in
  e2e. `localStorage` holds the theme preference and nothing else.
- Instead of: tokens in `localStorage` — readable by any injected script, which
  is precisely the failure this design's short lifetimes are hedging against.

### 2026-07-23 — The web is a fully static app; no API, no mocks, no contracts package

- Why: the screens are the deliverable right now. Building them against committed
  data in `src/data/` removes the mock-service layer, the mode switch, the
  contracts dependency and its registry token, and every runtime env var — and
  lets the UI ship without any backend coordination at all. Enforced rather than
  intended: `guard-static` fails the build on any network API under `src/`, and
  every e2e run asserts zero requests. Phases are now **W0–W7**; integration is a
  separate plan written later.
- Instead of: mocks-first with a W8 real-API flip — that plan carried an entire
  parallel API surface (client, MSW handlers, generated fixtures, mode guard) to
  serve a wiring phase this repo is no longer scoped to do.
- **Supersedes**: _Real API is the FINAL phase (W8)_, _Mode known in exactly two
  files_, _TanStack Query only for server state_, _Scenario switcher + generated
  MSW_, _Own repo consuming published `@alphabeacon/contracts`_, and both entries
  added earlier today (_no platform host / ticket flow_ and _session tokens +
  CSP_) — the web now holds no tokens, no hosts, and no platform contact, so
  their subject matter no longer exists here. `DraftStatus` + `canTransition`
  move from contracts into `src/lib/draft-status.ts`; the entry _Buttons render
  from the imported state machine_ still stands, with a local import.
- Cost this accepts, deliberately: types are declared rather than derived, there
  is no fetching layer to slot into, and the loading/error states are designed
  but unproven against real latency. `web-plan.md` §13 records all three, and the
  provider-hook discipline (never import `data/entities/*` from `features/`) is
  the one rule that keeps the eventual swap cheap.

### 2026-07-28 — The real brand palette, split by role to hold AA

- Why: the Alpha MENA Branding Kit landed, so `design.md` now exists and the
  palette is the brand's own. One constraint shaped the mapping: the signature
  pink `#FF1E57` measures **3.77:1** as small text on white and **3.24:1** on
  its own 10% tint — both below AA's 4.5:1. Rather than dilute the brand or ship
  inaccessible text, the palette splits by role: `--brand` (#FF1E57) keeps the
  logo, gradient, glow and display type; `--primary` (#B1204A, the kit's own
  deep rose darkened 0.017) takes every interactive text, link, ring and fill.
  Both are brand colors; only their jobs differ. `design.md` Part 1.4 lists
  every value that is not a kit color exactly, and why.
- Instead of: (a) using `#FF1E57` for `--primary` and shipping 3.2:1 text —
  fails our own design law and axe; (b) lightening the surfaces to rescue the
  pink — off-brand and still short; (c) dropping the pink to a decorative
  afterthought — it is the brand's signature.
- **Supersedes**: _Provisional OKLCH palette pending design.md_.

### 2026-07-28 — Barlow replaces Space Grotesk + Geist Sans; Geist Mono stays

- Why: the kit names **Barlow** as the brand typeface (and sets the logo in
  Barlow caps), so display and UI both move to it. Geist Mono is kept for
  figures because the kit defines no monospace and tabular numerals are a
  functional need — columns must align and digits must not jitter while counting
  up. Recorded as the one deliberate departure from a kit-only stack.
- Instead of: keeping Space Grotesk/Geist — visibly off-brand next to the logo;
  or forcing Barlow onto figures — proportional digits break every number column.
- Note: `screens4.md` §0.2's font row was updated in the same change; it is a
  cheat-sheet that mirrors `design.md`, which is the source for the visual system.

### 2026-07-28 — The palette is guarded by a test, not by review

- Why: three AA failures reached `main` during W1 and were only caught because
  axe happened to render the offending pair. `src/styles/tokens.test.ts` now
  parses `tokens.css`, resolves OKLCH the way a browser does (including sRGB
  gamut clamping and gamma-space alpha compositing), and asserts every pair the
  product renders — text on each surface, the `bg-X/10 text-X` status pattern
  over three surfaces, the heavier `/20` dark destructive tint, focus rings,
  form-control boundaries at 3:1, and chart series. It also asserts the
  brand/primary split itself, so nobody can "simplify" `--primary` back to the
  inaccessible pink.
- Instead of: relying on axe alone — it only sees pairs a screen happens to put
  on screen, so an unrendered state can ship broken and surface much later.

### 2026-07-27 — Provisional OKLCH palette pending design.md (superseded 2026-07-28)

- Why: `design.md` (the visual system of record) is not in this workspace;
  screens4.md §0.2 supplies fonts/type/spacing/radius/motion but no color
  values. W0 cannot ship tokens without colors, so `src/styles/tokens.css`
  carries a clearly-marked provisional "beacon blue → signal violet" OKLCH
  system (light+dark, AA-checked). Nothing outside tokens.css hardcodes a
  color, so swapping in design.md's real palette later is a one-file change.
- Instead of: blocking W0 on the missing doc, or silently inventing a palette
  without recording it — both worse; the flag lives here and in the session log.

### 2026-07-27 — Fonts ship via @fontsource packages bundled by Vite

- Why: `@fontsource-variable/{geist,geist-mono,space-grotesk}` CSS imports get
  bundled and the woff2 files land hashed in `dist/` — the same self-hosted,
  zero-network property the plan wanted from hand-copied files in
  `public/fonts`, but upgradable via pnpm and with no manual file management.
  (The shadcn init already wired Geist this way; we matched it for the other two.)
- Instead of: copying woff2 files into `public/fonts` and hand-writing
  @font-face — more moving parts for the same result.

### 2026-07-27 — next-themes is the theme store

- Why: the CLI-managed `ui/sonner.tsx` imports `next-themes` (the shadcn
  convention), and `ui/` is never hand-edited. Adopting next-themes as the
  theme provider (attribute="class", storageKey="ab-theme") satisfies that
  dependency and replaces a hand-rolled store with the ecosystem-standard one.
  `src/lib/theme.tsx` wraps it so features never import next-themes directly.
- Instead of: a custom theme context (originally written) plus either editing
  ui/sonner.tsx or shadowing it in ab/ — a divergence for no benefit.

### 2026-07-27 — shadcn CLI v4 layout: runtime `shadcn` dep, radix base, nova preset, skill at .agents/skills/

- Why: the current CLI installs `shadcn` as a runtime dependency (its
  `shadcn/tailwind.css` layer is imported from globals.css), uses the unified
  `radix-ui` package, and takes base library **radix** with the **nova**
  preset (Lucide + Geist — matches our design fonts). The `skills` CLI
  installs the shadcn/ui skill under `.agents/skills/` with a
  `.claude/skills` symlink rather than the plan's `skills/`; committed as-is.
- Instead of: pinning the older v2/v3 CLI to match the plan's folder wording —
  fighting the toolchain for a cosmetic path difference.

### 2026-07-27 — Signature motion opts in through one `data-ab-motion` attribute

- Why: "reduced motion removes signature animation" is a promise that has to
  survive every future component, not just today's two. Both animations declare
  themselves with `data-ab-motion`, and one rule in `globals.css` kills the whole
  attribute under `prefers-reduced-motion` — so the e2e sweep can assert over
  _every_ animated element rather than one known dot, and new motion cannot skip
  the guarantee by forgetting a media query. `use-count-up` enforces the same law
  in JS, where CSS cannot reach: under reduced motion it returns the target on
  the first render rather than animating faster.
- Instead of: per-component `motion-safe:` variants — correct wherever someone
  remembers them, invisible when they forget, and untestable in aggregate.

### 2026-07-27 — Status tokens darkened to clear AA on their own tints

- Why: the status-badge pattern renders `text-X` on `bg-X/10`, which is a much
  stricter contrast case than a solid fill, and axe measured real failures at the
  shadcn/provisional defaults: `--muted-foreground` 4.38:1, `--success` 4.47:1,
  `--destructive` 3.98:1 (AA needs 4.5:1). All three were darkened in
  `tokens.css`. Darkening also improves the solid-fill case (white text on
  `bg-destructive`), so one token still serves both roles.
- Instead of: adding separate `--on-tint` foreground tokens (doubles the palette
  for a problem darkening solves), or scoping contrast exceptions per component
  (the failure would return the next time someone used the token).

### 2026-07-27 — Testing Library cleanup is registered explicitly

- Why: vitest runs without `globals`, so `@testing-library/react` cannot find a
  global `afterEach` at import time and never registers auto-cleanup. Renders
  then accumulate across tests in a file and role queries start matching
  elements left over from earlier cases — which is exactly how it first
  surfaced. `src/test/setup.ts` now calls `afterEach(cleanup)` for every suite.
- Instead of: enabling `globals: true` — it would fix cleanup by making
  `describe`/`it`/`expect` ambient, and explicit imports are worth keeping.

### 2026-07-27 — `no-unused-vars` ignores rest siblings

- Why: `const { invalid, ...field } = props` is how a wrapper deliberately keeps
  an internal flag off the DOM, and the form layer needs it in every field
  component. Flagging that as dead code pushes authors toward `_`-prefix noise or
  spreading unknown attributes onto real elements. `_`-prefixed names remain the
  explicit escape hatch for genuinely unused bindings.
- Instead of: renaming to `_invalid` at each site — same result, more noise, and
  it reads as "unused" when the omission is the entire point.

### 2026-07-23 — Strict CSP on the static origin

- Why: still worth having on a site with no credentials — it is close to free on
  a static build and it is much harder to retrofit later. Ship a strict
  `Content-Security-Policy` (no `unsafe-inline`, `default-src 'self'`, no
  `connect-src` entries at all, which matches and reinforces the static law) as a
  CloudFront response-headers policy, asserted in e2e.
- Instead of: deferring headers until there is something to protect — by then the
  inline-style and third-party-script habits are already in the codebase.
