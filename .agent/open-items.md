# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Standing rules (not gates — habits that keep the deploys honest)

- **After every merge to `main`, also `git push origin main:live`.** `live` is
  the team's staging branch and must never drift from production; it carries no
  commits of its own. Forgetting leaves the team testing an older app against
  the real API, which is the confusing kind of stale.
- **Any merge to `main` runs the FULL live suite (`LIVE_MEDIA` off), never only
  the phase's own spec** (added 2026-08-20, from trap 18). `live-generate` had
  been failing on `main` since INT-12 because closing INT-12 ran
  `live-proposals` and nothing else — a spec nobody runs is a check that has
  already broken, and the phase that breaks a spec is rarely the phase that
  owns it. One file at a time, per the rate limits.

## Outstanding

### Integration — questions for the backend dev / infra (2026-07-30, INT-0)

1. **MOOT ON VERCEL, 2026-08-19 — reopen only if the app moves back to
   CloudFront.** `vercel.json` ships no CSP at all, so there is no
   `connect-src` to widen, and live mode reaches the API from the `live`
   branch's preview with no header work. The CORS side was measured the same
   day and is fine: the API echoes ANY `Origin` (verified from the `live`
   preview host, a per-deployment preview host, `alphabeacon-web.vercel.app`
   and `malaky.ai`), with `allow-methods: *` and
   `allow-headers: content-type,authorization`. The original item, which
   applies to the `infra/` CDK stack and not to Vercel:
   **CSP `connect-src` (infra).** The 2026-07-23 CSP decision ships **no
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
   2026-07-30; RE-CONFIRMED INT-6, 2026-08-17).** The contract says a client
   may send its own id, but the Function URL's CORS policy allows only
   `content-type, authorization` request headers — a browser preflight naming
   `x-request-id` receives no CORS grant and every call is blocked. The client
   now sends no id and logs the server's (from the envelope's `requestId`).
   Backend dev: add `x-request-id` to `Access-Control-Allow-Headers` and
   `Access-Control-Expose-Headers`.
   **INT-6 measurement** (`Docs/api/alphastudio-shapes.md`, preflight
   captures): `access-control-allow-methods: *` — so `PUT` and the new proxy
   paths ARE reachable from a browser, and the country + generate surfaces are
   buildable. But `access-control-allow-headers: content-type,authorization`
   is unchanged and there is **no `access-control-expose-headers` at all**, so
   the server's own id is not readable from a response either. Only the
   envelope's `requestId` is available to a bug report.
   **2026-08-20 (E2E-0820 F6/F12):** that envelope id is now actually SHOWN.
   It is carried on every failed action result (`requestId` on the `ok: false`
   branch) and rendered by `lib/error-reference.ts`, which falls back to the
   contract `code` when no id arrived — a client-side network failure has no
   envelope, and the exposed-header gap above means there is nothing else to
   quote. Surfaced today on the tone preview and the onboarding-finish toasts.
   The backend ask is unchanged; the impact of it landing is now larger,
   because the id has somewhere to go.
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
   (INT-3) — PARTLY CLOSED 2026-08-17 by the new contract.** The backend
   shipped what was asked for: voices gained a required `name` and both voices
   and tones now carry `rules[]` of `{id, kind: do|dont, text}`, embedded in
   every read, replaced wholesale by `PATCH { rules }`, with single-rule
   append/delete endpoints as well. INT-7 lifts the INT-3 restriction and
   enables the do/don't editors.
   **Still homeless:** a tone's `example` and a voice's `examples`. Their
   editors stay disabled and `notices.brandFieldsPending` narrows to name only
   those. Backend dev: is an examples home coming, or should the product drop
   the field? (A tone `example` DOES exist on the run body the proxy forwards,
   so the platform understands the concept — it simply has nowhere to be
   stored between runs.)
8. **PARTLY CLOSED 2026-08-18.** The SLOT-INGESTION half is void: Ward
   confirmed on 2026-08-17 that event-sources and slots are superseded by the
   org country + holidays, and INT-8 stopped calling both endpoints in live
   mode — so "when does ingestion fire" no longer has a consumer. The
   PRESET-SEEDING half stays open (see item 26). Original, for the record:
   **A fresh live org has no preset tones and no slot ingestion yet
   (INT-4).** The five preset tones are product law ("always present"), so
   `finishOnboarding` seeds them via the API's own `preset` flag — backend
   asked to seed server-side instead so a non-wizard org path gets them too.
   Slot ingestion: creating a `holidays` source produced no slots during the
   run; the skip/un-skip UI is wired and the live test degrades to a skip
   until ingestion runs — backend dev: when does ingestion fire?
