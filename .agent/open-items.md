# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Outstanding

### Integration — questions for the backend dev / infra (2026-07-30, INT-0)

1. **CSP `connect-src` (infra).** The 2026-07-23 CSP decision ships **no
   `connect-src` entries at all** in the CloudFront response-headers policy —
   correct for the static app, but a DEPLOYED live-mode build cannot reach
   the API through it. When live mode first deploys, the policy needs
   `connect-src` for the API origin (env-parameterized, per stage). Local dev
   is unaffected. No action until a live-mode deploy is planned.
2. **`postsPerDay` bounds disagree.** The API allows 1–24; the product's spec
   caps at `MAX_POSTS_PER_DAY = 3` with a named catalogue message (a W2 verify
   item). Conservative reading taken: the UI keeps its cap of 3 — the API
   accepting more does not oblige the product to offer more. Backend dev:
   confirm the product cap is intentional product law, or align the API.
3. **CORS blocks the documented `x-request-id` request header (found INT-1,
   2026-07-30).** The contract says a client may send its own id, but the
   Function URL's CORS policy allows only `content-type, authorization`
   request headers — a browser preflight naming `x-request-id` receives no
   CORS grant and every call is blocked. The client now sends no id and logs
   the server's (from the envelope's `requestId`; the response header is
   likely unexposed too). Backend dev: add `x-request-id` to
   `Access-Control-Allow-Headers` and `Access-Control-Expose-Headers`.
4. **Org roles are three-tier (`owner|admin|member`); the app's model is
   two-tier.** INT-1's session adapter collapses `owner → admin` for display
   (an owner can do everything the admin UI offers). INT-2 must teach the
   team screen the real model — "last OWNER cannot leave/demote" (409), not
   last admin — and `screens4.md` I7 should gain the owner tier when revised.
5. **Onboarding state is client-inferred in live mode.** The API has no
   onboarding concept, so "has at least one org" stands in for "onboarding
   complete" (auth-adapter). Fine for INT-1; if the product wants the full
   five-step wizard resumable server-side, that needs backend state.
6. **The stored session's `user`/`orgs` are a login-time snapshot (found
   INT-1).** RESOLVED in INT-2: the provider's live sync refreshes `GET /me`
   + `GET /me/orgs` on every session establishment and rewrites the stored
   record in place; the token is the only trusted persisted fact.
