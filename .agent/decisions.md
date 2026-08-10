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