9. **Model alias pairing (INT-4) — NARROWED 2026-08-20 (E2E-0820 B9).**
   Probed directly against the deployed API on a QA org (653):
   `POST /orgs/:id/schedules` with **`"modelAlias": "balanced"` is accepted —
   `201`, and it reads back intact**, as does a `PATCH` carrying the same
   value. So the alias vocabulary the frontend sends is legal, and the
   frontend's own ids (`gm_balanced` et al) never reach the wire — the
   adapter maps them at the seam.
   The remaining question for Ward shrinks to two parts: **is `gm_*` also
   legal on this field, and which vocabulary is canonical?** The original
   pairing question stands underneath it: THE mapping table pairs
   Balanced↔balanced and Precise↔quality confidently; Creative took the
   remaining `fast`. Backend dev: confirm which product model each alias
   should mean.
10. **PARTLY CLOSED 2026-08-18 — the `toneIds` half.** The wizard now seeds the
   preset tones first and maps their minted ids into the schedule it creates,
   so a live schedule is born with real tone ids (verified on the wire:
   `["186","187","188","189","190"]`). Google Calendar still has no API home,
   and in live mode the option is absent rather than disabled. Original:
   **Google Calendar sources have no API home (INT-4).** Live mode offers
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

### Integration — questions from the 2026-08-17 contract (INT-6)

Every one of these was raised by something the smoke run measured, and the
evidence is in `Docs/api/alphastudio-shapes.md`. Answers change what INT-7…11
build, so they are worth asking as a batch.

21. **Are event-sources and slots superseded by org country + holidays?**
    **(a) ANSWERED by Ward, 2026-08-17: YES.** Event-sources and slots ARE
    superseded; the backend feeds holidays into scheduling automatically.
    To apply in INT-8: live mode renders holidays only in C3/C4 (read-only —
    there is no per-day skip on the wire) and makes NO event-source or slot
    call at all; the INT-4 adapters stay for the static demo, annotated
    "retired by backend, live mode does not call them"; the wizard's holidays
    step becomes the country picker; D-INT-F gains "confirmed by backend
    2026-08-17". This also closes the slot-ingestion half of item 8 — the
    preset-seeding half stays open. The original question, for the record:
    The new `PUT /orgs/:orgId/country` loads the calendar and
    `GET /orgs/:orgId/holidays` reads it, with the capability's do/don't rules
    attached — which is everything C2/C3/C4 needed. The `event-sources` +
    `slots` surface still exists and is still wired (INT-4), but the two now
    overlap, and slot ingestion has still never produced a slot (item 8).
    Decide: does the app keep asking users to create event sources, or is
    country the single control (which is what D-INT-F assumes)? And if slots
    stay: **when does ingestion fire?**
