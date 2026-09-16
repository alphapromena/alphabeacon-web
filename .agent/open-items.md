# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Standing rules (not gates — habits that keep the deploys honest)

- **The live suite needs the API warm, and the harness now warms it.**
  `e2e/global-setup.ts` runs on every live invocation (`VITE_API_BASE_URL`
  set; it makes no request at all without it): it checks the server is in the
  mode the run expects (trap 22), wakes the service, warms a 12-way fleet, and
  keeps a heartbeat for the life of the run. `e2e/live-clocks.ts` carries the
  three derived wait values the re-clocked files use. **A warm run is now
  13/13.** A run that starts from hours of idle is not — see below. None of it
  is a fix for the API: `Docs/api/live-red-2026-08-23.md` holds that.
- **Against a cold API the full live suite runs TWICE. Round 2 is the merge
  gate; round 1 stabilises the deployment** (codified 2026-08-24; source
  `Docs/api/live-red-2026-08-23.md`). This is not permission to re-run until
  green: the two rounds are one procedure, both are reported, and it is the
  SECOND that must be 13/13. A red in round 2 is a red. Measured 2026-08-23:
  cold 9/13 in 757 s, then immediately 13/13 in 833 s — and again 2026-08-24 on
  the same branch. The clocks are derived (`e2e/live-clocks.ts`), so a round-1
  red that traces to an external lookup slower than its measurement is the
  API's cost to change, not a number to inflate. Retire this rule the day Ward
  keeps the function warm.

- **After every merge to `main`, also `git push origin main:live`.** `live` is
  the team's staging branch and must never drift from production; it carries no
  commits of its own. Forgetting leaves the team testing an older app against
  the real API, which is the confusing kind of stale.
