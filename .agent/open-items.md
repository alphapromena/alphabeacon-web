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

