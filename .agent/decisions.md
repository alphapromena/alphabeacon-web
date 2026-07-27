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
- **Supersedes**: *Real API is the FINAL phase (W8)*, *Mode known in exactly two
  files*, *TanStack Query only for server state*, *Scenario switcher + generated
  MSW*, *Own repo consuming published `@alphabeacon/contracts`*, and both entries
  added earlier today (*no platform host / ticket flow* and *session tokens +
  CSP*) — the web now holds no tokens, no hosts, and no platform contact, so
  their subject matter no longer exists here. `DraftStatus` + `canTransition`
  move from contracts into `src/lib/draft-status.ts`; the entry *Buttons render
  from the imported state machine* still stands, with a local import.
- Cost this accepts, deliberately: types are declared rather than derived, there
  is no fetching layer to slot into, and the loading/error states are designed
  but unproven against real latency. `web-plan.md` §13 records all three, and the
  provider-hook discipline (never import `data/entities/*` from `features/`) is
  the one rule that keeps the eventual swap cheap.

### 2026-07-23 — Strict CSP on the static origin
- Why: still worth having on a site with no credentials — it is close to free on
  a static build and it is much harder to retrofit later. Ship a strict
  `Content-Security-Policy` (no `unsafe-inline`, `default-src 'self'`, no
  `connect-src` entries at all, which matches and reinforces the static law) as a
  CloudFront response-headers policy, asserted in e2e.
- Instead of: deferring headers until there is something to protect — by then the
  inline-style and third-party-script habits are already in the codebase.