- **Any merge to `main` runs the FULL live suite (`LIVE_MEDIA` off), never only
  the phase's own spec** (added 2026-08-20, from trap 18). `live-generate` had
  been failing on `main` since INT-12 because closing INT-12 ran
  `live-proposals` and nothing else — a spec nobody runs is a check that has
  already broken, and the phase that breaks a spec is rarely the phase that
  owns it. One file at a time, per the rate limits. **Still mandatory** — the
  two-round rule above says WHICH run is the gate, never that the gate is
  optional.

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
5. **SUPERSEDED 2026-08-28 by ORDER ONB-0827 (decisions.md D-ONB-C).** There
   is no onboarding state left to infer: the wizard is deleted, and
   `org.onboarding {completed, resumeStep}` became `org.exists` — which is not
   an inference but the plain API fact "this user belongs to at least one org".
   The ask this item carried (server-side resumable wizard state) is moot
   because the wizard it would have resumed no longer exists. **Nothing to send
   Ward.**
   _The original item, for the record:_
   **Onboarding state is client-inferred in live mode.** The API has no
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
26. **PENDING WITHDRAWAL (2026-08-28, ORDER ONB-0827) — do NOT send to Ward.**
    Hasan ruled that a fresh live org must start with ZERO tones and its owner
    must write the first one (decisions.md D-ONB-B). If that holds, this ask —
    "please seed the five presets server-side" — asks the backend to build the
    exact behaviour the product just removed, and the client-side seeding it
    was written about no longer exists. **The founder is confirming with Hasan
    before anything is withdrawn**, so the item is marked rather than deleted:
    if the ruling is narrowed to the frontend only, the ask is still live for
    non-frontend org paths.
    Re-measured AGAIN on 2026-08-28 during the ONB-0827 Phase-0 probe and
    unchanged: fresh org **955** reads `brand/tones` `total: 0`. So the fact
    the item rests on is still true; what is in question is whether anyone
    still wants it fixed.
    **Nothing was sent to Ward from this cycle.**
    _The original item, for the record:_
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
27a. **CLOSED 2026-08-28 (ORDER ONB-0827, D-ONB-C).** There is only one
    literal now. The wizard was deleted and `finishOnboarding` collapsed into
    `createWorkspace`, which pushes the org and nothing else — so the schedule
    body is built in exactly one place, `useSchedulingActions().saveSchedule`,
    and the Calendar editor is the only schedule surface there is. It closed as
    a side effect of the onboarding ruling rather than as its own piece of
    work, which is the trade the item asked for ("unify both when something
    next touches these files for its own reasons").
    The FIVE verbatim copies of `failure()` under `src/data/` are unaffected
    and still stand as the same class of accepted debt.
    _The original item, for the record:_
    **Two literals build the same schedule body** (accepted debt,
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

### ONB-0827 — the onboarding ruling (2026-08-28)

36. **PENDING WITHDRAWAL — item 7 of the 2026-08-27 Ward message.** Recorded
    BY REFERENCE, because that message is not in this repo: nothing under
    `.agent/` or `Docs/` carries it, so there is no in-place item to annotate
    and inventing one would be worse than saying so. The founder holds the
    message and is confirming the withdrawal with Hasan alongside item 26.
    **Nothing was sent to Ward from this cycle.** Whoever reconciles the two
    lists should paste that item in here so the next reader can see what was
    withdrawn and why.

37. **A schedule can be stranded by deleting the tone it points at**
    (observation only, no build — 2026-08-28). Schedules store tone IDs, and
    tone deletion is a hard delete: the API cascades (proved in
    `live-brand.spec.ts` — deleting a tone empties `toneIds` on the schedules
    that referenced it), so a schedule can end up ACTIVE with an empty tone
    list and nothing on screen says the cadence just lost its voice.
    **This is pre-existing and UNCHANGED by this cycle** — ONB-0827 touched
    seeding, not deletion, and the order explicitly forbade building new delete
    mechanics around tones. It is worth a future guard: either C1 warning when
    a save would leave an active schedule with no tones, or the tone-delete
    confirm naming the schedules it will empty. Recorded so the next person to
    touch tone deletion does not discover it the expensive way.
    **CUT-0831 (2026-08-31) widened the reachable surface:** the preset
    concept is gone, so EVERY tone is deletable and the reducer guard that
    kept a schedule from being emptied by deleting the last preset went with
    it. Still observation-only; the future guard proposed above is unchanged.

38. **CLOSED 2026-08-28 (ORDER ONB-0827-B, decisions.md D-ONB-F).** Fixed on
    `feat/onb-04-invite-org` and verified live in `e2e/live-invite-org.spec.ts`,
    3/3: an invited existing user reaches the inviting workspace through the
    rail's switcher, a reload keeps that choice, and revoking the membership
    falls back to their remaining workspace with the sentence *"You are no
    longer a member of the workspace you were last in, so we opened another
    one."* — never a dead screen, never demo data.
    **One correction to the founder's brief, measured not assumed:** an
    existing user cannot ACCEPT an invite. `POST /orgs/:id/members/invite`
    answers `invitedNewUser: false` and sends no code, and
    `POST /auth/accept-invite` for that address answers **400 `bad_request`
    "Invalid or expired code"** (request
    `4b0959ba-b8d1-409a-9816-b93aaa83ef13`). Membership is simply added. So
    part 1 of the rule governs the NEW-user accept path — asserted in
    `live-auth`, which now checks the rail names the inviting org — and the
    existing-user case is carried by parts 2 and 3 plus the switcher
    screens4.md §0.4 has always specified.
    _The original item, for the record:_
    **An existing user invited to another workspace CANNOT REACH IT**
    (consequence of D-ONB-A, measured 2026-08-28).
    **Measured, not inferred.** Two fresh accounts, each with its own org
    (owner 1003, member 1004). The owner invites the member: `201
    invitedNewUser: false`. The member logs in again and both the session
    snapshot and `GET /me/orgs` come back
    `[{1004, owner}, {1003, member}]` — **their own org first**. The app works
    in `liveSession.orgs[0]` (`provider.tsx`, `useLiveWorkingOrgId`) and there
    is no org switcher in live mode, so they land in their own workspace and
    the one that invited them is unreachable through the UI.
    **Why it is new:** before this cycle a person who signed up but never
    finished the wizard had NO org, so `orgs[0]` was the inviting org and the
    flow worked. Auto-creating a workspace at verification is what changed it.
    **Not affected:** someone who arrives through the accept-invite deep link
    without ever signing up — that path still creates no org, so `orgs[0]` is
    the org that invited them. `live-team.spec.ts`'s admin test now uses that
    path deliberately, and says why.
    **This cycle did not fix it**, because both plausible fixes are product
    decisions rather than bugs: a live org switcher, or a rule about which org
    a session opens in. The founder should rule.

38b. **STILL OPEN — the founder's eye, not a bug.** The same ruling means a
    person invited to a colleague's workspace who happens to sign up first ends
    up owning an empty workspace they never wanted, funded with 5000 cents by
    the platform (`POST /orgs` funds the tenant). D-ONB-F makes that workspace
    harmless — they can switch away from it and the app remembers — but it does
    not stop it being created. Harmless today; it is a per-account cost once
    real money is involved, and a backend question (should signup fund a tenant
    that may never be used?) rather than a frontend one.

39. **CLOSED 2026-08-28 — deviation ACCEPTED by the founder** (ORDER
    ONB-0827-B), recorded as decisions.md **D-ONB-E**. The one-line revert
    stays documented there and is deliberately not exercised.
    _The original item, for the record:_
    **The readiness gate derives honestly in static mode, where the order said
    "reports ready"** (deviation, flagged for the founder — 2026-08-28,
    D-ONB-D). No demo DATA changed, but the `fresh` world is genuinely half set
    up — no voice rules, no sources, no topics — so it renders the checklist
    and the blocked generate state. That is what makes the gate exercisable
    from `/dev/datasets` and gives its axe scans real coverage; hardcoding
    static to ready would have made the whole feature untestable outside a paid
    live run, against the same order's "axe on the checklist and blocked
    states". The `active` world and the four derived from it are fully set up
    and see no gate at all. **Reversible in one line** (`known: !live` →
    `canGenerate: true` in static) if the founder wants the literal reading.

40. **The remembered workspace dies with the session** (deliberate, for the
    founder's eye — 2026-08-28, D-ONB-F). `purgeSession` clears it, so signing
    out leaves nothing behind and a reload is what the choice survives. That is
    the narrower of two readings of "a session opens in the last active org it
    remembers": the wider one — come back tomorrow, sign in, land where you
    were — needs a record that OUTLIVES its session, which would be a second
    durable thing against architecture.md's persistence law and would say, on a
    shared machine, which workspace the last person worked in. Say the word and
    it is a small change (drop the key from `purgeSession`); it was not taken
    unilaterally.

41. **A recorded DECISION can take tens of seconds to read back** (measured
    2026-08-28, ONB-0827-B). `live-proposals`' decline test covers a decline
    POST, a tab switch and a keyset-paged re-read of the proposals ledger.
    Across eleven observations it passed eight times — the whole test taking
    **20.6 s and 28.6 s** in two of them — and failed three: twice at the
    suite's 5 s default and **once at 40 s**. The spec now budgets 80 s for
    that one assertion, with the numbers written beside it.
    **The wait is not the finding.** A user who declines a draft and switches
    to the Declined tab can wait half a minute to see their own decision. That
    is a product fact worth a founder's eye and possibly Ward's: it may be the
    API's latency tail (p90 9.8 s per `live-red-2026-08-23`, and this is a
    chain of three calls), or it may be **open-item 32** — the keyset paging
    bug that loses rows sharing a timestamp — showing up as a row that arrives
    late rather than never. Not investigated here: ONB-0827-B did not touch
    proposals, and choosing between those two without measuring would have been
    a guess.

42. **SUSTAINED LOAD degrades the deployed API, and it recovers with rest —
    measured end to end (2026-08-30, ORDER ONB-0827-C).** New evidence for
    Ward, recorded BY REFERENCE against his own item 5: the 20-item list he
    holds is not in this repo, so there is no in-place row to append to, and
    whoever reconciles the two lists should paste this beside it.

    **What was seen.** On 2026-08-28 the full live suite was run repeatedly
    while ONB-0827-B was finished. The pass rate fell as the session went on
    and the WALL CLOCK tracked it almost exactly:

    | round | green | suite total | live-team | live-proposals | live-wallet |
    | ----- | ----- | ----------- | --------- | -------------- | ----------- |
    | 11    | 15/15 | 886 s       | 108 s     | 100 s          | 46 s        |
    | 12    | 14/15 | 952 s       | 111 s     | 140 s          | 54 s        |
    | 13    | 9/15  | **1,195 s** | **229 s** | 107 s          | **103 s**   |
    | 14    | 15/15 | **857 s**   | 119 s     | 82 s           | 39 s        |

    Round 14 is the SAME TREE as 13, run the next morning after ~14 h idle,
    with no code change of any kind between them — and it is the fastest of the
    four. Round 13 is 39 % slower overall than round 14, `live-team` 1.9× and
    `live-wallet` 2.6×. Every round-13 failure was a TIMEOUT, never a wrong
    assertion, and a different test each time — the tell recorded under trap 22
    that consecutive reds which do not agree on WHAT broke are about the
    harness or the service, not the branch.

    **Confirmed three ways on 2026-08-30, before any spec was touched.**
    1. **Direct latency probe, no Playwright.** `/health` cold 1,514 ms, then
       twelve back-to-back at **0.08 s**, and after 20 s idle **0.22 s** and
       **0.21 s** — i.e. **no cold-start penalty at all**, where
       `live-red-2026-08-23` measured 7.40 s after the same idle. Ten known
       authed operations: p50 **650 ms**, p90 **3,697 ms**, max **4,345 ms**,
       **zero calls over 5 s** (08-23: 31 of 118 over 5 s, 9 over 10 s).
       Request-ids in the session record.
    2. **Contract sweep**, the same `api-sweep.mjs` (md5 `7bb47b3…`) as both
       baselines: **no status changed on any shared operation, and no operation
       was added or removed.** Its single mismatch is item 43 below, which is
       four days old and already reported.
    3. **One virgin full round** on the untouched tree: **15/15**.

    **What it means for Ward.** This is not the cold-start story from
    2026-08-23 — cold starts are gone. It is a slow degradation under sustained
    traffic that clears after a rest, which is the shape of a resource leak or
    a connection/pool exhaustion somewhere behind the function rather than
    provisioning. The frontend cannot fix it and should not be tuned around it:
    the standing rule stays that a red which passes solo on a healthy API is
    the service's, and a red that survives one is ours.

    **What was deliberately NOT done:** no wait was re-tuned off round 13. One
    caveat stated rather than buried — the 80 s budget on `live-proposals`'
    decline assertion (item 41) was set on 2026-08-28 from a measurement taken
    while the API was already degrading, so it is probably more generous than a
    healthy API needs. It is left alone, because re-tuning it off a single
    healthy round would be the same mistake pointing the other way.

43. **The `media/assets/presign` regression is STILL OPEN, and it is the only
    contract diff on the wire** (re-confirmed 2026-08-30). The 2026-08-30 sweep
    called 115 operations against the baseline's 118 with **one** mismatch:
    `POST /orgs/:id/alphastudio/media/assets/presign` answered **400
    `bad_request` — "The media service rejected the request — check the body
    against the capability's schema"** where 2026-08-19 and 2026-08-23 both got
    201. The three missing operations are purely mechanical: the sweep gates
    the storage `PUT`, the re-presign and the asset `DELETE` on the `uploadUrl`
    that never arrives.
    **This is NOT a new overnight deployment.** It is finding 5 of
    `Docs/api/probe-alphastudio-assets-2026-08-26.md` (branch
    `probe/assets-0826`, pushed 2026-08-28), reproduced today byte-for-byte on
    a fresh org: same endpoint, same `{"mediaType":"image/png"}` body, same
    status, same message — request-ids `e0d5320d-97d4-4548-bfc5-6f65d7d8fea3`
    and `2883784f-544c-4cc2-8da8-4c5af9641e13`, on org 1278.
    **Our side is provably intact:** `{}` and `{contentType}` still answer
    `validation_failed` from OUR validator, and every body with a syntactically
    valid `mediaType` clears it and is refused upstream. The neighbouring media
    surface is healthy (`GET /media/jobs`, wallet and the `media.generate`
    catalog all 200 in under a second).
    **It does not touch the live suite** — no spec exercises that route; the
    presign `live-knowledge` uses is the RAG one
    (`/rag/collections/:id/sources/presign`), which the sweep shows `ok 201`.
    So it is not part of item 42's story, and it did not gate this cycle.
    **Ledger note, 2026-08-30 (ORDER HSN-02 — NO wire call made).** The
    leading hypothesis is now a MISSING FIELD rather than a broken route:
    Hasan's meeting chat (2026-08-28) shows the presign body as
    `{ "mediaType": "image/png", "desc": "..." }` — a `desc` our 08-17-era
    body (`{ mediaType }` only; `uploadReferenceImage` in
    `src/data/studio.ts`, and the smoke script) has never sent — and "check
    the body against the capability's schema" is exactly what a newly
    required field would say. Nothing touched, by the series law; **to be
    probed in the final-gate order**, and if it holds the fix is one field
    on one body.
    **Ledger note, 2026-08-30 (ORDER HSN-04 — NO wire call made).** The
    `desc` fix is now OPERATIONALIZED — on the KNOWLEDGE upload's presign,
    which Phase 0 found is the RAG door
    (`POST /orgs/:id/alphastudio/rag/collections/:cid/sources/presign`, body
    `{filename, mediaType}` → now `{filename, mediaType, desc}`, sent with
    no switch by the founder's word), NOT this item's media door. This
    item's own route, `POST /media/assets/presign` (`uploadReferenceImage`,
    body `{ mediaType }`), has NO caller in the app today and is untouched
    pending the founder's next-order ruling on the other presign callers.
    So HSN-04 does not by itself close this item. The final gate probes
    both doors — this one with `{ mediaType, desc }` — and says which
    hypothesis held. Full record: decisions.md HSN-04.
    **SOLVED-PENDING-WARD-CONFIRM (2026-08-30, ORDER HSN-FINAL Phase 0 —
    two presign-only wire calls, zero spend).** On a fresh QA org (1415), the
    SAME door in the SAME minute: `{"mediaType":"image/png","desc":"…"}` →
    **201** (`assetId masset_adb3fe2af9067cead02c329d`, request-id
    `45f67ae4-d154-481a-aaba-f73a4d63f19d`); the 08-17-era
    `{"mediaType":"image/png"}` → **400** `bad_request`, the same message as
    above (request-id `99de0be4-2c05-4a4a-911b-0d0fee9d9cef`). **The missing
    `desc` was the regression** — one field, not a broken route. The RAG door
    with `desc` answered **201** too (request-id
    `d77dd2b2-2f03-42c3-804d-e5b1de0dda9c`), so HSN-04's built shape stands.
    Verbatim bodies: `Docs/api/alphastudio-shapes.md`, "HSN-FINAL Phase 0".
    **What is NOT yet done, by order:** `uploadReferenceImage`'s body and the
    smoke script's media presign still send `{ mediaType }` — the founder
    rules on the other presign callers; the fix is one field on each. **For
    Ward (message item 3, rewritten):** the media presign now REQUIRES
    `desc`; confirm it is intentional and document it in api.md — then this
    item closes. Side observation for Hasan: the RAG door refuses
    `image/png` and `video/mp4` with `desc` present (400, "a media type it
    cannot extract"; request-ids `d7553931-…`, `3182f312-…`), so the
    Knowledge form's Image and Video choices are refused inline on the wire.

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

- [ ] **Legal review** — RE-SCOPED 2026-08-23 (M2). The pass's plain-language
      drafts are gone: `/privacy` and `/terms` now render Abdullah's ported
      website documents (`features/marketing/concept/legal/`), whose undecided
      values print as visible `[To be confirmed: …]` placeholders rather than
      as prose. See item 21 for what a lawyer now has to supply. The original
      item, for the record: `/privacy` and `/terms` (src/features/system/
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
      **2026-09-10:** `www.malaky.ai` is on the project (added 10:43:24Z,
      verified, 308 → the apex); both names verified, no TXT needed.
      Vercel's intended records, for the GoDaddy panel (nameservers stay):
      `A malaky.ai 216.198.79.1` and `A malaky.ai 64.29.17.1` replacing BOTH
      site-builder A records (`76.76.21.21` is the older single-address
      form); `CNAME www.malaky.ai c61f41105463f8af.vercel-dns-017.com.`
      (`cname.vercel-dns.com.` also accepted). When it lands the apex serves
      the production deployment = the dev API in public with test-mode
      Stripe and Stripe's returns on `1.malaky.ai` (item 53).

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

## 21. M2 — the concept-v2 visitor world (2026-08-23, `design/m2-concept-v2`)

Everything here is a founder or specialist decision. None of it blocks the
branch; all of it blocks DNS cutover or launch.

### Closed 2026-08-24 — the accessibility gate (D-M2-F-r2)

- [x] **The four AA corrections are in, and the merge gate is satisfied.**
      D-M2-F-r reverted them so Abdullah could review his palette verbatim; he
      delegated the call and the founder ruled that accessibility wins with the
      design spirit preserved. `--c-text-4` aliases `--c-text-3`, the filled
      CTA's ink is `#1a0a05`, the approval preview is absent rather than
      ghosted, the monogram is one tier up. `--c-accent` and every other token
      are byte-identical to Abdullah's. **Every allowlist is removed** — axe
      enforces contrast on the real homepage with zero exceptions.
      The stale-guards written into D-M2-F-r did their job: each one reported
      itself the moment its finding stopped being true, which is how the
      cleanup was driven rather than remembered.
- [x] **The Memory section's three contrast defects are fixed**, and the
      diagnosis in the previous entry was wrong in a way worth keeping. They
      were reported as "the dimming means superseded draft"; all three actually
      traced to one rule — the scroll-reveal resting at `opacity: 0.55`, which
      multiplied every text tier inside all three cards and applied equally to
      the learned rule and the future draft. The reveal slides without fading
      now. Separately, a `Superseded` badge carries what `--c-text-4` used to
      say alone, because aliasing that tier removed the distinction.
      verify:w02 11d and 11e fail if either is undone.
- [x] **The homepage's axe scan had never scanned the homepage.**
      `analyze()` does not auto-wait (state.md trap 14), so it read the
      still-mounted dev-datasets page — the APP's ivory palette, ~25 text
      nodes, all passing. M2's "axe clean on all five marketing routes" was
      true for four of them. It now waits for the hero `h1` and scans under
      reduced motion. Kept through the D-M2-F-r2 cleanup because it was a
      broken check, never an allowlist.

### Blocking cutover

- [ ] **`/request-demo` has no destination.** `submitDemoRequest` resolves
      locally after 900 ms and transmits nothing — the module says so in its
      own header, and the network law forbids anything else from `src/`
      outside `src/api/`. The form promises a reply and the success state says
      "You're on the list", so **this must reach a real mailbox or CRM before
      the site is live on malaky.ai.** Wiring it is a data-layer job (a new
      `src/api/` seam, or a form vendor), not a marketing one — the component
      awaits one promise and renders a result, exactly as it would against a
      real service.
- [ ] **`hello@malaky.ai` is a PLACEHOLDER.** It is the ONE invented value in
      the whole port. The prototype carried no contact address anywhere — no
      `mailto:`, nothing in the footer, and every value in `lib/legal.ts` is
      still `null` — but a form that transmits nothing has to offer some way
      to reach a person, so the demo page shows this address in the form
      footer and again in the success state. Point it at whatever mailbox
      sales actually reads, or supply a different one. `CONTACT_EMAIL` in
      `features/marketing/concept/site.ts` is the single place it lives.
- [ ] **Legal values.** `features/marketing/concept/lib/legal.ts` holds six
      `null`s that render as `[To be confirmed: …]` on both public documents:
      registered entity name, registered address, privacy mailbox, legal
      mailbox, governing law + forum, and effective date. `isProductionReady()`
      reports what is outstanding. **None of them may be guessed** — a privacy
      policy naming an entity that does not exist is worse than one that says
      the name is still to come. Counsel supplies them; filling them in here
      is the whole change.

### Needs a founder decision

- [ ] **The CTA change (D-M2-D) is vetoable.** M2 retired the "Request early
      access" launch model in favour of self-serve: every "Get started" is now
      the real `/signup`, and `/request-access` redirects to `/request-demo`.
      That follows Abdullah's brief, which is the newer instruction, but it
      reverses the founder's own 2026-08-11 production-pass decision. Confirm
      it, or say the word and it reverts — the path still exists, which is why
      it is a redirect and not a deletion.
- [ ] **Four AA deviations from Abdullah's design (D-M2-F, design.md 7.7).**
      Review these against the prototype side by side, and send them back to
      Abdullah:
      1. the filled CTA's label is dark ink (`#1a0a05`) on the unchanged
         orange, not white — white was 3.29:1 and this is the most visible of
         the four;
      2. `--c-text-4` aliases `--c-text-3` (the prototype's `#5d5a57` was
         2.63–2.93:1 on ~40 elements);
      3. the approval section's outcome cards are absent before you approve
         rather than ghosted at 30% opacity;
      4. the customer monogram moved up one text tier.
      All four are one-line reversals if the founder accepts the risk instead.
- [ ] **The auth seam.** `/signup`, `/login`, `/reset-password` and
      `/accept-invite` still wear the APP design system — light, Inter, shadcn
      — so a visitor crosses a visible seam at "Get started". Deliberate this
      pass; restyling auth to concept-v2 is a separate order. Decide whether
      it ships that way or waits.
- [ ] **`public/brand/malaky-logo-gold.png` was replaced** with the
      prototype's export (750×370 vs the repo's 610×352). The concept's
      `MalakyLogo` declares the new file's intrinsic size, so the two are a
      pair. Confirm the new export is the one to keep — nothing else in the
      app references the gold colorway.
- [ ] **`/request-access` is a redirect, not a route.** If early access is
      genuinely over, this can be deleted outright at the next tidy. Left in
      because a link somebody shared should not 404.

### Found here, but NOT this branch's — flagged for whoever merges next

- [ ] **The live suite is red on `main` right now, on latency.** Running all
      thirteen files (`LIVE_MEDIA` off, one at a time) during M2's gates, nine
      stopped somewhere in the signup → wizard-finish → Dashboard walk — always
      a TIMEOUT, never a wrong assertion, and a different test each run. The
      four worst were then re-run against a STASHED tree (plain `main`,
      `5c01c68`, same dev server, same API) and **all four failed identically**:
      `live-notifications`, `live-scheduling`, `live-team`, `live-auth`. So it
      predates M2. The E2E-0820 close-out on 2026-08-20 recorded the same suite
      as 45 passed / 2 skips / 0 failed, so either the API got slower or the
      finish burst got longer. Someone should measure the wizard-Finish
      round-trips against the live API before the next merge — the standing
      rule says a merge to `main` runs the full live suite, and today that rule
      cannot be satisfied by anyone, on any branch.

### Needs a specialist, or a later phase

- [ ] **Screen-reader walk of the visitor world.** axe is clean on all five
      routes at 1440 and 390 and under reduced motion — but axe reads markup
      and does not tab through anything (see the 2026-07-29 lesson above). The
      hero orbit, the brand-demo sequence, the approval loop and the pricing
      comparison table each have live regions or focus behaviour a scanner
      cannot judge.
- [ ] **The two pricing documents have to be reconciled eventually (D-M2-B).**
      `features/marketing/concept/lib/pricing.ts` is the launch offer;
      `src/data/entities/plans.ts` is what billing can charge for. They are
      deliberately separate now and they will disagree the moment self-serve
      checkout is real. That reconciliation belongs to the phase that builds
      it, not to this one.
- [ ] **Bundle.** The visitor world grew the entry chunk from 632 kB to
      675 kB and the main stylesheet from 160 kB to 216 kB (D-M2-A). The
      marketing route is deliberately the only eagerly-bundled screen, so
      splitting it is a W7 decision with a real cost — a visitor at `/` would
      pay a round trip for the page they came for.
- [ ] **The customers' artwork is unoptimised, and it dominates the page.**
      A first load of `/` off the production build transfers **3.83 MB**, of
      which **2.79 MB is imagery** (JS 675 kB, CSS 216 kB, fonts 151 kB).
      Adding the missing `loading="lazy"` hints took it down from 4.90 MB, but
      four files are in the hero and legitimately eager:
      `assessment-creative-square.png` **1.13 MB**,
      `alpha-pro-logo.jpg` **512 kB** (a logo),
      `assessment-render.png` **320 kB**, `crispy-fish-hero.png` **1.04 MB**
      (now deferred). They are the customers' own files at source resolution,
      rendered at a few hundred pixels. Re-encoding them (WebP/AVIF at the
      sizes actually used) would cut roughly 2 MB — but they are supplied
      artwork, so it is a decision for the founder and Abdullah, not a port.
      This also blocks the W7 Lighthouse budget for marketing (≥ 95 perf).


44. **The media asset list is thin, and two Ward deliveries would fatten it
    (2026-08-31, ORDER MED-0831).** `GET /orgs/:id/alphastudio/media/assets`
    ANSWERS NOW — 200 where Ward item 4 expected 502, measured Phase 0
    (request-id `c09531e7-fc46-413b-8be1-b903236b448b`) — but its rows carry
    only `{assetId, kind, desc, meta.synthetic}`: **no mediaType, no date**,
    so the Knowledge "Files" row has no date column and only kinds the type
    (asked of Ward, this order's report). Two facts measured for whoever
    fattens it: rows are minted at PRESIGN time (a failed PUT leaves a
    phantom row until deleted — the app deletes its own, other clients may
    not), and uploads read `meta.synthetic: false` while a RENDER's value is
    UNOBSERVED until the founder's `LIVE_MEDIA=1` render — the Files filter
    (`isUploadedMediaFile`) excludes only `synthetic === true` and must be
    revisited when a render row is first seen.
    **Rewritten 2026-08-31 (ORDER MED-0831/R):** the `logoAssetId` request
    is DROPPED — superseded by the list-as-record and the presign's `role`
    field (Hasan's addendum; `desc: "logo"` + `role: "logo"` mark the org
    logo, and the list-scan stays the read side). What remains asked of the
    platform: (1) **`createdAt` and `mediaType` on the list row** — the
    Files section has no date column and only kinds the type until they
    arrive; (2) **for Hasan: does `GET …/media/assets` echo `role`?**
    (assumption A2 — the app reads it when present, and the Files "logo"
    badge lights only when it is echoed). "logo" stays a reserved
    description in Knowledge either way.
    **(2) ANSWERED 2026-09-02 (ORDER HSN-0902 Phase 0, org 1692): YES — the
    list row carries `role`.** A `role:"logo"` presign lists back as
    `{assetId, kind, desc, role:"logo", meta}` (request
    `7c0d1b42-aa9d-455d-b692-1d603c2dd486`) and a `role:"brandkit"` one as
    `role:"brandkit"` with `kind:"document"` (request
    `16dec457-c3a3-4171-8a5d-8b84ee108333`). The Files badge on the echo
    is live; only (1) — `createdAt` + `mediaType` on the row — remains
    asked of Ward.

### BIL-0902 — billing goes live on the Stripe sandbox (2026-09-02; /R on Ward's corrected plans)

45. **CLOSED 2026-09-03 — M-BIL-1 (/auto): the founder's gate, run ONCE by a
    headed Chromium session on `1.malaky.ai`, recorded (sessions.md "M-BIL-1
    on production"). Steps 1–7 GREEN as written; step 8 done; step 9 is the
    founder's word to Ward.** The sign-off facts: **org 1813**
    (`qa+1788440509919@alphapromena.com`, "QA Funded Org 1788440509919" —
    the designated funded QA org, its password in the QA-creds store only);
    **invoice `in_1UBaHlKy5r44oOSRSZXHynCY`** (subscription
    `sub_1UBaHnKy5r44oOSRHqWlkYnh`, credit row id 4, 59900 cents, request
    `487952fb-b1a7-487b-a370-37883ac9a5c7`); **the 409 request id
    `c083f46c-5b4c-45e3-a2f8-a2a3b660d442`** (`conflict`, "This org already
    has a subscription — change or cancel it in the billing portal"); the
    cancel-path org **1814** (`qa+1788440509919c@alphapromena.com`, status
    `none`, request `180380f9-b7d0-4874-a856-b2e7d78ed082`). Per step: (1)
    the cards read exactly the wire's rows — Malaky Business $599.00 /
    month, Malaky Scale $899.00 / month, Enterprise "Custom" + Request a
    demo (plans request `ffaa696e-1abc-4561-b4cb-9c2b6105d388`); (2)
    checkout 201 (`d3b864c7-6263-4d02-b2e8-649e8b016aab`) → the Stripe page
    read "Subscribe to Malaky Business · US$599.00 per month" under the
    Stripe account name **"alpha pro mena"** (no Malaky logo, no `#FF1E57`
    — the branding of step 9 is NOT in yet; the portal's title is "alpha
    pro mena Billing" likewise); (3) Stripe returned 8.3 s after submit and
    the FIRST poll answered `active` 0.9 s after landing (request
    `ff851ad8-bc3d-4413-92eb-b169caf344a0`); the page said "Your
    subscription is active" and "Wallet: $599.00 available"; (4) wallet
    `{59900, 0, 59900}` (`03d94c55-c64f-4064-b007-27c70e7e3e23`), ONE credit
    row whose real field set is `id, orgId, cents, reference,
    stripeInvoiceId, stripeSubscriptionId, plan, createdAt` (recorded in
    `Docs/api/billing-shapes.md`), the bell's `billing.wallet_credited`
    ("Wallet credited", "$599.00 was added to your wallet from your base
    plan payment.", request `5ff33653-b2dd-428a-881f-673ba49a19e9`); (5) the
    409 above, the page on Manage billing with no Subscribe; (6) portal 201
    (`c616a80f-bda6-4b34-8474-22aa2892a1f1`) → `billing.stripe.com` →
    "Return" → `/billing?orgId=1813` clean, re-read `active`
    (`bc88120b-55c1-41d5-b33c-1467c6a2a536`); (7) org 1814's checkout 201
    (`e6001d80-191e-4d19-8dff-55c4cb697012`) → the Stripe back link →
    `/billing?orgId=1814&checkout=cancelled` with the note, two Subscribes
    back, subscription `none`; (8) `QA_FUNDED_EMAIL` / `QA_FUNDED_PASSWORD`
    stored (User-scope env vars, `stack.md`) — the first funded live run
    (serial, `--workers=1`, 13:11–13:14Z): **6 passed (2.3 m)** —
    `live-generate` 2/2 with its balanced run EXECUTED on org 1813 through
    `skipUnlessFunded` (the mechanism's first proof), `live-wallet` 4/4 (no
    self-skip in it since /R); a first attempt with two workers went red on
    both files' Settings sync at once, the parallel-burst harness class,
    before any generation; (9) NOT done here — the founder tells Ward "sandbox
    verified"; the Stripe-side branding is still to come before the flip.
    **A harness defect to know:** the run's screenshots and HARs were
    written under `test-results/m-bil-1/`, which is Playwright's outputDir,
    and the step-8 `pnpm e2e` run CLEANED it — the frames of the Stripe
    checkout, the portal and the success poll are lost; the run's own
    `report.json` (every rid above) survives verbatim and the frames of the
    persisted state were re-taken read-only (sessions.md). **The record:
    `Docs/qa/m-bil-1/`** (moved there on the founder's word, scrubbed of
    session tokens; state.md trap 24). Original text:

    **MANUAL GATE M-BIL-1 (/R) — the paid path, by the founder, on
    `1.malaky.ai` after the deploy (cannot be automated: no test drives the
    Stripe page).** The plans are Ward's corrected ones as `GET /billing/plans`
    delivers them (Phase 0/R, org 1745, `Docs/api/billing-shapes.md`): the
    keys `base` / `pro` UNCHANGED, the names **"Malaky Business"** /
    **"Malaky Scale"**, 59900 / 89900 usd per **month**.
    1. Fresh QA org → `/billing` → the two plans read **Malaky Business $599.00
       / month** and **Malaky Scale $899.00 / month**, and **Enterprise
       "Custom"** with the demo link beside them; the names on the cards are
       Ward's Stripe names — check the spelling there and on the Stripe page.
    2. **Subscribe → Malaky Business** → Stripe Checkout (host
       `checkout.stripe.com`) → card `4242 4242 4242 4242`, any future expiry,
       any CVC and postcode.
    3. Stripe returns to `1.malaky.ai/billing/success?orgId=…` → the poll
       flips to **active** within the minute → the plan and the wallet shown.
    4. Wallet available = **59 900** cents; the credits list shows ONE row with
       the invoice id (record the row's real field set — the one billing
       shape nobody has observed); the bell shows `billing.wallet_credited`.
    5. A second Subscribe → surfaced as **Manage billing** (409 `conflict`
       underneath; **record the request id**).
    6. **Manage billing** → the Stripe portal opens → return to
       `/billing?orgId=…` cleanly (the short poll re-reads; status `active`).
    7. Start a second checkout on ANOTHER fresh org and press back on the
       Stripe page → lands on `/billing?…&checkout=cancelled` with the small
       note, subscription still `none`.
    8. **Hand this paid org's credentials to the QA-creds store** as the
       designated funded QA org: `QA_FUNDED_EMAIL` / `QA_FUNDED_PASSWORD`
       (`stack.md`; §4 of the order). From then on the generating text specs
       run there instead of self-skipping — the first live run after step 8
       is the mechanism's first proof.
    9. Tell Ward **"sandbox verified"** — his cue to move Stripe to LIVE.
       Before that flip, the Stripe dashboard branding (Malaky logo,
       `#FF1E57`) should be in.
    Sign off with the org id, the invoice id, the 409 request id, and the
    funded org's email (never its password) in the journal.

46. **CLOSED 2026-09-02 by the founder's funding ruling (BIL-0902/R).** The
    measurement stands — a fresh org's wallet is `{0,0,0}` and every
    generation answers 402 `wallet_insufficient` until it subscribes (org 1670,
    request `3aa41779-6ef5-4d49-b101-12009d9b6d64`; org 1683, request
    `f4220662-0752-4488-9ffc-133a7bbd5779`; org 1745 again on the corrected
    contract) — and the answer is option (b): **no dev-credit door; one
    designated QA org funded by a real test-mode checkout (M-BIL-1 step 8),
    its credentials in the QA-creds store, and `skipUnlessFunded` routing
    the generating text specs there** (media stays behind `LIVE_MEDIA`).
    `live-proposals` keeps self-skipping on a fresh org by design (its counts
    are a fresh queue's); `live-billing` is the one spec that asserts the
    refusal. The merge gate's full green is reachable again the day step 8
    is done.

47. **For Ward (BIL-0902 Phase 0 → /R, no blocker):** (1) `DASHBOARD_URL` —
    ANSWERED: `https://1.malaky.ai` (Ward, 2026-09-02). (2) The plan KEYS
    stayed `base` / `pro` under the correction — only the names, amounts and
    interval changed (Phase 0/R, request `65719d4c-d272-4f46-9892-505b1ebcae4b`);
    intended, or a rename to `business` / `scale` still to come? The client
    reads the keys from the wire either way, but a rename would move the
    checkout body. (3) `POST /billing/portal` at `none` still answers `201
    {url}` (request `30912741-2631-4316-aa0c-e230f1f28cda`) — the product
    only offers Manage billing where the guide's table says so; is a portal
    at `none` intended? (4) The credit row's full field set is unobserved
    until a payment (M-BIL-1 step 4). (5) `Docs/api/api.md`'s Billing
    section and the refreshed `openapi.json` were not supplied with the
    guide — the frontend built to `billing-frontend.md` (its names, amounts
    and interval now superseded by the wire as recorded) plus its own probes.

### HSN-0902 — Hasan's three changes (2026-09-02) — HELD at the end of Phase 0

Numbering: 45–47 belong to BIL-0902 on its held branch `feat/bil-0902`; this
series counts from 48 so the two merge without a collision.

48. **FOR HASAN — BLOCKING, the series holds here: which door carries
    `whatYouOffer` (string, ≤500) and `whatSetsYouApart` (string, ≤2000)?**
    Measured 2026-09-02 on fresh org 1692 (`Docs/api/alphastudio-shapes.md`,
    "HSN-0902 Phase 0"): `PATCH /orgs/:id` with the two fields ALONE →
    400 `validation_failed`, `(root) "Provide at least one field to update"`
    (request `e253b332-f190-4188-b0e4-39e660023c17`) — the keys are not
    fields; beside `name` → 200 with both DROPPED, and `GET /orgs/:id`
    carries neither (requests `56022204-f83e-4c3b-8249-64af8853c189`,
    `45071929-6238-49f7-84dc-598658e40e03`); seven read-first candidate
    paths under `/orgs/:id/alphastudio/…` and `/orgs/:id/…` → 404. Today the
    platform learns about the org ONLY through Ward's context bundle (voice
    rules, sources, topics — api.md §Brand "Context sync"), which no
    endpoint reads or edits. Options for Hasan/Ward to name: (a) two columns
    on the org record, accepted by `PATCH /orgs/:id`, echoed by
    `GET /orgs/:id`, and pushed in the bundle; (b) a new AlphaStudio
    org-profile endpoint under `/orgs/:id/alphastudio/…`; (c) fields on the
    generate / media envelopes. The frontend builds Phase 3 on the named
    door — and Phases 1–2 (brand kit, `durationS`), probed clean, wait with
    it: one series, one gate.
    **Later the same day — the founder's word:** Phase 3 is carved out as
    **HSN-0902/B**, held on THIS item; Phases 1, 2 and 4 ship as HSN-0902.
    Nothing is built for the two fields until the door is named.

49. **For Hasan (no blocker): the media door's 400 is one generic
    sentence.** `role:"brandkit"` on a PNG, `durationS:"abc"` and
    `durationS:999` all answer `bad_request` — "The media service rejected
    the request — check the body against the capability's schema" — with no
    field, no limit and no `details[]` (requests
    `00e65eaa-21bb-4741-99f8-b8668621b77c`,
    `a13b2826-8794-4b89-872e-5fc99688731b`,
    `7c0f8c45-61ab-40a6-b243-5fe54478693f`). The app's own validation is
    therefore the only human-readable message; a field-level `details[]`
    (the shape `validation_failed` already carries) would let the wire's
    refusal name itself. Also for Hasan: the per-plan `durationS` maximum
    (balanced 10 · creative 20 · precise 30, from the 2026-09-02 walk) is a
    client-side table until the capability schema or the 400 names it.

50. **MANUAL GATE M-HSN-1 (founder, after the merge, on production; step 3
    is HSN-0902/B's, held on item 48).**
    1. Knowledge → **Brand kit** → a real PDF → **"Sent to the studio."**
       No description is asked. The bucket's CORS preflight answered
       `access-control-allow-origin: *` + `PUT` for `https://1.malaky.ai`
       on 2026-09-02 (org 1692), so this is expected to pass; if the PUT
       fails, the status line names the wall ("The upload never reached
       storage.") — record it verbatim.
    2. Files lists it as **"Brand kit"** · PDF · badge **brand kit** (from
       the role the wire echoes); **Open** works (a fresh ~1 h url);
       **Delete** works and the list re-reads without it.
    3. ~~Organization → both fields → Save → reload → both persist~~ —
       **HSN-0902/B**, nothing built; waits on item 48.
    4. On the `LIVE_MEDIA=1` render: Create visual → **Video** → choose a
       quality, set a duration under its maximum (the control shows it:
       balanced 10 · creative 20 · precise 30; default 8) → run — confirm the
       clip length matches `durationS`, and whether the job / status read
       echoes `durationS` (record the job id and the request-id; item 49
       asks Hasan to name the limit on the wire).
    Sign off with the org id, the brand-kit asset id and the video job id.

### HSN-0910 — Hasan's 2026-09-09 meeting (2026-09-10) — HELD at the end of Phase 0 (report-and-stop)

Numbering continues from 50. The record: `Docs/qa/hsn-0910/phase0/` and the
"HSN-0910 Phase 0" section of `Docs/api/alphastudio-shapes.md`.

51. **FOR HASAN — /B (State under Country) HELD: which field, on which door,
    and where does the state list come from?** Measured 2026-09-10 on fresh
    org 1824: `GET …/event-sources/countries` rows are exactly `{code, name}`
    (249 rows, request `2f9f27b1-bf9a-4971-86b4-07e12f3caaf9`); `PUT
    /orgs/:id/country {country:"US", state:"CA"}` → 200 with `state`
    DROPPED (`79ffe011-947b-4ad2-938a-d139a0e48a0d`; holidaysCount 10) and
    the org record unchanged on the read-back
    (`cec29cdc-ce2b-4743-bf9e-a41d36d8ea4d`); `POST …/event-sources
    {kind:"holidays", country:"US", state:"CA"}` → 201 with `state` DROPPED
    (`efc30c5b-ef94-4495-afc8-8292122cc393`; deleted after); six read-first
    candidate paths → 404/400. The holiday rows keep today's shape plus a
    new key `processed: false` (`4fbc1b3f-902d-4cc1-81f2-be67aff23b21`).
    The one-line question for the founder to send: "State under Country —
    which field carries it (`state`? `subdivision`?), on which door (`PUT
    /orgs/:id/country`, the event source, or a new one), and where does the
    app read the state list for a country (a new endpoint, or a static list
    per country)?" No UI is built on a guessed field.

52. **For Ward: is `POST /orgs/:id/alphastudio/media/assets/:assetId/approve`
    to be proxied?** Hasan's document says an approved `avatar.generate`
    sheet "joins your collection". Measured 2026-09-10: 404 `not_found` on an
    asset we own (`ecca3ba8-2e5f-4435-8a19-126e26e1a1b1`). Until it is
    proxied no "Approve" is built; a sheet can only be opened and
    downloaded.

53. **For Ward: the production environment (Hasan's point 1).** Facts
    measured 2026-09-10 (`Docs/qa/hsn-0910/phase0/environment/`): the API
    exposes no environment name (`/health` → `{"ok":true}`, `/openapi` info
    0.1.0 with no `servers`, the org root carries none); `1.malaky.ai`
    serves the `live` branch preview in LIVE mode (the API host inlined in
    `index-DUHITzRc.js`); the apex `malaky.ai` still serves a GoDaddy
    site-builder page, not this project (the 2026-08-11 DNS item);
    `alphabeacon-web.vercel.app` (production, `main`) is unreachable from
    the dev host (a TLS reset on `*.vercel.app`), so its mode was not
    measured then — **measured 2026-09-10 from Vercel's side: production
    serves the SAME bundle as the `live` preview (`index-Ckpi_DKM.js`, the
    API host inlined once) because `VITE_API_BASE_URL` was set in the
    Production scope by hand at 10:51:50Z = the dev base; production `main`
    is LIVE on the dev API, and the earlier STATIC record was wrong.** Asked of Ward: (1) a separate production environment
    for the main API and Hasan's AlphaStudio tenant (2–3 tenants, no QA
    orgs), with its base URL; (2) `DASHBOARD_URL` per environment — the
    three Stripe return routes (`/billing/success?orgId&session_id`,
    `/billing?orgId&checkout=cancelled`, `/billing?orgId`) must return to
    the apex on production and to `1.malaky.ai` on dev; (3) Stripe LIVE keys
    only on production, test mode stays on dev; (4) a measurable "which
    environment am I on" — a name on `/health` or the org root — the
    harness guard's best anchor. The draft message is in the Phase 0 report
    (sessions.md, 2026-09-10).

54. **CLOSED 2026-09-10 — A3 PROVEN by the funded `images.edit` on org 1813 (job `mjob_deed21e0f9608090deff880f`, request `46722d47-fab7-49a0-a3b5-a472b821d238`): the output is the input with its background replaced, so the door fetched our read-presigned url; the voice envelope (audio + timestamps document) measured on `mjob_e68d75567f364c34ab574b15`; 14 cents spent, the record under `Docs/qa/hsn-0910/phase0/funded/`. Original text:** A3 ASSUMED until the funded render: does Hasan's door fetch OUR
    read-presigned url (`referenceImages` / `imageUrl`) and our `masset_…`
    ids (`film.generate` references and character, `motion.generate` image /
    video)?** Phase 0 proved only that the door accepts them at intake (402
    at the wallet, not 400): `images.edit`
    `85b2a2ee-f28f-41db-a522-72807f15f78e`, `photoshoot.generate` with four
    `06a8212a-b28e-4121-b681-5a46821cd0f5`, `film.generate` with references
    + character `46012f19-4b3c-453d-8ed7-74805651e99c`, `motion.generate`
    required keys `5de44fd0-8731-437e-a3dd-db8723454c7e` (the supplement).
    The proof is §3.6's funded `images.edit` on org 1813 — the founder's
    word.

55. **Item 49 after §3.3 — still one generic sentence, 20 more samples; and
    two new facts for Hasan.** Every trap from the document's own refusals
    answers 400 `bad_request` "The media service rejected the request —
    check the body against the capability's schema" with no `details` and
    no field (18 of 19 on org 1824; the request-ids are in `summary.json`).
    New (filed as their own items 57 and 58 on the founder's word): (1) **`motion.generate` refuses `lang: "ar"`** — the document's
    only meaningful value (`3f76fcab-6426-4620-8b02-609f8ffed5d0`, the
    supplement) — while `lang: "en"` and no `lang` clear
    (`cc87be93-4c03-4213-8ce7-f326ad15610c`,
    `5de44fd0-8731-437e-a3dd-db8723454c7e`): which key buys the Arabic lip
    repair? (2) **five `referenceImages` on `photoshoot.generate` → 502
    `bad_gateway`, twice** (`2b59e0ce-9a2e-40ab-b0ba-cff566220b1f`,
    `b81bb7bd-1161-4572-bd10-e28cd98e61e0`) — the upstream fails above four
    instead of validating; and the door checks neither the motion still's
    340 px floor nor the clip's 3 s floor at intake. Also for Hasan (no
    blocker): the own-model rows carry `plan: null` on the plain catalog
    read — the `?plan=` read is the only mapping.

56. **CLOSED 2026-09-10 — M-HSN-2 PASSED on production (the founder): the grid, the Logos and Image edit composers, one balanced logos render (wallet −3 cents, the catalog's $0.03), the org id in Settings; the sign-off's org id and job id were not given and the pass stands on the founder's word. Original text:** MANUAL GATE M-HSN-2 (founder, after the merge, on production). (1)
    Studio → the grid shows the 13 cards the catalog grants, none "coming
    soon"; (2) one cheap render — `logos.generate` balanced ×1 ($0.03) —
    from its card to a `succeeded` job whose asset opens; (3) ~~the State
    selector~~ — /B HELD on item 51, nothing to check; (4) Settings shows
    the organization id at the top and Copy copies it. Sign off with the org
    id and the job id.

57. **FOR HASAN — `motion.generate` refuses `lang: "ar"`, and the same body
    passes without it (contradicts the document).** Filed on the founder's
    word, 2026-09-10 (the fact was first noted under item 55). The document
    says `lang` is a two-letter code and "only `ar` does anything — it buys
    an Arabic lip repair pass". Measured on org 1824 (the motion supplement,
    `Docs/qa/hsn-0910/phase0/supplement-motion/`), one variable per rung:
    the required keys alone → 402 at the wallet
    (`5de44fd0-8731-437e-a3dd-db8723454c7e`); `lang: "en"` → 402
    (`cc87be93-4c03-4213-8ce7-f326ad15610c`); **`lang: "ar"` → 400
    `bad_request`** (`3f76fcab-6426-4620-8b02-609f8ffed5d0`), the generic
    sentence, no field named. The question: which key and value buy the
    Arabic lip repair on `motion.generate`, and is the document's `lang`
    the intended key? Until answered the composer sends no `lang` on motion
    and shows no Arabic option there.

58. **FOR HASAN — `photoshoot.generate` answers 502 on five
    `referenceImages`, not 400.** _TEST-0915-2 (gate 1, 18:24Z): five references answered **400 `bad_request`** (request `8c8bb992-ecfb-405f-b413-2129e4257b37`); gate 2 likewise; the flap continues, bucket c both gates._ Filed on the founder's word, 2026-09-10
    (first noted under item 55). The document says 1 to 4 urls. Measured on
    org 1824: four references → 402 at the wallet
    (`06a8212a-b28e-4121-b681-5a46821cd0f5`); five → **502 `bad_gateway`
    "The media service is unavailable — try again later" in ~445 ms, twice**
    (`2b59e0ce-9a2e-40ab-b0ba-cff566220b1f`,
    `b81bb7bd-1161-4572-bd10-e28cd98e61e0`; run 1 on org 1823
    `8584b2b6-18bf-41f7-95d8-e657cd08df20`). Above four the upstream fails
    instead of validating, so a user who could send five would be told to
    "try again later" for a body that can never succeed. The app enforces
    the 1–4 range client-side; asked of Hasan: a 400 that names the limit.
    **TEST-0915 (2026-09-15): the answer FLAPS.** The same five-reference body
    answered 502 at 07:44Z (gate 1, the spec's expectation), **400
    `bad_request`** at 09:00Z (gate 2 — request `abc39336-4b76-4999-9edd-996da3dc516d`,
    the generic sentence, no field named), and 502 again at 09:31Z (gate 3).
    `live-media-capabilities` was red in gate 2 for that reason and green in
    gates 1 and 3; classified bucket c (this item), spec untouched. For Hasan
    with the two questions above: the upstream's answer to an over-limit body
    is not stable between minutes.

59. **live-auth test 3 encodes a dev-server artefact; the production build is
    the honest one (GATE-0910 Phase 0, 2026-09-10).** `DEFAULT_DATASET_ID`
    is `active` in dev and `visitor` in a production build; the verify
    screen creates the workspace from `org.name`; on the login-unverified
    path the pending state carries only the email — so the dev server has
    been creating a workspace named **"Atlas Roasters"** (the demo org) and
    landing on the Dashboard, while the production build (the one users
    get) lands on N3 "Name your workspace". Measured: `vite preview` runs 1
    and 2 red on that test identically, the dev-server control 7/7 minutes
    later (`Docs/qa/gate-0910/phase0/preview-probe.md`). Two fixes for the
    founder's word: (a) the spec expects N3 and finishes through it — the
    walk production actually has; (b) the app never takes a workspace name
    from the demo world, only from this flow's pending signup — a dev-mode
    leak with no production effect, but the dev server must not lie to the
    suite. Until (a) lands, a preview-served live round carries one known,
    classified red.

60. **Nine live tests are dormant as written since fresh orgs stopped being
    funded (BIL-0902).** live-proposals 2–5 (skip on a $0 wallet, never
    switch by design), live-scheduling 3 (no slots on a fresh org),
    live-studio 4 (a `LIVE_MEDIA` render on a $0 org can only reach the gate
    or 402), live-create-visual 3 (reads the fresh org after test 2 ran on
    the funded org; can only pass on a funded fresh org). For a ruling:
    re-target to the funded org under the one-mechanism rule, or delete.
    Found by the Phase 0 read (`Docs/qa/gate-0910/phase0/live-spec-lanes.md`).

61. **For Ward: the dev function's concurrency limit — `429
    ConcurrentInvocationLimitExceeded` under three parallel live files
    (GATE-0910 §3.2, measured 2026-09-10).** With the runner warming the fleet
    once and three files in flight, `GET /me/orgs` answered `429
    {"Reason":"ConcurrentInvocationLimitExceeded","Type":"User","message":"Rate
    Exceeded."}` (record `Docs/qa/gate-0910/gate/20260910-125038/`), and six
    more files timed out on the same throttle reaching the app. This is the
    Lambda's concurrent-execution cap, not a rate limit on a route: a
    dashboard load fires fourteen requests at once, so two or three real users
    opening the product together would meet it exactly as the lane did. Asked
    of Ward: the function's reserved/provisioned concurrency on dev (and the
    number for production, item 53). Until then the gate's lane A runs at the
    widest count that stays green 3/3 (the record says which), and the app's
    own handling of a 429 (no retry today — the walk times out) is a product
    question for a later order, not this one's.

62. **Two production walks the dev server never showed (GATE-0910 §4, the
    runner on the production build, 2026-09-13).** On the production build the
    boot world is `visitor`, so a new org's **Schedule form starts with NO
    model selected** and refuses the first save with "Pick which model drafts
    your copy.", and its **Organization form requires "What you offer, in one
    line"** before any save — a rename included. On a dev server the demo world
    pre-fills both, which is why `live-scheduling`, `live-schedule-repair` and
    `live-team` were green there for weeks and red on the production build in
    all four rounds of the proof (records
    `Docs/qa/gate-0910/gate/20260913-062802/` and `…-070254/`; the pages at
    failure carry the two refusals in the app's own words). The three specs now
    walk what production asks — pick Balanced, fill the offer line — and are
    green on the built app (`Docs/qa/gate-0910/item-62/preview-probe.log`,
    11 passed). **For the founder's ruling, a product question the spec fix
    does not decide:** should a new org's schedule default to a model
    (`balanced` is already the wire's fallback when none is sent), and should a
    rename be possible before the offer line exists? Today on `1.malaky.ai` and
    on the apex a real user meets both walls exactly as the specs did. Item
    59's family, third and fourth instance.

63. **For Hasan: `social-posts.media` checks the `durationS` TYPE before the
    wallet and the MAXIMUM after it (GATE-0910, measured 2026-09-13 at zero
    spend — `Docs/qa/gate-0910/item-63/`, `pnpm probe:item-63`).** _TEST-0915-2: 999 → 402 at the wallet in both gates; known red, waiting on Hasan._ The two
    halves of one field are no longer enforced in the same place: `durationS:
    "abc"` is refused **400 `bad_request`** before the wallet, as the
    capabilities document says; `durationS: 999` passes validation and reaches
    the wallet, which refuses it **402 `wallet_insufficient`** (request-ids
    `a3cb0dca-5f6a-4646-9ae8-3abe2c9a5315` and
    `25c4c86c-6b07-40ab-bfe5-93efba1b4b86`, both verbatim on the record). On
    2026-09-10 both answered 400 and `live-video-duration` was green in both
    HSN-0910 gate rounds; on 2026-09-13 it is red in six rounds out of six,
    always on the over-maximum body, never the type one. **Why it matters
    beyond the test:** on an unfunded org the wallet hides it, but on a FUNDED
    org that body is paid for before anything checks the clip's length. Asked
    of Hasan: (1) is the maximum still enforced, and where — before the wallet,
    after it, or only upstream at render time; (2) if after, is a funded org
    charged for a body later rejected for its length; (3) if the order is
    deliberate, the document should say so and the client should hold the
    maximum itself before spending. **No spec edit** — the spec posts to the
    API directly, not through the app, and stays as the document says until
    Hasan answers (the founder's ruling, 2026-09-13). **TEST-0915 (2026-09-15):**
    the same red in the session's first full gate (bucket c, KNOWN, no spec
    edit) and reproduced at zero spend on throwaway org 2197 — `durationS:
    "abc"` → 400 `bad_request` (request `2f6229da-b800-497a-b92e-06877bda2755`),
    `durationS: 999` → 402 `wallet_insufficient` (`81cf254c-2cec-441d-bf7b-c7b3492caf91`),
    wallet 0 → 0, no job. Still Hasan's.

64. **CLOSED 2026-09-15 (TEST-0915) — proven first on QA org 2170 through the affected write site byte-identical: with one Don't row stored, `input[id^="voice-do"]` matched only `voice-dont-0`, the stored Don't rule was overwritten and no do rule reached the wire (GET voices request `19beee5f-02b2-48b0-b191-bfcab36c2f1d`). Fixed by ONE helper, `addVoiceRule(page, 'Do' | "Don't", text)` in `e2e/live-setup.ts`, which targets the new row by the exact label `RuleList` writes (`Do rule N` / `Don't rule N`) with the row count read BEFORE Add, so nothing relies on DOM order; the six write sites and four read sites in `live-brand-rules`, `live-brand`, `live-onboarding` and `live-setup` (`ensureFundedBrand` on the shared org 1813, `completeBrandSetup`) moved to exact labels. Proven fixed on QA org 2171 with a Don't row present (`b21a362f-715e-4229-9291-905834df41d4`). Commit `454e98e`; no product code changed; record `Docs/qa/test-0915/item-64/`. Original text:** `input[id^="voice-do"]` also matches the Don't rows — six call sites read
    a list they do not name (found 2026-09-13 by the brand-voice removal
    probe; NOT fixed, by the founder's word). `RuleList` ids its inputs
    `<idPrefix>-<index>` (`src/features/settings/field-editors.tsx`), and the
    Brand voice screen passes `voice-do` and `voice-dont` — so the prefix
    `voice-do` is a prefix of `voice-dont` too, and
    `input[id^="voice-do"]` selects **every Do row AND every Don't row**.
    Measured on org 2166 with one do and one dont stored: the locator returned
    `["Name the farm when it matters", "Call anything artisanal"]` — two
    values for a one-row list. What it costs, per site: the READS in
    `live-brand-rules.spec.ts:167/184/187` and `live-brand.spec.ts:114` use
    `.first()` / `.nth(1)`, and the Do fieldset renders before the Don't one,
    so today they land on real Do rows **by DOM order, not because the
    selector says so** — they pass while asserting something they do not
    state, and any `toHaveCount` on that locator would be wrong outright. The
    WRITES are the fragile half: `.last()` at
    `live-brand-rules.spec.ts:157/159`, `live-brand.spec.ts:109`,
    `live-onboarding.spec.ts:138` and `live-setup.ts:173/396` resolves to the
    **Don't** input the moment a don't row already exists, so the helper types
    the do-rule into the wrong field and the assertion fails somewhere else.
    `live-setup.ts:173` (`ensureFundedBrand`) is the one to watch: it runs on
    the SHARED funded org 1813, which today has 1 do / 0 dont (item's own
    census, same date) — latent, not firing. The honest selector is
    `input[id^="voice-do-"]` (the trailing dash), or `getByLabel(/^Do rule/)`
    against the `aria-label` `RuleList` already writes. **Deferred
    deliberately:** every affected spec is green today, the fix touches four
    spec files and one helper, and it belongs in a testing session, not in a
    probe. No behaviour of the app is implicated — the screen and its PATCH
    are correct (`Docs`-less scratch record, 2026-09-13 probe).

65. **CLOSED IN CODE 2026-09-13 — the brand voice read/write asymmetry that
    grew org 1867's row from 18 rules to 94** (branch `feat/voice-0913`,
    decisions.md "D-INT-B AMENDED"). Kept here as the record of what a
    read/write asymmetry costs, and because the DATA repair was manual: org
    1867's two rows were merged to 19 deduplicated rules on row 293 and row
    294 deleted, by hand, at zero spend (request-ids in sessions.md). Three
    fixes shipped together — the adapter reads the canonical row only, a
    combined cap of 40 sits below the wire's 50, and a refused save renders
    the wire's 400 with its request id instead of a green toast. 17 new unit
    tests. **Nothing live has run against these** (build order, the standing
    rule): the next testing session the founder names is what proves them on
    the deployed API. `live-brand-rules.spec.ts` and `live-brand.spec.ts` both
    walk this screen and neither was touched.

66. **For the founder: how should a workspace with EXTRA brand voice rows be
    resolved?** (2026-09-13, the half of item 65 deliberately not built.) The
    screen now edits one row and SAYS the others exist — it does not merge or
    delete them, because that is destructive, irreversible, and a judgement
    call about which rule survives a near-duplicate. Today the answer is a
    workspace owner's act, by hand: read both lists out, merge, delete the
    loser (the 1867 walk is the template). There is NO support channel in this
    product (the founder, 2026-09-14) — the screen's notice points at an owner
    or admin for exactly that reason. **Two candidates for a real mechanism:**
    (a) a reviewed merge in the product — show both lists side by side, let
    the user choose what survives, one explicit press, no silent rewrite; or
    (b) ask Hasan to make the voice name unique per org, so a second
    `Brand voice` row cannot be created at all. (b) is the actual fix and
    removes the class; (a) is what this repo can ship without him, and is
    worth having anyway for rows that already exist under other names. Until
    one is chosen, the notice is the whole behaviour. **Nothing to ask Hasan
    about the limit:** `Docs/api/api.md` line 675 has said "at most **50**
    rules per create/PATCH" all along. The client simply never enforced a
    limit its own contract document carried — which is the more useful
    lesson, and why the new cap is a constant next to the other two rather
    than a number buried in a screen.

67. **For Hasan: what do `creative` and `precise` actually change on a
    generate run — the grounding SOURCE, the grounding STRICTNESS, or the
    model?** (2026-09-14, ORDER UX-0913/P1-R.) The Generate screen's plan
    control (`PLANS` in `src/features/generate/live-generate.tsx`, sent as
    `plan` on `PostsGenerateRequest`, `ApiPlan = balanced|creative|precise`)
    tells the customer what each option does. **Balanced's copy is settled**
    and was updated in this order. The other two are FROZEN until this is
    answered, because two plausible readings contradict each other and we will
    not replace one possibly-wrong claim with another:

    - _grounding SOURCE_ — what the app says today: creative grounds in a
      curated web search **instead of** the org's own material.
    - _grounding STRICTNESS_ — what Abdallah's replacement copy implied:
      creative stays on the org's material but leans **less on verbatim
      facts**.

    These are different behaviours and only one can ship. **The three strings
    as they stand today, verbatim, so the answer can be checked against them:**

    - `balanced` → "Grounded in your knowledge and sources, with fresh
      phrasing. The default."  _(settled, this order)_
    - `creative` → "Grounded in a curated web search instead."  _(frozen)_
    - `precise` → "The most careful writer, also web-grounded."  _(frozen)_

    Note `precise` carries its own unanswered half: "also web-grounded" says
    the careful option ALSO reaches the web, which sits oddly beside a name
    that reads as the most conservative choice. Worth confirming in the same
    answer. **Not to be confused with open-items 9** (`gm_creative → fast` on a
    schedule's `modelAlias`) — that is the OTHER vocabulary, and D-UX-0913-D is
    the record of why the two are so easy to confuse.

68. **The product has no Arabic UI locale, and no `dir` mechanism at all —
    while Malaky is positioned Arabic-first.** (2026-09-14, ORDER THEME-0913
    Phase 0, escalated by the founder in RULING 2.) This is not a polish item
    and it is not a translation backlog: **the mechanism does not exist.**

    **Measured, Phase 0:**

    - `index.html` is `<html lang="en">` with **no `dir` attribute**, and
      nothing in `src/` ever sets one.
    - **Zero Arabic strings anywhere in the signed-in product.** A script
      sweep of every `.ts`/`.tsx` under `src/` found Arabic script in exactly
      four files, **all of them under `src/features/marketing/`**
      (`Footer.tsx`, `icons.tsx`, `lib/campaign-creative.ts`,
      `lib/content.ts`). The visitor world speaks Arabic; the product a
      customer signs in to does not.
    - There is no locale layer, no message catalogue keyed by language, and no
      language preference on the account. `src/lib/messages.ts` is a flat
      English catalogue.
    - Arabic appears in the product only as **customer content** — a tone's
      language, a brand's language — never as interface.

    **What Phase 1 did and did not do.** ORDER THEME-0913 shipped the product
    **RTL-correct in structure**: all 35 physical-direction utility classes
    (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, and seven negative
    margins) were converted to logical properties (`ms-`, `me-`, `ps-`, `pe-`,
    `text-start`, `text-end`), and the app now hardcodes left or right
    **nowhere**. So a `dir="rtl"` document would lay out correctly. That is the
    structural half and it is done. **The locale half is untouched.**

    **What an Arabic locale would need** (named here so the order that does it
    starts from a list, not a discovery phase):

    1. **A locale layer** — a language preference that persists, a message
       catalogue keyed by locale, and a way for every designed string in
       `src/lib/messages.ts` (and the ~19 inline field helpers and
       `routes.tsx` handle contexts that UX-0913 deliberately left inline) to
       resolve through it.
    2. **`dir` on the document**, set from that preference before paint, the
       way `MarketingLayout` already sets `data-mk-world`.
    3. **The Arabic face — already present.** `--font-arabic`
       (IBM Plex Sans Arabic, 400/500/600) is in the token set and bundled;
       THEME-0913 put it there. Nothing to add.
    4. **The +1 weight step.** The design law requires Arabic to sit one
       weight step above the Latin equivalent at body size and below, because
       thin light-on-dark Arabic blooms. That is a rule about where Arabic is
       SET, so it cannot be applied until there is Arabic to set.
    5. **Number, date and time formatting** — `src/lib/format.ts`,
       `timezone.ts` and `MonoNumber`'s tabular-figure contract all assume
       Latin digits today.
    6. **The QA surface** — Phase 1's screenshots are English-only for exactly
       this reason. An Arabic locale needs its own screenshot matrix.

    **This is its own order and it has not been started.** The founder's
    instruction was explicit: name what it needs, do not begin it.

69. **The five M-BIL-1 frames show the retired light theme, and are deliberately
    NOT re-taken.** (2026-09-14, ORDER THEME-0913 close-out.)
    `Docs/qa/m-bil-1/recovered-org1813-*.png` (four) and
    `recovered-org1814-billing-cancelled-deeplink.png` (one) are the only
    screenshots under `Docs/` that still show the light palette. They were
    listed in the THEME-0913 Phase 0 inventory as "stale", and the close-out
    order offered a choice: replace them, or file them here.

    **They are filed, not replaced, and the reason is stronger than
    scheduling.** These are not design references. They are the **evidence
    record of a payment event** — the founder's billing manual gate
    (open-items 45, ORDER M-BIL-1/auto), run ONCE on 2026-09-03 against
    production with Stripe in test mode on two real orgs (1813, 1814). That
    folder's own README carries the rule: *"the Stripe pages are driven once,
    and nothing that can bill is retried."*

    Re-shooting them in the dark theme would produce pictures of a run that
    never happened. That is worse than a stale record — it is a false one. The
    frames show the palette the product wore on the day the gate ran, which is
    exactly what a record is for.

    **What would be needed if the founder ever wants the SCREENS refreshed**
    (not the payment): a live run against real funded orgs, which is a testing
    session, not a build order — and it would still not reproduce the original
    evidence, only new screens in the new theme. The honest form of that is a
    NEW record under a new folder, leaving these five where they are.

    `Docs/qa/m-bil-1/README.md` carries the same note inline, so a reader who
    opens the folder learns it there rather than here.

70. **The static e2e suite is not deterministic under parallel load — four
    specs flake, and locally there are no retries to absorb it.** _TEST-0915-2: at one worker through the runner the static suite was 119 / 0 / 90 in both gates; the one flake of the session was `entry-flow:129` in the pre-flight run, green alone in 2.1 s (bucket d)._
    (2026-09-14, ORDER THEME-0913 close-out, filed on the founder's word.)

    **NOT a regression, and that is established rather than assumed.** All four
    passed in run 1 and again 16/16 when re-run serially on the same tree and
    the same application code; the only files that changed between run 1 and
    run 2 were e2e specs, none of which touch these four.

    **The four, with both results:**

    | Spec | Run 2 (6 workers) | Run 1 / isolation (`--workers=1`) |
    | ---- | ----------------- | --------------------------------- |
    | `entry-flow.spec.ts:75` — `@golden signup → verify → the app, with no wizard in between` | FAILED — `getByText('Nova Skincare').first()` not found | passed (6.0s) / passed (3.2s) |
    | `entry-flow.spec.ts:119` — `@axe the workspace-creation retry scans clean` | FAILED — `getByRole('button', { name: 'Create my workspace' })` not found | passed (5.6s) / passed (3.3s) |
    | `entry-flow.spec.ts:129` — `sign-in locks out after repeated failures and counts down` | FAILED — test timeout 30 000 ms clicking the marketing header's `Login` link | passed (3.9s) / passed (2.1s) |
    | `hsn-series.spec.ts:53` — `Create visual on Today: beside Approve and Reject, refuses a blank kind, runs once, attaches nothing` | FAILED — the dialog's `Simulated in the demo…` line not found; the log shows `navigated to /today` mid-assertion | passed (8.8s) / passed (5.8s) |

    **Run totals for the record:** run 1 **114 passed / 1 failed / 84 skipped**;
    run 2 **110 / 5 / 85**; run 3 **115 / 0 / 85**; isolation
    (`entry-flow hsn-0902 hsn-series --workers=1`) **16 / 0 / 0**.
    (Run 2's fifth red was NOT a flake — it was `hsn-0902.spec.ts:69`, a real
    consequence of this series' all-caps ban, fixed with a `data-slot` hook.)

    **The mechanism, measured, not guessed.** `playwright.config.ts` sets
    `fullyParallel: true` and **`retries: process.env.CI ? 2 : 0`** — so a local
    run has **zero retries** and every flake lands as a hard red. Three of the
    four failures are a locator or a click missing its default 5 s / 30 s
    window; the fourth is an assertion racing a navigation. All four are timing,
    not logic, and the machine was carrying the developer's own browser
    (≈50 Chrome renderers) alongside six workers.

    **Why it matters for the named testing session:** the gate runs these same
    specs, and a red that is only contention costs a re-run and an
    investigation each time. **Nothing here is fixed by this order** — it is
    recorded so the next person does not re-derive it at 2 a.m.

    **Candidate remedies, none applied** (each is a decision, not a tidy-up):
    raise `retries` for local runs the way CI already does; give the four
    specs' first-navigation assertions explicit `waitForURL`, which is exactly
    what fixed the THEME-0913 screenshot spec; or pin `--workers` for the
    entry-flow file, which is the one that carries signup state.
    **TEST-0915 (2026-09-15):** the session's rule was `--workers=1` on every
    Playwright command line; the static suite ran serially four times —
    115 / 0 / 85 each time (350 s, 351 s, 351 s, 340 s) — with no flake, and the
    live files ran one at a time through the runner. `playwright.config.ts`
    was not edited. The remedies above are still the founder's to choose;
    item 74 records that the runner's static half cannot take the worker
    count from its command line.

71. **CLOSED 2026-09-15 (TEST-0915) — `live-brand-kit.spec.ts` ran ALONE first, live, `--workers=1`, on the built app with the dev base inlined: 3 passed / 0 skipped / 0 failed in 33 s; both edited assertions (lines 116 and 157, `[data-slot="file-role-badge"]` → `Brand kit`) executed and the wire echoed a role the table maps. Record `Docs/qa/test-0915/gate/20260915-070659/` (tree `9d4fdbc`). Original text:** Two LIVE spec edits are UNRUN and must not be assumed verified.
    (2026-09-14, ORDER THEME-0913 close-out, filed on the founder's word.)

    `e2e/live-brand-kit.spec.ts` **line 116** and **line 157** were edited by
    the THEME-0913 close-out and **never executed** — the close-out ran the
    static suite only, and the 21 live specs skipped as designed.

    **What changed and why.** Both lines asserted the media file's role badge
    by its TEXT CASE: `getByText('brand kit', { exact: true })`. That worked
    only because the badge's source string was lowercase and CSS rendered it
    uppercase. ORDER THEME-0913 banned all-caps labels, so the source became
    sentence case ("Brand kit") — and in the demo world the FILE is also named
    "Brand kit", so the exact-text locator then matched two elements. Both
    lines now read:

    ```ts
    await expect(<row>.locator('[data-slot="file-role-badge"]')).toHaveText('Brand kit')
    ```

    The hook `data-slot="file-role-badge"` was added to
    `src/features/settings/media-files-section.tsx` in the same change.

    **The static twin IS verified:** the identical edit to
    `e2e/hsn-0902.spec.ts:102` passed in run 3 and in the serial isolation run.
    That is good evidence the live pair will pass — it is **not** proof, because
    in live mode the badge is driven by the role the WIRE echoes rather than by
    the demo's fixture, and that path has not been exercised since the change.

    **Action for the named testing session:** run `live-brand-kit.spec.ts` and
    confirm both assertions. If the wire echoes a role the table does not map,
    the badge renders nothing and `toHaveText` fails — which would be a real
    finding about the wire, not about this edit.

72. **The sidebar's collapse runs on a `duration-200` literal that the motion
    scale does not reach, and the file it lives in may not be hand-edited.**
    Filed by ORDER MOTION-0914/A2, which ruled it **recorded, not fixed**.

    **What it is.** `src/components/ui/sidebar.tsx` ships
    `transition-[width,height,padding]` with an explicit `duration-200` on the
    rail's collapse. An explicit `duration-*` utility beats the
    `--default-transition-duration` that MOTION-0914/A pointed at the scale, so
    that one transition runs at 200ms while everything else in the product runs
    at `--motion-fast` (120ms) or `--motion-medium` (220ms).

    **Why it was not fixed.** CLAUDE.md rule 3: files under
    `src/components/ui/` are never hand-edited. The three legitimate escapes
    are a token, a variant, or an unlayered rule in `globals.css` — and the
    third would work here. It was left alone because 200ms is **20ms** from
    `--motion-medium`, which is the value it would move to; nobody can see the
    difference, and an unlayered override buys a rule in the cascade and a
    thing to maintain in exchange for nothing visible.

    `design.md` Part 5.0 names it as one of the two exemptions from "a literal
    duration in code we author is a bug", so the doc does not claim a
    completeness the code does not have.

    **Action for a human:** decide whether the 20ms is worth an unlayered rule.
    If a future shadcn update changes that literal, or if the scale's `medium`
    moves far from 200ms, this stops being cosmetic and should be revisited.

### TEST-0915 — the named testing session (2026-09-15)

Numbering continues from 72. The record: `Docs/qa/test-0915/`.

73. **CLOSED 2026-09-15 (ORDER-FIX-0915, D-FIX-0915-B) — candidate (a): `saveBrandVoice`'s catch returns the failure and does not resync; a save that lands still resyncs once, Try again still re-reads. Seam tests on a shared dispatch spy (2 red before); `live-brand.spec.ts`'s new browser-fulfilled 400 case — alert with the request id, the typed rule and Save still up three seconds on, then the real save — 6 / 6 alone on the dev API. The topics seam's identical idiom is item 78. Commit `a700612`; record `Docs/qa/fix-0915/item-73/`. Original text:** A refused Brand voice save wipes its own refusal and the user's draft:
    `saveBrandVoice`'s failure path resyncs, and the Settings layout unmounts
    the screen while the sync runs. (TEST-0915 proof C, on the built app
    against the dev API, org 2199.) A PATCH answered 400 (intercepted, the
    wire's envelope with `details[0].message` and a request id). The honesty
    half held: no "Brand voice saved", and the error toast carried the wire's
    own field message. But VOICE-0913's in-screen `role="alert"` with the
    request id — and the draft the user had typed, and the Save button — were
    gone within a second: `src/data/brand.ts` calls `resync()` in the catch
    (since INT-3, 2026-07-30), `liveSyncPhase` goes `syncing`, and
    `settings-layout.tsx` renders its skeleton instead of the outlet, so the
    screen remounts pristine when the sync lands. The unit tests that proved
    fix (3) render the screen under a mocked provider that never remounts,
    which is why it was green. Pre-existing on `main`; not this stack's; not a
    gate red. **Two candidate fixes, for a ruling:** (a) do not resync after a
    4xx refusal — nothing changed on the wire, the client's saved state is
    still the truth, and the draft and the alert survive (one line, but the
    same `resync()` idiom sits in eight other brand seams); (b) keep the
    resync but let the settings layout keep its outlet mounted during a
    re-sync (a busy indicator instead of the skeleton), which touches every
    settings screen's loading design. Evidence:
    `Docs/qa/test-0915/proofs/proof-c-1-refused-save.png`,
    `proof-c-2-three-seconds-later.png`, `proofs-live-run2.md`.

74. **CLOSED 2026-09-15 (ORDER-FIX-0915) — `scripts/verify-all.ts` takes `--workers <n>` (one outside CI unless given; in CI nothing is passed and Playwright's default stands) and `gate.ts` hands its own `--workers` down to the static half; `playwright.config.ts` untouched. Proven by `pnpm gate --skip-live --workers 1 --series fix-0915` (`Docs/qa/fix-0915/gate/20260915-130402/`, GREEN): the e2e log reads `Running 207 tests using 1 worker`. Commit `96b3435`; record `Docs/qa/fix-0915/item-74/`. Original text:** `pnpm gate`'s static half runs Playwright at the default worker count,
    and nothing on its command line can change that. (TEST-0915, item 70's
    rule for a testing session is `--workers=1` on every Playwright command
    line.) `scripts/verify-all.ts` spawns `pnpm exec playwright test
    --reporter=list,json` with no `--workers`, and `gate.ts`'s `--workers`
    reaches only the live lanes. This session ran the static suite directly
    (`playwright test --workers=1`: 115 / 0 / 85 twice, 350 s and 351 s, no
    flake) and the live half through `pnpm gate --skip-static`, so the seven
    `verify:wNN` report checks were not part of the gate record. **For a
    ruling:** give `verify:all` a `--workers <n>` pass-through (and `gate.ts`
    hand its own value down), or accept that the static half of a testing
    session runs outside the runner. Not a product item.

75. **CLOSED 2026-09-15 (ORDER-FIX-0915, D-FIX-0915-A) — `Authed` sends a signed-out render to `/login`, never to `/`; the handler is unchanged and the two navigations agree. No returnTo exists in the app and none was added (a question for the founder). Unit: `routes.test.tsx` + `data/session-breach.test.tsx`, 3 of 5 red before. Live: `e2e/live-auth-401.spec.ts` (expired at boot, revoked mid-session, dead at boot on Billing) alone at `--workers=1` on the dev API — 4 / 4 on org 2273 (request ids in the record); four earlier runs red on the spec's own defects, each kept. Commit `a691b96`; record `Docs/qa/fix-0915/item-75/`. Original text:** A 401 met MID-SESSION on an authed route lands on the marketing home,
    not on login. (TEST-0915 proof I, on the built app against the dev API,
    org 2199.) The boot path is right: an expired or tampered token at reload
    answers 401 on the first sync, the session is purged, the toast "Your
    session ended. Sign in again to continue." shows, and the app lands on
    `/login` (PASS, four runs). But a token REVOKED while the app holds it
    (`POST /auth/logout` from outside, 204) and then a read from an authed
    route (Settings) ends with the session purged and the URL at **`/`** — the
    signed-out website home — with no toast on screen after a few seconds.
    Mechanism, read in the code: `onUnauthorized` (`provider.tsx`) purges,
    dispatches `live/sessionCleared`, toasts and pushes `/login`; the
    provider's update renders the CURRENT authed route with `signedIn: false`
    first, and `Authed` (`routes.tsx`) answers a signed-out render with
    `<Navigate to="/" replace />`, which supersedes the push to `/login`
    (React Router wraps its own navigation in a transition). Pre-existing on
    `main` (INT-era code; the stack did not touch it); not a gate red; proof
    I's expected end state ("lands on login") holds only for the boot path.
    **For a ruling:** should `Authed` send a signed-out render to `/login`
    (which also changes where an anonymous deep link to `/today` lands), or
    should the 401 handler navigate through the router after the state
    settles? Measured (run 6, sampled every 200 ms from the revocation, request `3c6f25d3…`): url `/ → /settings → /`; the toast and the purge both at 413 ms; `/login` never reached; no Sign in button at the end. Record `proofs/proofs-live-run6.md`.
    **A third case, from the post-deploy smoke on `2.malaky.ai` after the
    merge** (`Docs/qa/test-0915/run-log.md` Phase 5, `post-deploy/smoke.md`):
    a boot on Billing with a tampered token ended at `/` with the toast up
    and the session purged — the same guard, the same race, the same fix.

76. **CLOSED 2026-09-15 (ORDER-FIX-0915, D-FIX-0915-C) — the first candidate: one unlayered rule in `globals.css` (override 7b), `.toaster .cn-toast { transition-property: transform, visibility, height, box-shadow }` — the rise stays, opacity is never transitioned (the exit is a cut now). Measured on the BUILT app: before, 1:1 at +51 ms, 1.34:1 at +85 ms, 4.27:1 at +168 ms against 13.62:1 at rest; after, 13.62:1 at every offset with the rise 68 → 57 → 26 → 0 px; reduced motion the end state at +45 ms (`scripts/probe-fix-0915-toast.ts`). The +80 ms sample lives in `today-queue.spec.ts`, proven by keying the rule off (0.31 at +80 ms) and reverting. Commit `7249bb4`; record `Docs/qa/fix-0915/item-76/`. Original text:** The Approve toast's ENTRANCE fade puts its description under AA for the
    first ~400 ms — sonner's own motion, not ours. (TEST-0915 proof E,
    axe mid-animation.) Scanned 80 ms after the Approve click, axe reported one
    serious `color-contrast` node, `div[data-description]` of the toast;
    scanned again once the toast was up it reported 0 violations and the
    description measured **13.62:1** (`rgb(232,232,232)` on `rgb(22,31,38)`),
    so D-MOTION-0914-L's fix stands. The transient is `sonner`'s default
    entrance — `[data-sonner-toast] { opacity: 0; transition: transform 400ms,
    opacity 400ms, … }` in `node_modules/sonner/dist/styles.css` — which
    composites the text at partial opacity over the page for the first
    frames. It is the same class of hazard D-MOTION-0914-H removed from the
    content entrance ("nothing is rendered at reduced contrast at any
    instant"), at a smaller scale and in a primitive this repo never hand-edits
    (CLAUDE.md rule 3). MOTION-0914/B's +80 ms scan recorded 0 here; the
    difference is timing, not the code. **For a ruling:** an unlayered rule in
    `globals.css` that keeps the toast's slide and drops its opacity ramp (the
    fourth mechanism rule 3 allows, with the arithmetic in the comment), or an
    accepted transient. Not fixed here — it is a motion decision about every
    toast in the product, not a bug in one.

77. **CLOSED 2026-09-15 (ORDER-SHELL-0915, D-SHELL-0915-A) — the shell is a layout route now: `AppFrame` (rail, top bar, banners, the section rhythm, the content entrance) mounts once in `WorldLayout` above every app route, `/` included, and each screen's `AppShell` — same props, 33 render sites untouched — declares its top bar into the frame and renders into its outlet. The indicator tagged on the Dashboard is the same DOM node through Today, Billing, Calendar and Settings (`e2e/shell-identity.spec.ts`, normal and reduced motion; red with a second frame around a screen), the five route arrivals measured before and after (proof E's clock on the static dev server, warm hops, three runs per route in both modes — medians 73 → 52 ms (motion) and 77 → 49 ms (reduced); Today 65–73 → 48–52, Billing 62–68 → 22–25, Settings 82–95 → 65–67, Studio 55–58 → 30–32, Calendar 52–56 → 32–35; the indicator re-created on 30 of 30 hops before, the same node on 30 of 30 after). Nothing per screen changed. Commit `5f01310`; record `Docs/qa/shell-0915/`. Original text:** The rail's gold indicator does not travel BETWEEN SCREENS: every screen
    renders its own `AppShell`, so the rail — and the one indicator in it — is
    re-created on each route change. (TEST-0915 proof G, sampled at 8 ms on
    the static dev server.) D-MOTION-0914-C built the right construction — ONE
    `[data-slot='nav-indicator']` per rail, measured against the active row —
    and recorded "measured sliding: translateY 4 → 36 → 132 → 228px across four
    routes". Those are positions read after each navigation; the motion itself
    was not sampled. Sampled, Dashboard → Today: the old node is gone and a
    NEW node appears at 77 ms with `data-placed="false"`, its opacity ramps
    from 0 (the silent first placement, then the `--motion-fast` fade), and only
    two transforms are ever seen (the old position, the new) — no intermediate
    frame, so nothing slides. Today → Billing: the same. The indicator DOES
    slide where the container persists: the settings sub-nav between tabs
    (see the run's next row), because `SettingsLayout` stays mounted. The
    press step, the hover step and the rest of D-MOTION-0914-C stand; only the
    between-route travel is unrealised. **The structural fix is state.md
    trap 8's rule** — shared chrome belongs in a route layout above an
    `Outlet` — which is an architecture change to how every signed-in screen
    mounts its shell, not a testing-session fix. Until then the rail's
    indicator appears at the new row in one fade; nothing is broken, the claim
    is narrower than written. Evidence: `proofs/proofs-static-run2.md`.

### ORDER-FIX-0915 — the follow-ups (2026-09-15)

Numbering continues from 77. The record: `Docs/qa/fix-0915/`.

78. **CLOSED 2026-09-16 (NIGHT-0916 order 5, D-NIGHT-0916-E).** _Measured
    first: a refused topic POST wiped the chip with nothing said (12 reads).
    Item 73's rule applied: no resync on a refusal, the chip stays, an alert
    with the wire's message and request id. Commit `a7be9b7`._ **The topics
    seam keeps the `catch { resync(); return failure }` idiom item 73
    removed from the brand voice save.** `saveTopics` in
    `src/data/brand.ts` dispatches an optimistic `topics/set`, writes, and
    resyncs on failure as on success. Whether a refused topic write erases
    anything on screen is unmeasured — the topics editor is a tag input, not
    a draft form with an alert — so it is filed, not changed: out of
    ORDER-FIX-0915's scope (item 73 named the brand voice). **For a ruling:**
    the same one-line change, once a refused topic write is measured.
79. **The app makes deferred reads about a second after the sign-in sync
    settles** — `event-sources/countries` and `alphastudio/media/assets`,
    twice each on the dev server (StrictMode) — and a live spec's "next read"
    can race them: item 75's runs 2–4 met the 401 on those reads before the
    spec's own click. Not a product bug; a fact for spec authors —
    `waitForLoadState('networkidle')` after the Dashboard heading does not
    cover them. `live-auth-401.spec.ts` records every toast it sees and
    dispatches its click best-effort for that reason.
80. **Every `[api]` console line on the dev API reads `request-id
    unexposed`:** the server's `x-request-id` header is not CORS-exposed, so
    the client reads an id only from an error envelope; a success carries none
    the browser can see. For Ward: `Access-Control-Expose-Headers:
    x-request-id` would make every call findable from the console. Not a fix
    in this repo.

### TEST-0915-2 — the named testing session (2026-09-15)

Numbering continues from 80. The record: `Docs/qa/test-0915-2/`.

79 (annotated, still open): no red of item 79's shape in either gate; the
deferred reads were met on purpose by the Phase 4 probe's 401 cases and by
`live-auth-401` (green in both gates). No harness fix landed — nothing to
close.

81. **Under the gate's live round, five form submits answered nothing inside
    their 20 s and the specs went red — green alone, every one.** _NIGHT-0916
    (order 1, D-NIGHT-0916-A): the client side is done — every request fails
    at 15 s with "The server did not answer. Try again." (code `timeout`,
    handled like a network failure: alert, toast, submit re-enabled, draft
    kept, no retry), and the gate runner spaces file starts by 8 s
    (`--spacing`). **Stays open for Ward, the wire side, with the night's
    measurements:** a burst of eight signups answered 201 in 3.9–4.6 s (no
    hang, no 429), so the hang is not width-driven; it is ONE request pending
    15–30 s then answered — seen on a signup POST (~21:01Z), a login POST
    (~21:23Z), five of seven product signups from a preview build
    (21:54:57Z–22:04:16Z), and directly on the CORS preflight: `OPTIONS
    /auth/signup` for origin `localhost:5197` answered 200 in **17,931 ms**
    at 22:02:3xZ, then 357/367/398 ms; the signup POSTs right after 1.5–1.7 s.
    Record `Docs/qa/night-0916/order-1/`, `order-4/`. Question for Ward:
    what holds a single request (OPTIONS included) for 15–30 s while its
    neighbours answer in under 3 s. Separately, this machine's outbound
    dropped three times tonight (21:24–21:30Z, 22:19–22:20Z, 23:01–23:08Z:
    `connect ETIMEDOUT` to the API's address, GitHub and 2.malaky.ai
    unreachable together) — not the wire, and not this item._ Gate 1
    (`Docs/qa/test-0915-2/gate/20260915-180958/`): from 18:24Z `live-wallet:76`
    and `live-media-upload:58` (Sign in) and `live-billing:62`,
    `live-brand-rules:72`, `live-generate:50` (Create account) sat on the
    filled form with no alert and no toast (the error contexts); alone at one
    worker each was green (wallet 4/4, media-upload 3/3, billing 7/7,
    brand-rules 4/4, generate 1/1; `gate1-isolation/`). Gate 2:
    static GREEN through the runner (verify:all PASS, 119 / 0 / 90 at one worker, unit 829/829 in 74 files, the seven report checks PASS); live 20 of 22 green or all-skipped, the two reds the known bucket c — 58 (400, request `20bf58fb…`) and 63 (402); no bucket a, b or d; 25 min. The shape is the API under the round's burst — the
    runner's warm-up already reads a 429 as an answer — not the code; the app
    showed nothing for a hung submit because there was nothing to show. **For
    a ruling:** whether the round should space its signups (the runner's
    lane A opens a fresh org per file inside ten minutes), and for Ward
    whether the auth endpoints rate-limit per IP.
82. **CLOSED 2026-09-16 (NIGHT-0916 order 4, D-NIGHT-0916-D).** _The clock
    runs from the overlay's first paint, not from mount; the gate waits for
    the workspace; at the clock's end the node hides itself before it tells
    the app. Measured on the built app: 2587 ms paint → removal before (the
    dismissal render ~800 ms behind the sync's), 1814 ms after; the lane-A
    live case reads 1802 ms. Commits `1452bda`, `e3ed7b1`; record
    `Docs/qa/night-0916/order-4/`._ **First light overruns the 2000 ms
    ceiling in LIVE mode: 2287 / 2239 / 2196 ms on three fresh accounts
    (orgs 2312, 2315, 2318), page time, mount → removal.** The moment closes on a 1800 ms `setTimeout`
    (`first-light.tsx`), and live the workspace sync's re-renders land inside
    that window, so the timer fires late. It plays once and never on a
    reload (both proven live). Not this stack's regression — the moment and
    the live sync predate it and the live duration was never held to the
    ceiling (TEST-0915's smoke read "~4710 ms incl. verify") — and a fix is a
    motion decision (close on the animation's own end rather than a timer, or
    accept the sync's share). **For a ruling.** Record
    `Docs/qa/test-0915-2/phase4/`.
83. **CLOSED 2026-09-16 (NIGHT-0916 order 2, D-NIGHT-0916-B).** _One landing:
    a deliberate sign-out moves to `/` through the router, waits for the
    commit, then purges — the marketing home from every route; the forced
    sign-out keeps login. The two helpers loosened in `2dc7c45` are tight
    again. Commit `5fc614d`._ **A sign-out lands in two places by
    construction.** Since D-FIX-0915-A a
    sign-out on an authed route re-renders through `Authed` and lands on
    `/login`; a sign-out on `/` re-renders through `RootGate` and lands on
    the marketing home. Two live specs asserted the old single landing and
    were updated to accept either (bucket a, `2dc7c45`). Neither the order
    nor D-FIX-0915-A names the sign-out case. **For a ruling:** one landing
    for Sign out (navigate explicitly, before clearing the session), or keep
    the guard's answer as it is.

84. **returnTo survives a sign-in that lands on N3 (no workspace).**
    (2026-09-16, NIGHT-0916 order 3.) The sign-in screen reads and clears
    `ab-return-to` on success and navigates to it; when the account has no
    workspace, RootGate shows N3 at `/` and the remembered path is consumed
    the same way — but a path remembered AFTER that point by a guard (a deep
    link tried while on N3) stays in sessionStorage until the next deliberate
    sign-out or the next guard write, since nothing on N3 reads it. Harmless
    today (the key dies with the tab; a later sign-in in the same tab would
    honour a path the person did type), filed so it is not a surprise. **For
    a ruling:** clear it on the N3 render, or leave it.

85. **The login panel now carries two accent-inked figures — the beacon's
    core (D-NIGHT-0916-F, ordered) and the headline's full stop
    (D-THEME-0913-C, the website's idiom).** (2026-09-16, NIGHT-0916 order 6.)
    Neither is a control, and the form keeps exactly one accent element
    (Sign in), so the one-accent law as written holds; but the panel reads as
    two accent points at 1440 (`Docs/qa/night-0916/login/after-1440.png`).
    Not changed: the full stop is a prior ruling. **For the founder:** keep
    both, or drop the stop now that the core carries the accent.

86. **`pnpm lint` sweeps the git-ignored `.gate/` folder.** (2026-09-16,
    NIGHT-0916 order 4.) A probe script parked there turned the cheap checks
    red before anything ran
    (`Docs/qa/night-0916/order-4/checks-lint-red-probe-file/`). The runner's
    own artefacts under `.gate/` are not `.ts`, so the gate never trips on
    it; a human's scratch file does. **Small:** add `.gate/**` to the eslint
    ignores, or keep the rule "nothing of yours lives in `.gate/`".

87. **An in-flight resync from an earlier write can wipe an optimistic chip
    until the next resync lands.** (2026-09-16, TEST-0916 gate 1,
    `live-brand › sources and topics`.) The seam dispatches a topic
    optimistically and POSTs; if a resync started by the previous write (the
    source's) lands in between, it puts the server's list — without the new
    topic — over the optimistic one, and the chip is gone until the topic
    write's own resync brings it back. On a slow wire that gap passed the
    spec's 5 s (22:59Z; `Docs/qa/test-0916-gate1/gate/20260915-224502/`);
    the same flow was green in `live-topics-refused` two minutes earlier and
    in both TEST-0915-2 gates. Pre-existing (every write has dispatched
    optimistically and resynced since INT-2); not touched tonight — the fix
    is in the sync merge: an in-flight resync must not overwrite an
    optimistic write that has not resolved. **For a ruling.**
