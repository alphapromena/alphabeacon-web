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