22. **PARTLY CLOSED 2026-08-19 — proposals shipped.** The ledger is live
    (contract now 65 paths) and INT-12 builds Today on it: `GET proposals`
    with state/runId/cursor, approve and decline. What that leaves open is the
    residue, and it is still real: **no list-runs endpoint** (the ledger
    indexes runs only because every draft becomes a proposal), **no
    published-social proxy** (so a record cannot be listed, refreshed or
    removed), and **no drafts store** (so no editing before approval and no
    scheduling). See questions 29–31 below. The 2026-08-18 probe record:
    **(historical)** The live
    `GET /openapi` is byte-identical to the committed contract — 62 paths,
    nothing added — and an AUTHENTICATED route probe answers `404 not_found`
    for every proposals and published-social candidate, matching a deliberate
    nonsense route while `wallet` answers 200. Evidence and method are in
    `Docs/api/alphastudio-shapes.md` ("Proposals & published-social — NOT
    PROXIED"). Note for whoever re-probes: an unauthenticated probe proves
    nothing, because auth runs before routing and EVERY path answers 401.
    The original question:
    **A list-runs endpoint, and a server-side draft store.** Only
    `GET .../posts/runs/:runId` exists — there is no way to enumerate an org's
    runs. INT-10 therefore keeps a per-org localStorage ledger of run ids
    (D-INT-G), which does not survive a different browser and is not a real
    history. Also: every draft came back carrying a **`proposalId`**
    (`prop_…`), so the proposals ledger clearly exists upstream — but
    `/v1/proposals` and `/v1/published-social` are **not proxied**, so
    approve / decline / published-history cannot be built. Are they coming?
    Until they are, F1's action row is Copy + Create visual only.
23. **PARTLY ANSWERED by observation — still needs the backend's word.** INT-11
    now RENDERS `cost`, `displayHint`, `capabilitySchema` and
    `appMetadata.min_plan` in E1/E2, because they are the only honest source
    for a price, a name and a params form. If any of them is incidental rather
    than contractual, say so and E1 falls back to "charged to your balance".
    Original question:
    **Prices in the catalog — is `cost` a contract or an accident?** Model rows
    carry `cost` as `{ images: "0.03" }` / `{ video_seconds: "0.07" }` decimal
    strings, alongside `displayHint`, `capabilitySchema`, `capabilities` and
    `appMetadata.min_plan`. None of that is in api.md. E1 would like to show a
    real price per model — confirm these fields are stable enough to render,
    or E1 falls back to "charged to your balance".
    Related: **all ten probed capabilities are granted** to this app
    (`media.generate`, `social-posts.media`, `images.edit`,
    `photoshoot.generate`, `brand-assets.generate`, `logos.generate`,
    `logos.redesign`, `video-ads.generate`, `tones.preview`,
    `social-posts.generate`) — confirm that is intended for `alphabeacon` and
    not a playground grant that will narrow later, because E1's gallery is
    built from it.
24. **ANSWERED 2026-08-18 — S3 CORS ALLOWS THE BROWSER PUT.** Proven in
    Chromium against the live buckets by `e2e/live-knowledge.spec.ts` (a real
    .txt file presigned, PUT from the browser, ingested to `Ready`) and by
    `live-studio`'s render, whose asset the browser GETs from storage. Both
    surfaces ship; neither is hidden. The e2e network law now allows exactly
    one extra shape — a url carrying the AWS SigV4 signature our API issued
    (decisions.md D-INT-A, widened). Original question:
    **S3 CORS for a browser `PUT`** (media assets + RAG sources). The presigned
    upload works from Node — proven, `200` on both buckets with real bytes. A
    browser additionally needs the bucket's own CORS to allow `PUT` from the
    app origin, and that cannot be tested outside a browser. If it is not
    configured, reference images (E2) and file upload (I6) are unbuildable and
    both surfaces stay hidden. Please confirm/configure and say which origins.
25. **Two fields the docs and the wire disagree about.** `slot` on
    `posts/generate` reads as optional in api.md but a body without it is a
    `400`. `embeddingModel` on `rag/collections` is documented optional but a
    body without it is a `400`. Both are now treated as required — please
    correct api.md (or the validation), so the next reader is not misled.
26. **Server-side preset-tone seeding, now with rules** (extends item 8).
    **STILL OPEN — re-measured 2026-08-20 (E2E-0820 A1).** An org created by
    DIRECT API calls, with the wizard never involved (signup → verify →
    `POST /orgs`), comes back with **0 tones**, 0 voices and no schedule:
    probe org **622**, left in place. So the wizard remains the ONLY seeder,
    and a non-wizard org path — anything that creates an org outside this
    frontend — still gets an org with no tones at all.
    A fresh live org still has no preset tones, so `finishOnboarding` seeds the
    five through the API — and as of this contract it must also send each
    preset's `rules`. If the backend seeds server-side instead, a non-wizard
    org path gets them too and the wizard's job shrinks.
    The client-side seeding is therefore NOT redundant and was not removed.
    When Ward does ship server-side seeding, the wizard's seeding step becomes
    a no-op by construction: since 2026-08-20 it reads the org's existing tones
    first and creates only the presets missing by name.
27a. **Two literals build the same schedule body** (accepted debt,
    2026-08-20). `useSchedulingActions().saveSchedule` and
    `finishOnboarding` each construct the eight-field schedule payload
    (`timezone`, `days`, `generateAt`, `postsPerDay`, `modelAlias`,
    `toneIds`, `eventAware`, `active`) from their own object literal. Real
    drift risk — a field added to one is silently missing from the other —
    but B7 had just rebuilt Finish and churning it again immediately is the
    worse trade, so it is recorded rather than done. Same class as the
    FIVE verbatim copies of `failure()` under `src/data/` (account, auth,
    brand, scheduling, team), which B4 extended one line at a time for the
    same reason. Unify both when something next touches these files for its
    own reasons.

27b. **Static demo billing copy still says "credits"** (accepted debt,
    2026-08-20). The E2E-0820 sweep cleared every LIVE-reachable surface and
    left the static demo's own ledger vocabulary intact per D-INT-E — H3's
    ledger screen, the Studio composer's cost arithmetic, the `low-credits`
    dataset and the shell chip's static branch. Moot once production serves
    live; revisit only if the static demo outlives the cutover.

28. **INT-12 candidates — the five granted capabilities with no composer yet.**
    `photoshoot.generate`, `brand-assets.generate`, `logos.generate`,
    `logos.redesign` and `video-ads.generate` are all granted to this app and
    listed in E1, but ship without a form (amendment 6): their bodies need
    fields this phase did not verify end to end — reference images (1–4),
    `params.count`, `params.imageUrl`, `params.generateAudio`. Their observed
    `capabilitySchema`s are captured in `Docs/api/alphastudio-shapes.md`, so
    each is a form and a live spec away.

29. **Do backend-driven scheduled runs land as proposals in the same org
    ledger?** This is the biggest open question in the product right now:
    Today is complete if and only if the "morning drafts" a schedule produces
    arrive as proposals like any other run. INT-12 renders them identically if
    they do — that is the whole point of deriving from the ledger — but
    nothing has been observed yet, because nothing has confirmed when (or
    whether) scheduled generation runs at all. Until it is answered, Today's
    empty state deliberately promises nothing about mornings: it says
    "generate posts to start".

30. **Will `published-social` (list / add / delete) be proxied?** Approving
    creates a published entry, and the frontend can neither list nor remove
    it. Needed to show what has actually gone out, to refresh engagement, and
    for the day publishing is real.

31. **Could the proposals list carry the draft content, or could a list-runs
    endpoint exist?** Today currently costs one run read per distinct run in
    the queue (cached per session, terminal runs only). Either change would
    make the review queue a single read. Not urgent, but it is the shape of
    the screen's cost as the ledger grows.

27. **Is `guardrail_text_units` metering worth surfacing?** The usage read
    returns three units for one generate run (`input_tokens`,
    `output_tokens`, `guardrail_text_units`). H3 will group by capability and
    show them as-is; confirm that is the right granularity for an end user, or
    whether the app should sum to one number per capability.

32. **BUG — keyset paging loses rows that share a timestamp (found INT-12,
    2026-08-19).** `GET .../proposals` compares the cursor on the timestamp
    alone, though the cursor itself carries the tie-breaking id
    (`2026-08-19T05:47:43.595Z#prop_317767a2…`). Any page boundary inside a
    group of same-instant rows drops the rest of the group — and proposals
    from one run are created together, so a `perTone: 2` run or a 2–3 tone run
    is exactly such a group. Measured on the probe org: `?limit=1` walked 2 of
    3 rows; `?state=pending&limit=1` walked 1 of 2 and its second page came
    back empty with no cursor. Full evidence and the decode of the cursor are
    in `Docs/api/alphastudio-shapes.md`.
    **The frontend is designed around it** (D-INT-J: page only to discover
    runIds, then re-query `?runId=` for authoritative state), so nothing is
    blocked — but any other consumer walking that list will silently lose
    rows, and the fix is a tie-break on `(createdAt, proposalId)`.

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
- **2026-08-10 update (rb/02):** the film is RETIRED from the route by
  Abdullah's V1 brief (decisions.md D1) — the take-approval and 4K
  re-render lines above are VOID. Masters remain archived. The deferred
  `rb/03-ambient` option (new-subject ambient footage) is recorded in D1.

### Website V1 founder items (2026-08-10, rb/02-v1-brief)

**16. Claims-map sign-off + Arabic copy review + pricing + push.** Four
things only Abdullah can close, gathered for one sitting:

- **Claims map** (`Docs/brief/claims-map.md`): every row marked *founder
  decision* — the proactive-drafting promise (#6/#7), memory breadth (#4),
  native Arabic generation (#8), executive LinkedIn (#9), channel
  adaptation (#10), source traceability (#13), learning loop (#14), data
  protection (#15), cancel/plans (#16) — each either stands for launch,
  softens, or gains a "coming soon" label (brief §34).
- **Arabic copy review:** every Arabic string in the demo content (demo
  brand names, the ArabicSocialCard campaign, the §24 split-screen) needs a
  native read for register, punctuation and RTL hierarchy — written by the
  build, not by a native speaker.
- **Pricing decision (D3):** V1 ships without Pricing by default. If tiers
  are finalized, the §28 outcome-led packaging (Starter / Growth /
  Business) flips on in one small commit at the seam left in STEP 5.
- **Push approval:** rb/02-v1-brief merges/pushes only on explicit founder
  approval (same gate as rb/01).

**17. Brief §32 — product pillars, recorded and OUT OF SCOPE here.** The
ten V1 product pillars (Brand Brain, Morning Workspace, Proactive Planner,
Multi-Voice Content, Native Arabic System, Approval Guardrail, Source
Confidence, Channel Adaptation, Learning Loop, Performance Feedback) are
app-side direction the website promise must converge with. Recorded so the
product plan can pick them up; nothing app-side changes on rb/02.

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

## 17. Production pass artifacts needing a human (2026-08-11)

- [ ] **Legal review**: `/privacy` and `/terms` (src/features/system/
      legal-screens.tsx) were drafted plain-language by the pass and are
      live. Counsel must review before paid acquisition.
- [ ] **support@malaky.ai** is the contact address on both documents —
      confirm the mailbox exists and is watched.
- [ ] **OG image** (`public/brand/og-malaky.png`) is the wordmark on ivory,
      composed from the supplied logo asset — founder eyeball wanted.
- [ ] **Launch model**: acquisition CTA is now "Request early access"
      (item 12's rule: self-serve publishing backend is not live). Flip to
      "Start free" via marketing-home + verify-w02 CTA law + e2e matcher
      + pricing-section seam when self-service is real.

## 18. Phase 2 gates (2026-08-11)

- [ ] **Request-access destination**: `/request-access` validates and
      confirms, but the submission only buffers locally (analytics seam +
      localStorage) — the network law allows nothing else and no form
      vendor is approved. Wire a real destination (API endpoint or an
      approved vendor via the dataLayer seam) BEFORE driving paid or
      public traffic to the page; the copy promises a reply.
- [ ] **Higgsfield asset manifest**: `Docs/brief/asset-manifest-phase2.md`
      awaits founder approval. Nothing has been generated. On approval:
      three stills + the one Nura Reel (9:16, poster-first, ≤1.5 MB
      target) through the `content-asset.tsx` seam.
- [ ] **malaky.ai DNS cutover**: discovered 2026-08-11 while verifying the
      Phase 2 deploy — `malaky.ai` and `www.malaky.ai` still resolve to
      GoDaddy Website Builder (13.248.243.5 / 76.223.105.230), which serves
      a placeholder site, NOT the Vercel deployment. Vercel holds the
      `malaky.ai` alias and serves the correct build on
      `1.malaky.ai` and `alphabeacon-web.vercel.app`. Someone with GoDaddy
      DNS access must point the apex + www at Vercel (per the Vercel
      domains panel) before the canonical/OG URLs on malaky.ai are real.

## 19. Founder-supplied reference posts (2026-08-11)

- [ ] **Baker Tilly Saudi Arabia**: the founder supplied their LinkedIn
      post as a reference and states written permission exists. NOT
      shipped — attach the written permission to this item, and confirm
      what it covers (using their post as demo content on malaky.ai is a
      public claim about a real client), before any Baker Tilly creative
      or name appears on the site.
- [x] **SpaceX / X post**: declined and not shipped. It is a real
      company's real post carrying a real person's account; presenting it
      as Malaky's demo output would claim work Malaky did not do.

## 20. Platform logo marks — trademark call (2026-08-12)

- [ ] The founder asked for real platform logos (Instagram / LinkedIn /
      Facebook / X) inside the demo cards. Not shipped: D6 bans
      third-party logo assets, and reproducing those marks on a public
      marketing page is a trademark question (usually fine as nominative
      use under each platform's brand guidelines, but it is counsel's
      call, not the design system's). Recognition currently comes from
      each platform's surface, chrome, layout and type — which carries
      most of the signal. To enable: get sign-off, amend D6 in
      decisions.md, add the marks to `platform-chrome.tsx`, and relax the
      verify-w02 logo assertion.