7. **Tone rules/examples and voice do/don't/examples have no wire home
   (INT-3).** The API stores tones as `{name, description, preset}` and
   voices as one `description` per row. Live mode disables the rule/example
   editors with a note (`notices.brandFieldsPending`) and carries voice rules
   as ONE flat list — nothing is smuggled into descriptions. Backend dev:
   tones want `rules {do, dont}` + `example`; voices want a kind (do/don't)
   and an examples home.
8. **A fresh live org has no preset tones and no slot ingestion yet
   (INT-4).** The five preset tones are product law ("always present"), so
   `finishOnboarding` seeds them via the API's own `preset` flag — backend
   asked to seed server-side instead so a non-wizard org path gets them too.
   Slot ingestion: creating a `holidays` source produced no slots during the
   run; the skip/un-skip UI is wired and the live test degrades to a skip
   until ingestion runs — backend dev: when does ingestion fire?
9. **Model alias pairing (INT-4).** THE mapping table pairs Balanced↔balanced
   and Precise↔quality confidently; Creative took the remaining `fast`.
   Backend dev: confirm which product model each alias should mean.
10. **Google Calendar sources have no API home (INT-4).** Live mode offers
   country holidays only (the option is absent, not disabled); the static
   demo keeps the Google stub. Also: the wizard's schedule POST sends
   `toneIds: []` because tones cannot exist before the org does — tones are
   picked in C1 after; if the backend ever seeds presets, the wizard can
   send real ids.
11. **screens4.md has no account/security screen (INT-2).** Profile name and
   change-password needed a home; they live in an "Your account" section at
   the bottom of I1, live mode only (the static demo has no account to edit).
   screens4.md should gain a proper home for it when next revised.
12. **Voices edit is delete+create, so an edited line jumps to the top on
    refetch (close-out note, non-blocking).** Rows have no identity beyond
    their text in the current seam, and lists come back `createdAt DESC` —
    editing a rule re-creates it, moving it to the top. If line order ever
    matters, switch edits to `PATCH` on the row id; the API supports it. No
    code change now.
13. **Static-vs-live divergence on admin role powers (close-out note,
    product question).** The demo's admins can change roles; the wire makes
    role changes owner-only. It stays an explicit per-mode rule in
    `useTeamPermissions()` — but either the API is stricter than screens4
    intended, or the demo should tighten to match. Backend/product decides;
    the frontend follows whichever answer.

### M1 cinematic items — RETIRED by the rebrand (2026-08-08)

The two items that sat here (clip-1 take approval → 4K re-render; the
marquee's hover-only pause) are void: the cinematic M1 concept was retired
with the Malaky rebrand (decisions.md 2026-08-08), its components and assets
deleted (git history preserves them). No take will be approved and there is
no marquee to pause.

### Malaky rebrand — one item gated on the designer (2026-08-08)

**14. Vector wordmark original requested.** The supplied logo artwork exists
only as three 610×352 raster PNGs
(`public/brand/malaky-logo-{charcoal,gold,white}.png`), derived from the
founder-approved wordmark. A vector original has been requested from the
designer. When it arrives: re-export the three colorways to the same
filenames (drop-in), re-derive the favicon/touch-icon crops, and consider an
SVG favicon. Until then the PNGs are the only artwork and are never redrawn
or edited (design.md Part 3).

### Founder confirmation bundle (2026-08-08)

**15. One sign-off on the whole brand-implementation picture**, gathered so
the founder confirms once rather than piecemeal:

- **Typography:** Inter (variable, single family) — proposed by engineering
  because the kit names no typeface (decisions.md 2026-08-08). Swappable in
  one `@font-face` block + three token lines if a different face is chosen.
- **The gold split-by-role:** Champagne Gold `#C7A76A` reads 1.9:1 on ivory,
  so light-theme `--brand` is the deepened `#9A7B4F` (display-only) and true
  gold carries the dark theme (design.md Part 1.3). Confirm the derivation
  is acceptable brand-wise.
- **Motion-law amendment (M1 only):** the "cinematic-calm" tier — scrubbed
  footage and pinned sections on the marketing page when the footage obeys
  the brand; strict calm law everywhere else; reduced motion renders the
  static page unchanged (design.md Part 5, 2026-08-08).
- **The cinematic direction:** the Malaky interface as a floating
  glass-and-ivory 3D object assembling on scroll (Apple-product-page
  language), M1 light-canonical with footage graded for ivory.
- **The footage itself (added 2026-08-09):** the shipped Seedance set — hero
  still, assembly take B (the scrub), detail macro, calm pull-back
  (decisions.md carries takes, jobs and the 362-credit spend). If a
  different take or re-render is preferred, the swap is drop-in: same
  filenames under `public/film/`, one manifest in `film/media.ts`. An
  optional 4K re-render of take B for crisper frame re-extraction waits on
  this sign-off.

### Two gates REOPENED — they must run against the fixed build

The focus, tablist and posting-time changes of 2026-07-29 moved the very
semantics two of the sittings exist to check, so their earlier sign-off no
longer covers what is on screen now. **The 2026-08-08 Malaky rebrand replaces the
cinematic M1 with the calm kit-flow page — both sittings' M1 scope is
rewritten below.**

**Sitting 1 — viewport and environment (~45 min).** Unchanged in scope, but the
settings tablist, the role select and the longer posting-time strings are all
new since it ran, and all three are width-sensitive. Re-walk 360px. Now also:
the Malaky M1 at 360px (every split section must collapse to one column; the
workspace preview card must not overflow), and the page in BOTH themes — the
rebrand made marketing theme-aware (light-first; dark is charcoal with the
white wordmark, design.md Part 6 rule 8).

**Sitting 2 — keyboard and screen reader (~60 min).** This one changed the most.
Settings is now a `tablist`/`tab`/`tabpanel` with roving tabindex and manual
activation, the leave-guard hands focus back explicitly, two hidden file inputs
left the tab order, and the team rows gained a role `<select>` whose most
important behaviour is an ABSENT option. None of that existed when the walk was
done. Listen specifically for:

- the tablist announcing position ("tab 3 of 6") and selection state;
- the leave-guard's return: after "Keep editing", is focus announced back in the
  field, or silently moved?
- the role select on the last admin — the missing option is the design, so does
  the row's explanation get announced with it?
- posting times: `9:00 AM GMT+3 · 10:00 AM your time` reads as one string;
  confirm it is not heard as two unrelated numbers.

New for the Malaky M1 (2026-08-08):

- the hero reads as: heading "Malaky" (the Arabic wordmark image is
  presentation; the name is `sr-only`), then the promise and the support line;
- the workspace preview is `inert`: nothing inside it is focusable, and the
  `sr-only` sentence before it describes what the illustration shows;
- the tone card and channel tiles read as plain lists;
- with reduced motion on: every section renders finished — the reveal fade
  never exists (no-preference media query), nothing reads as missing.

---

## Signed off

- **2026-07-29 — all three sittings, thirteen gates.** Sitting 1 (viewport and
  environment), sitting 2 (keyboard and screen reader) and sitting 3 (read it as
  a stranger) were walked in order and triaged. Two reported findings were
  retired as session artifacts, not defects: `/` does render the marketing home
  for a signed-out visitor (`RootGate` handles it), and a 404 at `/pricing` is
  correct because pricing lives at `/billing/plans`. Six focus defects, two
  data-honesty defects and one product question came out of it; the six focus
  defects are fixed and covered by `e2e/settings-a11y.spec.ts` plus the
  `keyboard-focus rules hold` structural check.

  The headline lesson, recorded because it changes how this repo is reviewed:
  **axe was green on every one of those screens and always had been.** It reads
  markup; it does not tab through anything. Six real focus bugs sat underneath a
  passing accessibility suite.

- **2026-07-28 — W1 visual pass.** `/dev/kitchen-sink` in both themes, the
  dashboard, and the empty states via `/dev/datasets`, reviewed against the
  Alpha MENA kit after the brand landed. Approved by the reviewer, including the
  `--brand` / `--primary` split.
