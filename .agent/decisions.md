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

### 2026-07-28 — No Arabic UI, and the two costs that decision does and does not defer

- Why: `context.md` puts UI localization out of scope and `architecture.md`
  records an English UI, so Barlow's lack of Arabic coverage costs nothing for
  chrome. Two futures were separated rather than lumped together:
  **(a) Arabic content** — generated post copy in an Alpha MENA product is
  plausible (the demo tenant already runs on `Asia/Amman` with a Jordan holiday
  feed). It is data through `DataProvider`, not localization: it needs an
  Arabic-capable fallback appended to `--font-sans` plus `dir="auto"` on the
  elements that render user/AI text. Cheap, local, and reversible — deferred
  until an Arabic record actually exists, because adding a face for content that
  does not exist is speculative weight.
  **(b) Arabic chrome** — mirroring the app is the expensive one: `dir="rtl"`,
  logical properties instead of left/right everywhere, mirrored icons and
  motion, and a paired Arabic face for the type scale. It is NOT started, and
  the trigger to revisit is a decision to localize the UI, not the appearance of
  Arabic content.
- Instead of: adding an Arabic webfont and RTL plumbing now — pays a real cost
  today for a requirement the product does not have; or saying nothing and
  letting Arabic content silently fall back to a system font later.

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

### 2026-07-29 — F1's stream is a script catalogue, chosen by the prompt

- Why: the app is static, so the "model" is a timer replaying canned copy — but
  every state F1 must render is a state a real stream produces. Five scripts in
  `src/data/compose-scripts.ts` cover the five outcomes (complete, complete with
  a mid-stream guardrail flag, dropped, long-enough-to-stop, refused), and
  `pickScript` selects one by a word in the prompt so each is reachable by
  typing. The allowance check runs first, so no prompt can type past a refusal.
- Instead of: a dev-only "which script?" control in the product (demo furniture
  a user would find), or random selection (untestable, and a designed state you
  cannot reach on purpose is a designed state nobody reviews).

### 2026-07-29 — The org's timezone lives on the schedule, and only there

- Why: screens4.md I1 asks for "timezone (mirrors C1, single source)". `Org` and
  `Schedule` both carried one; nothing read the org's copy, and the first thing
  that did would have made two screens disagree about when a post goes out.
  `Org.timezone` is deleted, and I1's control dispatches `schedule/update`.
- Instead of: keeping both and syncing them on save — the sync is the bug.

### 2026-07-29 — I4's Preview composes, and says so

- Why: the screen promises "one sample line combining the org's brand voice with
  this tone's rules", and there is no model to ask. What can be shown honestly is
  the thing the action exists for: which brand-voice rules and which tone rules
  are in force at the same time, beside a sample line (the tone's own example
  when it has one). `composePreview` is pure, so the composition is testable.
- Instead of: a fake spinner and a canned sentence dressed as a generation —
  the one place in this product where pretending would actually mislead.

### 2026-07-29 — N4's offline state is real; degraded service is forced

- Why: `navigator.onLine` plus the `online`/`offline` events is genuine signal
  and costs nothing, so the offline banner is real. "We're having trouble
  reaching AlphaBeacon" has no honest source in an app that never makes a
  request, so it is reachable only through `/dev/states`, alongside loading and
  error. Both messages live in the catalogue and both render.
- Instead of: inventing a failure on a timer so the second banner "works" — a
  product whose first lie is an outage it made up.

### 2026-07-29 — Retry only appears where a retry could win

- Why: I6 has two kinds of failure. A file we cannot read at all (wrong type)
  will fail identically forever, so it offers the reason and Remove; a failure
  that might clear offers Retry. This is the same law as the media entry points
  in D2 — a control you can see but never use is a tease.
- Instead of: one Retry on every failure (teaches people the button is a lie), or
  a `retryable` flag on the record (a field to describe what the reason already
  says).

### 2026-07-29 — N2's secondary link goes to your admins, not to "support"

- Why: screens4.md N2 asks for a secondary support link. There is no support
  inbox, and a link that goes nowhere is worse than none — so 404 points at the
  people who can actually act, the admins in this workspace (I7).
- Instead of: a fabricated `support@` address, which would look real enough to
  be tried.

### 2026-07-29 — The save bar and its dirty guard are one component

- Why: C1 had a sticky save bar and a leave-without-saving dialog written inline,
  and W6 added three more screens that need both. They are one promise — nothing
  changes until you save, and leaving with unsaved work is refused out loud — so
  a screen that took the bar without the guard would keep half of it.
  `components/ab/save-bar.tsx` owns both; `verify:w06` fails any settings screen
  that grows its own `useBlocker`.
- Instead of: copying the pattern per screen (four wordings of the same refusal),
  or a hook that returns state a screen still has to render (the half nobody
  copies is the dialog).

### 2026-07-29 — No retroactive PRs; `main` fast-forwards

- Why: W0–W6 were built before the GitHub remote existed. Once it did, `main`
  was fast-forwarded through each phase branch in order (`--ff-only`, so a
  diverged branch would have failed loudly rather than merged quietly) and the
  phase tips were kept as the per-phase record. Opening seven PRs after the fact,
  on a solo project with no second reviewer, is ceremony that buys nothing — the
  `verify:wNN` gate is what actually protects the branch, and it is unchanged.
- Instead of: reconstructing the PR history for the audit trail — `sessions.md`,
  the phase branches and the verify output already are the audit trail.

### 2026-07-29 — Manual gates are grouped by sitting, not by phase

- Why: thirteen items had accumulated across six phases, and grouped by phase
  they were unclearable — each sitting would have meant setting up a screen
  reader, resizing to 360px and re-reading copy, three times over. Grouped by
  apparatus (viewport → screen reader → read-as-a-stranger) the same thirteen
  close in three sittings. The order matters: layout findings move focus order,
  so the viewport pass runs before the screen-reader pass, and judgment last.
- Instead of: clearing them per phase as each shipped (the intent all along,
  and it did not survive contact with six phases), or dropping the ones that
  felt covered by axe — axe cannot hear what is announced, which is the point.

### 2026-07-29 — Settings is a route layout, and its sections are a real tablist

- Why: each section rendered its own copy of the layout, so changing section
  swapped one component for another, React unmounted the whole navigation, and
  the focused tab went with it — focus fell to `document.body` and a keyboard
  user tabbed back in from the top of the page every time. Mounting the layout
  once above an `Outlet` fixes the cause rather than the symptom, and is also
  what a tablist needs. Activation is manual (arrows move, Enter follows)
  because these tabs change the URL; automatic activation would fire six
  navigations on the way past.
- Instead of: restoring focus programmatically after each navigation (treats
  the symptom, and leaves the nav being destroyed and rebuilt for no reason), or
  leaving six plain tab stops (works, but the reviewer asked for the tablist and
  it is the standard pattern for sectioned settings).

### 2026-07-29 — The save bar's guard remembers the field, not the click

- Why: the leave-without-saving dialog has no trigger element — the router's
  blocker opens it — so Radix has nothing to restore focus to and drops it on
  the body. Reading `document.activeElement` when the block fires is not enough
  either: by then focus is on the nav tab the user clicked to leave. Choosing
  "Keep editing" should return you to the form you are keeping, so the bar
  tracks the last control focused inside the editing region and ignores the
  tablist and the dialog.
- Instead of: focusing the first field (loses your place in a long form), or
  accepting the tab (you chose not to go there).

### 2026-07-29 — Focus-not-obscured is held once, in the base layer

- Why: WCAG 2.2 §2.4.11. The save bar is fixed to the bottom of the viewport and
  the browser scrolls a newly focused control flush to that same edge, so the
  last field lands underneath it. Padding on the column cannot fix this — the
  browser scrolls to the element, not to the end of the page. A single
  `scroll-margin-bottom` on every focusable element in `globals.css` does, costs
  nothing where there is no bar, and cannot be forgotten by the next screen that
  grows one.
- Instead of: per-screen padding (already present, and demonstrably not enough),
  or making the bar non-fixed (loses the always-reachable commit).

### 2026-07-29 — A hidden file input never holds a tab stop

- Why: both upload controls paired a visible button with an `sr-only` file
  input. `sr-only` hides an element visually but keeps it focusable, so tabbing
  landed on something that rendered nothing and focus appeared to vanish. The
  button is the affordance; the input is plumbing and takes `tabIndex={-1}`.
- Instead of: `aria-hidden` on the input as well — it would drop the control out
  of the accessibility tree entirely, and a screen-reader user browsing by form
  control would lose a working way to open the picker.

### 2026-07-29 — The credits ledger states its arithmetic

- Why: the rows always summed to the balance correctly, but a reader seeing
  "granted 500" and "balance 458" had to add up a table to find the missing 42.
  H3 now prints granted / spent / held / balance, all computed from the same
  rows by `reconcileLedger`, with the identity asserted against every dataset.
  Writing that test immediately found a real bug: the low-credits world charged
  452 credits to `job_backfill`, a job that did not exist, so the single largest
  line on the screen rendered with a blank description.
- Instead of: a stored summary (the balance is never stored — that law is what
  keeps the number honest), or explaining it in prose (prose does not fail a
  test when the data stops adding up).

### 2026-07-29 — An absent delta says why it is absent

- Why: "no comparable prior period → show nothing" is right, but silent absence
  reads as breakage: the trend badges appeared on the 7-day range and vanished
  on 30-day with no explanation. The card now distinguishes the two real
  reasons — there is no earlier window yet, or there is one and it was empty.
- Instead of: showing "0%" or "—" (the invented comparison this rule exists to
  prevent), or extending the series to 60 days so 30-day always has a prior
  window (hides the question instead of answering it, and the same gap returns
  at the next range).

### 2026-07-29 — A "quiet week" world, so a zero can be looked at

- Why: every seeded world has a busy last seven days, so G1's headline stat
  cards — posts published, and every delta beside them — could not be checked in
  their most important state. `quiet-week` publishes nothing in seven days, with
  reach tapering to a floor rather than to zero (older posts keep working) and
  followers flat. Datasets are already "the only way a screen reaches a
  different world", so this is the existing mechanism rather than a new one.
- Instead of: a dev toggle that zeroes analytics (a second mechanism for what
  datasets already do), or editing the seed to be quiet by default (loses the
  busy world the rest of the product is demonstrated from).

### 2026-07-29 — OPEN QUESTION: should the shared pipeline between D3 and Studio be visible?

- The question, narrowly: draft detail (D3) and Creative Studio (E1–E4) read as
  two different products, and **that is correct** — they are two jobs, and that
  is settled. What is not settled is whether the pipeline they share — the same
  credits, the same reserve → release → commit, the same job list — should be
  surfaced in the UI, or should stay an implementation detail the user never
  needs to hold.
- Arguments for surfacing: a user who spends credits in D4 and then sees a
  balance move in Billing currently has to infer the connection; E3's job list
  already mixes both origins ("Standalone" / "For draft") and is the one place
  the shared pipeline is visible, but nothing points at it from D3.
- Arguments against: the whole point of D4 is "Studio, in context" — someone
  approving a draft should not have to learn what a job is.
- Not building anything. Logged so the question survives; it needs a product
  decision, not an implementation.

### 2026-07-29 — A test is worth more than the assertion it was written for

- Why: `ledger.test.ts` was written to prove one identity — granted − spent −
  held equals the balance. What it actually found was unrelated and worse: the
  low-credits world charged 452 credits to `job_backfill`, a job that did not
  exist, so the single largest line on the credits screen rendered with a blank
  description. Nobody was looking for that, and no screenshot would have shown
  it. The rule this repo takes from it: **when you write a test for one
  property, assert the surrounding invariants too** — every reference resolves,
  every total is non-negative, every row names something real. The cheap extra
  assertions are where the unknown bugs live, and they cost a line each.
- Instead of: testing exactly the one property in question, which would have
  passed and left the 452-credit ghost in place.

### 2026-07-29 — Posting times: the schedule's zone, labelled by offset

- Why: four decisions taken together, all approved. (1) A slot is a wall-clock
  time in the org's posting zone, so that zone is the fact and everything else
  renders it. (2) The viewer's local time appears ONLY when it differs — an
  always-on second zone trains people to read neither — and brings its date with
  it when the day differs too. (3) The label is `GMT+3`, never `AST`: that
  abbreviation means both Arabia and Atlantic Standard Time, and this product's
  operators publish to clients in either. In the tightest slot — a calendar day
  cell, a queue slot heading — the offset is what fits, so the offset is used
  everywhere and the IANA name appears where there is room (calendar header,
  slot sheet, schedule config). (4) Dates outside the current year carry it.
- All of it lives in `components/ab/posting-time.tsx` so no screen can hold a
  different opinion, and `verify:w06` fails if a screen stops using it.
- Instead of: per-screen formatting (six opinions), or the abbreviation (shorter,
  ambiguous, and ambiguity in a publishing time is a missed post).

### 2026-07-29 — The product no longer claims to know the audience's time

- Why: C4 read "the time your audience sees". That is not imprecise, it is
  false, and it was user-facing: a connected page has followers in every zone
  and this product holds no data about where they are. Renamed to **posting
  time** everywhere, and the claim deleted. If a platform ever reports a real
  audience zone it arrives as its own sourced fact, not as a relabelling of the
  operator's zone. `verify:w06` greps the feature tree for the claim so it
  cannot come back in a well-meaning line of copy — comments are stripped first,
  so the code that removed it may still quote it in explaining why.
- Instead of: softening it ("roughly the time your audience sees"), which keeps
  a claim the data cannot support.

### 2026-07-29 — SPEC GAP FOUND: no way to change a member's role

- Why: screens4.md I7 specifies a role BADGE on member rows and a role select
  only in the invite dialog. Read strictly that is what was built, and the badge
  correctly stays a non-focusable label. But it leaves an admin no way to
  promote or demote anyone — the only path from member to admin was remove and
  re-invite, which destroys that person's history and their joined date. That is
  a data-loss route wearing the costume of a missing feature, so the gap is in
  the spec rather than in the implementation.
- What was added: an admin-only `<select>` beside the badge. Promotion is
  immediate (it grants access and is reversible); demotion is confirmed (it
  takes access away). Demoting the LAST admin is impossible rather than
  discouraged — the option is absent, the reducer refuses it, and the row says
  to promote someone else first, because a workspace with no admin can never
  change its own billing, team or connections again.
- Noted as a spec gap, not a feature invented: `screens4.md` I7 should gain the
  role control when it is next revised.

### 2026-07-30 — M1 rebuilt as the cinematic scroll page; the layer is licensed in design.md Part 5

- Why: the basic landing sold the product; it did not tell the brand's story.
  The beacon — a signal sweeping order out of noise — is the one image this
  brand owns, and a scroll-driven hero where the VISITOR does the sweeping puts
  the product's promise (order by 07:00) in their hands. Part 5's "no other
  animation" rule required extending, not sidestepping: the new section
  licenses the layer, bounds it to M1, and holds it to the same reduced-motion
  law as the two signature animations.
- The app screens are untouched. Pricing still renders `usePlans()`; the four
  FAQ items are unchanged; every asserted marketing behaviour (front door,
  plan names, sign-in path, golden walk) still passes.
- Instead of: a tasteful static refresh (does not differentiate), or a
  three-D/WebGL build (heavier, and the brand's story is a film, not a model).

### 2026-07-30 — The hero scrub runs on canvas frames, never on video currentTime

- Why: seeking a video is keyframe-quantized and decode-latency-bound; it
  stutters exactly when attention is highest. 200 WebP frames (1600×900,
  ~8 MB with the rest of the media) drawn to a canvas scrub perfectly, load
  coarse-to-fine (stride 8/2/1, resting frame promoted) and ease toward the
  scroll target so fast flicks settle instead of strobing.
- Enforced structurally: `verify:w02` fails on `currentTime` anywhere under
  `features/marketing/` (comments stripped first — the law may be quoted).
- Instead of: `video.currentTime` scrubbing — simpler, and visibly janky.

### 2026-07-30 — lenis (new dependency) for the marketing scroll, guard-first

- Why: the scrub's feel is the page's product; native wheel steps read as
  jolts on a 420vh pin. Lenis is ~10 KB, runtime-network-free, and drives the
  REAL scroll position, so `position: sticky`, anchors and the e2e's
  scroll-driven asserts keep working.
- The guard is the point: under `prefers-reduced-motion` Lenis is never
  constructed (structurally checked), so reduced-motion scrolling is the
  browser's own everywhere in the product.
- Instead of: scroll-hijack libraries (own the scrollbar, break sticky and
  a11y), or nothing (the scrub reads stepped on Windows wheel deltas).

### 2026-07-30 — All M1 film is generated to ONE reference image; take C won the scrub

- Why: four clips must read as one world. A single hero still (charcoal void,
  grey noise, pink beacon low-left sweeping upper-right) was generated first
  and passed as the image reference to every Seedance 2.0 render (std, 1080p,
  16:9, 8s, no audio), so the world cannot drift between hero, macro, morning
  and dawn.
- Three takes of the assembly clip were rendered; **take C** shipped because
  its build is the most monotonic — outlines snap in near half-way, text lines
  stream in progressively, and the finished chips include an amber "flagged"
  state unprompted. A scrub needs legible forward progress more than it needs
  drama; take A's queue pops in fully formed, take B's cards are too small.
- The product footage is the REAL app: `/today` in the active world, recorded
  headlessly against the dev server, compressed alongside the film (H.264
  CRF 26–30, faststart, silent). The page labels film and product separately —
  the film earns attention, the recording earns trust.
- Pending: a 4K re-render of take C for final frame re-extraction once the
  takes are approved (open-items.md); the swap is drop-in, same filenames.

### 2026-07-30 — THE STATIC LAW IS AMENDED: network code is legal only in src/api/, only in live mode

- Why: the AlphaStudio API is deployed and the integration has begun. The law
  the repo was built under ("no network calls of any kind") is consciously
  changed, not eroded: network code is legal in exactly ONE directory
  (`src/api/`), behind exactly ONE switch (`VITE_API_BASE_URL` in `.env.local`,
  read by exactly one file, `src/api/config.ts`). Absent the switch the app is
  byte-for-byte the static build — datasets, `/dev/datasets`, and an e2e suite
  that still asserts zero requests. Static mode is not a fallback; it is the
  demo and the test bed, kept working forever.
- Enforcement moved with the law rather than dying: `ab/no-network` gained an
  `allowNetworkGlobals` option scoped to `src/api/**`; `guard-static` exempts
  only the `fetch` rule and only under `src/api/`; the e2e network assert
  allows exactly one extra origin, and only when the env var is set for the
  run. `http(s)://` literals remain banned EVERYWHERE in `src/` — the base URL
  is environment-supplied, never source-supplied.
- This supersedes the absolute wording of the 2026-07-23 "fully static" entry
  (its spirit — provider hooks as the seam — is precisely what made this swap
  cheap), and consciously revives the 2026-07-19 "mode known in two files"
  intent in a new form: mode is known in ONE file now.
- Instead of: a parallel "api branch" of the app (two products to maintain), or
  killing guard-static (the first accidental fetch in a feature would sail in).

### 2026-07-30 — One API client; 401 is the whole auth strategy; 429 surfaces, never auto-retries

- Why: docs/api/api.md is the single source of truth and its conventions are
  mechanical enough to centralize once: bare-JSON successes, one error
  envelope switched on `code` (never message), decimal-string ids, `{items,
  total}` pagination, `x-request-id` on everything. `src/api/client.ts` owns
  all of it so no call site re-implements any of it.
- 401: tokens are opaque and there is no refresh endpoint, so a token-carrying
  401 means the session is dead — purge, toast, land on login. A 401 on an
  anonymous call (a failed login) is a wrong password, NOT a dead session; the
  client distinguishes by whether it attached a Bearer, and fires the
  unauthorized hook once per breach, not once per parallel request.
- 429: the client parses `Retry-After` into `retryAfterSeconds` and does NOT
  auto-retry. Every rate limit in this API guards a human-triggered send
  (codes, invites); a silent retry would burn the very budget the user is
  waiting on. Surfacing the wait (countdown on the button) is the honest UI.
- Instead of: a data-fetching library (caching semantics the provider already
  owns; the seam is the provider, not the fetcher), or per-feature fetch
  wrappers (the drift the one-client rule exists to prevent).

### 2026-08-08 — AlphaBeacon → Malaky: the rebrand, in one branch (`rb/00-malaky`)

- Why: full identity change by the founder — name, Arabic calligraphic
  wordmark (ملاكي), palette, typography, motion language, and the marketing
  concept. Source of truth is the **Malaky Brand Starter Guide v1.0**
  (`Docs/brand/Malaky_Brand_Standards_v1.pages`; the kit arrived as an Apple
  Pages bundle, not the PDF the brief named — the document text was recovered
  from `Index/Document.iwa` with a hand-written snappy decoder and archived
  under `Docs/brand/reference/`). The old Alpha MENA kit is deleted.
- The palette split discipline carries over with new colors: Champagne Gold
  `#C7A76A` reads 1.9:1 on ivory, so the gold is split BY ROLE exactly the way
  the pink was — light `--primary` is Deep Charcoal (the kit assigns it
  buttons), light `--brand` is gold deepened to `#9A7B4F` (display-only,
  3.60:1), and dark `--primary`/`--brand` are the true gold (7.34:1 on
  charcoal — the premium moment lives on dark). All 49 contrast assertions in
  `tokens.test.ts` pass against the new palette unchanged.
- Scope guards: static datasets and the DataProvider architecture untouched;
  `package.json` name, internal `ab-` identifiers, storage keys, and the repo
  name stay this phase — only user-facing surfaces changed.
- Instead of: softening the gold until it reads as text (dilutes the accent
  everywhere), or keeping pink for interactive states (the rebrand retires it
  outright, including the signal gradient — no bright gradients, per kit).

### 2026-08-08 — Typography: Inter, PROPOSED, pending founder confirmation

- Why: the kit names **no typeface**. Something must render; Inter (variable,
  single family display-to-caption) is the proposal — neutral, excellent
  Latin + Arabic-adjacent numerics, `tabular-nums` support for `MonoNumber`'s
  contract, and the "Apple designed software" personality the kit asks for.
  Barlow and Geist Mono are retired with the old identity; `--font-mono` maps
  to Inter so the mono-figures idiom survives any future swap.
- **This is a proposal, not founder-approved brand law** — if the founder
  names a face, swapping is one `@font-face` block + three token lines.
- Vendored as local WOFF2 (`src/styles/fonts/`) with hand-written
  `@font-face`: the npm registry was unreachable the day of the rebrand
  (`@fontsource-variable/inter` timed out; files fetched from jsdelivr).
  Swap to the @fontsource package when the registry returns.

### 2026-08-08 — The cinematic M1 is retired; the kit's §4 flow replaces it

- Why: the kit prescribes the marketing page's shape (Hero, Today's
  Workspace, How Malaky Works, Memory, One Brand Every Channel, Human
  Approval, Built for the Middle East, Call to Action, Footer) and a motion
  law — gentle fades and subtle hovers ONLY — that the ink-void scrub
  concept cannot satisfy. The 2026-07-30 cinematic build (canvas scrub, HUD
  clock, Lenis, marquee, ambient film) is deleted along with its 8.4 MB of
  `public/marketing/` assets and the `lenis` dependency; git history
  preserves all of it. The pending clip-take approval (open-items) is void.
- The new page's motion budget is one IntersectionObserver-flipped
  fade-and-rise per section, with the animated state living only inside a
  `prefers-reduced-motion: no-preference` query — reduced motion renders
  every section finished. `verify:w02`'s structural laws were rewritten to
  ban the retired primitives (video, canvas, scroll libraries, rAF loops).
- Real product content per kit §5: tones + rules via `useTones()`, channels
  via `useConnections()`, pricing via `usePlans()`; the workspace preview
  quotes Atlas Roasters and says so. Page weight fell from ~8.7 MB of media
  to ~150 KB of wordmark PNGs.
- Instead of: adapting the cinematic page to the new palette (the concept
  itself — scrubbing, pinning, film — is what the motion law forbids), or
  a from-scratch art direction (the kit already names the sections).

### 2026-08-08 — Motion law AMENDED: a second tier, "cinematic-calm", scoped to M1 only

- Why: the founder brief for `rb/01-motion` adds an Apple-product-page
  cinematic layer to M1 — the Malaky interface as a floating glass object
  assembling on scroll — which the strict gentle-fades law cannot license.
  Rather than eroding the law case by case, it gains one explicit tier:
  scroll-scrubbed footage and pinned sections are legal ON M1 ONLY, when the
  footage itself obeys the brand (warm ivory spaces, soft daylight, champagne
  gold as the only glow, charcoal UI, one slow drifting camera). The app
  keeps the strict calm law; design.md Part 5 carries the full text,
  including the forbidden list (dark voids, particles, kinetic type slams,
  film grain, neon, AI clichés) that separates this from the retired 2026-07
  ink concept.
- `prefers-reduced-motion` renders the current static M1 unchanged — the §4
  base page is the enhancement base AND the complete fallback, so the
  cinematic layer can never become load-bearing.
- **M1 becomes light-canonical with the layer:** the footage is graded for
  ivory, so the marketing route will ignore the app theme when the layer
  lands. This consciously supersedes the 2026-08-08 "every route honors the
  theme" note for M1 alone; the app stays light+dark.
- This tier, the product-as-3D-object direction, the Inter proposal, and the
  gold split-by-role are bundled into ONE founder-confirmation open item
  (open-items 15) so sign-off happens once, on the whole picture.
- Instead of: quietly widening the calm law (the next exception would cite
  this one), or building the layer as a law violation to fix later.

### 2026-08-08 — rb/01-motion BLOCKED at generation: the pipeline's tools are absent this session

- The brief's generation pipeline (`fable5-higgsfield` skill, archetype 8 +
  the Higgsfield MCP connector for Seedance) is unavailable: the skill files
  exist nowhere on this machine (user skills, repo skills, plugins all
  checked), and the `claude_ai_Higgsfield` MCP server that generated the
  2026-07 cinematic footage is not connected in this session (its tools are
  absent from the registry; ToolSearch finds nothing). Both are
  user-provided resources; neither can be substituted without changing what
  the founder asked for — no footage was improvised from other tools, and
  **no credits were spent**.
- What DID land on `rb/01-motion`: the motion-law amendment (above),
  design.md Part 5 two-tier rewrite, open-items 15 (founder bundle), and
  the two UI reference screenshots for Seedance (real Malaky theme, Atlas
  Roasters content — session scratchpad `m1-refs/`). Engineering and the
  verify-law rewrite deliberately wait for the footage: a scrub with no
  frames cannot pass its own check.
- Resume path when the user reconnects the tooling: hero image first (the
  consistency trick), then clips 1–3 with the hero + UI screenshots as
  references to every generation, takes recorded in `m1-takes/`, then the
  engineering layer per the brief.

### 2026-08-09 — generation gate re-checked: skill found, connector still absent

- Supersedes half of the 2026-08-08 blocker: the `fable5-higgsfield` skill
  NOW exists on this machine, at
  `~/.claude/skills/fable5-higgsfield-skill/fable5-higgsfield/` (SKILL.md +
  references/site-archetypes.md, both read). Note the extra nesting level —
  the harness skill registry does not list it, so it is readable but not
  invocable as a skill; moving `fable5-higgsfield/` up one level into
  `~/.claude/skills/` would register it.
- The other half stands: the claude.ai Higgsfield connector is still not in
  this session's tool registry — three ToolSearch sweeps (by name, by
  Seedance/model keywords, by generation keywords) surfaced zero
  `mcp__claude_ai_Higgsfield__*` tools. The direct `higgsfield` HTTP server
  was removed deliberately (Higgsfield's OAuth whitelists only claude.ai's
  redirect URI, so Claude Code cannot complete its flow); it still appears
  as an unauthenticatable stub. Per the skill and the standing instruction,
  the Seedance model id must come from `models_explore` — never guessed —
  so no generation was attempted and **no credits were spent**.
- The two Seedance UI references survive: original in the 2026-08-08 session
  scratchpad `m1-refs/` (`ref-dashboard-light.png`,
  `ref-today-queue-light.png`), now also copied into the 2026-08-09 session
  scratchpad `m1-refs/` as a hedge against temp cleanup.
- Resume path unchanged, with one sharpened precondition: the connector must
  actually surface as `mcp__claude_ai_Higgsfield__*` tools in the session
  registry (verify with a tool sweep before anything else), then
  `models_explore` → balance check → hero image with BOTH refs → clips 1–3
  → engineering → verify → merge.

### 2026-08-09 — The M1 film is generated; take B won the scrub

- Why each choice, in order. The connector surfaced this session (85 tools),
  so the gate cleared. `models_explore` confirmed ids rather than guessing:
  **seedance_2_0** (std/1080p/16:9/8s/silent — the recorded defaults) for
  film and **nano_banana_pro** (2K, text-rendering strength — the refs are
  UI screenshots whose text must survive) for the hero still. The hero image
  was generated FIRST with both UI refs and passed to every clip, so the
  glass object cannot drift between shots — consistency beats quality.
- Three takes of the assembly clip only; singles elsewhere. **Take B**
  shipped: its build spreads monotonically across the full 8 s, so every
  scroll position maps to visible progress. Take A completes by half-way and
  scrubs dead for the back half; take C floats glass droplets mid-assembly
  that read as particles, which the tier forbids. Clips 2 (detail macro) and
  3 (calm pull-back) were first-take accepts.
- Spend: 2 (hero) + 5 × 72 = **362 credits**, preflighted with `get_cost`
  before submission. Jobs: hero `394ba3f4`, takes `61e0a521`/`924ceaf3`
  (shipped)/`2a253d80`, detail `afd189ed`, calm `2cab6a96`.
- Web payload: 193 WebP frames 1536×864 (4.8 MB) + two H.264 CRF-28 clips
  (~0.7 MB each) = 6.3 MB, ~90 % below the raw renders. Paths live only in
  `film/media.ts`, and `verify:w02` asserts the declared frame count against
  the files on disk.
- Instead of: Seedance 2.5 (720p ceiling — below the recorded 1080p bar), or
  accepting take C for its gold underglow (prettier single frames, but a
  scrub is judged by its progress curve, not its stills).

### 2026-08-09 — The scrub eases frames, not scroll: no Lenis this time

- Why: the 2026-07 build smoothed wheel steps with Lenis AND a rAF lerp on
  the frame index. The lerp alone absorbs wheel quantization for the canvas
  (the only scroll-linked motion on the page — the pinned copy fades on band
  crossings, which native scroll cannot jolt), and native scroll keeps
  sticky, anchors, keyboard paging and assistive tech untouched — the same
  properties the old decision valued Lenis for preserving. One less
  dependency, and the reduced-motion story simplifies to "the layer never
  mounts".
- Instead of: reintroducing `lenis` (a new dependency needing its own guard
  so reduced motion never constructs it — real cost, and its benefit here
  was already covered by the easing), or scroll-hijack libraries (own the
  scrollbar, break sticky and a11y — rejected in 2026-07 too).
- `verify:w02` bans Lenis and animation libraries across marketing, permits
  canvas/rAF/scroll-listeners only under `film/`, and requires the
  `use-cinematic` gate to affirm `no-preference` positively — absence of a
  match (jsdom, old browsers) renders the static page, never the layer.

### 2026-08-10 — D1: the hero film is retired; a DOM/CSS 3D card system replaces it (rb/02)

- Why: Abdullah's V1 brief (`Docs/brief/malaky-website-v1-brief-abdullah.md`)
  changes the hero SUBJECT — the marketing Malaky produces, not the product
  interface — and requires things baked video cannot deliver: a working
  Approve · Edit · Decline moment, legible real text including native RTL
  Arabic inside the cards, animated workflow-status transitions, the same
  story as a mobile swipe/stack, and aggressive Core Web Vitals. Film v1
  (frame sequences, `film/` components, media manifest) leaves the app and
  `public/`; the masters stay in the local `m1-takes/` scratchpad and the
  Higgsfield library. **This closes the 6.3 MB payload flag** — the film
  payload leaves with the film.
- Deferred option, recorded: `rb/03-ambient` may regenerate a Seedance
  ambient layer with the NEW subject (floating output cards) once the card
  designs exist to serve as generation references.
- Instead of: adapting the rb/01 film to the new story (the subject itself
  is what changed — no regrade fixes that), or generating new footage now
  (the brief's interactivity requirements rule out baked video regardless).

### 2026-08-10 — D2: one CTA pair sitewide (rb/02)

- Why: brief §14 — one conversion goal. Primary is exactly "Start free";
  secondary is exactly "See how it works →" (anchors to How Malaky works).
  Every other variant (Book demo / Request demo / Join waitlist / Try
  Malaky / Get started) is purged and `verify:w02` greps them banned.
- Instead of: mixing launch models across sections — §14 names this
  explicitly as the failure.

### 2026-08-10 — D3: Pricing leaves V1 navigation and flow (DEFAULT; founder may flip) (rb/02)

- Why: brief §15 + §28 — pricing is not finalized, billing is not in the
  API, and the current static plans carry the model/credit terminology §28
  bans. Publishing placeholder pricing is worse than omitting it. The route
  code stays unlinked rather than deleted, and the seam is one small commit
  from the §28 alternative (outcome-led Starter / Growth / Business, no
  model names, no credits, no "all channels") if the founder finalizes
  tiers.
- Consciously retired with it: the rb-era verify law "pricing keeps
  `usePlans()` on M1" — the marketing page no longer renders plans at all.
  H1 (Billing) still reads `usePlans()` in the app, untouched.
- Instead of: shipping the current Free/Pro/Studio cards (credit-led, model
  names — both banned), or deleting the pricing code (the flip should be
  cheap).

### 2026-08-10 — D4: marketing payload budget re-set to ≤ 3.0 MB (rb/02)

- Why: the film's 6.3 MB budget dies with the film (D1). The card system is
  DOM/CSS; mock-post artwork lazy-loads per scene, prefers SVG/CSS
  composition, and rasters only as WebP/AVIF where needed. The close-out
  report states the measured number.
- Instead of: inheriting the old budget — it existed to carry footage the
  route no longer ships.

### 2026-08-10 — D5: customer-content palette exemption (rb/02)

- Why: the story is "Malaky learns each customer's identity" (brief §3,
  §10) — demo-brand artwork INSIDE mock posts uses that demo brand's own
  palette. Malaky chrome stays strictly under the palette law (Warm Ivory /
  Deep Charcoal / Limestone; gold as the only Malaky accent). Written into
  design.md Part 5 so guard checks don't misfire on card interiors.
- Instead of: forcing demo content into Malaky's palette — it would erase
  the exact point the hero makes.
- Mechanism: one file-level `eslint-disable ab/no-raw-color` in
  `outputs/demo-brands.ts` (the palettes' single home), and `verify:w02`
  fails any other marketing file that borrows the disable — the exemption
  cannot creep.

### 2026-08-10 — D6: platform marks are text labels, never imported logo assets (rb/02)

- Why: channels are identified with subtle text labels (plus glyphs already
  in the repo's icon set where suitable); third-party brand-logo assets
  carry trademark and freshness burdens a V1 demo doesn't need. Roadmap
  channels are labeled per §22/§34 and the claims map.
- Instead of: importing platform logo packs — trademark exposure for no
  storytelling gain.

### 2026-08-10 — D7: where the brief disagrees with itself, the addendum wins (rb/02)

- Why: §19–§35 is the later, fuller direction. Concretely: How Malaky works
  is the 5-step visual workflow of §20 (not §6's six rows); the page flow is
  §33's 17 items (not §17's 13); section headlines are "Built here. Written
  for here." (§24), "Marketing without made-up facts." (§27), "Your company
  has a voice. So do the people behind it." (§25/§33); the FAQ title is
  "Frequently asked questions" (§29).
- Instead of: implementing both halves literally — they conflict, and
  silent averaging is how a page stops matching any brief.

### 2026-08-10 — D8: motion law v2 — cinematic-calm becomes scroll-choreographed card transforms (rb/02)

- Why: the brief keeps scroll-linked 3D but changes the medium. The M1
  cinematic tier is REDEFINED from scrubbed footage to scroll-choreographed
  3D card transforms: slow, premium, scroll-led; cards may float slightly,
  separate, change depth, rotate subtly, come forward when relevant, and
  reorganize (§13). Forbidden, now doubly confirmed by the brief: bouncing,
  fast spinning, particles, exploding cards, excessive parallax — plus the
  house bans (dark voids, neon, grain, kinetic type, AI clichés). §12
  surface law folds in: 18–24 px radius, thin warm-gray borders, subtle
  shadows, no pervasive glassmorphism, no heavy gradients or giant drop
  shadows. Strict calm still governs everything outside M1; reduced motion
  renders the static tier-1 page (the engine never mounts). The no-Lenis
  and no-`currentTime` laws stand; the film-specific laws (canvas/video
  licensing, frame-count-vs-disk) retire with the film, and the film ban
  becomes an assertion: no canvas, no video on the marketing route.
- Instead of: keeping the footage tier alongside the card tier — two motion
  systems on one route is exactly the drift Part 5 exists to prevent.

### 2026-08-10 — The verify:w02 gate amendment, in full (rb/02)

- Why: the operating order requires every gate change logged. Kept: lint,
  typecheck, unit, guard-static, build, posts-per-day cap, deliverables,
  wordmark law, light-canonical, reveal/stage CSS under no-preference.
  **Added:** film ban as assertion (no canvas/video/`/film/` on the route);
  rAF + scroll listeners legal only in `outputs/`; engine style writes
  allow-listed to transform/opacity/zIndex; the no-preference gate affirmed
  in `use-media.ts` and consumed in `scroll-story.tsx` behind gate AND
  width; `dir="rtl"`+`lang="ar"` structural on the Arabic card; the D5
  raw-color exemption scoped to demo-brands.ts; copy laws (no co-pilot, no
  model names/"drafting model"/credit terminology, one CTA pair, FAQ title).
  **Retired:** frame-count-vs-disk and film `<video>` attribute checks (die
  with the film, D1); "pricing keeps usePlans()" (D3 — the no-local-plan-
  data half survives); kit §5 real-product-content laws (useTones/ToneBadge/
  useConnections on M1) — superseded by the brief's §31 demo-brand
  consistency, which the demo-brands module + verify enforce instead.
  **e2e:** front door asserts the §2 hero and pricing's absence;
  reduced-motion rewritten to "engine never mounts, static layout complete";
  new RTL and S5-approval tests; live-spec h1 assertions updated.
- Instead of: silently deleting failing checks — the amendment IS the
  record of what protection moved where.
- One conscious deviation from the operating order's §2c: `content-visibility`
  per scene was evaluated and REJECTED — it skips layout of off-screen
  contents, which breaks the visibility semantics the e2e suite asserts on
  below-fold sections, and the route it would optimize transfers ~0.6 MB
  with zero raster demo artwork. The CWV work it targeted is carried by
  transform/opacity-only animation (compositor-composited) and the D4
  payload result instead.

### 2026-08-11 — Ambient idle drift: CSS keyframes on a nested wrapper, not more rAF

- Why: the founder narrowed the sprint to ONE change — the hero cards must
  keep moving when scrolling stops (float, drift, tiny rotation, depth
  breathing; 8–16 s cycles, 2–8 px, ≤ 0.8°, per-card duration/phase so
  nothing moves in step). The scroll engine already owns `transform` on
  each card slot, so the drift animates a NESTED inner wrapper — scroll
  wrapper → ambient wrapper → card — and the two systems write different
  elements, which is what makes them compose instead of cancel. The
  per-card profiles live in `outputs/motion-tokens.ts`; the one keyframe
  track (`mk-ambient-drift`, parameterized by custom properties) lives in
  the same no-preference query as every other marketing animation, so
  reduced motion removes the drift rather than slowing it. Hover pauses a
  card's drift (`animation-play-state`), and the engine sets the same
  pause on the company card during the S5 approval moment. The static
  swipe strip drifts at half amplitude.
- Instead of: folding idle motion into the engine's rAF loop (would keep a
  rAF alive forever for motion CSS animates for free on the compositor,
  and would mix two motion sources into one transform string), or a
  library (banned by the gate).
- Also recorded, honestly: before the founder's mid-session scope
  narrowing arrived, this session generated five Higgsfield campaign
  stills (nano banana, 10 credits, balance 1427.5 → 1417.5) intended for
  the cards. The narrowed brief forbids new assets — the stills were never
  committed and remain unused in the Higgsfield library; no repo bytes
  changed. Generation for this route stays paused until the founder asks.

### 2026-08-11 — Card realism: platform anatomy yes, logos and counts still no

- Why: the founder asked each hero card to read as its channel's REAL post
  format at a glance. The §5 fake-engagement ban and D6 logo ban both
  stand — the line drawn: platform identity comes from LAYOUT (Instagram's
  header/artwork/actions/caption stack, LinkedIn's person-vs-company
  headers and Like·Comment·Repost·Send row, an email's From/Subject
  chrome, X's handle-and-glyph anatomy) with generic lucide glyphs and NO
  numbers — action rows are aria-hidden icon affordances, never counts,
  followers, or third-party logo assets. The Malaky wrapper (radius,
  border, soft shadow, tiny channel label, workflow chip) stays OUTSIDE
  the platform anatomy — Malaky previews the channel, it does not clone
  it. demo-brands gains `sectorAr` so the Arabic card's category line is
  native per brand (open-items 16 review covers the new strings).
- Instead of: real platform logos/screenshots (trademark + D6), fake
  like counts (§5), or leaving the generic label-only cards the founder
  rejected.

### 2026-08-11 — Full-fidelity posts: demo engagement numbers, platform hues, fictional logo marks

- Why: the founder explicitly directed realistic engagement data ("These
  numbers are DEMO DATA"), platform interface colors, and believable
  fictional brand logos — overriding the V1 brief's §5 no-engagement rule
  for the mock posts. The line now: engagement numbers are INVENTED data
  on INVENTED brands inside clearly-illustrative previews (aria-hidden
  interiors); Malaky chrome still never shows a fabricated metric. D6
  still stands — no third-party logo assets; platform identity is layout
  plus generic glyphs plus interface hues (PLATFORM in demo-brands.ts,
  the module holding the one raw-color exemption, so the color law's
  scope is unchanged). The four customer logos are hand-drawn inline SVG
  marks (brand-logos.tsx) filled from each brand's own palette — no new
  assets, no new colors. Three layers stay distinct: Malaky owns the
  wrapper, the platform owns the interior interface, the customer owns
  the content.
- Instead of: leaving label-only cards the founder rejected twice, real
  platform logos/screenshots (trademark + D6), or scattering raw hexes
  outside the exempt module.

### 2026-08-11 — Production pass: code-split, early-access CTA, legal pages

- Why: founder-directed production-readiness sprint. (1) The route table
  now lazy-loads every screen except the marketing front door — visitor
  '/' JS fell 1,314→612 kB raw (391→189 kB gzip; recharts/analytics is
  its own 360 kB chunk), measured before/after; Suspense fallback is a
  quiet aria-busy spinner. (2) The D2 CTA pair is AMENDED: self-service
  publishing is not live, so per the founder's rule the acquisition CTA
  is "Request early access" everywhere public, "Start free" joins the
  banned list (launch models must never mix), and the unlinked
  pricing-section seam is exempted so the flip back stays one edit.
  verify-w02 + the golden-walk e2e encode the new pair. (3) /privacy and
  /terms are real routed documents linked from the footer and the signup
  consent line (FormField.description widened to ReactNode for the
  links); both flagged for counsel in open-items 17. (4) index.html
  carries production metadata (canonical, OG, Twitter) on malaky.ai
  URLs, with robots.txt + sitemap.xml; the OG card is the supplied
  wordmark composed onto brand ivory — no generated imagery. (5) The
  hero's pinned story shrank 620→420 vh and the orbit loop reads the
  viewport only on resize, never per frame.
- Instead of: shipping the whole app to every visitor, leaving dead
  legal anchors and an aspirational "Start free", or hand-waving the
  claims (the audit against the shipped product is in
  Docs/brief/claims-map.md).

### 2026-08-11 — Phase 2: request-access flow, event seam, one legal video slot

- Why: founder's Phase 2 brief (category-defining polish, no redesign;
  everything from 90fb8b2 preserved). (1) `/request-access` is now the
  acquisition front door — real fields (name, work email, company,
  country, website, role, optional "handle first") through the one form
  layer, confirmation reads "You're on the list." The submission goes
  NOWHERE over the network by law: it buffers through the same seam as
  marketing events (`analytics.ts` → `window.dataLayer` + localStorage),
  and open-items 18 gates launch on wiring a real destination. The
  golden e2e walk reaches the app's signup via Sign in → "Create an
  account" instead. (2) `analytics.ts` is the privacy-conscious event
  seam (§23): named funnel events, flat payloads, no identifiers, no
  vendor — `track()` buffers on `window.__malakyEvents` and pushes to
  `dataLayer` when a tag manager exists, so an approved vendor plugs in
  without touching call sites. (3) The D1 film ban is AMENDED with one
  scoped exemption: `content-asset.tsx` is the single legal `<video>`
  seam on the marketing route (§26 asset architecture — css | image |
  carousel | video), constraints machine-checked (poster-first,
  `preload="none"`, muted, cinematic-layer gated, in-view src). No video
  ships until the Higgsfield manifest (Docs/brief/asset-manifest-
  phase2.md) is approved; the reduced-motion e2e still asserts zero
  `<video>` elements render. (4) Calendar shows business-specific dates
  (diamond marker, "your date") with Falak's launch campaign already
  prepared; the facts panel is interactive (claim → highlighted source).
- Instead of: a request form that silently posts to an unapproved
  vendor (network law), letting `<video>` in anywhere (the scrubbed-film
  ban stands), or leaving the D1 gate contradicting the approved §26
  architecture until the Reel lands.

### 2026-08-11 — Campaign photography enters through the asset slot

- Why: the founder supplied platform mockups approving real campaign
  photography for the demo brands. Four stills now sit in
  `public/campaigns/` (85 kB total, WebP, 560–720 px) and render through
  the §26 `ContentAsset` slot: Falak's night-highway fleet, Nura's sunlit
  linen-and-clay interior, Zaytoun's overhead iftar table. `photoFor
  (brand)` in `campaign-photos.ts` maps brand → still, so every card
  picks the right photograph from the brand it was handed and no call
  site has to know. THE SPLIT IS THE POINT: photography carries the mood
  as a background layer, and every headline, Arabic line, route lockup
  and CTA stays live HTML on top of a palette scrim — crisp at any size,
  translatable, editable without regenerating an asset, and RTL-correct.
  Meezan stays deliberately photograph-free (advisory work has no product
  shot; the executive post is stronger text-first). D6 still holds: the
  stills contain no third-party logos, no real brands, no recognisable
  people, and platform identity is still layout plus generic glyphs.
- REJECTED from the same upload: the SpaceX/X post (a real company's real
  post with a real person's account — shipping it would claim Malaky
  produced SpaceX's marketing) and the Baker Tilly Saudi LinkedIn post
  (a real firm; the founder states written permission exists, so it is
  parked in open-items 19 pending the document rather than declined).
  A generated rocket still was produced for the X reference and dropped:
  no demo brand is aerospace, and inventing a fifth brand would break the
  frozen four-brand set.
- Instead of: shipping real brands' posts as Malaky's demo work, or
  baking headline type into the images (which would lose crispness,
  translation and RTL shaping).

### 2026-08-12 — Posts render on the PLATFORM's surface, not Malaky's

- Why: founder review — the cards "still feel like generic SaaS mockups".
  The cause was structural, not decorative: every post rendered on
  Malaky's warm ivory `bg-card`, inherited Malaky's foreground colors and
  radius, so six different networks read as six Malaky panels. Fix:
  `platform-chrome.tsx` + `PLATFORM_UI` give each network its own
  surface/ink/muted/border/accent, published as `--pf-*` custom
  properties by `PlatformFrame`; every header, reaction cluster, action
  row and counts row reads color from the PLATFORM. X is now black,
  Instagram/LinkedIn/Facebook white on their own grays, the newsletter
  gets mail-client chrome. Malaky's channel label + workflow badge stay
  strictly OUTSIDE the frame (the founder's three-layer rule: platform UI
  / customer brand / Malaky workflow). Executive posts get a drawn
  portrait avatar (`PersonAvatar`) instead of initials, so a personal
  account no longer reads as a second company page. Engagement is a
  structured `engagement` prop per card, and brands carry `brandVoice`,
  so a card can later be driven entirely by data.
- Instead of: restyling each card one-off again (the previous two passes
  did that and the founder rejected both), or importing real platform
  logos — D6 still bans third-party logo assets, and reproducing
  Instagram/LinkedIn/Facebook/X marks is a trademark call for counsel,
  not a design call. Recognition here comes from surface, chrome, layout
  and type, which is most of the signal; open-items 20 carries the logo
  question if the founder wants the marks added under brand guidelines.
- Naming: the `*Card` exports stay (≈37 call sites + e2e); the founder's
  requested `InstagramPost` / `LinkedInCompanyPost` / … names are
  exported as aliases of the same components, so new code reads the way
  the brief asks without a rename churn through the route.

### 2026-08-17 — D-INT-A: the proxy law, and its ONE presigned-PUT exemption

- Why: Ward's instruction of 2026-08-17 — "do not connect to the APIs in
  [the AlphaProStudio environment / collection] directly; only from the main
  API and its grouped `/alphastudio/`." So every generation call is
  `…/orgs/:orgId/alphastudio/*` on our own API with the normal Bearer session.
  The frontend never addresses the upstream service, never signs anything: no
  HMAC, no `x-aps-*` headers, no service key, no edge secret.
- The one exception, and it is unavoidable: our API mints a presigned `PUT` and
  the bytes go straight to object storage, because the platform deliberately
  never proxies bytes. That request lives in `src/api/upload.ts`
  (`uploadToPresignedUrl`) and is kept as narrow as an exception can be — the
  url is never composed locally, no `Authorization` is attached (the signature
  IS the authorization, and sending our session token to a third-party origin
  would leak it), and the `Content-Type` is exactly the one the presign was
  issued for, because it is part of the S3 signature.
- Enforcement, so this is law rather than intention: `guard-static` now runs a
  second rule set over `src/` banning `cloudfront.net`, `x-aps-`, the upstream
  `v1` route prefix, `svc[_-]?key` and `edge[_-]?secret` in CODE, and narrows
  the `fetch` licence from "anywhere in `src/api/`" to exactly two files —
  `client.ts` and `upload.ts`. A third network caller now fails the build.
- The proxy rules read CODE ONLY, comments stripped by `codeOf()`. Deliberate:
  the upstream routes and headers are things this repo's docs SHOULD name, and
  a check that matched prose would fire on the very comments explaining the
  proxy and then get deleted (state.md's "a structural check must not match
  prose"). The first implementation was a full string-aware lexer and it was
  the wrong tool — one apostrophe in JSX prose opened a string it never closed
  and blanked the rest of the file, i.e. a guard that silently stops guarding.
  The line-scoped scanner has two documented blind spots that can only LOSE a
  match, never invent one, and law 1 already covers both.
- The AlphaProStudio Postman **environment** is gitignored by name and by
  pattern (`*.environment.json`): it carries a live HMAC service key. The
  **collection** is committed — it is schemas, and it is the authority for the
  bodies our proxy forwards verbatim.
- Instead of: calling the service directly with a key shipped to the browser
  (the reason the proxy exists), or leaving the proxy law as prose in this file
  (the next agent would have had only good intentions to go on).

### 2026-08-17 — D-INT-H: proxy types are transcribed from observed JSON, never from prose

- Why: `/alphastudio/*` returns the upstream's shape unchanged and the contract
  says new fields "may appear without notice". api.md's examples are
  illustrative, and the OpenAPI document declares the proxy responses loosely
  on purpose (`{ runId, status, capability?, mode?, outputs?: any[] }`). Types
  written from either would have been guesses.
- So `scripts/smoke-alphastudio.ts` (`pnpm smoke:alphastudio`) drives one fresh
  QA org through every proxy surface against the deployed API and writes every
  response body verbatim to `Docs/api/alphastudio-shapes.md`. THAT file is what
  `src/api/types.ts`'s proxy half is transcribed from; anything the run did not
  prove is optional, and unknown fields are tolerated rather than stripped.
- It paid for itself immediately. Four things the docs had wrong or silent:
  1. **`slot` is REQUIRED** on `posts/generate` (a body without it → `400`).
  2. **`embeddingModel` is REQUIRED** on `rag/collections`, though api.md marks
     it optional (without it → `400`; `embed-default` is the alias this app
     holds).
  3. **`toneId` and `rationale` live INSIDE `outputs[].content`**, not beside
     it — a type with them at the output level would have read `undefined`
     forever, and rendered a draft with no tone and no rationale.
  4. **Catalog model rows carry far more than documented**: `displayHint` (a
     ready-made vendor-free label), `cost` (a decimal-string price — so E1 CAN
     show one, and the render below proved it exact), `capabilitySchema` (a real
     JSON Schema for that model's `params`, which is exactly what W5's generated
     params form consumes), `capabilities`, and `appMetadata.min_plan`.
  5. **A media job's lifecycle is `queued → submitted → succeeded`**, not a
     run's `queued → running → completed`. A shared status type or poll
     predicate across the two would have hung on the first render.
  6. **A job response echoes `modelAlias`** (which catalog row served it) even
     though a job REQUEST is refused by name for carrying that field. Read-only
     in, banned out.
- Instead of: transcribing api.md's examples (three of the four above would
  have shipped as bugs), or writing everything as `unknown` and probing at
  every call site (the drift the one-client rule exists to prevent).

### 2026-08-17 — D-INT-D: the plan vocabulary is not the schedule's alias vocabulary

- Why: two different surfaces name models two different ways and it would be
  easy — and wrong — to collapse them. On-demand runs and media jobs take
  `plan ∈ balanced | creative | precise`, which maps DIRECTLY onto the app's
  `gm_balanced | gm_creative | gm_precise` with nothing eliminated. A schedule
  takes `modelAlias ∈ fast | balanced | quality`, whose pairing is still
  unconfirmed (open-items 9) and where INT-4 had to give Creative the leftover
  `fast`.
- So `ApiPlan` is its own type and `MODEL_ALIAS_BY_ID` is untouched. The two
  vocabularies never map onto each other, even though both contain the word
  "balanced".
- Instead of: one shared table (it would have propagated INT-4's unconfirmed
  guess into a surface that has no need of it).

### 2026-08-17 — D-INT-E: live mode shows money, not credits

- Why: the wallet is cents (`{ cents, heldCents, availableCents }`), the
  catalog's prices and `costUsdEstimate` are USD decimal STRINGS, and the
  refusal is `402 wallet_insufficient`. Nothing on the wire is a credit.
  Inventing an exchange rate would put a made-up number in front of a user
  about their own money.
- So live mode shows currency: `availableCents` (the number the next request is
  actually checked against — not `cents`), plus "reserved" when
  `heldCents > 0`. The static demo keeps its credits ledger, unchanged.
- `costUsdEstimate` and the catalog `cost` are rendered as trimmed decimal
  strings and never `parseFloat`ed — a float there is a rounding error in
  someone's billing.
- There is **no funding endpoint** on this API (orgs are funded once, 5000
  cents, server-side at creation). So the 402 state says so honestly and
  preserves the user's input rather than offering a top-up that does not exist.
- Instead of: a synthetic credit rate (dishonest), or hiding the balance
  entirely (the 402 would then be unexplainable).

### 2026-08-17 — D-INT-B/C/F/G: the four interpretations INT-7…10 are built on

Recorded here as the founder set them; each is implemented in its own phase.

- **D-INT-B — brand voice is ONE canonical voice row.** Live mode holds the
  org's brand voice on a single row named `Brand voice` (created lazily on
  first write, description a plain sentence), and its `rules` are the app's
  do/don't. READS flatten every voice's rules in creation order — exactly how
  the backend builds the context bundle, so what the user sees is what
  generation gets. INT-3-era rows exist only on QA orgs, so there is no
  migration code. `examples` still has no wire home: its editor stays disabled
  with the honest note.
- **D-INT-C — tone rules go live; `example` does not.** `rules[]` ↔
  `{do[], dont[]}`; save is `PATCH { rules }`, whole-list replace, which is
  exactly the editor's save semantics (the single-rule endpoints exist but the
  UI has no use for them). `example` has no wire home, so the "fields pending"
  note narrows to name only that.
- **D-INT-F — country is the single holiday control. CONFIRMED BY THE BACKEND
  2026-08-17** (Ward: event-sources and slots ARE superseded; the backend feeds
  holidays into scheduling automatically). So the INT-8 reading is stronger
  than the original decision: live mode does not merely stop ASKING for event
  sources, it does not CALL them — `fetchScheduling` reads the schedule and the
  holiday calendar and nothing else, because two round trips whose answers the
  product no longer acts on are worse than none. C3/C4 render holidays
  read-only with their do/don't rules; there is no per-day skip, because there
  is none on the wire. The INT-4 event-source and slot adapters stay in the
  codebase for the STATIC demo and are annotated as retired on the live path.
- **D-INT-G — F1 is batch, not stream, and its results are read-only.** The
  proxy has no stream endpoint, so there is no fake token streaming: calm
  progress, then drafts. Attributions, flags and rationale are always visible
  (upstream terms require sources to stay visible). Approve/decline/schedule
  stay hidden in live mode because there is no drafts wire, and a per-org local
  run ledger (localStorage, runIds only) makes results re-pullable via the run
  read until a list endpoint exists. A ledger id that answers 404 is dropped.

### 2026-08-17 — D-INT-I: what a live suite is allowed to spend

- Why: every fresh QA org spends the platform's own starter funding (5000
  cents), and renders cost real money while text runs cost fractions of a cent.
  Left unstated, a live suite would quietly become a bill.
- So: live suites use `plan: balanced`, one text run and one tones-preview at
  most; a media render happens only under `LIVE_MEDIA=1`; the wallet is read
  before and after and printed in the log. The smoke run's measured numbers,
  which set the expectation for every later suite:
  - text only (no render): **5000 → 5000 cents.** One generate, one preview and
    one refused no-slot probe metered to about `0.0055` USD in total, which
    rounds to 0 cents. The asset and RAG byte flows are free by design.
  - with `LIVE_MEDIA=1`: **5000 → 4997 cents** — one balanced 1:1 png render is
    3 cents, exactly the `cost.images: "0.03"` the catalog advertises for
    `image-balanced`. So the catalog's price is trustworthy enough for E1 to
    show, and a render is ~1600× a text run: the env-var gate is the whole
    difference between a cheap suite and an expensive one.
- Instead of: leaving cost to judgement per session (the first expensive
  mistake would have been discovered on an invoice).

### 2026-08-17 - D-INT-C in practice: one tone schema, and where `example` went

- INT-7 removed `liveToneSchema`, the live-only relaxation INT-3 needed. Its
  whole reason was that requiring "at least one do or don't" would have
  demanded fields with nowhere to be stored; rules have a wire home now, so
  one schema serves both modes and the requirement is real again.
- `notices.brandFieldsPending` became `notices.brandExamplesPending` and now
  names only what is actually missing. A stale "everything is pending" note
  beside working editors would train users to ignore the notice that still
  matters.
- I4's Preview became two things behind one action (`previewTone`): live mode
  runs `posts/tones-preview` and shows a REAL sample; static mode composes as
  before. The card says which of the two it is showing - "A real sample,
  written in this tone just now" vs "Composed from what you have typed". The
  rule list beside it is unchanged in both, because that list is what the
  screen exists to answer and it is honest either way.
- `brandVoice` is deliberately omitted from the preview request. The platform
  falls back to the org's pushed context bundle and never merges, so sending
  one would preview something real generation does not use. A `502` on an org
  with no bundle becomes "save your brand voice first" rather than a shrug.
- The composer moved to `src/lib/tone-preview.ts`: the data layer calls it now,
  and a feature is the wrong home for something the data layer depends on.

### 2026-08-18 — INT-8: what the country replaced, and the empty state it exposed

- **The wizard's country is set LAST, after the org, tones and schedule.** It
  is the only step that takes ten seconds and the only one whose failure must
  not cost the user everything before it. Order: org → preset tones (with
  rules) → schedule (with the REAL tone ids the seeding just minted) → country.
- **open-items 10's empty-`toneIds` note is CLOSED.** The wizard picks tones by
  static ids that mean nothing server-side; `finishOnboarding` now maps the
  seeding's own answers back by name, so the schedule is created with ids that
  resolve. Verified on the wire: `toneIds: ["186","187","188","189","190"]`.
- **The country control is NOT part of I1's save bar.** It saves through its
  own ~10 s call, and an all-or-nothing form commit would either block on it or
  report a success it had not finished. It sits in its own section instead.
- **A no-op says so.** `reloaded: false` gets its own quiet line, and the Save
  button is disabled when nothing would change — spending ten seconds to
  re-load an identical calendar is unkind, and announcing "11 holidays loaded"
  for a call that loaded nothing is a small lie.
- **Found by the live spec: C3's empty state was keyed on slots alone.** With
  slots gone from the live wire, a calendar full of real holidays rendered
  "Nothing scheduled yet" and hid them. Now empty means empty — the grid earns
  its place if EITHER slots or occasions have something in them. This is the
  kind of bug only a live run finds: every static world has slots.

### 2026-08-18 — INT-9: two currencies of discourse, and exact arithmetic

- **`src/lib/money.ts` exists so no screen ever calls `parseFloat` on money.**
  The wire sends integer cents (the wallet) and DECIMAL STRINGS (`0.003749600000`
  from usage, `0.03` from the catalog). Twelve-decimal strings are exactly the
  values a double cannot hold, so `sumDecimalStrings` aligns and adds them as
  BigInt integers. `formatUsdString` trims for reading but never rounds a real
  charge to `$0.0000` — it says `< $0.0001` instead, because a charge displayed
  as zero is the one output nobody can act on.
- **The chip shows `availableCents`, not `cents`.** A wallet whose balance is
  entirely held cannot spend a penny of it, and the larger number is the more
  comforting lie. `heldCents > 0` adds a "reserved" clause rather than hiding it.
- **An all-zero wallet is funding pending, not an empty wallet.** Funding is
  server-side and best-effort at org creation, so zeros mean it has not landed.
  That is a WAIT, and saying "you have no money" would be wrong.
- **H3 becomes two different screens.** The static demo's credits ledger answers
  "why is my balance what it is" from entries the app wrote itself; live mode
  has no such ledger, so it answers the same question from the wallet plus the
  metering read-back. Nothing converts between credits and money.
- **`group_by=tenant` is unreachable from the UI by TYPE, not by convention.**
  It reports across every org of this app, so the seam takes
  `ApiUserUsageGrain` and a `tenant` chart is a compile error.
- **`unit` is displayed as it arrives.** The wire returns `input_tokens`,
  `output_tokens`, `guardrail_text_units`, `search_queries` and will grow more;
  inventing friendly names for a vocabulary we do not own goes stale silently.
- Found by the live run: the dashboard's "Credits balance" tile still said
  credits over a wallet holding $50.00, and the rail said "Plan and credits".
  Both now split by mode. The e2e asserts NO credits vocabulary survives into
  live mode, which is the only way that stays true.
- Observed and worth knowing: `holidays.lookup` IS metered (it shows in usage
  with three units) though it did not draw the wallet down — consistent with
  the upstream collection calling it free. So a fresh org has usage rows before
  it has generated anything.

### 2026-08-18 — INT-10: F1 becomes two interactions behind one route

- **Live F1 is a different INTERACTION, not a different data source.** The
  provider law ("no screen knows which side its data came from") holds for
  data; it cannot hold for a screen whose static half streams tokens into an
  editable draft while its live half queues a batch and renders read-only
  results. So `GenerateScreen` branches once, at the top, and each half is
  whole — rather than one component carrying two contradictory lifecycles.
- **The screens4.md F1 deviation, recorded:** no stream (the proxy has no
  stream endpoint), and an action row of Copy + Create visual only. Approve,
  decline and schedule are ABSENT rather than disabled, because an approval
  that cannot be recorded anywhere is a button that lies — the same rule that
  keeps the media entry point absent before approval in D2.
- **Flags, attributions and rationale are rendered unconditionally when
  present.** A hidden guardrail flag is worse than no guardrail, and the
  upstream terms require sources to stay visible.
- **`slot` is built from NOW in the schedule's timezone.** It is required (the
  smoke run proved it; api.md does not say so), and the schedule's zone is the
  clock the org's posting day is measured in — the browser's is the fallback
  before a schedule exists.
- **The client refuses an over-budget fan-out first.** Upstream refuses rather
  than truncating, so refusing locally turns a 400 into a sentence naming which
  number to change.
- **A bug worth recording, because the shape recurs:** the poll's `cancelled`
  ref was cleaned up by an effect that also depended on `orgId`. The first
  orgId change ran the cleanup, latched `cancelled` to true, and nothing ever
  reset it — so every later poll returned at its first check and the screen sat
  on "Writing your drafts…" forever, with no error to show for it. An unmount
  guard must be its own dependency-free effect. Only a live run surfaces this:
  in static mode nothing polls.

### 2026-08-18 — INT-11: the catalog IS the gallery, and the exemption widened

- **E1 renders nothing that was not read from the wire.** Card names are the
  catalog's own `displayHint`, prices are its `cost` decimal strings, plan gates
  are `appMetadata.min_plan`, and E2's params form is generated from each
  model's `capabilitySchema` — the same law W5 already held statically ("the
  form may not name a model or a parameter"), now fed by a real JSON Schema.
  None of those four fields is documented in api.md; all four were found by the
  smoke run (D-INT-H). The live spec asserts NO vendor name appears anywhere in
  the gallery, which is the only way that stays true.
- **A composer ships only where the body is fully known** (`media.generate`,
  `social-posts.media`, `images.edit` — the founder's amendment 6). The other
  granted capabilities are listed honestly as "arrives in a later phase" rather
  than given a form built on a guessed body. Their observed schemas are in
  `Docs/api/alphastudio-shapes.md` for whoever picks them up.
- **THE NETWORK LAW'S EXEMPTION WIDENED, deliberately and narrowly.** D-INT-A
  licensed one non-API request: a presigned PUT. Showing a render needs a
  second — the browser GETs the asset from storage, because the platform hands
  finished jobs presigned GET urls precisely so the client loads them and never
  proxies bytes. The e2e predicate is therefore "a url carrying the AWS SigV4
  signature OUR API just issued", in live mode only. An unsigned request to any
  host still fails the law, which is the case the guard exists for.
- **open-item 24 is ANSWERED: S3 CORS allows the browser PUT.** Proven in
  Chromium against the live buckets, not argued from the Node result — the
  founder's amendment 7 was right that we could answer it ourselves. Both the
  reference-image door and I6's file upload are therefore real surfaces, not
  hidden ones.
- **Found while proving E4:** arriving from the composer names a job in the
  query string, so it was already "open" and its Open button never rendered —
  meaning nothing ever minted its asset url and a finished render sat there
  invisible. It now opens itself the moment it settles, which is what the user
  came for anyway.
- **The list stays url-less on purpose.** Minting a presigned url per asset
  across a page is a signing call per row for links most people never open, so
  E3 lists without them and E4 mints one per asset actually opened.

### 2026-08-19 — D-INT-J: Today is derived from the ledger, not from local state

- Why: a proposal row carries no content, so the review queue is a JOIN —
  ledger → unique `runId`s → run reads → outputs matched back by the
  `proposalId` stamped on them. That is what makes a reload, a second device
  and a run this frontend never started all show the same queue.
- **D-INT-G is amended: the INT-10 localStorage run ledger is RETIRED.** It
  existed only because nothing server-side indexed an org's runs. The
  proposals ledger does, so "recent runs" became a shared fact instead of a
  per-browser cache, and F1's list is now proposals grouped by run.
- Terminal runs are immutable, so run reads are cached in memory and
  sessionStorage. A non-terminal run is never cached — caching one would
  freeze a queue mid-flight.
- **PAGING IS NOT TRUSTED FOR COMPLETENESS**, and that is not caution — the
  live walk proved the server's keyset skips rows sharing a creation instant,
  which is exactly what proposals from one run do (see the shapes doc). So the
  page walk only DISCOVERS runIds; the authoritative read is `?runId=`, which
  returns a run's whole set and carries no cursor at these sizes. Correctness
  comes from the per-run read; the walk is just an index.

### 2026-08-19 — D-INT-K: Approve means "approve and record as posted"

- Why: there is no publishing on the wire, and `approve` creates the
  published-social entry dated now. api.md advises calling it "when the post
  actually goes live, not when an admin clicks approve" — with no publish path
  to wait for, the honest move is to do both at once AND SAY SO, rather than
  hold a record back for an event that cannot happen. The card reads: "Malaky
  records this as posted and stops suggesting anything like it. Copy the text
  to publish it yourself."
- `publishedId` is `mlk_<proposalId>` — DETERMINISTIC, so a double click, a
  flaky connection and a reload all converge on the documented safe retry
  instead of racing into a 409. A random id would make the second attempt fail.
- A confirm precedes Approve because the published record is permanent
  (declining later leaves it). Decline asks for an optional reason (≤500) and
  is reversible — latest wins. There is no Undo pretence: no un-decide exists.
- **Founder flag:** the button stays "Approve" with the explanatory line
  beneath it. When real publishing lands, Approve becomes two-stage (approve,
  then publish) and this decision is the thing to revisit.

### 2026-08-19 — D-INT-L: Edit is deferred, and absent rather than disabled

- Why: no drafts store exists, so an edit could not be persisted, could not
  reach the platform's record, and could not change what the next run learns
  from. A disabled Edit button would advertise a feature; an absent one with a
  sentence is the truth. Live Today ships Approve · Decline · Copy.
- Deviation from screens4 D2 logged. The note names the condition rather than
  a date: "editing arrives with scheduling".

### 2026-08-19 — Production defaults to the visitor world; the env var is an override, not a dependency

- **What happened.** Production shipped with ZERO environment variables. The
  rebrand's deploy fix set `VITE_DEFAULT_DATASET=visitor` in `vercel.json`
  documentation but the variable was never actually set on Vercel, so the
  deployed bundle resolved `resolveInitialDatasetId(undefined)` → `active` →
  a signed-in demo tenant → `RootGate` rendered the DASHBOARD at `/`. Every
  visitor to the marketing site got someone else's workspace for ten days.
- **Why the old design allowed it.** The default was a plain constant chosen
  for local convenience (`active` is the world you want while developing), and
  the safe production value lived only in configuration. Configuration that is
  never applied is indistinguishable from configuration that does not exist —
  and nothing in the build, the tests or the gates could tell the difference.
- **So the default is derived from the BUILD**:
  `import.meta.env.PROD ? 'visitor' : 'active'`. Vite folds it at build time,
  so a production bundle cannot boot signed-in no matter what the deployment
  does or does not set. `VITE_DEFAULT_DATASET` survives as an explicit
  override — pinning a preview to a particular world is still useful — but
  nothing depends on it being present.
- **The gate is two-sided, and the second half is the one that matters.**
  `verify:w02` asserts (1) the SOURCE derives the default from the build with
  `visitor` on the production branch, and (2) the emitted `dist/` really does
  fall back to `"visitor"` — captured by backreference, since minified names
  change per build. Only the artifact half could have caught the incident,
  because the source was fine and the DEPLOYMENT was what defaulted wrong.
  Both halves were canary-tested: reverting the constant fails the unit tests,
  and a stale bad `dist/` with correct source fails the artifact half.
- Instead of: setting the variable and calling it fixed (the same failure is
  one dashboard edit away), or hardcoding `visitor` everywhere (dev would boot
  signed-out and every local session would start by switching worlds).

### 2026-08-20 — E2E-0820: "credits" is scoped to the static demo, not purged from it

- **The finding (F4).** Billing → Subscription read "Free — $0 a month · 100
  credits" on the LIVE app, which contradicts D-INT-E: live mode shows money.
- **The interpretation, because the order and D-INT-E pull opposite ways.**
  The order says the word "credits" must not appear and asks for a repo-wide
  sweep; D-INT-E deliberately KEEPS credits as the static demo's own currency
  and forbids inventing an exchange rate between the two. Both are founder
  positions, so the reading that preserves the recorded decision wins: **no
  surface a LIVE user can reach says "credits"; the static demo keeps its
  ledger vocabulary.** That is the same class of bug the founder reported —
  a live user reading a credit figure — without renaming the demo's currency,
  its `low-credits` dataset, `useCreditBalance`, or the H3 ledger screen.
- **What that meant in practice.** H1/H2/H4 render the SAME static plan data in
  both modes (plans are not on the wire), so those three were the live-reachable
  surfaces and are reworded unconditionally rather than forked by mode — copy
  that changes with the mode is harder to trust than copy that does not.
  Everything else that still says "credits" was checked to be inside a
  `!live` branch, a dev route, or a comment.
- **The wording.** `plan.credits` is a credit count with no honest conversion
  into currency, so the allowance is NAMED, not numbered: "Includes a monthly
  generation allowance" (`MESSAGES.notices.planAllowance`). The price stays a
  real figure ("$0 a month") because that one IS derivable. Plan cards stay
  comparable because `entitlements.features` already carries what separates
  them ("1 post a day" vs "Up to 3 posts a day"), so no information is lost.
- **Route.** `/billing/credits` → `/billing/balance`, with the old path kept as
  a redirect: it was linked from the shell chip, the dashboard tile and a live
  spec, and a bookmark should not 404 over a vocabulary change.
- Instead of: purging credits from the static demo too (a large rename that
  fights D-INT-E for a surface no live user sees), or mode-forking the plan
  card (two truths about one plan).

### 2026-08-20 — E2E-0820: a pre-run count is resolved against the tones that exist now

- **The finding (F5).** F1's summary said "3 drafts" over two selected tones,
  and "1 draft" over none.
- **The cause.** `LiveGenerate` seeds its selection from `useTones()` on FIRST
  paint. In live mode that is the pre-sync world; `live/orgSynced` then REPLACES
  `world.tones` wholesale with the ids the API minted, so an id chosen a moment
  earlier stops existing while it is still in the selection. The summary counted
  the raw id list, the request body counted the intersection, and a ghost id sat
  in the gap between them — invisible in the picker, worth a draft in the count.
- **The fix.** One resolution (`planRun`) feeds the counter, the guards and the
  request body, and a reconciliation effect prunes ids no tone answers to any
  more. With no tone selected the run control is disabled and NO count renders:
  "0 drafts" is a number nobody asked for, and the tone-required line is what
  the screen has to say at that point.
- Instead of: fixing the arithmetic in place (it was never the arithmetic), or
  re-seeding the selection on every tone change (that would fight a user who
  deliberately deselected).

### 2026-08-20 — E2E-0820: Finish attempts every step, reports what failed, and repairs on re-run

- **The finding (F12).** Org 619 came out of the wizard with tones but no
  schedule and no country, and the wizard reported success.
- **The cause, in three parts.** `finishOnboarding` swallowed everything after
  `POST /orgs`: tones through `Promise.allSettled` with the rejections
  discarded, schedule and country through `.catch(() => undefined)`, then
  `return ok` regardless. Only org creation could fail visibly, and its toast
  was `MESSAGES.errors.generic` with a "Try again" whose `onClick` was `() => {}`.
- **The shape of the fix.** The ok/not-ok axis is now the ORG alone, because
  that is the only part that cannot be repaired from Settings. Everything after
  it is attempted regardless of what failed before it, and each failure is
  collected with its code and the envelope's `requestId` and handed back as
  `incomplete[]`. The wizard still COMPLETES on a partial success — the
  workspace exists, and holding a user in the wizard behind a step that may
  never succeed would strand them — but the toast names which parts did not
  save and where to set them.
- **Idempotency, so a retry repairs instead of duplicating.** The org is reused
  when the user already owns one by that name (a lost response to `POST /orgs`
  used to mint a second workspace on the retry), presets are seeded only where
  one of that name is missing, and a schedule is created only when the org has
  none. Country is a `PUT`, so it was already free to repeat.
- Instead of: blocking completion until every step lands (a permanent upstream
  failure becomes a permanent dead end), or reporting the first failure only
  (the founder's org lost two steps, not one).

### 2026-08-20 — E2E-0820: an unread balance is not an unavailable one

- **The finding (F9).** The header chip showed "Balance unavailable — funding
  pending" for two to five seconds on every route load.
- **Why it was wrong.** That copy is an API-CONFIRMED claim — an all-zero
  wallet means server-side funding has not landed (INT-9). The chip reached it
  through `wallet === null`, which also means "not read yet". A verdict was
  standing in for a wait, on every screen, because the chip mounts in `AppShell`.
- **Three states now, because there are three facts:** the read is in flight
  (`balanceLoading`, neutral), the sync finished and brought no wallet back
  (`balanceUnread` — a failure, not a state of the wallet), and an
  API-confirmed all-zero wallet (`balanceUnavailable`, unchanged). The loading
  signal is `useScreenPhase()`, which already derives from `liveSyncPhase`.
  The same split is applied to the Balance screen, which the chip links to.
- Instead of: a skeleton (the chip is one line of text; a shimmer there is
  noisier than the word "Loading"), or treating an unread wallet as loading
  forever (a failed read would sit on "Loading balance…" with no end).

### 2026-08-20 — E2E-0820 B9: "has the user edited?" is recorded, not inferred

- **The finding.** C1's save bar could never go clean on a live org: the tone
  picker rendered the five real tones while `draft.toneIds` held seven demo
  ids, and Save would have posted them. F5's defect class, on a second screen.
- **The first fix was wrong in an instructive way.** The screen already had a
  guard — adopt the new pristine if the draft still equals the LAST pristine,
  otherwise leave it alone — and extending it to "otherwise prune ghost ids"
  looked sufficient. It made things worse: after a reload the just-saved
  selection was pruned to nothing. The brand and scheduling halves of the sync
  graft INDEPENDENTLY, so the "last pristine" ref can advance to the live
  schedule on a render where the draft has not adopted yet; the next pass then
  reads a perfectly untouched draft as an edit and prunes it against whichever
  tone list happens to be current.
- **So the flag is recorded.** `edited` is set by `patch()` — the one funnel
  every field change already went through — and cleared on Cancel and on a
  successful save. "Did the user change something" is a fact the screen knows;
  reconstructing it by comparing JSON against a ref that advances on its own
  schedule was inference dressed as a fact.
- **Two guards survive from the wrong version, because they are about
  evidence, not identity:** never prune against an empty tone list ("not
  loaded" is not "none exist"), and never prune when the pristine's own ids do
  not resolve (the two halves are out of step — wait for the render where they
  are not).
- Instead of: comparing draft to pristine more cleverly (the seam is the
  problem, not the comparison), or reconciling in the provider (it has no idea
  which fields a user has touched).

### 2026-08-20 — E2E-0820 B9: a live org with no schedule does not wear the demo's

- **What the repair spec exposed.** An org in the 619 shape — tones seeded,
  schedule missing — opened C1 showing a full cadence: five active days, three
  posts a day, eight tones. None of it was theirs. `fetchScheduling` answers
  `schedule: null` when the org has none, and the reducer's
  `...(action.scheduling.schedule ? … : {})` left the seeded demo schedule in
  place, so the demo's data was presented as the org's own settings.
- **The law it broke** is the one INT-8 applied two lines above it, for
  `eventSources`: "an empty list is the honest answer rather than demo data
  dressed as live data". A missing schedule now grafts a BLANK one — no days,
  no tones, one post, not started — instead of falling through to the seed.
- **Timezone and generate-time survive as defaults**, because those are the two
  fields where a guess helps more than a blank and both are visibly a choice on
  the form. Everything that constitutes the actual schedule starts unset, so
  C1 asks instead of asserting.
- **This is what makes 619 self-repairable**, which was the question behind the
  addendum: the form arrives blank, the user fills it, and `saveSchedule`
  falls back from `PATCH` to `POST` because there is no `scheduleId` — proven
  end to end in `live-schedule-repair.spec.ts`, including the exact tone ids
  surviving the round trip and a reload.
- Instead of: special-casing the screen (every other reader of
  `useSchedule()` would still see demo data), or leaving `schedule: null` and
  making every consumer handle it (the app's model has always had a schedule).

### 2026-08-23 — D-M2-A: M1 is retired; the visitor world is Abdullah's concept-v2

- **What left.** `features/marketing/marketing-home.tsx`, the whole
  `features/marketing/outputs/` engine (the scroll story, the 3D card orbit,
  the post cards, the demo brands, the platform chrome, the approval demo, the
  workspace section, the motion tokens, the story layout and its test),
  `reveal.tsx`, the unlinked `pricing-section.tsx` seam, the `[data-mk-reveal]`
  / `[data-mk-stage]` / `[data-mk-ambient]` / `[data-mk-card3d]` block in
  `globals.css`, `public/campaigns/` (four webp), and `public/brand/og-malaky.png`.
  Also `features/system/legal-screens.tsx`, whose job the ported legal pages do
  now, and `features/marketing/{analytics.ts,request-access-screen.tsx}` — see
  D-M2-D for why the early-access door went with them.
- Why: M1 and concept-v2 are two answers to the same question, and keeping both
  would mean two marketing worlds, two motion laws and two sets of demo
  content in one bundle. Git history keeps M1; the tree does not.
- Instead of: leaving M1 behind a flag — a flag nobody flips is dead code with
  a switch on it, and `verify:w02` would have had to assert two designs.
- Cost, stated plainly: **the bundle did not shrink.** M1's engine was ~3,000
  lines; concept-v2's home page eagerly carries the hero orbit, seven sections,
  the brand-demo analysis engine, the operating calendar and a 450-line SVG
  creative library. Entry chunk 632 kB → 675 kB, CSS 160 kB → 216 kB. The
  visitor world is simply a bigger thing now. Route-level splitting of the
  marketing world is W7's business, not this branch's.

### 2026-08-23 — D-M2-B: pricing is marketing's own data, not `usePlans()`

- **What.** `/pricing` renders from `features/marketing/concept/lib/pricing.ts`,
  ported verbatim from the prototype: three deployments (Business $599, Scale
  $899, Enterprise custom), Malaky Managed at +$299, Intelligence Setup,
  the comparison table and the scoped-items list. It does not read `usePlans()`
  and imports nothing from `src/data`.
- Why: the two are different documents with different owners. `src/data`'s
  plan entities describe **what billing can charge for** and feed H1/H2 inside
  the product; this page describes **what sales is offering during the Middle
  East launch** — a commercial position, in Abdullah's words, and the newest
  brief. Forcing one through the other would have meant either inventing
  marketing copy in the billing entities or bending the launch offer to fit a
  billing shape.
- **This supersedes the W2 verify line "plans stay one source" for the
  marketing route only.** H1 still reads `usePlans()`, `plans.test.ts` still
  guards it, and `verify:w02` now asserts the separation from the other side:
  nothing under `features/marketing/` may import `@/data` (one exception, the
  layout, which asks whether `/` is the site or the product).
- Reconciling them is a real task and it is not this branch's: when self-serve
  checkout is built, the two have to agree, and the honest place for that is
  the phase that builds it. Logged in open-items.
- Instead of: mapping the prototype's tiers onto the existing plan entities —
  it would have made the marketing page lie about what billing supports, or
  made billing carry launch copy it has no use for.

### 2026-08-23 — D-M2-C: the purchase flow is NOT ported

- **What did not come across.** `components/concept-v2/purchase/**`
  (GetStarted, Checkout, PaymentSurface, Onboarding, Schedule, Complete,
  OrderSummary, StepRail, FlowChrome), `lib/concept-v2/adapters/**`,
  `commerce.ts`, `flow-state.ts`, `onboarding-steps.ts`, the concept login
  page, and the `scripts/` QA harness.
- Why, for the purchase flow: in the prototype it is an honest inert fiction —
  nothing is charged, and the pages say so. **Here it would sit next to a real
  signup and a real onboarding wizard**, so a visitor would meet two "get
  started" journeys, one of which creates an account and one of which does
  not. That is not a fiction any more, it is a trap.
- Why, for the login page: we have a real `/login`.
- Why, for `scripts/`: our gate culture stays ours. The laws that harness
  enforced (the frozen section rhythm, the spacing steps) are asserted by
  `verify:w02` instead, in the place this repo already looks.
- `verify:w02` names all nine purchase modules and fails if one reappears.
- Instead of: porting it behind a "concept" banner — the banner is exactly the
  thing a visitor in a hurry does not read.

### 2026-08-23 — D-M2-D: "Get started" is the real signup; early access is retired

- **What.** Every "Get started" on the site — header, mobile panel, hero,
  brand demo, the closing CTA, and the Business and Scale pricing cards —
  resolves to `/signup`, the app's own account creation. "Request a private
  demo" (header, mobile panel, brand demo, the Enterprise card, the pricing
  page's closing CTA, the footer's Contact) resolves to `/request-demo`.
  Login resolves to `/login`. All of it through one map,
  `features/marketing/concept/site.ts`, asserted by `site.test.ts` (which also
  reads the source to prove no component types a route by hand) and by
  `verify:w02`.
- **This resolves the open question the production pass left.** The 2026-08-11
  launch model was "Request early access" as THE acquisition CTA, with
  "Start free" banned so the two models could never mix. Abdullah's brief is
  the newer instruction and it is a self-serve one, so the early-access model
  is retired rather than held alongside: `/request-access` now redirects to
  `/request-demo` and its screen has left the bundle. **The founder can veto
  this at review** — which is why it is a redirect and not a deletion of the
  path.
- The `?plan=` query the prototype's pricing CTAs carried is dropped: `/signup`
  does not read it, and a parameter nothing reads is a promise nothing keeps.
- Instead of: keeping "Request early access" as a third door — three doors on
  one page is how a visitor learns to press none of them.

### 2026-08-23 — D-M2-E: the port is VENDORED, and keeps upstream's file names

- **What.** `src/features/marketing/concept/**` is Abdullah's source, file for
  file, directory for directory, PascalCase names and `cardStack.module.css`
  and all — against this repo's kebab-case convention.
- Why: so it can be diffed against the prototype again. The port is 58 files
  and ~12,000 lines; the next time Abdullah changes a section, a rename map is
  the difference between a five-minute merge and a re-port. The brief asked
  for the CSS modules "rename-free" for exactly this reason, and splitting the
  convention down the middle — renamed components beside un-renamed
  stylesheets — would be the worst of both.
- What it costs, and how it is contained: two of the vendored files export a
  JSX-carrying constant beside their components, which the fast-refresh lint
  rule forbids. Rather than restructure upstream's files, `concept/**/*.tsx`
  joins the existing exception list in `eslint.config.js` beside `src/data/**`
  and `routes.tsx`. Four more carry a scoped `eslint-disable ab/no-raw-color`
  because they draw artwork or depict someone else's platform chrome;
  `verify:w02` asserts that list is exactly those four and no others.
- Everything OUTSIDE `concept/` — the route screens, the layout, the styles —
  is ours and follows the repo's conventions.
- Instead of: renaming everything on the way in (cheap once, expensive every
  time after), or vendoring under `node_modules`-style isolation (it is source
  we will edit).

### 2026-08-23 — D-M2-F: the port meets AA, and the four changes are named

- **What.** Abdullah's palette arrived failing WCAG AA in four places, on every
  page. Fixed in the token file and at the four sites, each commented where it
  changed, each listed in design.md Part 7.7, each reversible in one line:
  `--c-text-4` (2.63–2.93:1, ~40 elements) aliases `--c-text-3`; the filled
  CTA's ink is `--c-on-accent` `#1a0a05` instead of `#fff` on `#ff4e2d`
  (3.29:1); the approval preview is absent rather than held at `opacity: 0.3`
  (1.43:1); the customer monogram moved up a tier off `--c-surface-3`
  (4.22:1). `--c-accent` `#ff4e2d` itself is **untouched** — it is the
  identity, and darkening it would have changed every CTA on the site.
- Why this was not left as debt: "contrast ≥ AA everywhere" is design.md
  Part 6 rule 1, `tokens.test.ts` has enforced it for the app palette since
  W1, and CLAUDE.md rule 5 makes an axe-clean screen part of the definition of
  done. A marketing site whose primary CTA fails AA is an accessibility
  exposure at launch, not a matter of taste — and an allowlist of "known
  violations" is the kind of check that rots (state.md traps 15 and 18).
- **`src/styles/marketing-tokens.test.ts` is the new guard**, mirroring
  `tokens.test.ts`: it parses the real stylesheet, resolves the contrast the
  way a browser does, and asserts the whole text-tier × surface matrix plus
  the CTA in both its states. 26 assertions.
- Flagged for review rather than assumed correct: the founder and Abdullah
  should look at the dark ink on the orange CTA in particular, since it is the
  most visible of the four. Logged in open-items.
- Instead of: shipping the prototype's values and allowlisting the axe
  findings (a real defect plus a weakened gate), or changing `--c-accent`
  (a brand decision that is not an engineer's to make).

### 2026-08-24 — D-M2-F-r: the AA pass is REVERTED for review; the four failures are allowlisted

- **What.** D-M2-F's four accessibility fixes are undone on
  `design/m2-concept-v2`. `--c-text-4` is Abdullah's `#5d5a57` again
  (2.63–2.93:1, ~40 elements), the filled CTA's ink is `#fff` again (3.29:1,
  and 2.83:1 on hover), the approval preview is ghosted at `opacity: 0.3`
  again (1.43:1, and back in the accessibility tree before the visitor has
  approved anything), and the customer monogram is back on `--c-surface-3`
  (4.22:1). `--c-accent` was never touched by either decision.
- **Why.** The founder's call, 2026-08-24: the preview Abdullah reviews has to
  be his design verbatim, not the corrected one. A review of a design that was
  silently changed is a review of something nobody drew. This is a decision
  about what a REVIEW ARTEFACT shows, not about what ships.
- **Scope, and it is the whole point of the decision.** This branch is not
  merged and must not be. Re-applying D-M2-F is a gate on `main`, recorded in
  open-items 21. The state.md branch table and every one of the four sites
  says so at the site of the change.
- **The gates were made to state the cost, not to stop looking.** D-M2-F
  warned that "an allowlist of known violations is the kind of check that
  rots", and that warning is honoured rather than ignored:
  - `marketing-tokens.test.ts` keeps all 26 assertions. The four findings
    become PINNED entries — each asserts the ratio it actually measures AND
    that it is still below AA, so improving a value tells you to remove it
    from the allowlist and worsening one fails. Everything else is still held
    to AA.
  - `e2e/marketing.spec.ts` allowlists by EXACT COLOUR PAIR, never
    `disableRules(['color-contrast'])` — an unlisted pair still fails, and so
    does every other rule. A second test asserts the allowlisted pairs are
    still really being reported, so the list cannot quietly cover nothing.
  - `verify:w02` sweeps every marketing stylesheet for a quiet tier on a light
    fill with `BrandMark.module.css` named as its one exception, and reports
    the exception as STALE if that file ever stops doing it. It also asserts
    the ghosted card is present, so restoring D-M2-F reports the check as
    stale rather than passing silently.
- **Two things were found doing this, and neither is D-M2-F-r's doing.** The
  homepage's axe scan had never run against the homepage (trap 14: `analyze()`
  does not auto-wait, so it scanned the still-mounted dev-datasets page in the
  APP's ivory palette), and once gated it scanned a MOVING page, reporting
  mid-transition blends as defects. The scan now runs on a settled homepage
  under reduced motion, which `marketing.css` collapses to the end state.
  Fixing it surfaced three genuine pre-existing contrast defects in the Memory
  section, dimmed text at 1.6–3.21:1, which are listed in their OWN group and
  in open-items — never folded in with the four.
- Instead of: keeping D-M2-F (Abdullah reviews a design he did not draw), or
  reverting the values and switching the contrast rule off (the same defects,
  plus a gate that would never speak again).

### 2026-08-24 — D-M2-F-r2: the corrected palette ships; no allowlist anywhere

- **What.** D-M2-F's four accessibility fixes are back, and D-M2-F-r is
  superseded. `--c-text-4` aliases `--c-text-3` again, the filled CTA's ink is
  `--c-on-accent` `#1a0a05`, the approval preview is absent rather than ghosted,
  and the customer monogram sits one tier up. `--c-accent` `#ff4e2d` and every
  other token are byte-identical to Abdullah's. **Every allowlist is gone** —
  axe enforces contrast on the real homepage with zero exceptions, the tokens
  test holds the whole matrix to AA outright, and verify:w02's quiet-tier sweep
  has no named exception.
- **Why.** Abdullah delegated the call ("do what's appropriate") and the founder
  ruled: accessibility wins, design spirit preserved. D-M2-F-r had done its job
  — it existed so he could see the four as drawn before deciding.
- **The Memory section, and a correction worth recording.** The three contrast
  defects there were reported as "the dimming means superseded draft". They did
  not. All three traced to ONE rule — `.draft, .learned, .future { opacity:
  0.55 }`, the scroll-reveal resting state — which multiplied every text tier
  inside all three cards: 1.60:1 on the original draft, 2.18:1 on the rule list,
  3.21:1 on "what it learned". It applied equally to the learned rule and the
  future draft, which are the two things the section exists to prove. There was
  also no strikethrough to keep.
  **The fix is that the reveal slides without fading.** No dim value would have
  worked: `--c-text-3` is 4.76:1 on `--c-surface-1` and 4.57:1 on
  `--c-surface-2` at FULL strength, so any opacity below ~0.97 puts the quiet
  tiers under AA. Movement is kept, the border still transitions, and the rule
  this repo has now learned four times is honoured: never dim real text with
  opacity.
- **"Superseded" moved off colour, and that IS needed — for a different reason
  than assumed.** Abdullah said it with `--c-text-4` alone, and the AA fix
  aliases that tier to `--c-text-3`, which is the colour of the rule list beside
  it. So the one channel the meaning travelled on stopped being a distinction.
  A `Superseded` badge now sits in the label row the section already had.
  **Shipped over the alternative** (a strikethrough on the original draft body)
  because the label row is structure Abdullah already drew, while a line through
  a 1.375rem display paragraph is a heavier visual edit than the AA fix itself.
  The draft stays obviously secondary at a glance without it: quieter tier, no
  accent border, no tinted background, against an edited card that has all
  three.
- **What is enforced, now that nothing is allowlisted.** verify:w02 gained two
  checks that fail if either fix is quietly undone: 11d (the Memory reveal may
  move, it may not fade) and 11e (the superseded signal may not be colour-only
  again). 11c flipped from "assert the ghosting is present" to "assert it is
  absent, and that the card leaves the accessibility tree".
- **Kept from D-M2-F-r's turn, because it was never an allowlist:**
  `settledHomepage` in `e2e/marketing.spec.ts`. The homepage's axe scan had
  never scanned the homepage (trap 14 — `analyze()` does not auto-wait, so it
  read the still-mounted dev-datasets page), and once gated it scanned a moving
  page. It now waits for the hero `h1` and scans under reduced motion, which
  `marketing.css` collapses to the settled end state.
- Instead of: keeping the prototype's values (Abdullah delegated the decision,
  and the founder took it), or keeping a "documented" allowlist alongside the
  fixes (nothing left to allow — an allowlist covering nothing is the rot it was
  written to prevent).

### 2026-08-28 — PHASE-0 RULING: the hard gate is the four brand entities, measured not argued (ONB-0827)

- **What was asked.** ORDER ONB-0827 said: before designing the readiness
  gate, find out on the wire whether the country and the posting schedule
  block generation. If a fresh org holding only the four brand entities can
  run, they are checklist items; if it cannot, they join the hard gate.
- **What was done.** Two fresh QA orgs, through the deployed API, warmed first
  (probes `200 1657ms, 200 359ms, 200 130ms`; 12-way fleet slowest 499 ms), so
  no latency recorded is a cold start. Org **619 and every production org were
  untouched.**
- **(a) The four alone are enough.** Org **954**
  (`qa+1787915648395onba@alphapromena.com`): one voice with two rules, one
  tone with one rule, one source, one topic — `GET /orgs/954/schedules`
  `total: 0`, `org.country: null`. The exact body `src/data/generate.ts`
  builds today (`slot` synthesized client-side, `plan: balanced`,
  `options.perTone: 1`) answered **202 in 1158 ms**, request
  **`60c06fd5-acb7-4060-81d5-4a7b8113ebeb`**, run
  `run_f47e61d75ea07f9c406dc4d8` → `completed` with one real draft ("New
  sustainable packaging options now available for small retailers…").
- **(b) Zero tones is refused, and the refusal is unusable.** Org **955**
  (`qa+1787915648395onbb@alphapromena.com`): voice + source + topic, and
  `GET .../brand/tones` `total: 0` — which independently re-confirms
  open-item 26 (the API seeds nothing). The same body with `tones: []` came
  back **400 `bad_request` in 804 ms**, request
  **`ae30783f-f28d-4d5a-9ac6-88c92da1a2a9`**: _"The generation service
  rejected the request — check the body against the capability's schema"_ —
  no `details`, nothing a user could act on. **That is the message the gate
  exists to make sure nobody ever sees.**
- **The ruling.** The HARD gate is the four brand entities and nothing else.
  The country and the posting rhythm appear in the checklist, marked as what
  they buy — holidays, and scheduled posting — and never as blockers.
  `src/data/readiness.test.ts` fails if anyone promotes them without new
  evidence.
- **Cost: under one cent.** The wallet read `5000/0/5000` before and after;
  usage for the day totals `$0.00476` across guardrail units, input and
  output tokens. Two orgs, each auto-funded 5000 cents by the platform.
- Instead of: reasoning from `api.md`. State.md trap 13 is exactly this —
  "api.md is not the wire", and `slot` is the field that taught it.

### 2026-08-28 — D-ONB-A: signup stays minimal, and verifying lands the user IN THE APP

- Why: Hasan's product ruling via the founder (2026-08-27), superseding prior
  product law. A five-step wizard between "I verified my email" and "I can see
  the product" is a toll gate on a person who has already paid twice. Signup
  already collects the minimum (name, work email, password, org name, terms);
  after verifying, the next thing on screen is the dashboard.
- What follows structurally: the org has to be created at verification, since
  that is the first moment there is a session to create it with and the last
  moment before the product needs one. It is created from the org name typed
  at signup, idempotently — the E2E-0820 F12 law, that a lost response must
  never mint a second workspace, survives the rewrite intact.
- Instead of: bypassing the wizard behind a flag (a screen nobody reaches is a
  screen nobody maintains, and it would still have owned the schedule), or
  moving setup into a modal on first load (the same interruption, wearing a
  different frame).

### 2026-08-28 — D-ONB-B: no seeded tones, ever — a fresh live org starts empty

- Why: Hasan's ruling. The five presets were never product truth on the wire:
  the API has no seeding (open-item 26, re-measured again in the Phase-0 probe
  — a fresh org reads `tones total: 0`), so `finishOnboarding` planted them
  client-side. Every new workspace therefore claimed five voices its owner had
  never chosen, and the tone picker opened on somebody else's idea of how the
  brand sounds.
- What changed: the seeding step is gone from the org-creation path. What the
  wizard collected is resolved against the tones the org REALLY has, so a
  dangling static id is dropped rather than written into a schedule. The
  `tones` variant of `FinishStepFailure` went with it — it could no longer
  occur, and an unreachable failure mode is dead code that reads as coverage.
- **This is a SEEDING change, not a deletion feature.** No new delete
  mechanics, rules or UX were built around tones; existing tone management is
  byte-identical. I3 gained one honest empty state — "No tones yet", naming
  the consequence — and stopped rendering a "Presets — always available, in
  every workspace" heading over an empty grid.
- The DEMO world is untouched, per the order: `PRESET_TONES` still composes
  the `visitor`, `fresh` and `active` datasets, `entities/tones.ts` is
  unchanged, and `settings-system.test.ts`'s preset test — which is about the
  demo reducer — was left exactly as it was.
- Instead of: keeping the seeding until the backend ships its own (that is
  open-item 26, and it would have kept shipping the same untruth in the
  meantime), or seeding one tone instead of five (a tone the user did not
  write is the thing being removed, and one is not less of one).

### 2026-08-28 — D-ONB-C: the wizard is DELETED, and N3 becomes the workspace-creation retry

- Why: D-ONB-A leaves the wizard with nothing to collect that does not already
  have a durable home — brand voice, tones and sources in Settings, the country
  on I1, the posting rhythm on C1. A screen kept "just in case" would be a
  second, unmaintained editor for five things the product already edits.
- What went: `src/features/onboarding/*` — the screen, the wizard shell, the
  finish report and its test. `/onboarding` stays reachable as a REDIRECT into
  the app, because N3, the dashboard banner, Today's empty state and an unknown
  number of bookmarks pointed at it, and a saved link should land in the product
  rather than on a 404.
- **The model lost a journey it no longer has.** `org.onboarding {completed,
  resumeStep}` became `org.exists`: one honest fact, set by the adapter from
  org membership — which is all `completed` was ever inferred from — and read
  by the three route guards. The three `onboarding/*` reducer actions collapsed
  into `workspace/created`; `org/update` already did everything `saveBrand` did.
- **`finishOnboarding` became `createWorkspace`:** the org and nothing else.
  The tone, schedule and country pushes died. Pushing four things from one
  screen is exactly what left org 619 half-built while reporting success
  (E2E-0820 F12); each of the three now has a screen that owns it.
- **The wizard's private schedule client died with it, which closes open-item
  27a** — the two literals that both built the eight-field schedule body are
  one again, because only `saveSchedule` is left. The fields the wizard shared
  with C1 moved to `features/calendar/schedule-fields.tsx`, beside their one
  remaining owner. **The Calendar editor is now the ONLY schedule surface.**
- **N3 is reframed, not retired.** It used to say "you stopped at step 3 of 5".
  It now handles the one narrow state that can still arrive: a verified account
  whose workspace was never created — a failed create, a tab closed mid-flight,
  or an account from before this change that never finished the old wizard.
  With a recoverable name it is one button; without one it asks for that ONE
  field, because an org cannot be created without a name and inventing a
  company's name would be worse than asking. **A single recovery input is not a
  wizard**, and `createWorkspace` is idempotent so pressing again repairs.
- **The accept-invite path is untouched** — it joins an existing org and never
  creates one.
- Instead of: keeping the wizard for the org-creation step alone (a five-step
  shell around one field), or auto-generating an org name (a workspace called
  "My Workspace" is a thing the user has to fix later, at a worse moment).

### 2026-08-28 — D-ONB-D (**PENDING** — built, awaiting the Hasan sync): the brand-readiness gate

Recorded as PENDING per ORDER ONB-0827: the ruling behind it is Hasan's, but
the shape below is this cycle's reading of it and has not been confirmed.

- Why: with the wizard gone there is no longer a moment that guarantees setup
  happened, so the guarantee has to live where the data does. Hasan's ruling is
  that NOTHING generates — posts or any Studio media job — until brand setup is
  complete.
- **One selector, in the data layer.** `src/data/readiness.ts` derives every
  item from provider hooks and hands back `{known, canGenerate, items,
  missing}`. Every gate reads it; no screen decides for itself what ready
  means. `deriveReadiness` is the pure half, so the ruling is assertable as a
  function rather than only through a rendered screen.
- **What blocks is the Phase-0 ruling above,** not a preference.
- **Trap 20 is why `known` exists.** In live mode the world is the seeded demo
  until `live/orgSynced` lands, so reading readiness in that window would
  report a workspace ready on Atlas Roasters' tones. Unknown is neither ready
  nor blocked: the surfaces render loading. **Trap 19:** nothing is stored, so
  nothing can go stale — the answer is derived on the render that reads it.
- **Enforced at every generation entry:** the `/generate` route (the checklist
  state, not a dead form), the Studio composer, D4's media dialog, and Today's
  affordances, which say "Finish setup to generate" BEFORE they are pressed.
  D4's gate sits INSIDE the dialog on purpose: the media entry point itself is
  rendered from `canTransition` and may never be hidden or disabled by anything
  else (the W3 structural law), so the button still opens — onto the checklist.
- **Tone preview is deliberately NOT gated**, and `verify:w06` asserts that it
  stays that way: previewing is part of CREATING the first tone, so gating it
  would lock the user out of the very item the gate is asking for.
- **The gate is UX, not security.** The server keeps the last word: a refusal
  that slips through is surfaced with its request id, which is what makes the
  Phase-0 400 — a message with no `details` — reportable at all.
- **One deviation from the order, flagged rather than buried.** The order said
  static mode reports ready. It derives honestly instead. No demo DATA changed,
  but the `fresh` world is genuinely half set up (no voice rules, no sources,
  no topics), so it renders the checklist — which is what makes the gate
  exercisable from `/dev/datasets` and gives the blocked states real axe
  coverage. Hardcoding static to ready would have made the whole feature
  untestable outside a paid live run, against the same order's "axe on the
  checklist and blocked states".
- Instead of: a per-screen check in each entry point (five screens, five
  chances to disagree with the checklist the user was just shown), or blocking
  at the API seam (the seam cannot render an explanation, and a silent refusal
  is the thing being fixed).

### 2026-08-28 — D-ONB-E: static readiness derives honestly (the ONB-0827 deviation, ACCEPTED)

- **The founder ruled on open-item 39.** ORDER ONB-0827 said static mode
  reports ready; the build derived readiness honestly instead, flagged it, and
  the deviation is now **accepted**. This entry exists so the next reader finds
  the ruling beside the code rather than in a report.
- Why it was taken: no demo DATA changed, but the `fresh` world genuinely has
  no voice rules, no sources and no topics — so it renders the checklist. That
  is what makes the gate exercisable from `/dev/datasets` and gives the blocked
  states real axe coverage. Hardcoding static to ready would have made the
  whole feature untestable outside a paid live run, against the same order's
  own "axe on the checklist and blocked states". The `active` world and the
  four derived from it are fully set up and never see the gate.
- **The one-line revert stays documented, not exercised:** making
  `useReadiness` return `canGenerate: true` whenever `!isLiveMode()` restores
  the literal reading. It is written down here so the option keeps existing
  without anybody having to rediscover it.
- Instead of: quietly conforming (the gate would have had no static coverage at
  all), or arguing it in a report and leaving the code ambiguous.

### 2026-08-28 — D-ONB-F: a session opens in the org it remembers, and an invite switches to the inviting one

Closes open-item 38, which ONB-0827 created and the live suite caught.

- **The problem, measured twice.** ONB-0827 made every signup mint a workspace
  (D-ONB-A). The app worked in `orgs[0]`, and `/me/orgs` orders by `joinedAt`
  **ascending** — so for anyone who signed up before being invited, `orgs[0]`
  is always the org they made first and **the inviting workspace was
  unreachable**. Measured on fresh orgs 1003/1004, then again on 1064/1065:
  `[{own, owner}, {inviting, member}]` both times.
- **A correction to the order's own brief, measured rather than assumed.**
  ONB-0827-B describes the fix as "accepting an invite switches the active
  org". **An existing user cannot accept an invite:**
  `POST /orgs/:id/members/invite` answers `invitedNewUser: false` and sends no
  code, and `POST /auth/accept-invite` for that address answers **400
  `bad_request` "Invalid or expired code"** (request
  `4b0959ba-b8d1-409a-9816-b93aaa83ef13`). Their membership is simply added.
  So part 1 of the rule governs the NEW-user accept path, and the existing-user
  case — the one open-item 38 actually measured — is fixed by parts 2 and 3
  plus the switcher below.
- **The rule, and where each part lives.**
  1. `acceptInvite` passes the just-joined org into `establish`, so a new user
     lands in the org that invited them rather than wherever the selection
     would otherwise fall. `mostRecentlyJoined` identifies it by sorting on
     `joinedAt` rather than trusting a position — an ordering the rule depends
     on should be asserted by the code that depends on it.
  2. `selectActiveOrg(orgs, remembered)` replaces every `orgs[0]`. The
     remembered id is persisted beside the session (`src/api/session.ts`),
     under the same `rememberMe` convention, and **stamped with the user id**
     so the same person gets their workspace back while a different person on
     the same machine reads `null`.
  3. A remembered org that is not in the session's list — deleted, or
     membership revoked — falls back to the first available org and sets a
     flag the shell says out loud, once. Measured: after
     `DELETE .../members/:id` the org leaves `/me/orgs` and a direct read
     answers `404 not_found`, so "absent from the list" IS "revoked", with no
     extra call.
- **The switcher is what actually closes 38, and it was already screen truth.**
  screens4.md §0.4 has always said "org switcher at the bottom if the account
  belongs to multiple orgs", and the shell's own comment said the block would
  become one "the moment an account belongs to more than one org". ONB-0827 is
  what made that moment arrive. With ONE org it stays identity — a menu
  offering a single choice is the disabled-and-teasing pattern wearing a
  chevron — so STATIC mode is unchanged.
- **Switching RE-GRAFTS, it does not merely re-sync.** The org's name and, more
  importantly, the viewer's ROLE are per-org: someone can own one workspace and
  be a member of the next. Bumping the sync alone left the rail showing the old
  name and would have offered owner controls in a workspace where the user is a
  member.
- **The memory dies with the session, deliberately.** `purgeSession` clears it,
  so signing out leaves nothing behind. The rule says a SESSION opens in the
  org it remembers, and reload is what it has to survive; making it outlive
  sign-out would add a second durable record — against architecture.md's
  persistence law — and on a shared machine it would say which workspace the
  last person was in. If the founder wants "come back tomorrow and land where I
  was", that is a deliberate widening, not an oversight.
- **The fallback toast is latched.** The flag is sticky because the fallback is
  decided by the live sync, which lands after first paint — a flag that cleared
  itself would be a message nobody saw. Sticky plus a dispatch can still fire
  twice (a later sync re-sets it; StrictMode runs effects twice in dev), and it
  did: the live spec caught two identical toasts. A ref latch makes "say it
  once" true.
- Instead of: choosing the most-recently-joined org at login (it would yank a
  user out of their own workspace the moment anyone invited them), or shipping
  the persistence without the switcher (parts 2 and 3 would have been real and
  open-item 38 would still have been open, because nothing could ever change
  what was remembered for an existing user).

### 2026-08-30 — HSN-01: draft-per-tone is DELETED, and the generate body loses `options` with it

- **Provenance.** The founder's sync with Hasan (AlphaStudio upstream owner),
  2026-08-28. HSN-01 is item 1 of a series of contract-alignment orders; the
  founder supplied Hasan's reference envelope for the generate body verbatim,
  and it is recorded at the end of `Docs/api/alphastudio-shapes.md`
  ("Upstream target envelope — Hasan sync 2026-08-28"). Structure is the
  contract there; the values are Postman samples.
- **The ruling.** The "Drafts per tone" option on the Generate page is deleted
  — control, state, copy, plumbing — the same law as the ONB wizard: deleted,
  not bypassed, not flagged off. On the wire the field was `options.perTone`
  (`PostsGenerateRequest`), and upstream does not read it; removing it emptied
  the `options` wrapper, so the wrapper went too. This order's ONLY wire
  change is that removal — every other divergence from the reference envelope
  (tone `length`, our per-tone `language` and `example`, `attachedEvent`, plan
  vocabulary) is reported, untouched, for later HSN orders to converge on.
- **Probed before built, per the house Phase-0 law.** ONE generate request =
  the exact body `src/data/generate.ts` builds minus `options`, against a
  fresh isolated QA org: **202 in 1054 ms**, request
  **`ce257b64-e5e1-4b3a-a00f-74144dc9388a`**, run
  `run_9ca46bb7b3f46d355e998505` (queued; capabilityVersion now 10). Org 954
  was the ordered first choice but its owner's QA password lived only in the
  ONB session (a credential correctly never written down), so a fresh org was
  provisioned mirroring 954's four-entity setup — org **1364**
  (`qa+1788081957033hsn1@alphapromena.com`), with a sibling **1363** minted
  by an aborted first attempt (a tones-list parse bug; no generate call, no
  spend). The platform's org ids have moved past the 9xx range — 1363/1364
  are QA-isolated all the same. **Org 619 and every production org were
  untouched.**
- **What went with the multiplier, deliberately.** `MAX_FANOUT` and
  `RunPlan.overBudget` existed only to police `tones.length × perTone > 6`;
  with the multiplier gone the fan-out IS the tone count, capped at 3 by the
  picker, so the guard could never trip again. It was deleted along with
  `MESSAGES.errors.fanoutTooLarge` — whose copy named the deleted option —
  rather than left as dead coverage (the D-ONB-B rule: an unreachable failure
  mode reads as coverage and is not).
- Instead of: hiding the select behind a flag (the order forbids exactly
  that), or keeping the wire field "harmlessly" (upstream ignoring a field
  today is not a contract that it will tomorrow — the reference envelope is
  the contract, and it has no `options`).

### 2026-08-30 — HSN-02: Create visual is ONE popup, ONE post, NO retry, and attaches nothing

- **Provenance.** Item 2 of the Hasan-sync series (the founder's sync with the
  AlphaStudio upstream owner, 2026-08-28). The reference envelopes — image and
  video — are recorded verbatim at the end of `Docs/api/alphastudio-shapes.md`
  ("Upstream social-posts.media envelope — Hasan sync 2026-08-28"). Structure
  is the contract; the values are samples.
- **The ruling.** A "Create visual" action in two places — each generated draft
  on the Generate page, and each draft card on Today beside Approve and
  Decline — opens ONE modal that submits `social-posts.media` for THAT draft.
  `capability`, the single `posts[]` entry `{ref, content, tone{id, name,
  description, rules[]}}`, `params: {}` and `collection: {use: false}` are
  derived and never rendered as inputs; `kind` (no default), `plan`
  (balanced), `imgStyle` (Cinematic), `style.text`/`style.logo` (on) and up to
  six `guidance` strings are the form. The 202 is read as a LIST of jobs and
  the one job is followed through the Studio's own poller.
- **The laws, and where each lives structurally.**
  - *Single post per call* — `SocialPostsMediaRequest.posts` is a one-tuple
    and `buildPostVisualRequest` is the only builder (PROBE-INT13: the
    multi-post path bills and then 502s; single-post is the clean control).
  - *No retry, anywhere* — the submit is single-flight (`submitting` disables
    it) and a failure parks in `failed` until "Back to the form"; only a
    fresh press sends. Every failure string says a retry may bill again,
    because the `posts[]` path has created and billed a job and then answered
    502. `upstreamUnavailable` ("nothing was charged") is deliberately NOT
    used for this call.
  - *`collection.use` is false, hardcoded* — the founder's explicit word for
    this modification; no toggle exists.
  - *Guidance max six* — founder-confirmed; blanks are trimmed and a seventh
    row cannot be added.
  - *`imgStyle` is client-side curation only* — sent verbatim, upstream
    accepts any string, so the list is revisable without contract impact.
  - *The series no-testing law* — no e2e, verify, axe, live call or new spec
    of any kind this item; coverage is authored in the final-gate order.
- **Interpretations on record (each reversible in a line).**
  1. *The receipt.* The fan-out receipt has never been observed on the wire
     (PROBE-INT13, open-item 34a). `jobFromFanOutReceipt` reads the ruled
     `{jobs: [...]}`, TOLERATES a bare job (the single-job control's shape),
     and treats anything else as `unconfirmed_receipt` — accepted, maybe
     billed, not success.
  2. *The static card.* On the static D2 card the button renders in the same
     row-state as Approve and Reject (`canApprove`), so an approved static
     card keeps D4 — the demo's credits composer and its one attach path — as
     its single visual button. On the live Today card it renders on every
     card that has a draft. Rendering it on approved static cards too is a
     one-line change (drop `canApprove &&`).
  3. *The legacy control.* `live-generate.tsx`'s disabled "Create visual"
     (`visualComingNext`) was REWIRED and the notice deleted with it — no
     second path. D4's "Create image or video" and E4's "Attach to a draft"
     are the static demo's ATTACH pipeline, not create-visual controls; both
     untouched, both reported as attachment surfaces for a later order.
  4. *The poller.* E3's poll loop moved verbatim into
     `features/studio/use-job-poll.ts` and both E3 and the dialog call it —
     one machinery, two consumers. The only additions: a `timedOut` signal,
     and a guard so a restarted effect cannot leave an orphan loop behind.
  5. *The gate.* The dialog reads `useReadiness()` and renders
     `GenerationBlocked` inside itself, exactly as D4 does (D-ONB-D: a media
     job is a generation job).
  6. *Static mode* resolves through the existing Studio simulation as a
     STANDALONE job (`media/start` → `media/succeed`), labelled simulated,
     zero network — and attaches nothing, because this order attaches
     nothing.
- Instead of: a second poller inside the dialog; typing the receipt as a
  single job because that is the only shape ever seen (the ruling says list);
  defaulting `kind` to image (the two kinds cost differently); or hiding the
  tone-less case behind a fabricated tone (a draft whose tone is gone gets an
  honest refusal — `rules` are never invented).

### 2026-08-30 — HSN-03: tones gain `language` + `length`, AHEAD of the backend, behind one switch

- **Provenance.** Item 3 of the Hasan-sync series. The founder's ruling: every
  tone gains two user-chosen fields in Settings — `language` (Arabic |
  English) and `length` (short | medium | long) — which will drive generation
  on Hasan's side. **The founder's stated constraint:** the tones API persists
  only `{name, description, preset, rules}` today; Hasan adds the two later.
  So this is a DELIBERATE ahead-of-backend deviation, built honestly.
- **The interim, and its flip condition.** The two fields live in a client
  sidecar — `src/data/adapters/tone-fields.ts`, localStorage
  `ab-tone-fields:<orgId>` → `{ [toneId]: { language, length } }` — written
  by the seam on every create/update (keyed by the SERVER's tone id), retired
  on delete, and hydrated into the tone model in `fetchBrand`, the one seam
  that knows the org. The wire send is implemented and DISABLED behind
  **`TONE_FIELDS_ON_WIRE`** in `src/data/brand.ts`. **Flip condition:** Hasan
  confirms persistence → set it `true` → optionally re-save existing tones to
  backfill. Once the server echoes a field it wins over the sidecar, and an
  entry the server has fully superseded deletes itself on the next read — so
  the sidecar empties without a migration. The `description` field stays
  clean: the no-smuggling law holds.
- **The vocabulary.** `language` is `ar` | `en` — exactly what the generate
  body already sent per tone from the page picker (located, not chosen).
  `length` is `short` | `medium` | `long`: the reference shows short/long,
  `medium` is founder-stated.
- **The form (create AND edit, one `ToneEditorForm`).** `language` is
  REQUIRED with NO default — `''` until the user chooses, and an old tone
  cannot be saved until its owner says. `length` pre-selects `medium` as a
  FORM default only; the model never assumes it. Both selects are the new
  `SelectField` in `ab/form.tsx` — a native select, because it accepts an
  empty "not chosen" value and matches the product's other pickers.
- **Existing tones.** Absent values render "Not set" on the I3 card — never
  fabricated, never silently defaulted on display. In live mode the editor
  says the fields are kept in this browser for now (`toneFieldsLocal`),
  because a second device will honestly show them as not set.
- **The generate body (this order's only wire change).** `toRunTone` adds
  `length` from the tone and OMITS the key when the tone has none — closes
  HSN-01 divergence #1. Per-tone `language` keeps flowing, now
  `tone.language ?? <page picker>`: the tone's own setting wins, the page's
  picker covers only tones without one, and its helper line says so.
  Divergence #2 (the reference shows no `language`) stays recorded; the
  founder confirms Hasan consumes it later. The HSN-02 `social-posts.media`
  tone object is untouched — no `length`, no `language` there.
- **Static world.** Demo tones carry sensible values on the record itself;
  static create/edit run through the same seam and model with zero network.
  The sidecar is live-only, because static mode persists nothing by law
  (architecture.md) — that is the one place the "same path" is a different
  store, and it is the law's doing, not this order's.
- **Rider (HSN-02 acceptance).** `visualUnconfirmed` now reads: *"The
  platform did not confirm this visual. The job may already exist and may
  already have billed — check your Studio renders before trying again,
  because a retry can bill again."*
- Instead of: smuggling the fields into `description` (forbidden), sending
  them on the wire now (upstream drops unknown fields today, and a field the
  server silently ignores is a field the user thinks is saved), defaulting
  an old tone's language on display (a lie about a choice never made), or
  a Radix `Select` (it cannot represent an empty required value cleanly).

### 2026-08-30 — HSN-04: brand-kit caps as client-side ceilings, and the Knowledge upload names what it is

- **Provenance.** Item 4 of the Hasan-sync series. Two rulings and two riders.
- **Part A — caps.** Sources are capped at **10** and topics at **30**
  (`MAX_FOLLOWED_SOURCES`, `MAX_TOPICS` in `src/data/types.ts`), the
  founder's word matching the 2026-08-28 meeting record ("max sources =
  ten"). Ward's API is not changing, so these are CLIENT-SIDE PRODUCT CAPS —
  the same precedent as `MAX_POSTS_PER_DAY`. Enforced at every add path: the
  I5 screen disables the add control at the cap with an honest counter
  (`n / 10`, `n / 30`) and the catalogue message, `TagInput` grew `max` +
  `capMessage` for it, and the seam (`addSource`, `setTopics`) refuses growth
  past the cap as a validation-shaped failure so any path the screens did not
  gate still cannot exceed it. **Over-cap data is rendered, never trimmed or
  hidden** — a live org can be above a cap from another client or from
  before this order, and it keeps every row; only adding stops (`setTopics`
  refuses only lists that GROW past the cap, so an over-cap list may still
  shrink). Reachability: in the app it is unreachable after this order; on
  the wire it stays reachable through any other client. The demo datasets
  hold 3 sources and 5 topics, so nothing was trimmed. The generation gate's
  floor (≥1 of each, `readiness.ts`) is untouched — caps are ceilings.
- **Part B — the Knowledge upload.** Before any file leaves the browser the
  user chooses Image | Video | Document and gives a REQUIRED description.
  The choice filters the picker's `accept` list AND the chosen file's real
  MIME is checked against it (`checkKnowledgeFile`) — a mismatch, or a
  browser that reports no type, is an inline error and nothing is sent. The
  old live path's `text/plain` fallback for unknown types is GONE: that was
  a silent coercion. One form (`knowledge-upload-form.tsx`) serves the live
  screen and the static demo; the demo says it is simulated and keeps its
  honest verdict (an image still fails to extract, as the wire did).
  Accept lists, verbatim: image `image/png, image/jpeg, image/webp`; video
  `video/mp4`; document `application/pdf, text/plain, text/markdown,
  application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  (= the extractable set the smoke run proved). Image and video may be
  refused by the RAG door upstream — that is the wire's truth to show, and
  the final gate's to observe.
- **The presign body, and the NO-switch rationale — with a correction on
  record.** The Knowledge upload's presign now carries `desc` beside
  `mediaType` (`{ filename, mediaType, desc }`), per Hasan's 2026-08-28
  envelope (`Docs/api/alphastudio-shapes.md`, "Upstream presign envelope").
  Sent with NO disable switch — the founder's explicit word, the opposite of
  HSN-03 — on the reasoning that this door is already broken (open-item 43)
  and the new shape is the leading fix. **Phase 0 found the premise does not
  hold for this door:** the Knowledge upload uses the RAG presign
  (`POST …/rag/collections/:id/sources/presign`), which the 2026-08-30 sweep
  showed HEALTHY (`ok 201`); the broken door of open-item 43 is the media
  presign (`POST …/media/assets/presign`, `uploadReferenceImage`), which has
  no UI caller today. So `desc` is being added to a working call whose
  tolerance of an extra field is unobserved. Built as ruled, because the
  ruling was explicit and Ward mirrors his side; the one-line revert is the
  `desc` key in `uploadFile`'s body, and the final gate probes both doors.
  The other presign callers were located and TOUCHED NOTHING: (1)
  `uploadReferenceImage` — `POST …/media/assets/presign` body
  `{ mediaType }`, no caller in `src/`; (2) `scripts/smoke-alphastudio.ts`
  — the same media body and the RAG matrix `{ filename, mediaType }`.
- **Rider 1.** `previewTone` sends `language: tone.language ?? 'en'` (both
  the tone's and the request's `language`, which the body carries twice), and
  the editor passes the chosen language — an Arabic tone previews in Arabic.
- **Rider 2.** From this order on, every close-out attaches the verbatim
  `git ls-remote --heads origin` receipt: the repo is private, and the
  receipt replaces the public verification channel.
- Instead of: trimming over-cap data (a silent delete), hiding it (a lie
  about what the org has), coercing an unknown file type to `text/plain`
  (the old behaviour), or a switch on `desc` (ruled out by name).

### 2026-08-30 — HSN-FINAL: the series gate — both doors probed, the deferred coverage, one gate-found fix, and the deploy that Vercel blocks

- **Provenance.** The founder closed the Hasan series at four items and made
  this order its single consolidated gate: the testing the series law
  deferred lands here, then ONE ff merge to `main`. House law back in force —
  probe-first, two-round live suite with round 2 as the merge gate, decisions
  logged, report-and-stop.
- **Phase 0, measured not argued (fresh QA org 1415, presign only, zero
  spend).** P1: the media door WITH Hasan's `desc` answered **201**; the
  08-17-era body without it answered **400** on the same org in the same
  minute — **the missing `desc` was open-item 43's regression**, one field,
  not a broken route. Item 43 is SOLVED-PENDING-WARD-CONFIRM and the Ward
  message's item 3 is rewritten to say so. P2: the RAG door with `desc`
  answered **201** — HSN-04's built shape stands and the documented one-line
  revert was NOT flipped. Observation, not a change: the RAG door refuses
  `image/png` and `video/mp4` even with `desc` ("a media type it cannot
  extract"), so the Knowledge form's Image and Video choices are refused
  inline by the wire — the honest behaviour it was built to show, and
  Hasan's side to widen. Verbatim record in `alphastudio-shapes.md`.
- **What the coverage was shaped to prove, and where each claim lives.**
  Static e2e (`e2e/hsn-series.spec.ts`) proves what a user can reach in the
  demo: both Create visual entry points, the refused blank kind, the guidance
  cap, the single flight, the simulated lifecycle, that nothing is attached,
  the reset on reopen, axe on the modal; the required tone language and the
  form-only length default; the caps' counter, disabled add and shrink; the
  Knowledge form's filter, real-MIME refusal and required description. Unit
  tests hold what the demo cannot reach: the sidecar's hydrate/retire/prune
  rules, the caps at the seam THROUGH the real provider (so the reducer and
  the seam are tested together), `checkKnowledgeFile`, the visual body, the
  receipt tolerance incl. `unconfirmed_receipt` and its bill-again copy, and
  the generate body's language/length sourcing with no `options`. Three
  things are deliberately NOT in static e2e and say so in the file header:
  the `unconfirmed_receipt` copy (a live failure path), a tone reading "Not
  set" (only a pre-HSN-03 live tone can), and the paid render
  (`live-create-visual.spec.ts`, gated on `LIVE_MEDIA`, authored and not
  exercised — the wire was proven by HSN-02's trail and this gate's probes).
- **The gate found a defect in HSN-02, and it is fixed, not reported around.**
  The popup's Cancel/Close/Done called the parent's `onOpenChange` directly;
  Radix reports only an open-change IT initiated (Escape, the overlay), so
  the state machine never reset — reopening the popup, even for a different
  draft, showed the last result. `close` now resets first. And the static
  simulation's timer is no longer cancelled on close: the demo's job settles
  whether or not the dialog is open, which is what the copy already promised
  ("it keeps going if you close this"); only the dialog's own state is gated
  on the epoch. Two small changes, both making a documented law true.
- **The stale specs were updated for the new steps, not loosened.** Four
  tests learned HSN-03/04's required steps (choose a type and describe the
  upload; pick a language) and assert MORE than before (the row carries its
  type and description). The one whose PNG used to be declared a document
  now declares it an image, because a PNG declared as a document is refused
  before it is listed — and that refusal is its own test.
- **The deploy Vercel will block — a founder decision, flagged not worked
  around.** Every deployment since the repo went PRIVATE (between HSN-02 and
  HSN-03, 2026-08-30) is `BLOCKED`, error link "troubleshoot project
  collaboration → team configuration". Vercel's rule, verbatim: *"The Hobby
  Plan does not support collaboration for private repositories. To deploy
  commits under a Hobby team, the commit author must be the owner of the
  Hobby team."* Commits here are authored by `qus0i`; the Hobby team's owner
  is `alphapromena`. So the ff merge — which the order authorises on a green
  round 2 — will land on `main` and `live` but PRODUCE NO DEPLOYMENT until
  one of three founder moves: make the repo public again, move to Pro and
  add the author, or author commits from the owner's GitHub identity.
  Production keeps serving the pre-merge commit meanwhile; nothing breaks,
  nothing ships. The merge goes ahead because it is what the gate authorises
  and it is safe; the deploy is not this order's to force.
- Instead of: skipping the probes because HSN-04 had already committed to
  `desc` (the founder's word, and the control call is what made P1 a verdict
  rather than a hope); leaving the reset bug as a "static-only quirk" (it is
  live too — reopen on another draft after a live run shows the old asset);
  re-authoring commits under the owner's identity to get past Vercel (an
  attribution the founder decides, not the agent).

### 2026-08-31 — the repo is PUBLIC again, by the founder, to clear the Vercel block

- **The founder's decision, on record (ORDER HSN-FINAL/5).** HSN-FINAL merged
  the series (`main` = `01a249a`, gated round 2 16/16) but Vercel BLOCKED
  both deployments: the Hobby plan deploys a private repo only for commits
  authored by the team owner, and the repo had been private since mid
  2026-08-30. Of the three unblock paths the gate laid out (public repo, Pro
  + member, owner-authored commits), the founder chose reverting the repo to
  PUBLIC. Blocked deployments stay blocked, so the commit carrying this note
  is itself the fresh git event that re-triggers production and the `live`
  preview; Phase 5's verification runs against what it produces.
- Instead of: upgrading to Pro (a billing decision nobody ordered) or
  re-authoring commits under the owner's identity (an attribution change the
  gate had already declined to make on its own).

### 2026-08-31 — CUT-0831: two Generate controls die, and the preset concept with them

- **Provenance.** The founder's ruling from the 1.malaky.ai screenshots: the
  page-level Language picker and the "Anything to steer it?" box must not
  exist, and the preset concept — abolished for seeding in ONB-0827 but
  surviving as code (the Settings "Presets" section, the kind badge, the
  undeletable rows) — dies in code. The 8 legacy rows in org 619 (the old
  wizard Finish ran twice — the trap 19/20 fingerprint) die by the founder's
  hand after deploy, not by code.
- **Probed before built (fresh QA org 1485; org 619 untouched; zero spend).**
  P1: today's create body with `preset: true` → **201** (tone 1881, request
  `6988e345-6d58-41d1-8df5-22f69a205312`). P2: `DELETE` that row → **204**
  (request `c5a43e72-5af5-4614-bfea-4a1d611877d1`), and the list read back
  empty (request `bc4d7f1a-b6a6-4efa-b9ea-e796ef138f9a`). The wire deletes a
  preset row, so item 3 shipped in full and the founder's post-deploy manual
  delete of the 8 rows will work. The probe row was its own cleanup.
- **Item 1.** The steering box never reached the wire (its own copy said so);
  the control, its state and `generateNotesPending` are gone, and the body
  builder's unit test now asserts the body's CLOSED key set
  (`{plan, slot, tones}`) — the before/after bodies are byte-identical by
  construction, not by care.
- **Item 2, and its interim consequence.** Per-tone `language` is the tone's
  own, full stop: `GenerateInput` takes `RunnableTone` (a `Tone` whose
  `language` is set), the `?? picker` fallback is deleted, and no default
  language exists anywhere on the wire. A tone with no language renders as a
  DISABLED, dashed, muted chip — receding via tokens, never opacity (trap 3)
  — and cannot be selected; when nothing is selectable, one line above the
  chips says what unlocks generation. `previewTone`'s `'en'` default is
  preview-only and stays. Readiness (D-ONB-D) is untouched — it counts
  tones, not languages. **The interim, on record as ordered:** until Hasan
  persists `language` and the founder's post-deploy re-save backfills it,
  the field lives in the per-browser sidecar (HSN-03) — so a member on
  ANOTHER browser sees every tone as "Needs a language — set it in
  Settings › Tones" and cannot generate until they set it there (their
  sidecar then carries it). That is the honest cost of no-default, chosen
  over inventing a language the tone was never given.
- **Item 3, and its interpretations.** `Tone.kind` is deleted from the
  model; the wire's `preset` field is READ AND IGNORED (it still arrives on
  every row) and the bodies are frozen by `brand-wire.test.ts`: create keeps
  `preset: false` byte-for-byte, PATCH never carried it. Interpretations,
  each reversible in a line: (1) the demo worlds' five sample rows KEEP
  their ids, values and languages as ordinary tones — the constant renames
  `PRESET_TONES → SAMPLE_TONES` because a constant named "preset" is the
  concept surviving; the demo-world data question stays parked as ordered.
  (2) The reducer's preset-delete refusal goes, which re-opens the known
  stranding of open-item 37 (a delete can empty an active schedule) — noted
  there, not fixed here, per "no drive-by". (3) `ToneBadge` takes only a
  name: the identical-rendering law is now STRUCTURAL (the type cannot
  express a second-class tone), and its test now guards the one thing left —
  no decoration around the name. (4) The "Create custom tone" button label
  and `noCustomTones` catalogue copy stay — renaming them is UI copy the
  ruling did not touch, and four specs hang off the label. (5) screens4.md
  still describes I3 with presets; the founder's ruling supersedes it and
  this entry flags the contradiction rather than editing the product doc
  silently. (6) No seeding code survived ONB-0827 — confirmed by grep, as
  the order asked.
- Instead of: hiding the two controls behind flags (the ruling says not
  exist), keeping `kind` as a vestigial field "for compatibility" (a concept
  that survives in the type survives), trimming the demo tones (a data
  change the order parked), or re-adding a delete guard for empty schedules
  (open-item 37 is a recorded decision for a future order, and the founder's
  own hand-delete of 8 rows must not be second-guessed by the client).

### 2026-08-31 — MED-0831 Phase 0: the media door measured, and two premises the wire has moved past

- **Provenance.** ORDER MED-0831 — the media presign door: Knowledge
  uploads and the org logo. Rulings H1–H5 and W1 are FINAL, from Hasan in person
  (2026-08-31), confirmed by the founder. This entry records Phase 0's probe
  interpretations and the measured facts that bear on later phases; the
  build decisions land with their phases. On branch `feat/med-0831` off
  `main` (`7b7222d`), pushed before work began, per the order.
- **Probe interpretations, each on record.**
  1. *P3 ran in the middle of P2* — between the byte `PUT` and the `DELETE` —
     so the list and jobs reads happened while a real uploaded asset existed:
     the strongest version of "does the list see it" and "do uploads appear
     as jobs". The order sequences P3 after P2; the reordering strengthens
     the measurement and changes no call.
  2. *A P3b supplement was added beyond the ordered probes* (fresh org 1612,
     zero spend: one presign, two list reads, one delete): does a
     NEVER-uploaded presign appear in the assets list? It does — the row is
     minted at presign time, so a failed `PUT` leaves a phantom row. Phase 2
     must know this; measuring it now cost four free calls.
  3. *The docx `mediaType`* is the app's own `EXTRACTABLE_MEDIA_TYPES` value
     (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`),
     matching every prior probe.
  4. *Two orgs, not one* — the supplement ran as its own script with a fresh
     identity (1612) rather than reusing 1611's token, which was not kept.
     Both are QA-isolated; org 619 untouched. The order expected the 14xx
     range; the platform is minting 16xx now — recorded, same isolation.
- **Measured facts that later phases must respect (verbatim record in
  `Docs/api/alphastudio-shapes.md`, "MED-0831 Phase 0").**
  - *The gate conditions Hold:* P1 answered **201 for png/jpeg/webp/mp4**
    (and for pdf, plain, markdown, docx — all eight), and P2's chain is
    clean end to end (201 → PUT 200 → read-presign 200 → GET 200 → DELETE
    204 → re-presign 404 `not_found` "Asset not found").
  - *H4 is a product allowlist, not a wire constraint:* the door filters
    nothing by type at presign time. The app's four-type limit is ours to
    enforce (H1 routes documents to the RAG door), and the record says so.
  - *H2's premise has moved:* `GET …/media/assets` answered **200, not
    502** — Ward item 4 appears fixed. The row shape is
    `{assetId, kind, desc, meta.synthetic}`: NO `mediaType`, NO date. So the
    ruled sidecar interim (`MEDIA_LIST_ON_WIRE = false`) is built as ruled,
    and whether to flip the switch — knowing the wire list cannot fill the
    row's date column and only kinds the type — is reported at the Phase 2
    gate for the founder, not decided here.
  - *Phantom rows exist:* a presign minted and never uploaded appears in the
    list until deleted. Phase 1's law that a failed PUT reports the minted
    asset id gains a second purpose: the id is the cleanup handle.
  - *Uploads never appear in `GET …/media/jobs`* (`{"jobs": []}` beside a
    live uploaded asset), and never-uploaded assets DELETE cleanly (204 × 8).
- Instead of: skipping the document-type presigns because H1 keeps documents
  off this door (the order says measure the full list for the record), or
  treating the 200 list as licence to skip the ruled sidecar (the ruling is
  final; the premise change is the founder's to re-rule at a gate).

### 2026-08-31 — MED-0831 Phase 1: one uploader, and the go's two re-rulings on record

- **Provenance.** The founder's go on the Phase 0 report (2026-08-31), which
  carried two rulings beyond the standing order:
  1. *Merge order — stack, don't wait.* `feat/med-0831` is REBASED onto
     `origin/feat/cut-0831` (`aa6162e`) and Phases 1–3 build on top.
     CUT-0831 gates and ff-merges first; MED follows as a straight ff. If
     cut's tip moves, `rebase --onto` the new tip and report the hash; no
     conflict is ever resolved silently.
  2. *H2 re-ruled — the wire wins from day one.* NO media-uploads sidecar,
     NO `MEDIA_LIST_ON_WIRE`, and W1's org-logo sidecar
     (`ab-org-logo:<orgId>` behind `ORG_LOGO_ON_WIRE`) goes too:
     `GET …/media/assets` is the list for both. The logo is the row whose
     `desc` is `"logo"` (H3); more than one such row is SAID, never picked
     from. "Files" shows desc, kind, Open (read-presign on click), Delete —
     no date column and no exact MIME until the wire row carries them (asked
     of Ward). `meta.synthetic`'s interpretation must be logged when Phase 2
     reads it. A 502 from the list renders as itself — no local memory of
     what was uploaded. A failed PUT deletes the asset it just minted — one
     call, no retry — and the report carries the id either way.
- **The rebase, performed and recorded.** `git rebase --onto
  origin/feat/cut-0831 main feat/med-0831` hit the EXPECTED conflicts in the
  two append-only logs (`.agent/decisions.md`, `.agent/sessions.md`) — both
  branches appended entries at EOF. Resolution, in the open: BOTH entries
  kept, CUT-0831's first (chronological), one blank line restored at each
  seam; not a word of either entry changed, nothing else touched. Pushed
  `--force-with-lease`; the rebased Phase 0 commit is `a22bec8` on top of
  `aa6162e`.
- **The ruling (Phase 1).** `uploadMediaAsset(file, mediaType, desc)` in
  `src/data/studio.ts` is the ONE uploader for every media-door caller:
  presign `{ mediaType, desc }` → `uploadToPresignedUrl` with the TICKET's
  `uploadUrl` and `mediaType` → `{ assetId, mediaType }` back. `desc` is
  required at the type level — no caller can omit it. No read-presign in the
  chain: a download url is minted only on demand through the existing
  `assetUrl`. No retry anywhere. `uploadReferenceImage` is folded in and
  DELETED — grep confirms it had no caller under `src/`.
- **Interpretations on record (each reversible in a line).**
  1. *The result type.* `UploadMediaAssetResult` — success
     `{ ok: true, assetId, mediaType }` carrying the TICKET's `mediaType`
     (the value storage signed), failure the house `Failure` shape plus
     `assetId?` and `cleanup?: 'deleted' | 'left'`; `requestId` travels on
     API failures, the `createPostVisual` precedent.
  2. *The cleanup DELETE's own failure is absorbed, not reported over the
     PUT's.* The PUT's error is the one the user acts on; the cleanup's
     outcome only sets `cleanup` — `deleted` (the phantom row is gone) or
     `left` (the id is the handle for a later delete). One DELETE, never
     retried, per the go's wording.
  3. *A non-ApiError still throws* — the house `toFailure` law: only wire
     shapes become results; a programming error surfaces as one.
  4. *The unit tests live in `src/data/studio.test.ts`* — the stack ruling
     makes the CUT-shared file safe to edit. Four tests: the closed presign
     body (`toEqual` is a closed key set), presign-before-PUT order with the
     ticket's own values and NO second api call on success, the failed-PUT
     delete-once-and-carry-the-id law (both cleanup outcomes), and the
     failed-presign case (nothing minted, nothing PUT, nothing deleted).
- Instead of: keeping `uploadReferenceImage` beside the new uploader (two
  doors to one route; the order says folded in and deleted), returning the
  caller's `mediaType` on success (the ticket's is the signed truth),
  retrying the cleanup DELETE (the go says one call), or parking the unit
  tests in a new file to dodge the CUT overlap the stack ruling dissolved.

### 2026-08-31 — MED-0831 Phase 2: the Knowledge doors split, and Files reads the wire

- **Provenance.** The founder's Phase 2 go (2026-08-31), which added: the
  asset list is read LAZILY — when Knowledge (and later Organization) opens,
  never in the bootstrap burst; after a Delete the wire list is re-read; no
  local ledger of any kind; "Files" is uploads only — exclude the
  `desc: "logo"` row, apply the `meta.synthetic` interpretation once read in
  anger and log it; Document stays on the RAG path byte-for-byte.
- **The routing (H1) is ONE type guard.** `isMediaUploadKind` in
  `src/data/studio.ts` — image and video are media assets
  (`uploadMediaAsset`: presign with the form's description as `desc`, then
  the PUT, done — no registration call), a document is the RAG call it has
  always been (`uploadFile`, byte-for-byte — the diff shows no edit to it).
  Both screens read the guard, so the routing is structural. Url and
  pasted-text sources untouched.
- **The `meta.synthetic` interpretation, ON RECORD (`isUploadedMediaFile`).**
  What was read in anger: Phase 0 measured every UPLOAD as
  `synthetic: false` (orgs 1611/1612); a RENDER's list row is unobservable
  without paid spend, so its value is still unmeasured. The filter therefore
  excludes only what is POSITIVELY marked `synthetic: true` and shows
  `false` or absent — if the flag turns out not to separate uploads from
  renders, this degrades to exactly the ruled fallback (show what the wire
  gives). The logo row (`desc === "logo"`, `LOGO_ASSET_DESC`) is excluded as
  Organization's. Revisit the flag when the founder's LIVE_MEDIA render
  makes a render row observable.
- **The Files section (`media-files-section.tsx`, shared).** A row is what
  the wire carries and no more: description (falling back to the asset id),
  the kind word, Open (LIVE only — read-presign on click through `assetUrl`,
  about an hour, opened in a new tab), Delete (confirm, then the DELETE,
  then re-read the list). No date column, no exact MIME — asked of Ward. On
  a list refusal the section renders `mediaListUnavailable` and NOTHING
  else: the error state structurally precedes the rows, so a stale list
  cannot masquerade as current. The read is a per-org effect in the screen —
  the lazy trigger is the screen opening.
- **Interpretations on record.**
  1. *The form no longer waits on the RAG collection* (`disabled={busy}`,
     was `busy || !collectionId`): the media door needs no collection, and
     gating an image upload on an unrelated RAG failure would couple the
     doors H1 separates. The document branch still requires it and reports
     honestly when it is missing.
  2. *Failure copy names the phantom row's fate.* `mediaUploadFailedCleaned`
     (the one cleanup DELETE succeeded — nothing kept) vs
     `mediaUploadFailedLeft` (the slot may still be listed under Files — its
     own Delete is the handle), the minted id appended at the site either
     way. "Try again" is safe copy here — presigns and PUTs are not billable
     — unlike a render's bill-again warnings.
  3. *The upload success toast says what happened and no more* — "Uploaded —
     the studio has it now", against RAG's "Added — we are reading it now":
     the media door has no ingestion to claim.
  4. *The static world mirrors the wire's shape* — `MediaFileRecord`
     (assetId, desc, kind) on the Dataset (`src/data/types.ts` touched: the
     world gained a collection — a deliberate reconciliation-point change),
     reducer actions `media/upload` and `media/delete`, rows landing WHOLE
     because the media door has no lifecycle. All seven seeds start empty
     (the three base datasets carry `mediaFiles: []`; the derived four
     spread them) — populated is reached by uploading, and the parked
     demo-data question stays parked. No Open in the demo: it keeps no
     bytes, and a control that can never work is disabled-teasing.
  5. *Live mode never dispatches the static actions* — the wire list is the
     only live record, per the ruling; the reducer comment says so.
- **Deferred to the gate, by the phase law (build hygiene only):** the
  static specs this routing knowingly strands —
  `compose-analytics-settings.spec.ts` (the knowledge lifecycle's PNG half:
  declared an Image it now lands in Files instead of failing extraction) and
  `e2e/hsn-series.spec.ts` (the Knowledge form walk) — are updated at the
  gate with the rest of the suite, the HSN series pattern.
- Instead of: keeping the collection gate on the whole form (couples the
  doors), a `MEDIA_LIST_ON_WIRE` switch or any sidecar (re-ruled away), a
  date column fed by local memory (the ruling says no local ledger — the
  wire has no date, so neither do we), or hiding absent-`synthetic` rows
  (would let the filter silently eat wire truth).

### 2026-08-31 — MED-0831 Phase 3: the logo lives on the wire, H5 flips the collection in, and "logo" is reserved

- **Provenance.** The founder's Phase 3 go (2026-08-31) with three additions:
  (1) "logo" is a RESERVED description in Knowledge — refused trimmed,
  case-insensitive, with an honest message; (2) more than one `desc: "logo"`
  row renders EVERY row with its own Delete, Upload/Replace disabled until
  one or zero remains, never pick; (3) live mode shows the WIRE's logo —
  read-presign on screen open (lazy, not bootstrap), the local preview only
  bridges until the upload lands, other members see the same logo, and the
  sidebar keeps today's behaviour with no new bootstrap read (measured:
  the rail shows the Malaky wordmark, not the org logo — nothing to change).
- **The live logo (`org-logo-live.tsx`, H3 + W1 as re-ruled).** The logo is
  the asset whose `desc` is exactly `"logo"` in `GET …/media/assets`, read
  when the Organization screen opens and read-presigned (~1 h). Upload =
  `uploadMediaAsset(file, file.type, LOGO_ASSET_DESC)` with a real-MIME
  check (png/jpeg/webp; the square hint stays). Replace = DELETE the old
  asset FIRST, then upload — a failed delete STOPS the replace and says so;
  nothing retries, and a second logo is never uploaded beside a first.
  Remove = DELETE + clear. The status line beside the buttons speaks the
  ruled vocabulary: "Sent to the studio." · "Not sent — <the error>", the
  phantom-slot id appended when the uploader's cleanup could not delete it.
  It sits OUTSIDE the form's save bar, the country's precedent (D-INT-F): a
  field with its own wire calls must not ride an all-or-nothing commit.
- **Interpretations on record.**
  1. *Upload/Replace is also disabled while the list is unread or refused*
     (not only in conflict): Replace must know what it deletes, and an
     upload against an unknown list could mint a second logo row blind. The
     refusal line says why the button is dark.
  2. *The wire match is EXACT `"logo"`; the reservation check is
     case-insensitive.* We only ever mint the exact marker, and inventing
     breadth on the wire side could adopt another client's near-miss row as
     the logo; the form-side reservation is deliberately wider so a user's
     " Logo " cannot near-collide with a marker they cannot see.
  3. *The bridge clears on failure and on the wire's answer* — a preview of
     a logo that is not stored would be a lie; after a successful upload the
     re-read + presign replaces it, which is also what every other member
     sees.
  4. *The conflict rows are labelled by asset id* (the wire's only handle —
     every row's desc is the same word), each with its own Delete; the
     `logoConflict` line says Malaky never guesses which is current.
- **H5, flipped and logged.** `VISUAL_COLLECTION = { use: true }` — ONE
  constant, no toggle; `buildPostVisualRequest` carries it and one unit test
  pins both the value and the identity. This REVERSES HSN-02's
  `collection.use: false`, which was itself the founder's word — the
  reversal is his, in person, 2026-08-31 (rulings final). The type
  (`SocialPostsMediaRequest.collection`), the HSN-02 comments and the shapes
  doc's envelope note now say so (the old line kept, marked SUPERSEDED).
  **The first proof that a render actually draws on the collection is the
  founder's own `LIVE_MEDIA=1` render** — nothing in this order spends to
  prove it.
- **"logo" reserved in Knowledge (addition 1).** `isReservedMediaDesc` in
  `src/data/studio.ts` (trimmed, lowercased, equal to `LOGO_ASSET_DESC`),
  called by the shared form between the required-description check and the
  file check; `knowledgeDescReserved` names where the logo actually lives.
  Only the marker itself is refused — a description that merely mentions
  "logo" passes (unit-tested both ways).
- **The copy.** "It is shown beside your name, never inside a post" is
  deleted — H5 makes it false by design. Shipped in BOTH modes: **"Square
  works best. It is kept with your brand files."** — the one claim the wire
  provably keeps today. The stronger line ("…so your visuals can use it")
  is PROPOSED in the report and waits on the founder's render proof, per
  "do not invent a claim the wire cannot keep".
- **Static world unchanged:** the FileReader data-URL flow, the save bar,
  zero network — only the hint line moved to the new copy.
- Instead of: picking the newest logo row in a conflict (ruled out by
  name), uploading before deleting on replace (would stand two rows on the
  wire mid-flow), auto-retrying the failed delete (no retry anywhere), a
  sidebar read of the asset list (no new bootstrap read, and the rail never
  showed the org logo), or shipping the "visuals can use it" claim before a
  render proves it.

### 2026-08-31 — MED-0831 gate ABORTED by the founder, and MED-0831/R ships on the fast path

- **The gate, as far as it ran.** verify:w00–w06 **all PASS** at the gated
  tip `2205261` (each behind a full TIME_WAIT drain; 519 unit and a
  102/67/0 static suite inside every one). The live round was attempted
  three times and the founder ABORTED the gate mid-third: attempt 1 died on
  a Windows-shim-mangled `--grep` ("No tests found"); attempt 2 adopted an
  orphaned dev server and was killed; attempt 3 ran clean until orphaned
  CHILDREN of the killed attempts (playwright + vite survive a parent kill
  on Windows — trap 22's sixth shape, recorded in sessions) shared the port
  and poisoned everything after `live-country`. What RAN CLEAN and stands
  as the record, no classification needed (the founder's word):
  **live-auth 7/7** (solo, clean environment, 1.1 m), **live-brand-rules
  5/5**, **live-country 4/4**, live-create-visual 3 skipped (LIVE_MEDIA
  off). No other file produced a clean run.
- **The founder's fast-path ruling (2026-08-31, Hasan in the room), verbatim
  in effect:** stop the gate; build the `role` rider; run lint · typecheck ·
  unit ONLY (build hygiene so the Vercel build cannot fail — not a gate);
  NO e2e, NO verify, NO live spec; merge and deploy WITHOUT the eye-pass —
  **Hasan reviews on production, and a wrong assumption must fail visibly
  there, never silently.** The merge is two recorded ff steps: `main` →
  `feat/cut-0831`'s tip (CUT-0831 ships under the same ruling), then →
  `feat/med-0831`'s tip.
- **MED-0831/R — the assumptions, on record (Hasan delegated the answers;
  founder-approved; ASSUMED until his production review; also in
  `alphastudio-shapes.md`, "MED-0831/R"):**
  - *A1* — the presign field is `role`, only value `"logo"`; a non-logo
    upload OMITS the key, never null. Built as a closed body either way
    (`uploadMediaAsset(file, mediaType, desc, role?)`), unit-asserted
    including the never-null law by name.
  - *A2* — whether the list echoes `role` is unknown: read when present;
    the org logo sends BOTH `role: "logo"` and `desc: "logo"`, and the
    exact-desc lookup + H3's conflict rule stay the read side.
  - *A3* — the same role serves the org logo and logo-MARKED Knowledge
    images (partner/product marks), which stay in Files with a `logo`
    badge only when the row echoes the role; the "logo" description
    reservation stays.
  - *A4* — Knowledge's mark is a checkbox, "This image is a logo", Image
    only, never Video, unchecked by default — and it RESETS when the kind
    changes, so a hidden-but-checked box can never send a role for a video
    or a document (`uploadRoleFor`, the one routing function, unit-tested
    across all kinds). Organization always sends the role, no control.
- **Also in the rider:** open-item 44 rewritten — the `logoAssetId` request
  DROPPED (superseded by list-as-record + `role`), `createdAt` + `mediaType`
  still asked of the row, and "does the list echo `role`?" added for Hasan.
- Instead of: probing the door with `role` before shipping (the founder
  ruled the production review IS the probe), a select for future roles (one
  value exists), sending `role: null` for non-logos (A1 forbids it by
  name), or gating the ship on the aborted round's unread files (the
  founder's word closes the gate).

### 2026-09-02 — BIL-0902 Phase 0: billing probed on org 1670, and the shapes get their own file

- **The ruling (founder-approved, logged as the order asked):** billing
  probes live in **`Docs/api/billing-shapes.md`**, their own file, because
  `pnpm smoke:alphastudio` overwrites `alphastudio-shapes.md` wholesale and a
  re-run would erase the billing record. `pnpm probe:billing`
  (`scripts/probe-billing.ts`, a Node script outside `src/`) writes it.
  Ward's guide is committed verbatim at `Docs/api/billing-frontend.md` — his
  words, not ours. `Docs/api/api.md`/`openapi.json` are NOT refreshed here:
  the Billing section lives in the backend repo and was not supplied.
- **What was measured, on fresh QA org 1670 (all request-ids in the file):**
  plans `{plan, name, amountCents, currency, interval}` × 2 — names AS
  DELIVERED are **"Malaki Base"** and **"Malaki Pro"** (misspelled in
  Stripe; rendered as is, the fix belongs in the Stripe dashboard);
  `base=50000 usd/year`, `pro=80000 usd/year`. Subscription at `none`: every
  guide field PRESENT — `plan` and the four stamps `null`,
  `cancelAtPeriodEnd: false`. Credits `{items: [], total: 0}` with and without
  `limit/offset` (accepted, not echoed). Wallet **zeros**. Member reads: all
  200. `POST /checkout {plan:"gold"}` → **400 `validation_failed`**; as a
  member → **403 `forbidden`**; as the owner → **201 `{url, sessionId}`**,
  host `checkout.stripe.com`, `cs_test_…` (66 chars), url NEVER opened, the
  session abandoned; subscription and wallet unchanged afterwards. Extra:
  `POST /portal` on the never-subscribed org → **201 `{url}`** (a portal
  exists even at `none`; the product still offers it only where the guide's
  table says Manage billing).
- **No contradiction with the guide.** One premise of OURS moved: INT-9's
  "an all-zero wallet is funding pending" is **superseded** — the sandbox
  funds nothing at creation any more, and Ward's model says zeros mean
  "never subscribed". Phases 1–3 build on that.
- **Interpretation on record:** the checkout `url` and `sessionId` are
  recorded as their SHAPE (host, prefix, length), not verbatim — the same
  precedent as tokens and presigned urls in `alphastudio-shapes.md`; a Stripe
  test-mode link is harmless but it is still a link into a payment page.
- **A member-role account WAS cheap:** a second QA user, verified with
  `000000`, invited as `member` — added at once (D-ONB-F's
  `invitedNewUser: false`). Probe 6 ran.
- Instead of: appending to `alphastudio-shapes.md` (erased on the next smoke
  run), or opening the checkout url "just to see" (a payment page opened is
  a session the founder did not ask for).

### 2026-09-02 — BIL-0902 Phases 1–3: billing on the wire — the seam, the two routes, and the reactions

- **The seam (`src/data/billing.ts`).** `createBillingActions(live)` behind
  `useBillingActions()`: `listPlans`, `getSubscription`, `listCredits`,
  `createCheckout(orgId, plan)`, `createPortal(orgId)` — every call takes an
  EXPLICIT org id because the two Stripe return routes carry the org in their
  query and that id is authoritative there. The wallet read is the EXISTING
  one (`useWalletActions().refresh()` / `useWallet()`); nothing reads it a
  second way. Failures are `AuthActionResult`'s shape, switched on `code`;
  the two POSTs are single-shot (one click → one call →
  `window.location.assign(url)`; a failure returns the button, and a second
  click is the user's). Types are OURS (above the proxy divider in
  `src/api/types.ts`), transcribed from `billing-shapes.md`; the credit ROW is
  the guide's, marked unobserved until a real test payment.
- **Static mode** answers the wire's SHAPE with zero network: two demo plans
  (`Base`/`Pro`, 50000/80000, usd, year — the names are the demo's, the
  prices mirror the sandbox), subscription `none` with the full field set,
  credits empty. The demo's Subscribe assigns the SAME route Stripe would
  return to (`/billing/success?orgId=…&session_id=demo`) so one code path
  walks both modes, and the success page in static says "Nothing was paid".
  **No demo wallet in cents** — the demo's currency is its credits ledger
  and the two never convert (D-INT-E); the order's "wallet demo" is read as
  "the demo must not pretend".
- **Two routes, named exactly as the backend hard-codes them:** `/billing`
  and `/billing/success`. Both read LAZILY on open (the MED-0831 pattern —
  never at bootstrap), scoped to the query `orgId`.
- **The `orgId` interpretation (the order asked for it):** no query → the
  active org; the active org → as is; **another org this session belongs to
  → the app SWITCHES to it** (`org/setActive`, the rail switcher's own
  D-ONB-F mechanics — the user came back from paying for THAT workspace and
  should be standing in it) and the page says "Showing billing for <org>";
  **an org this account is not a member of → no call is made** and the page
  renders "Not your workspace" with the way to its own billing. Static: the
  demo org's id, same rule.
- **The status table** (`billing-view.ts`, unit-tested line by line):
  `none/canceled/incomplete/incomplete_expired` → plans + Subscribe;
  `active/trialing/paused` → Manage billing; `past_due/unpaid` → the banner,
  then Manage billing. A status this build has never seen maps to Manage
  billing AND the raw word is always rendered as the badge — a wrong
  assumption fails visibly. `409 conflict` on checkout flips the page to
  Manage billing and re-reads the subscription ONCE (a GET, not a retry).
- **Owners subscribe and manage; any member reads** — as
  `useBillingPermissions()`: the viewer's role equals the workspace's
  protected tier (`owner` live; `admin` in the demo, which has no owner
  tier — `useTeamPermissions`'s own rule). Members see the plans and the
  honest line; no disabled-and-teasing button.
- **The legacy static billing screens (H1 `/billing/plans`, H2
  `/billing/subscription`, H4 `/billing/return`) are the DEMO's only from
  this order.** In live mode they `Navigate` to `/billing` — a page offering
  $29-a-month plans and a Cancel that cancels nothing would lie in front of a
  real subscription; the `billingStatic` note they wore is deleted. The
  demo keeps them whole (credits ledger, past-due world, `verify:w05`'s
  structural checks), reached through the header chip, whose static
  destination becomes `/billing/subscription` (H2 was always its job). H3
  `/billing/balance` stays in both modes. Retiring H1/H2/H4 from the demo is
  a separate founder decision, not this order's.
- **Zeros mean "never subscribed"** (the Phase-0 finding): `isFundingPending`
  → `isUnfunded`; the chip says "No balance yet — subscribe" and leads to
  `/billing`; the dashboard tile shows the honest `$0.00`; H3's live branch
  says "Your wallet is empty. Subscribe…". `balanceUnavailable` and
  `noSelfServeTopUp` are retired (both now false); `fundedByPlan` replaces
  the second. `live-wallet.spec.ts` re-pointed from the $50 starter funding
  to zeros — the old assertion is red on `main` today against this sandbox.
- **The 402 reaction** is ONE component (`ab/insufficient-balance.tsx`) on
  the three generation surfaces that can receive it — Generate (F1), the
  Studio composer (E2), Create visual (HSN-02) — now saying "Your wallet is
  empty or too low — subscribe or renew" with a "Go to billing" link; the
  input is still kept and the balance still shown. Nothing is swallowed:
  every surface already parked in its `shortBalance` state.
- **Notifications:** `billing.wallet_credited` → a new `wallet_credited`
  kind (Wallet icon); `billing.payment_failed` was already mapped. Both carry
  `action: "/billing"` and the adapter's rooted-path rule links them.
- **`cancelAtPeriodEnd: true`** → "Your plan is set to end on
  <currentPeriodEnd>. You can resume it in the billing portal." We only link.
- **The `past_due` banner lives on `/billing`** (the subscription is read
  there), not in the shell: a product-wide live banner would need the
  subscription in the bootstrap sync, which this order's lazy-read law
  argues against. The shell's existing banner stays the demo's
  (`world.billing.status`). A follow-up if the founder wants it global.
- **The poll** (`use-subscription-poll.ts`): `GET /subscription` every 2 s,
  give up after 60 s with "Still processing" and a Check-again button (a
  user gesture); the portal return re-reads for 10 s and stops quietly.
  Cleans up on unmount; a read that lands after unmount sets nothing.
  Polling a GET is designed behaviour, not a retry.
- **Scope check, not built:** the marketing page's `usePlans()`/
  `concept/lib/pricing.ts` do NOT collide with `/billing` — different
  documents, different owners (D-M2-B stands); the reconciliation open item
  remains and now has a wire to reconcile against.
- Instead of: holding the subscription in provider state (the query `orgId`
  is authoritative on the two routes, so a per-page read scoped to it is
  simpler and cannot show the wrong org's plan); mapping the demo's
  free/pro/studio onto base/pro (smuggling); deleting H1/H2/H4 outright (the
  demo's past-due world and W5's verify depend on them); a global past-due
  banner from a bootstrap read (a bigger change than the order asked for).
### 2026-09-02 — HSN-0902 Phase 0: three doors measured on org 1692, and the series HOLDS on the org fields

- **The ruling that stopped it is the order's own:** "if no door accepts
  the fields, stop at the end of Phase 0 and report — the founder asks
  Hasan." Neither Ward's org record (`PATCH /orgs/:id` DROPS
  `whatYouOffer` / `whatSetsYouApart` beside `name` and refuses them alone
  as "Provide at least one field to update") nor any AlphaStudio path
  answers for them (seven read-first GETs, all 404), and the only
  organization information Hasan's side receives today is the server-side
  context bundle (voice rules, sources, topics). So nothing of Phases 1–4
  is built — not even the two Phase 0 cleared — because the order is ONE
  series → one gate → one merge, and a partial series is not the
  deliverable. The branch holds Phase 0 alone; the series resumes on it
  when the door is named.
- **What Phase 0 pinned, for the resumed order:** (1) the brand kit's
  closed presign body `{mediaType:"application/pdf", desc:"brandkit",
  role:"brandkit"}` → 201, listed as `kind:"document"` with `role`
  ECHOED; the door refuses `role:"brandkit"` on a PNG (400), so the
  client's PDF allowlist MIRRORS the wire rather than standing in for it.
  (2) **A2 is answered — `GET …/media/assets` echoes `role`** ("brandkit"
  and "logo" both measured), so the Files badge on the echo is real, not
  hypothetical, and the org logo's exact-`desc` lookup can stay as the read
  side without a second marker ever being needed. (3) `params.durationS`
  is a known, validated, TOP-LEVEL field on the video body: the upstream
  400s a non-integer and an over-max BEFORE the wallet check, with a
  sentence that names neither, so the client clamp (per plan) is the only
  human-readable limit and the wire's 400 renders as itself. (4) An image
  body with NO `params` key clears validation (402, not 400) — the
  "images never send params" ruling is wire-safe. (5) The media bucket's
  CORS preflight allows `PUT` from `*` for both the dev-server and the
  production origin — the brand kit does NOT ship behind a CORS wall today.
- **Probe discipline, kept:** one fresh org (1692); the wallet read
  `{0,0,0}` BEFORE any generation body, and the five bodies sent only
  because it did, with the wallet and the job list re-read after
  (unchanged, empty); every minted asset deleted; presigned urls and the
  token redacted; the record APPENDED to `alphastudio-shapes.md` (never
  overwritten) by `scripts/probe-hsn-0902.ts`, the same shape as
  `probe-billing.ts`.
- Instead of: building Phases 1–2 while Phase 3 waits (the order's stop
  clause is explicit, and a two-thirds series would need the whole gate
  again); encoding the two fields into a voice or topic `description` (the
  brand-adapter law — never invent a wire home); sending a generation body
  on a funded wallet to "see the max" (the shield is the zero wallet or
  nothing); or reading the media door's 400 as "the field is unknown" (the
  SAME generic sentence answers a bound-role PNG, so it says "refused by
  the schema", never which key).

### 2026-09-02 — HSN-0902 Phases 1, 2 and 4: the brand kit, the video duration, the 402 rule — Phase 3 carved out as HSN-0902/B

- **The founder's word (2026-09-02, on the Phase 0 report):** resume with
  Phases 1, 2 and 4; Phase 3 — the Organization fields — is **HSN-0902/B**,
  held on open-item 48 until Hasan/Ward name the door, and nothing is built
  for it; lift the A2 ASSUMED marks now that the echo is measured. So this
  series ships two of the three changes and says so everywhere it is
  recorded.
- **The brand kit is the logo's pattern, LISTED.** A fourth Knowledge kind,
  "Brand kit", PDF only — the door binds `role: "brandkit"` to
  `application/pdf` (Phase 0: a PNG with it → 400), so the client allowlist
  MIRRORS the wire rather than standing in for it — routed like Image/Video
  through the ONE uploader. The user never types a description: the
  reserved word IS the description, the closed pair
  `{ desc: "brandkit", role: "brandkit" }`, decided in one function
  (`knowledgeUploadMarkers`) so neither screen can assemble the body by
  hand. `"brandkit"` joins `"logo"` as a reserved free description
  (trimmed, case-insensitive; the wire match stays exact). Unlike the logo
  (Organization's), the brand kit IS a Files row — the founder's ruling,
  stored like every other file — labelled "Brand kit", typed PDF, badged
  from the ECHOED role, Open + Delete, no cap on count. Success reads
  "Sent to the studio." (M-HSN-1's line, the logo's), and a PUT that never
  reached storage names the wall in the status line.
- **The video duration is one table, one key, one union.** `params.durationS`
  is a TOP-LEVEL key on the video body and NOTHING on an image body:
  `PostVisualOptions` is a union on `kind`, so a video option set must carry
  `durationS` and an image one cannot, and the builder spreads `params` in
  for a video only — unit-pinned as an ABSENT key, not `{}` (Phase 0
  measured that such a body clears the wire; HSN-02's `{}` is superseded).
  The maximum lives in ONE place, `VIDEO_DURATION_MAX_S: Record<ApiPlan,
  number>` — balanced 10 · creative 20 · precise 30, default 8, min 1 —
  keyed by the plan vocabulary TYPE (a plan the table does not name is a
  compile error, never a runtime surprise), with the unit in every name.
  Client-side validation only — whole seconds inside the plan's range — and
  the wire's generic 400 renders as itself. A quality change CLAMPS (the one
  ruled rewrite: "on model change, clamp to the new max"); a typed over-max
  value is refused with the message, never rewritten under the user's
  hands. Static runs the same limits with zero network.
- **The 402 rule, applied to this gate (founder-proposed in BIL-0902).** A
  fresh org's wallet is zero — the plan is the only funding — so every
  generation answers 402 at intake. `live-generate` is THE ONE spec that
  asserts the refusal: a new test walks the run into the balance state
  (`Available: $0.00`, the form kept, nothing charged) and skips when the
  org is funded. Its real run and every other generating spec —
  `live-proposals`, `live-brand-rules`, `live-create-visual` even under
  `LIVE_MEDIA` — read the wallet FIRST through `skipUnlessFunded` and
  self-skip with the honest reason: never a body the wire is known to
  refuse, never a red that is only "no funding". `live-wallet`'s three
  starter-funding assertions skip the same way (they are BIL-0902's to
  re-target on its held branch — skipped here, not rewritten). The durationS
  shape probe (`live-video-duration`) asserts the wire's OWN guard — a bad
  value is 400 BEFORE the wallet check — and self-skips on the 402 of the
  valid body; the positive proof (the job accepts, the clip length matches)
  rides on the founder's `LIVE_MEDIA=1` render, M-HSN-1 step 4.
- **The brand kit's live proof is two halves, each named as what it is:**
  the wire from Node — presign the closed pair, PUT a tiny PDF from
  Playwright's request context (NOT browser truth), then the app reads the
  row back, Delete, re-read — AND the browser-truth upload from Chromium
  through the form. Phase 0 measured the bucket's preflight open for both
  origins, so the second is expected green; if it ever reds on the PUT, the
  status line names the wall and that is the report.
- Instead of: a prefilled description field for the brand kit (the founder:
  the user never types one); listing it outside Files or capping it at one
  (the ruling: stored like every other file); `params: {}` on image bodies
  (Phase 0 proved the absent key clears the wire, and the order pins the
  absence); a per-model maximum read from the catalog schema (Hasan's
  numbers are per PLAN, and the wire's 400 names no limit); a string-keyed
  maximum map (a plan the table forgets must fail at compile time);
  asserting the 402 in every generating spec (one asserts, the rest skip —
  the founder's rule); or building Phase 3 on a guessed door (the order's
  brand-adapter law — never invent a wire home).

### 2026-09-02 — HSN-0902 gate: two things found and fixed, one rung taken, and a host that slept

- **The live Knowledge screen's lazy-collection race is a product fix,
  not a test fix.** Since MED-0831 the upload form no longer waits on the
  RAG collection (the media door needs none), so a DOCUMENT dropped in the
  first seconds after the screen opens reached the RAG path before the
  lazily created collection id had landed — first as "Something went wrong
  on our side" (the generic alert on a null id), then, once the path
  resolved the collection itself, as a row that never appeared (the list
  refresh read the click's stale closure, still null). Both were real for a
  user, both were the BIL-0902 round-1 red "knowledge 2/3, a 30 s wait on
  the upload row", and both had been on `main` since MED-0831's gate was
  aborted. Fixed in `live-knowledge.tsx`: the one path that needs the
  collection asks for it at submit time when the id has not arrived, and
  `refresh` reads a ref (`collectionRef`) so it always refreshes the list it
  actually wrote to. The error stays for the case that is one — a collection
  that cannot be created or found.
- **`live-knowledge.spec.ts` takes the `SCREEN_SYNC` rung on its two
  post-reload waits** — the seventh file to, and on purpose (live-clocks.ts:
  "a sixth file needing a rung is a decision to take on purpose, not by
  importing this file"). The measurement: the 5 s default failed in BOTH
  rounds of this gate on a screen that, since MED-0831, fans out two more
  lazy reads on open (the RAG collection + sources, and the media asset
  list), each able to land on a cold container. The assertions are
  unchanged; only the clock is.
- **A host that sleeps mid-round is a harness fault, judged as one.**
  Round 2's `live-brand-kit` red was the machine entering sleep 32 seconds
  into the file (Kernel-Power event 42 at 13:27:48Z, resume 14:18:50Z; the
  warm-up heartbeat stopped after 7 beats and the test "took" 51 minutes).
  The file was re-run as a recorded supplement (3/3 in 37 s) with the host
  held awake by a `SetThreadExecutionState` request that lives only as long
  as its process — no power setting was changed — and the power log is the
  evidence. Trap 22 gets a seventh shape in sessions.md: an unattended
  round needs the host awake, and a red whose duration is longer than its
  timeout is the sleep, not the product.
- Instead of: hiding the knowledge race by re-adding a form-wide wait on
  the collection (the media door and the brand kit must not wait on a RAG
  collection they never use); asserting `Uploading|Ready` later with a
  bigger clock (the row was never coming — a clock cannot fix a stale
  closure); changing the machine's sleep policy (a session gesture, not a
  repo's business); or counting the sleep-poisoned file as a round-2 red
  without a supplement (the law says a red in round 2 is a red — this one
  was the host's, and the supplement says so with its timestamps).

### 2026-09-02 — BIL-0902/R: the funding ruling (no dev-credit door), the Enterprise card, one mechanism for the funded QA org, and a contract that kept its keys

- **The founder's funding ruling:** there is no dev-credit door and none
  will be asked for. A QA org is funded the REAL way — a test-mode checkout
  paid once with Stripe's test card `4242 4242 4242 4242`; nothing is
  charged and the wallet is credited for real. The first such org is minted
  at manual gate M-BIL-1 (step 8) and its owner's credentials go into the
  QA-creds store as `QA_FUNDED_EMAIL` / `QA_FUNDED_PASSWORD` (documented in
  `stack.md`, never committed). This CLOSES open-item 46: the live suite's
  full green is reachable again by a paid QA org, not by the sandbox
  funding fresh ones.
- **One mechanism, never two.** `skipUnlessFunded` (HSN-0902's 402 rule)
  is the single door: a spec reads its org's wallet first; funded → it
  runs; zero and a funded QA org configured → it signs in as that org's
  owner (through the real login, from a cleared store), ensures the four
  brand entities IDEMPOTENTLY (checked on the wire, added through the real
  screens only when missing; the tone's per-browser language re-saved every
  time), and runs THERE; zero and nothing configured → it self-skips with
  the honest reason exactly as before. The funded org's own wallet is read
  too — an empty one means "pay again" and skips with that reason, never a
  red. Media renders stay behind `LIVE_MEDIA`: test money does not change
  what a render costs upstream. `live-proposals` opts OUT of the switch
  (`switchToFundedOrg: false`) because its assertions count a FRESH org's
  queue ("1 needs review", then "0"); a shared funded org carries every
  earlier run's queue, and loosening those counts would weaken the proof.
  Until the funded org exists the mechanism is built and unexercised; the
  first live run after M-BIL-1 step 8 is its first proof, and the report
  says so.
- **The one spec that asserts the 402 is `live-billing`.** HSN-0902 put the
  assertion in `live-generate`; this series' own Phase 3 proof — "refused
  with 402, and the refusal points at Billing" — is the richer one and the
  billing order's, so it owns the assertion now and the duplicate leaves
  `live-generate` (which also still expected the pre-BIL copy). One
  asserting spec, every other generating spec self-skipping — the rule as
  the founder wrote it.
- **The Enterprise card:** Enterprise is a plan the wire does NOT carry and
  Stripe never checks out — sales-assisted, Managed arranged directly, no
  add-on (the founder's word, §0). So `/billing` shows it BESIDE the wire's
  plans with no price ("Custom"), no Subscribe, and exactly one action: the
  existing `/request-demo` route. It is a fixed card in `PlansSection`, the
  same for owners and members and in both modes — nothing on it is gated by
  a role, and nothing on it can spend.
- **The plan union is read, not assumed — and the wire kept its keys.**
  Phase 0/R (org 1745) delivered `base` = "Malaky Business" 59900 usd/month
  and `pro` = "Malaky Scale" 89900 usd/month: Ward's correction changed the
  names, the amounts and the interval and KEPT the keys, so
  `ApiBillingPlanId` stays `'base' | 'pro'` and the "old key" probe answers
  201 because `base` is the live key. The demo plans mirror the delivered
  rows exactly (keys, names, cents, interval); the interval word renders
  from the wire; no "$500", "yearly" or "/ year" survives anywhere in the
  tree. The order's §2 expected a 400 on `base` — recorded as it fell, and
  read in the record's own "Reading" note so nobody mistakes it for the old
  contract surviving.
- Instead of: a dev-credit endpoint or a QA allowance on `POST /orgs` (the
  founder ruled it out — a real checkout is the honest funding); a second
  skip helper for the funded org (one mechanism); running `live-proposals`
  on the shared org with loosened counts (a weaker proof is not a proof);
  two specs asserting the 402 (the rule says one); a Subscribe on the
  Enterprise card that leads nowhere (no checkout exists — a button that
  cannot succeed is the disabled-teasing the design law forbids); or
  renaming the keys to `business`/`scale` because the order expected them
  (the wire is the record, and it said `base`/`pro`).
