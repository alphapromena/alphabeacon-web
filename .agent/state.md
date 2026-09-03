# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-09-03, after **M-BIL-1 (/auto) RAN GREEN on
`1.malaky.ai`: the founder's billing gate, steps 1–8 by a headed Chromium
session, recorded (sessions.md "M-BIL-1 on production") — org **1813**
funded by ONE test-mode checkout (Malaky Business, invoice
`in_1UBaHlKy5r44oOSRSZXHynCY`, wallet `{59900,0,59900}`, the first poll
`active` 0.9 s after Stripe's return, the credit row's full field set now
observed, the `billing.wallet_credited` notification), the 409
`c083f46c-5b4c-45e3-a2f8-a2a3b660d442`, the portal round-trip clean, org
**1814**'s abandoned checkout back on `?checkout=cancelled` at `none`; the
funded QA org's owner in the QA-creds store (`QA_FUNDED_EMAIL` /
`QA_FUNDED_PASSWORD`, User-scope env vars on this machine, `stack.md`); the
FIRST funded live run 6/6 — `live-generate`'s balanced run executed on org
1813 through `skipUnlessFunded`, `live-wallet` 4/4; item 45 CLOSED; step 9
(Ward's "sandbox verified", and the Stripe-side branding — the pages carry
the account name "alpha pro mena" today) is the founder's word. TRAP 24 for
the ledger: `test-results/` is Playwright's outputDir and `pnpm e2e` CLEANS
it at the start of every run — the gate's frames and HARs, written there
as ordered, were deleted by the step-9 run; the runner's `report.json`
survived and five frames were re-taken read-only. A record must never
live under `test-results/`; the M-BIL-1 record sits there now AND in the
session scratchpad — move it before the next e2e run.** Before that, same
day: **ORDER BIL-0902/R MERGED and DEPLOYED on
the founder's word: `main` fast-forwarded `d645607` → `5cbda94` (eleven
commits, one linear history), pushed to `origin main` and `main:live` at
12:44Z; production `dpl_3QpLH1SqJ5BrGbptusyp6TG5gZWs` and the `live` preview
`dpl_EjY9KcdJVFBqtR4NG7tx5m7SFUUn` READY at `5cbda94`; `1.malaky.ai` moved
`index-Lxcr-Fsd.js` → `index-DUHITzRc.js` ~99 s after the push; rollback
candidate = the `d645607` pair, production `dpl_85t8AoU2RX69XzPJvc5hAFEdkPrZ`
and `live` `dpl_F5HpQTqGSqdj8L83efJzG56K23UZ`, both READY; `feat/bil-0902` kept
as the record (local — never on `origin`).** Before the merge, the same
day: the founder's supplement for BIL-0902/R (the seven unjudged live
files, wallet first) RAN on a steady link — five green, the two reds spec
defects, fixed and re-run: wallet 4/4, team 6/6, the live suite 20/20 on
its latest runs; ORDER BIL-0902/R — billing on Ward's corrected plans —
REBASED, RE-PROBED, RE-TARGETED and GATED on `feat/bil-0902`. The branch
sat on `main` = `d645607` (HSN-0902 merged and deployed): the held WIP
`df14989` replayed as `492fc45`, then the /R commits.
**Phase 0/R (fresh QA org 1745, zero spend, `Docs/api/billing-shapes.md`,
the old record kept below as history):** `GET /billing/plans` delivers the
KEYS **unchanged — `base` and `pro`** — with the names **"Malaky Business"
/ "Malaky Scale"**, **59900 / 89900 usd per `month`** (request
`65719d4c-…`); so the client's plan union stays `'base' | 'pro'`, read from
the wire; the "old key" probe answered **201, not 400**, because `base` IS
the live key (recorded and read as such); subscription `none` with the full
field set; credits empty; wallet `{0,0,0}`; member reads 200, member
checkout 403; **portal at `none` still 201**; the delivered-key checkout 201
(url never opened); **the org fields are still DROPPED by `PATCH /orgs/:id`
— item 48 stays blocked.** **What stands:** the demo plans mirror the
delivered rows exactly; the interval renders from the wire; the
**Enterprise card** beside the plans (Custom, no checkout, `/request-demo`);
`billing-frontend.md` carries the superseded note; no `$500` / `yearly` /
`/ year` / `Malaki` anywhere in `src` or `e2e`; **the founder's funding
ruling** — no dev-credit door, one designated QA org funded by a real
test-mode checkout at M-BIL-1 step 8, its owner in `QA_FUNDED_EMAIL` /
`QA_FUNDED_PASSWORD` (`stack.md`) — is built into `skipUnlessFunded` as the
ONE mechanism (zero wallet + creds → sign in as the funded owner, ensure the
brand entities idempotently, run there; `live-proposals` opts out;
unexercised until the org exists); `live-billing` is the one spec asserting
the 402 (the HSN duplicate left `live-generate`). Open-item 46 CLOSED by
the ruling; 45 = M-BIL-1 (/R); 47 re-scoped (the keys question for Ward).
**The gate (final tree):** lint · typecheck · prettier · guard-static 345 ·
unit **601 / 53** · static e2e **111 passed / 82 skipped / 0 failed** ·
`verify:w00`–`w06` **all PASS** · **live round 1 19/20 clean** (billing
7/7; the one red, `live-wallet`, never ran — the global warm-up refused it
on THIS HOST'S LINK) · **live round 2:** the 18:25Z attempt stopped on a dead link (and its loop had to be ended by
command line); the CLEAN round (18:48–19:22Z) judged 10/20 files — **billing
7/7**, brand-kit 3/3, brand-rules 4 + 1, country 4/4, create-visual 3
skipped, generate 1 + 1 — with four reds of one shape (a login or an upload
not within its rung: auth, brand, invite-org, knowledge; none in this
series' files) and **10 files REFUSED at warm-up when the link died at
~19:00Z. The 14-file supplement ran 20:27–20:46Z on a link that flapped
again inside it: auth 7/7, invite-org, media-upload, onboarding,
schedule-repair, studio and video-duration green; brand, knowledge,
notifications, proposals and scheduling red on the same login/sync-latency
class, team and wallet refused at warm-up.** So the gate is **PARTIAL,
closed: static green throughout, round 1 19/20, round 2 + supplement 13/20
green (this series' own surfaces 7/7 in every run), and 7 files — brand,
knowledge, notifications, proposals, scheduling, team, wallet — left
unjudged by this host's network. **The founder's supplement (2026-09-03,
wallet first, host held awake, stop on any drop) first STOPPED at 06:11Z on
a dead link (nothing ran; gateway and 1.1.1.1 100 % loss), then RAN
12:02–12:10Z on a steady link that held every burst: brand 5/5, knowledge
3/3, notifications 1/1, proposals 1 + 4 skipped and scheduling 2 + 1
skipped (both by design, as in round 1), wallet 2 + 1 failed and team 4 +
1 failed — both reds SPEC defects, not the product, not the link: wallet's
`getByText('$0.00')` matched three usage cells by substring (this series'
own re-target; fixed with `exact: true` and a 20 s wait), team's Remove
click raced the demotion's PATCH (a missing one-line wait, the file's own
pattern; fixed). Re-run on the fixes (supplement 4b): the link held, wallet 4/4 (50 s), team 6/6 (1.7 m). Every one of the 20 live files is green on its latest run of the final tree's spec (no single round ran all 20 on one link); the gate is CLOSED — static suite, verify, unit, guard, live — for the founder's merge word.**
(The 19-file totals in this head were off by one — the suite is 20 files —
and are corrected in place.) **This host's
link dropped four times this evening** (17:12–17:39Z, 18:23Z, ~18:5xZ,
19:0xZ–…; gateway 192.168.1.1 unreachable, DNS timing out) — the reds it
left are the harness's, classified per file in sessions.md; and **trap 22
took a seventh shape: a `TaskStop` on a round script does NOT end its bash
loop** — it kept iterating and interleaved with a restart on the same port
and log until all 18 harness processes were ended by command line. Next:
DONE — merged and deployed on the founder's word (the top of this head);
**M-BIL-1 (/R) on `1.malaky.ai`** (item 45), step 8 mints the funded QA
org; HSN-0902/B on item 48. Before that, same day: **ORDER BIL-0902/R
began: `feat/bil-0902`
REBASED onto the new `main` (`d645607` — HSN-0902 merged and deployed),
one commit replayed, seven conflicts resolved (the five journal files by
keeping both series in date order, `package.json`/`stack.md` by keeping both
script rows, `e2e/live-wallet.spec.ts` in BIL's favour — zeros = never
subscribed — while HSN's `skipUnlessFunded` and the 402 rule stand in
`live-setup.ts` for §4's funded-QA-org mechanism to build on).** Ward's
corrected plans — Business $599/month, Scale $899/month, Enterprise with no
checkout, `DASHBOARD_URL` = `https://1.malaky.ai` — are the contract this
series now re-probes (Phase 0/R) and re-targets; the founder's funding
ruling: no dev-credit door, a QA org is funded by a real test-mode checkout
(card 4242). NOT pushed until the founder's word. Before that, same day: **ORDER HSN-0902 was MERGED and DEPLOYED
on the founder's word.** `main` fast-forwarded `9adb47c` → **`c5456f1`**
(five commits, no merge commit, one linear history) and was pushed with
`main:live` at 14:59Z; both deployments **READY** at `c5456f1` —
production **`dpl_8f1MyYrEhAhq1FUGJKNxmpR2iwnt`** (target production, ref
`main`) and the `live` preview **`dpl_8Stid97fok9wb7wA5wCZHJ45VuGQ`**;
`1.malaky.ai` moved `index-D7LsIWPh.js` → **`index-Lxcr-Fsd.js`** ~95 s
after the push; the rollback candidate is the previous production
deployment **`dpl_Ch2yVsMCpntumx1BxMvjs55euDbN`** (`9adb47c`, MED-0831/R).
`feat/hsn-0902` is kept on `origin` as the record. `feat/bil-0902` (held at `df14989`, cut from the OLD `main` `9adb47c`) was
to be rebased onto the new `main` before BIL-0902/R — done, see the head of
this paragraph. **Next: M-HSN-1
on production (open-item 50), the founder's; HSN-0902/B on item 48; trap
23 (the host sleeping through a live round) is in the ledger below.**
Before that, same day: **ORDER HSN-0902 — Phases 1, 2 and 4 (the brand kit
· the video duration · tests and the gate) BUILT and GATED on
`feat/hsn-0902`; Phase 3 (the Organization fields) carved out by the founder
as HSN-0902/B, held on open-item 48, nothing built for it.** Branch off
`main` = `9adb47c`, five commits, then the merge above (BIL-0902 stays HELD
at `df14989` on its own branch). **What stands:** a fourth Knowledge kind, **Brand kit** — PDF only,
no description asked, the closed presign pair `{desc:"brandkit",
role:"brandkit"}` from ONE function, listed under Files as "Brand kit" ·
PDF with the badge from the ECHOED role, Open + Delete, "Sent to the
studio."; `"brandkit"` reserved beside `"logo"`. **Create Visual, video
only:** `params.durationS` top-level (an image body carries NO `params`
key — a type union pins it), ONE table in seconds keyed by the plan
vocabulary type (balanced 10 · creative 20 · precise 30; default 8), the
control shows the maximum, clamps on a quality change, refuses a typed
over-max value; the demo runs the same limits. **The 402 rule** is in the
suite: `skipUnlessFunded` reads the wallet before any body; `live-generate`
is the one spec asserting the refusal; every other generating spec — and
`live-wallet`'s starter-funding assertions — self-skip with the reason.
**The gate (final tree): lint · typecheck · prettier · guard-static 335 ·
unit 537 / 48 · static e2e 106 passed / 75 skipped / 0 failed · verify
w00–w06 all PASS (w06 standalone) · live round 1 16/18, live round 2 —
the gate — 16/18 with the two reds judged and cleared by recorded
supplements: `live-brand-kit` red because the HOST SLEPT 51 min inside it
(Kernel-Power 42 at 13:27:48Z) → 3/3 in 37 s; `live-knowledge` red on a
5 s post-reload wait → the `SCREEN_SYNC` rung, which exposed a REAL
MED-0831 regression (a document dropped before the lazy collection id
landed erred, then never listed) → fixed in `live-knowledge.tsx` → 3/3;
final tree `live-media-upload` 3/3, `live-brand-kit` 3/3. No red stands.**
Then M-HSN-1 (item 50) on production after the merge. Before that, same
day: **HSN-0902 Phase 0** — probed on fresh QA org **1692**,
zero spend, every body and request-id appended to
`Docs/api/alphastudio-shapes.md` ("HSN-0902 Phase 0") by the new
`pnpm probe:hsn-0902`. **P1 — brand kit:** presign `{application/pdf,
desc:"brandkit", role:"brandkit"}` → 201, listed as `kind:"document"`
with **`role` ECHOED — A2 ANSWERED** (the logo's `role:"logo"` echoes
too; open-item 44's question closes); `role:"brandkit"` on a PNG → 400
(the door binds role to type); the bucket's CORS preflight allows PUT
from `*` for localhost:5199 AND 1.malaky.ai — **CORS is not the wall**.
**P2 — durationS:** a top-level, validated field on the video body: 8 →
402 (the zero-wallet shield), "abc" and 999 → **400 BEFORE the wallet
check** (one generic sentence, no limit named — the client clamp is the
only readable limit); an image body with NO `params` → 402 (clears
validation). **P3 — the stop:** `PATCH /orgs/:id` refuses
`whatYouOffer`/`whatSetsYouApart` alone ("Provide at least one field to
update") and DROPS them beside `name`; no AlphaStudio org-profile path
exists (seven GETs → 404); Hasan's side sees the org only through Ward's
context bundle (voice rules, sources, topics). **No door accepts the
fields → Phases 1–4 NOT built; the founder asks Hasan (open-item 48,
BLOCKING).** When the door is named the series resumes on this branch
with Phase 0 pinned (the rulings queued for it: "brandkit" as a reserved
description, video-only `params`, the one-place per-plan max table
10/20/30 default 8, the 402 self-skip rule for the live gate). Before that, same day: **ORDER BIL-0902 — billing goes live on the
Stripe sandbox — was BUILT, PARTLY GATED, and then HELD by the founder's
stop order.** Branch **`feat/bil-0902`** (off `main` = `9adb47c`), committed,
**NOT pushed, NOT merged**. Ward is changing the plans (base/pro yearly →
**business $599/month, scale $899/month; Enterprise has no checkout**) and
pointing `DASHBOARD_URL` at `https://1.malaky.ai`, so the contract this
series probed and built against changes within hours; one gate per series,
and it runs once the new contract lands — **BIL-0902/R follows on Ward's
confirmation.** What stands at the held commit: Ward's guide verbatim at
`Docs/api/billing-frontend.md`; the Phase-0 probe record
`Docs/api/billing-shapes.md` (org 1670, every request-id) **marked
SUPERSEDED — old contract**; the seam `src/data/billing.ts` (explicit org
id per call, single-shot checkout/portal, static demo in the wire's shape);
`/billing` (plans from the wire, the status table, Subscribe for owners,
Manage billing → portal, the past_due banner, history) and
`/billing/success` (2 s poll, wall-clock 60 s give-up); the demo's H1/H2/H4
redirect to `/billing` in live mode; zeros = never subscribed (chip, tile,
H3, the 402 component pointing at Billing); `billing.wallet_credited`.
**The gate, as far as it ran:** lint · typecheck · prettier · guard-static
344 · unit **583 / 52 files** · static e2e **107 passed / 74 skipped / 0
failed** · `verify:w00`–`w06` **all PASS**; live round 1 (one file at a
time, `LIVE_MEDIA` off) — auth 3/7 (one 20 s wait on "Welcome back" after a
reset, 3 did not run), **billing 4/7** (the success poll's give-up came
late on a loaded API — fixed after, wall-clock deadline; 2 did not run),
brand-rules 4/5 (Preview this tone → **402**), **brand 5/5, country 4/4,
create-visual self-skipped, generate 1/2 (the run refused with 402 — the
Phase 3 proof, pinned on org 1683 request `f4220662-0752-4488-9ffc-133a7bbd5779`;
it stays valid whatever the plans are called)**, invite-org 3/3, knowledge
2/3 (a 30 s wait on the upload row), media-upload 3/3, notifications 1/1,
onboarding INTERRUPTED by the stop order; proposals, schedule-repair,
scheduling, studio, team, wallet NOT reached; **no round 2**. Open-item 46:
every generating spec 402s on a fresh org now (the plan is the only
funding) — a decision for the founder/Ward before any live gate can be
16/16 again. **The /R delta, for whoever picks it up:** `ApiBillingPlanId`
`'base' | 'pro'` → `'business' | 'scale'` (`src/api/types.ts`,
`src/data/billing.ts`, the probe script's `{plan:"base"}` bodies); interval
`year` → `month` (the price words already read the wire's interval; the
M-BIL-1 checklist and the demo copy say yearly); amounts 59900/89900 in
`DEMO_BILLING_PLANS`, `billing.test.ts`, `billing-screen.test.tsx`,
`e2e/billing.spec.ts` ("$500.00 / year") and `e2e/live-billing.spec.ts`
(`['base','pro']`, "/ year"); an **Enterprise CTA** with NO checkout (a
contact/sales action on the plans page — a plan row the wire may or may not
carry; never a Subscribe); re-probe with `pnpm probe:billing`; and
`DASHBOARD_URL = https://1.malaky.ai` — **production `main` is the STATIC
build (no `VITE_API_BASE_URL`)**, so Stripe's returns would land on the
demo's "Nothing was paid" page unless the founder points it at the `live`
preview or gives production the variable. The marketing page already sells
Business $599 / Scale $899 / Enterprise (D-M2-B), so the two pricing
documents finally meet on the wire. Before that,
2026-08-31: **ORDER MED-0831 (+ its /R rider) SHIPPED
on the founder's fast-path ruling** — the media presign door is the product's:
Knowledge Image/Video uploads and the org logo go through
`uploadMediaAsset` (presign `{mediaType, desc, role?}` → PUT → done; `desc`
required, a failed PUT deletes its own phantom row and reports the id;
`role: "logo"` per Hasan's ASSUMED addendum A1–A4 in
`alphastudio-shapes.md`); Documents stay on the RAG door byte-for-byte; the
Knowledge "Files" section and the Organization logo read
`GET …/media/assets` — THE record, no sidecar of any kind (H2 re-ruled;
the list answers 200 now, Ward item 4 apparently fixed; rows are minted at
presign time; `isUploadedMediaFile` excludes `synthetic===true` and the
`desc:"logo"` row); H5 flipped `collection: {use: true}` on Create Visual
(one constant, first proof = the founder's LIVE_MEDIA render); "logo" is a
reserved Knowledge description. **The gate ran verify:w00–w06 ALL PASS and
static e2e 102/67/0 at `2205261`, then the founder ABORTED the live rounds**
(three attempts poisoned by orphaned harness children — trap 22's sixth
shape, in sessions.md; live-auth 7/7, live-brand-rules 5/5, live-country
4/4 stand as the record, no classification, his word) **and ruled the fast
path with Hasan in the room: lint · typecheck · unit only (521/47 green),
no e2e/verify/live, merge and deploy WITHOUT the eye-pass — Hasan reviews
on production; a wrong assumption fails visibly there.** Merged as TWO
recorded ff steps: `main` → `feat/cut-0831` (`aa6162e`) → `feat/med-0831`'s
tip; `main` and `main:live` pushed; the deployment verification (READY via
the Vercel API, the 1.malaky.ai bundle-hash change, the rollback candidate)
is in the 2026-08-31 MED-0831/R session report. Still Hasan's/Ward's:
does the list echo `role` (A2), `createdAt`+`mediaType` on the row
(item 44), `TONE_FIELDS_ON_WIRE`. Before that, same day: **ORDER
CUT-0831** — two Generate controls
and the preset concept are gone, on branch **`feat/cut-0831`** (off `main` =
`7b7222d`) — **SHIPPED with MED-0831 under the same fast-path ruling** (its
own gate was green on 2026-08-31: round 2 16/16; the eye-pass was waived by
the founder's ruling; his post-deploy hand-work — deleting org 619's 8
legacy preset rows, re-saving the 4 custom tones — is now live and still
his). Probed first (fresh QA org 1485,
zero spend): create with `preset:true` → 201, DELETE → 204 — so the wire
deletes preset rows and the founder's post-deploy hand-delete of org 619's
8 legacy rows will work. Item 1: the "Anything to steer it?" box is deleted
(never on the wire; the body's closed key set is now unit-asserted). Item 2:
the page-level Language picker and the `?? picker` fallback are deleted —
per-tone `language` is the tone's own, `GenerateInput` takes `RunnableTone`,
and a tone without a language is a disabled dashed chip pointing at
Settings › Tones. **The ruled interim consequence is real and the suite met
it first:** the language lives in the per-browser sidecar until the backend
persists it, so every fresh browser (and every Playwright context) must
re-save the tone once — `ensureToneLanguage` in `live-setup.ts` performs
that documented backfill gesture in three specs. Item 3: `Tone.kind` is
deleted, the wire's `preset` is read and ignored (bodies frozen byte-exact
in `brand-wire.test.ts`), Settings › Tones is ONE list with Edit + Delete
on every tone, the reducer's preset-delete guard is gone (open-item 37
notes the widened surface), and the demo rows survive unchanged as
`SAMPLE_TONES`. Gate at the tip: lint · typecheck · **503 unit / 47 files**
· guard-static **332** · static e2e **99 passed / 64 skipped / 0 failed** ·
`verify:w00`–`w06` **all PASS** · live **round 1 15/16** (one signup-landing
one-off in `live-invite-org`, 3/3 in round 2) · **round 2 — the merge gate —
16/16, 60 passed / 5 skipped, no red**. Decisions: CUT-0831 (2026-08-31).
After merge + deploy, BY HAND on production: the founder deletes the 8
legacy preset rows in Settings › Tones and re-saves the 4 custom tones once
so each carries a language. Before that, same day: the HSN-FINAL/5 deploy
(below). Before that: **ORDER HSN-FINAL** — the Hasan series'
consolidated gate, and **THE SERIES IS MERGED**: `main` fast-forwarded
`289cad5` → **`6f45679`** (fourteen commits across five stacked branches, no
merge commit, one linear history) and pushed with `main:live`, after the
full house law ran on the tip — Phase 0's two presign probes (**open-item 43
SOLVED-PENDING-WARD-CONFIRM: `desc` was the regression**, P1 201 with it /
400 without on the same org; P2 the RAG door 201, HSN-04's shape stands), the
deferred coverage (+31 unit, +6 static e2e, four stale specs updated, one
`LIVE_MEDIA`-gated live spec authored not exercised), every static gate green
(lint, typecheck, **501 unit / 46 files**, guard-static **331**, static e2e
**99 passed / 64 skipped**, `verify:w00`–`w06` all PASS), and the live suite
under the two-round law: **round 1 15/16** (the one red was the LOCAL dev
server refusing a connection — harness), **round 2 — the gate — 16/16**.
The gate found and fixed two things the series had deferred: the Create
visual popup did not reset on its own Close/Done (Radix reports only
open-changes IT initiates), and every live tone creation had to learn
HSN-03's required language. **BUT NOTHING DEPLOYED:** both Vercel
deployments at `6f45679` — production `dpl_2f9jcfToFHjohGKBtjwVdzz9YoUT`
and the `live` preview `dpl_8e2DnP1MWCmdiH7Xdd1iv7KnCsbE` — are **BLOCKED**,
as every deployment has been since the repo went private earlier the same
day: Vercel's Hobby plan deploys a private repo only for commits authored by
the team owner, and ours are authored by `qus0i`. Production still SERVES
`289cad5` (`dpl_GYJNtXZX4Jwj9YUjqWfJEHJ4B5yu`, the rollback candidate) and
`1.malaky.ai` still serves `index-CDsww8Wq.js`. **Founder decision:** make
the repo public again, move to Pro and add the author, or author commits
from the owner's identity — then Redeploy from the Vercel dashboard (or
push again). The Phase-5 production smoke is written and waiting
(`smoke-hsn-final.mjs` in the session record) and was NOT run against the
old bundle. **Update 2026-08-31 (ORDER HSN-FINAL/5):** the repo was
reverted to PUBLIC by the founder — his decision, on record — to clear the
Vercel Hobby private-repo block; the BLOCKED deployments stay blocked by
design, so this note's own commit is the fresh git event that re-triggers
them, and Phase 5 (READY confirmation, entry-hash change, the zero-spend
smoke) resumes on it — the 2026-08-31 session entry carries the verification.
**Verified the same morning: THE SERIES IS SHIPPED.** Both re-triggered
deployments went **READY** at `0a5e84d` — production
`dpl_5ASg1kwjqAsEAN45chuEukyjWwKJ`, the `live` preview
`dpl_HSvSjvQoQ437eCunKQCc7togzn7u` — and `1.malaky.ai` moved
`index-CDsww8Wq.js` → **`index-B6ntD0ng.js`**. The zero-spend smoke ran
**31/32**, the single FAIL being the smoke script's own chunk-discovery
regex, not the product: walk 2 opened the Create-visual modal in the real
browser, and a direct sweep of all 94 deployed chunks then found "Create a
visual" in `use-draft-actions-CAU0htIZ.js` and the button label on both the
Today and Generate chunks. Rollback candidate: the pre-merge production
`dpl_GYJNtXZX4Jwj9YUjqWfJEHJ4B5yu` (`289cad5`).
Before that, same day: **ORDER HSN-04** — item 4 of the Hasan
series. **Part A:** sources are capped at **10** and topics at **30** —
client-side product ceilings (the `MAX_POSTS_PER_DAY` precedent), enforced at
the I5 screen, in `TagInput` and at the seam; over-cap data is rendered, never
trimmed, and only adding stops. **Part B:** the Knowledge upload asks Image |
Video | Document plus a REQUIRED description before any file leaves the
browser, checks the file's real MIME against the choice (no more `text/plain`
coercion), and the presign body carries **`desc`** beside `mediaType` with NO
switch, by the founder's word — **with a correction on record:** that door is
the RAG presign, healthy on 08-30; open-item 43's broken door is the media
presign, which has no UI caller and is untouched pending the next order. Riders:
`previewTone` sends the tone's language; every close-out now attaches the
`git ls-remote --heads origin` receipt. Build hygiene only. On branch
**`feat/hsn-04-limits-knowledge`** (off `feat/hsn-03-tone-lang-length` =
`ab26bb8`), **pushed, NOT merged**; later HSN orders stack on it. Before that,
same day: **ORDER HSN-03** — item 3 of the Hasan
series. Every tone gains **`language`** (Arabic | English, required in the
editor with no default) and **`length`** (short | medium | long, form default
medium), set in Settings on create and edit — built **AHEAD of the backend**:
the tones API persists neither yet, so they live in a client sidecar
(`ab-tone-fields:<orgId>`, `src/data/adapters/tone-fields.ts`, live-only,
server value wins and retires it) and the wire send waits behind ONE switch,
**`TONE_FIELDS_ON_WIRE`** in `src/data/brand.ts`, until Hasan confirms
persistence. The generate body now carries per-tone `length` (omitted when a
tone has none — closes HSN-01 divergence #1) and per-tone `language` from the
tone itself (`ar`/`en`, the vocabulary it always sent). Old tones read "Not
set". Build hygiene only, by the series law. On branch
**`feat/hsn-03-tone-lang-length`** (off `feat/hsn-02-create-visual` =
`6281cd6`), **pushed, NOT merged**; later HSN orders stack on it. Before that,
same day: **ORDER HSN-02** — item 2 of the Hasan
series. A **"Create visual"** action now exists in two places — each generated
draft on the Generate page (the disabled legacy button, REWIRED) and each draft
card on Today beside Approve and Decline — and opens ONE modal that submits
Hasan's `social-posts.media` envelope for THAT draft: one post per call, no
retry anywhere (every failure says a retry may bill again — the `posts[]`
path has billed and then 502'd), `collection.use` false by the founder's word,
guidance capped at six. The 202 is read as a LIST and the one job is followed
through the Studio's own poller (E3's loop, lifted into `use-job-poll.ts`).
Static mode resolves through the Studio simulation, standalone and labelled.
**Nothing is attached to a draft yet** — the attachment surfaces are reported
in the session entry for a later order. **By the series law NO testing ran
beyond build hygiene** (lint, typecheck, 470 unit, guard-static 325 clean);
e2e, verify and live coverage are the final-gate order's. On branch
**`feat/hsn-02-create-visual`** (off `feat/hsn-01-generate` = `df13b5f`),
**pushed, NOT merged**; later HSN orders stack on it. Before that, same day:
**ORDER HSN-01** — item 1 of the
contract-alignment series from the founder's 2026-08-28 sync with Hasan
(AlphaStudio upstream owner). The Generate page's "drafts per tone" option is
**DELETED** — control, state, copy, plumbing — and the generate body no longer
carries `options.perTone` (the emptied `options` wrapper went with it). Probed
before built: the body without the field answered **202** (fresh QA org 1364,
request `ce257b64-e5e1-4b3a-a00f-74144dc9388a`). Hasan's reference envelope for
the generate body is recorded verbatim at the end of
`Docs/api/alphastudio-shapes.md`; every OTHER divergence from it (tone
`length`, our per-tone `language`/`example`, plan vocabulary) is reported in
the session entry and deliberately unchanged — later HSN orders converge on it
step by step. On branch **`feat/hsn-01-generate`** (off `main` = `289cad5`),
**pushed, NOT merged — every merge waits on founder review**, and later HSN
orders stack on this branch. Before that, same day: the
**ONBOARDING REDESIGN WAS MERGED AND
SHIPPED** on the founder's explicit approval (eye-pass passed). `main`
fast-forwarded `fd84173` → **`963c9f7`**, fourteen commits, **no merge commit —
one linear history**, and pushed with `main:live`. **`1.malaky.ai` serves it**:
the entry hash moved `index-Cel1CcpM.js` → `index-CDsww8Wq.js`, the wizard's
route chunk does not exist in the deployed bundle, every wizard string is gone
and every ONB-0827 catalogue string is present. An 11/11 scripted smoke walked
the real site — fresh signup → verify → **lands in the app with no wizard** →
generation gated with the checklist naming all four. Before that: **ORDER
ONB-0827-B**: the founder accepted the
static-readiness deviation (**D-ONB-E**), ruled that open-item 38 be fixed
before any merge, and **approved PUSHING the branches** — which is done, five
of them, `main` and `live` untouched. `feat/onb-04-invite-org` stacks on the
ONB-0827 tip and closes 38 (**D-ONB-F**): a session opens in the org it
REMEMBERS rather than blindly `orgs[0]`, accepting an invite lands in the org
that invited you, a lost membership falls back with a sentence rather than a
dead screen, and the rail's workspace footer becomes the switcher screens4.md
§0.4 has always specified. **Still not merged — the merge waits on the
founder's eye-pass.** Before that: **ORDER ONB-0827 — Hasan's onboarding
ruling** was BUILT on a three-branch stack off `main` (`fd84173`):
`feat/onb-01-tones` -> `feat/onb-02-entry` -> `feat/onb-03-gate`. **Branch
only: not merged, not pushed — it waits on founder review.** The wizard is
DELETED, a fresh live org starts with ZERO tones, and nothing generates until
the org's brand setup is complete. A Phase-0 probe settled the gate's shape on
the wire before it was designed (decisions.md, 2026-08-28): an org holding only
the four brand entities generated fine with no country and no schedule
(request `60c06fd5-...`), and an org with no tones was refused with an
unusable 400 (`ae30783f-...`) — so the hard gate is the four, and the country
and the posting rhythm are checklist items rather than blockers. Decisions
D-ONB-A..C, with **D-ONB-D recorded as PENDING**. Before that: 2026-08-24,
after the **M2 design cycle was MERGED to `main`**
on the founder's explicit approval — the visitor world is now Abdullah's
concept-v2 port with the corrected palette, fast-forwarded to `039adfb` and
pushed with `main:live`. Before that, the same day: **D-M2-F-r2** — Abdullah
delegated the call
on the four AA deviations, the founder ruled that accessibility wins with the
design spirit preserved, and the corrected palette shipped: the four fixes
re-applied, the Memory reveal changed to slide without fading, a `Superseded`
badge carrying what `--c-text-4` used to say by colour alone, and **every
allowlist deleted**. The branch is merge-ready and waits only on the founder's
word. Before that: 2026-08-24, when this branch took **`main`** — which now
carries the **live-suite warm-up** (`fix/live-suite-warmup`): a warm-up +
heartbeat in `e2e/global-setup.ts`, the trap-22 mode guard, the three derived
rungs in `e2e/live-clocks.ts` across five spec files, and the two-round
operating rule. That is why the live reds recorded against M2 on 2026-08-23 are
gone: they were `main`'s, not this branch's. Before that: 2026-08-23, **M2**
(`design/m2-concept-v2`) — the visitor world replaced with Abdullah's
concept-v2 prototype, ported. **Branch only: not merged; pushed for review.**
Before that: 2026-08-20, after the **E2E-0820 triage** branch
(`fix/e2e-0820`) — the founder's live in-app E2E on `1.malaky.ai` against org
619; eight frontend fixes plus two root-cause probes, then **B9** — the
stranded schedule draft, and a live org no longer wearing the demo's schedule.
**Merged to `main` as a fast-forward and pushed (with `main:live`) on the
founder's explicit approval, 2026-08-20.** Before that: 2026-08-19, after **INT-12** (`int/12-proposals`) — Today is the
proposals ledger, so the review queue survives a reload and a change of device.
INT-11 put the Studio and Knowledge on the live platform; INT-10 made F1 real; INT-9
put money on screen; INT-6 landed the
contract and the observed shapes; INT-7 put brand rules on the wire; INT-8 made
the org country the single holiday control — all of it merged to `main` and
pushed 2026-08-19._

---

## In one paragraph

`alphabeacon-web` is a static-first React SPA — every screen in
`screens4.md`, rendered from typed data committed under `src/data/` —
integrating with the **live AlphaStudio API** (contract: `Docs/api/api.md`,
refreshed 2026-08-17 to 62 paths; `Docs/api/changelog.md` is the per-change
record and `Docs/api/alphastudio-shapes.md` is the observed proxy truth).
**The product is now branded Malaky** (Arabic wordmark ملاكي, kit under
`Docs/brand/`): new palette, Inter (proposed), calm motion law. **Since M2
(2026-08-23) there are TWO design systems in the repo:** the signed-in product
(design.md Parts 1–6 — light-first, Inter, shadcn tokens) and the VISITOR
WORLD (design.md Part 7 — Abdullah's concept-v2, dark, DM Sans + IBM Plex Sans
Arabic, vendored under `src/features/marketing/concept/`). They are scoped so
neither can reach the other. `package.json`, internal `ab-`
identifiers, and the repo name deliberately keep the old name this phase.
Network code is legal only in `src/api/`, only when `VITE_API_BASE_URL` is set;
without it the app is byte-for-byte the static build and the e2e suite asserts
zero requests. Phases **W0–W6 are built and verified**; **W7 is parked behind
the two manual gates**; the INT phases are wiring covered entities live (table
below).

## Where the code is

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Remote     | `github.com/alphapromena/alphabeacon-web` (private)    |
| `main`     | Production line, now at **`5cbda94`** — **BIL-0902/R** (billing on Ward's corrected plans: Malaky Business / Malaky Scale monthly on the wire's own keys `base`/`pro`, the Enterprise card, `DASHBOARD_URL`, the funded-QA-org mechanism; eleven commits on `feat/bil-0902`) fast-forwarded and **pushed 2026-09-03** on the founder's word, `main:live` with it; production `dpl_3QpLH1SqJ5BrGbptusyp6TG5gZWs` and `live` `dpl_EjY9KcdJVFBqtR4NG7tx5m7SFUUn` READY, `1.malaky.ai` on `index-DUHITzRc.js`; rollback candidate the `d645607` pair (`dpl_85t8AoU2RX69XzPJvc5hAFEdkPrZ` / `dpl_F5HpQTqGSqdj8L83efJzG56K23UZ`). Before the merge it was `d645607` — **HSN-0902** (2026-09-02, see `feat/hsn-0902` below). Previously at **`6f45679`** — the whole **Hasan series** (HSN-01…04 plus the HSN-FINAL gate, fourteen commits across five stacked branches) fast-forwarded and **pushed 2026-08-30** on a green round 2, `main:live` with it. Vercel blocked the first deployment pair (private repo on the Hobby plan; commit author ≠ team owner); **on 2026-08-31 the founder reverted the repo to PUBLIC** and the re-triggered pair went **READY** at `0a5e84d` — production `dpl_5ASg1kwjqAsEAN45chuEukyjWwKJ`, `live` `dpl_HSvSjvQoQ437eCunKQCc7togzn7u` — with `1.malaky.ai` moving to `index-B6ntD0ng.js` and the zero-spend smoke green (31/32; the one FAIL was the smoke's own chunk regex, disproven by a direct chunk sweep). Before the merge it was `289cad5`. Previously at **`963c9f7`** — the whole **onboarding redesign** (ONB-0827 → 0827-B → 0827-C, fourteen commits across four stacked branches) fast-forwarded and **pushed 2026-08-30** on the founder's explicit approval, `main:live` with it. Before that push it was `fd84173`. The wizard is deleted, a fresh live org starts with zero tones, nothing generates before brand setup is complete, and a session opens in the org it remembers. Decisions D-ONB-A…F. Previously at **`039adfb`** — the whole **M2 design cycle** (`design/m2-concept-v2`, four commits) fast-forwarded and **pushed 2026-08-24** on the founder's explicit approval, `main:live` with it. Before that push it was `b8becc1`. Previously at **`b8becc1`** — the live-suite warm-up (`df23176` plus its close-out, three commits) fast-forwarded and pushed 2026-08-24, `main:live` with it. Before that push it was `5c01c68`. Previously at **`83ec448`** — the E2E-0820 triage (B1–B9, three commits) fast-forwarded and **pushed 2026-08-20** on the founder's explicit approval, `main:live` with it. Before that push it was `550f54e`. Previously at **`c6e3489`** — everything below PLUS the whole live integration (INT-6…12), merged as a fast-forward and **pushed 2026-08-19** on the founder's explicit approval. Before that push it was `6c598b2`. Open-items 16–18 still hold the human gates |
| `rb/02-v1-brief` | Website V1 per Abdullah's brief + the ambient idle drift + the M1 card-realism passes through 2026-08-12 — tip `6c598b2`, and `origin/main` is at the same commit, so the production line has all of it |
| Local `main` ref | **No longer stale** (checked 2026-08-24): local `main` == `origin/main`, and this merge fast-forwards both. The 2026-08-17 warning stood because the local ref had never been fast-forwarded and `git log main..` over-reported by 22 commits — worth re-checking with `git rev-parse main origin/main` before trusting any local `main` comparison. |
| `fix/e2e-0820` | **The E2E-0820 triage, 2026-08-20 — branched off `main` (`550f54e`), MERGED as a fast-forward and pushed; kept on `origin` as the per-fix record.** F3 Generate reachable from the rail/dashboard/Today, F4 the "credits" vocabulary + `/billing/balance`, F5 the pre-run count, F6 the tone-preview reference, F9 the balance chip's three states, F10 the stale results footer, F11 pluralization, F12 the wizard Finish (failure-tolerant, reported, idempotent), B9 the schedule draft reconciler + a blank schedule for a live org that has none. Gate output in the session entry |
| `design/m2-concept-v2` | **M2 — the visitor world. Branched off `main` (`5c01c68`) 2026-08-23; took `main` again and MERGED as a fast-forward 2026-08-24 on the founder's explicit approval; kept on `origin` as the per-cycle record.** The decision chain is D-M2-A…F, then D-M2-F-r (the AA pass reverted so Abdullah could review his palette verbatim), then **D-M2-F-r2** (he delegated, the founder ruled accessibility wins with the design spirit preserved — the four corrections re-applied, the Memory reveal changed to slide without fading, a `Superseded` badge added, and every allowlist deleted). Abdullah's `malaky-prototype` `components/concept-v2/**` ported into `src/features/marketing/`: five routes under one layout, 58 marketing files, its own token file and contrast guard. M1 retired with it. Decisions D-M2-A…F; open-items 21 |
| `fix/live-suite-warmup` | **The live suite warm-up, 2026-08-23/24 — branched off `main` (`5c01c68`), MERGED as a fast-forward and pushed; kept as the per-fix record.** `global-setup.ts` wakes the API, warms a 12-way fleet and holds a heartbeat for the life of a live run, and refuses a run whose dev server is in the wrong mode (trap 22, guarded not just recorded). `live-clocks.ts` states three rungs derived from `Docs/api/live-red-2026-08-23.md`, and five spec files read them instead of literals — `live-brand`, `live-brand-rules`, `live-scheduling`, then `live-auth` and `live-team`. Locators and matchers byte-identical throughout. The two-round rule below came out of it |
| `feat/onb-01-tones` | **MERGED 2026-08-30. ONB-0827 Phase 1, 2026-08-28 — branched off `main` (`fd84173`); PUSHED 2026-08-28, merged 2026-08-30.** No seeded tones: the `PRESET_TONES` seeding leaves the org-creation path, I3 gains an honest empty state, and the now-impossible `tones` failure step goes with it. `PRESET_TONES` still composes the demo datasets — the demo world is untouched by order. D-ONB-B |
| `feat/onb-02-entry` | **MERGED 2026-08-30. ONB-0827 Phase 2 — stacked on Phase 1; PUSHED 2026-08-28, merged 2026-08-30.** `src/features/onboarding/*` DELETED; `/onboarding` is a redirect into the app; `org.onboarding {completed,resumeStep}` becomes `org.exists`; `finishOnboarding` becomes a lean `createWorkspace` (org only, idempotent) called at verify; N3 is reframed as the workspace-creation retry. `e2e/onboarding.spec.ts` is `e2e/entry-flow.spec.ts`. Closes open-item 27a. D-ONB-C |
| `feat/onb-03-gate` | **MERGED 2026-08-30. ONB-0827 Phase 3 — the tip of the ONB-0827 stack; PUSHED 2026-08-28, merged 2026-08-30.** `src/data/readiness.ts` is the one selector; `ab/setup-checklist.tsx` is the one surface; the gate is enforced at `/generate`, the Studio composer, D4's dialog and Today's affordances, and `verify:w06` has a structural check that keeps it that way. D-ONB-D (PENDING) |
| `feat/onb-04-invite-org` | **MERGED 2026-08-30 — this is the commit `main` now points at (`963c9f7`). ONB-0827-B, 2026-08-28 — stacked on `feat/onb-03-gate`. PUSHED, NOT merged.** Closes open-item 38: `src/data/adapters/org-selection.ts` is the one selector (`selectActiveOrg`, `mostRecentlyJoined`), the active org is persisted beside the session and stamped with the user id, `graftAuthSession` takes the chosen org instead of reaching for `orgs[0]`, accepting an invite switches immediately, a revoked membership falls back with a latched toast, and the rail's footer becomes a switcher at two orgs. D-ONB-F |
| `feat/hsn-01-generate` | **MERGED 2026-08-30 (HSN-FINAL, `6f45679`); kept on `origin` as the per-order record. HSN-01, 2026-08-30 — branched off `main` (`289cad5`).** The Generate page's "drafts per tone" option deleted (control, state, copy, plumbing), `options.perTone` gone from the generate body and the emptied `options` wrapper with it; `MAX_FANOUT`/`overBudget`/`fanoutTooLarge` deleted as the multiplier's own plumbing. Hasan's target envelope appended to `Docs/api/alphastudio-shapes.md`. Probe: 202 without the field (org 1364, req `ce257b64-…`) |
| `feat/hsn-02-create-visual` | **MERGED 2026-08-30 (HSN-FINAL). HSN-02, 2026-08-30 — branched off `feat/hsn-01-generate` (`df13b5f`); kept as the record.** "Create visual" on live Today cards (beside Approve/Decline), on live Generate result cards (the legacy disabled button rewired), and on static D2 cards beside Approve/Reject; one `CreateVisualDialog` submitting Hasan's `social-posts.media` envelope (one post, `params {}`, `collection.use` false, guidance ≤ 6, `kind` chosen never defaulted), the 202 read as a job LIST, polled through the shared `use-job-poll.ts`. Attaches nothing. Build hygiene only, by the series law |
| `feat/hsn-03-tone-lang-length` | **MERGED 2026-08-30 (HSN-FINAL). HSN-03, 2026-08-30 — branched off `feat/hsn-02-create-visual` (`6281cd6`); kept as the record.** Tones gain `language` (required, no default) + `length` (default medium) in the Settings editor, create and edit; interim client sidecar `ab-tone-fields:<orgId>` hydrated in `fetchBrand`, wire send disabled behind `TONE_FIELDS_ON_WIRE`; generate body carries `length` (omitted when absent) and per-tone `language` from the tone; `SelectField` added to `ab/form.tsx`; rider copy on `visualUnconfirmed`. Build hygiene only |
| `feat/hsn-04-limits-knowledge` | **MERGED 2026-08-30 (HSN-FINAL). HSN-04, 2026-08-30 — branched off `feat/hsn-03-tone-lang-length` (`ab26bb8`); kept as the record at `1520369`.** Sources ≤ 10 / topics ≤ 30 as client-side ceilings (screen + `TagInput` + seam; over-cap rendered, never trimmed); the shared `KnowledgeUploadForm` (Image | Video | Document, required description, real-MIME check) in both worlds; the RAG presign body carries `desc`, no switch; `previewTone` sends the tone's language. Build hygiene only |
| `feat/hsn-final-gate` | **HSN-FINAL, 2026-08-30 — branched off `feat/hsn-04-limits-knowledge` (`1520369`), MERGED as the tip `main` now points at (`6f45679`); kept on `origin` as the gate's record.** The two presign probes, the deferred coverage (`e2e/hsn-series.spec.ts`, `e2e/live-create-visual.spec.ts`, five unit files), four stale specs and every live tone creation updated for HSN-03/04, the gate-found Create visual reset fix, the `verify:w06` upload check re-pointed, and the probe record in `alphastudio-shapes.md` |
| `feat/bil-0902` | **BIL-0902 → BIL-0902/R, 2026-09-02/03 — branched off `main` (`9adb47c`), held by the founder's stop order, then REBASED onto `d645607`, re-probed, re-targeted and gated 20/20; MERGED as a fast-forward on 2026-09-03 (`main` → `5cbda94`) and DEPLOYED (production `dpl_3QpLH1SqJ5BrGbptusyp6TG5gZWs`, `live` `dpl_EjY9KcdJVFBqtR4NG7tx5m7SFUUn`); kept as the record, local only.** Billing on the Stripe sandbox: Ward's guide verbatim, the Phase-0 probe record (org 1670 — SUPERSEDED, old base/pro yearly contract), the seam, `/billing` + `/billing/success`, the 402/notification/chip reactions, the demo's H1/H2/H4 redirecting live. Gate closed 20/20 (sessions.md, 2026-09-03). **BIL-0902/R** delivered the re-target: Malaky Business / Malaky Scale monthly on the wire's own keys, the Enterprise card, `DASHBOARD_URL`, `skipUnlessFunded` as the one funded-QA-org mechanism; M-BIL-1 (/R) is the founder's, on `1.malaky.ai` (item 45) |
| `feat/med-0831` | **MED-0831 + /R, 2026-08-31 — branched off `main` (`7b7222d`), REBASED onto `feat/cut-0831` (`aa6162e`) by the founder's stack ruling, MERGED and SHIPPED the same day on his fast-path ruling; kept on `origin` as the per-order record.** Phase 0 probed the media door in full (all eight types presign 201 with `desc`; the lifecycle clean; `GET …/media/assets` answers 200 — Ward item 4 apparently fixed; rows minted at presign time). Phase 1 `uploadMediaAsset` (no retry; a failed PUT deletes its own mint and reports the id). Phase 2 the Knowledge door split (H1) + the wire-only Files section (H2 re-ruled: no sidecar ever). Phase 3 the wire's org logo (H3; delete-then-upload replace; conflict shown, never picked), H5 `collection:{use:true}`, "logo" reserved. /R: `role: "logo"` on the presign per Hasan's ASSUMED A1–A4. Gate: verify w00–w06 ALL PASS, static 102/67/0, live rounds ABORTED by the founder (auth 7/7 · brand-rules 5/5 · country 4/4 stand) |
| `feat/hsn-0902` | **HSN-0902, 2026-09-02 — branched off `main` (`9adb47c`), MERGED as a fast-forward the same day (`main` → `c5456f1`) and DEPLOYED (production `dpl_8f1MyYrEhAhq1FUGJKNxmpR2iwnt`, live `dpl_8Stid97fok9wb7wA5wCZHJ45VuGQ`); kept on `origin` as the per-order record.** Phase 0 probed three doors on org 1692, zero spend (`pnpm probe:hsn-0902`): the brand-kit presign 201 with `role` ECHOED by the list — A2 answered; `params.durationS` validated BEFORE the wallet (400 on a bad value, 402 on the valid one); NO door for `whatYouOffer`/`whatSetsYouApart` → Phase 3 carved out as HSN-0902/B (item 48). Phases 1+2: the Brand kit kind (PDF only, the closed `{desc,role}` pair from one function, no description asked, listed under Files with the badge from the echoed role, "brandkit" reserved) and `params.durationS` video-only with the one-place per-plan table in seconds (10/20/30, default 8; a type union keeps `params` off image bodies). Phase 4: static + live specs, the 402 self-skip rule (`skipUnlessFunded`; `live-generate` the one asserting spec), the gate-found Knowledge lazy-collection fix, the knowledge spec's SCREEN_SYNC rung. Gate: unit 537/48 · static 106/75/0 · verify w00–w06 PASS · live rounds 16/18 + 16/18 with both reds judged (the host's 51-minute sleep; the MED-0831 race) and cleared by recorded supplements |
| `feat/cut-0831` | **CUT-0831, 2026-08-31 — branched off `main` (`7b7222d`). SHIPPED 2026-08-31 with MED-0831 (the first of the two ff steps; its own round-2 gate was 16/16; the eye-pass waived by the founder's fast-path ruling); kept on `origin` as the per-order record.** The steering box and the page-level Language picker deleted; per-tone language is the tone's own (`RunnableTone`, disabled dashed chips otherwise); the preset concept removed (`Tone.kind` gone, one list on I3, every tone deletable, wire bodies frozen in `brand-wire.test.ts`); the live suite performs the per-context language backfill (`ensureToneLanguage`). Probe: preset create 201 / DELETE 204 on org 1485 |
| `probe/int13` | The PROBE-INT13 media probe (2026-08-26/27), branched off `main` (`fd84173`) — **PUSHED 2026-08-28**, not merged, so its open-items 34/35 do NOT exist on the ONB stack. Phase B is still blocked on Ward |
| `probe/assets-0826` | The assets-endpoint probe (2026-08-26), docs-only — **PUSHED 2026-08-28** so the Ward message's file pointers resolve on GitHub |
| `chore/api-sweep` | The 118-operation contract sweep (`89199d9`), one commit ahead of `main`, untouched by the triage |
| `live`     | **Team-only staging**, always a fast-forward of `main` and never carrying commits of its own. Vercel builds its PREVIEW with a branch-scoped `VITE_API_BASE_URL`, so `live` is where the app runs against the real API; PRODUCTION (`main`) has no such variable and stays byte-for-byte static. **After every merge to `main`: `git push origin main:live`.** |
| Phase branches on `origin` | `int/06-contract` · `int/07-brand-rules` · `int/08-country` · `int/09-wallet` · `int/10-generate` · `int/11-studio-knowledge` · `int/12-proposals` — pushed 2026-08-19 as the per-phase record, exactly as `w/NN` and `int/00…05` are kept. `probe/proposals` was deliberately NOT pushed: it is superseded, and its record lives on in `int/12` as `ee2bc57` |
| Phase tips | `w/00`…`w/06`, `int/00`…`int/05`, `rb/00-malaky`, `rb/01-motion` |
| Tags       | none                                                   |

Every phase branch was cut from the previous one, so they stack linearly and
`main` was fast-forwarded straight through them — no merge commits, one history:

```
main ← rb/01-motion tip (67f99b4 + close-out, fast-forwarded 2026-08-09)
  └─ w/00 … w/06 ─ (M1 cinematic, posting-time fixes on main)
     ─ int/00-client ─ int/01-auth ─ int/02-orgs ─ int/03-brand
     ─ int/04-scheduling ─ int/05-notifications ─ rb/00-malaky (Malaky rebrand)
     ─ rb/01-motion (M1 cinematic layer, film + two-tier laws)
```

**Push status:** `rb/01-motion` and `main` pushed 2026-08-09 (the push
cleared on user approval minutes after the permission gate blocked it).

**Workflow from here (decided 2026-07-29):** the retroactive PRs for W0–W6 were
skipped deliberately — solo developer, no reviewer, no value. From W7 onward,
open a PR only if it is useful. `web-plan.md` §9's "PR per phase" is therefore
aspirational, not a rule this repo follows.

## Phase status

| Phase                                | Screens                      | State                                                        |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| W0 Foundation                        | —                            | Done · `verify:w00` green                                    |
| W1 Design layer                      | —                            | Done · `verify:w01` green                                    |
| — Brand pass                         | —                            | Superseded 2026-08-08 by the Malaky rebrand (below)          |
| W2 Marketing/auth/onboarding         | M1, A1–A5, N3                | Done · `verify:w02` green (rewritten for concept-v2 in M2)   |
| W3 Review queue                      | D1–D5                        | Done · `verify:w03` green                                    |
| W4 Calendar + connections            | C1–C4, B1–B3                 | Done · `verify:w04` green                                    |
| W5 Studio + billing                  | E1–E4, H1–H4                 | Done · `verify:w05` green                                    |
| W6 Compose/analytics/settings/system | F1, G1–G2, I1–I7, N1, N2, N4 | Done · `verify:w06` green                                    |
| — **Malaky rebrand** (`rb/00-malaky`) | M1 + every user-facing surface | Done 2026-08-08 — kit palette/typography/motion in `design.md`, name sweep, new M1, deploy fix (`VITE_DEFAULT_DATASET` + `vercel.json`) |
| — **M1 cinematic layer** (`rb/01-motion`) | M1 | Done 2026-08-09, merged — then superseded by the V1 brief (film retired, D1) |
| — **Website V1** (`rb/02-v1-brief`) | M1 | Built + verified 2026-08-10 — **SUPERSEDED by M2, 2026-08-23** |
| — **M2: concept-v2** (`design/m2-concept-v2`) | the whole visitor world | Built 2026-08-23, corrected and **MERGED 2026-08-24** (D-M2-F-r2) — the accessibility gate in open-items 21 is closed; what remains there blocks DNS cutover, not the merge |
| — **ONB-0827: the onboarding ruling** (`feat/onb-01…04`) | A5 (deleted), N3, I3, F1, E2, D4, D1, the rail | **MERGED and SHIPPED 2026-08-30** (`963c9f7`). A5 is RETIRED |
| — **The Hasan series** (`feat/hsn-01…04` + `feat/hsn-final-gate`) | F1, D2, E3, I3, I4, I5, I6 | **MERGED 2026-08-30 and SHIPPED 2026-08-31** — merged at `6f45679` on a green round 2; deployed at `0a5e84d` after the founder reverted the repo to public. `1.malaky.ai` serves it (`index-B6ntD0ng.js`); the zero-spend smoke is green |
| — **BIL-0902: billing on the Stripe sandbox** (`feat/bil-0902`) | `/billing`, `/billing/success`, the 402 surfaces, N1, the chip, D1 | **BUILT 2026-09-02, gate PARTIAL, HELD by the stop order** — Ward changes the plans; BIL-0902/R re-targets them; merge waits on the new contract's gate + the manual gate M-BIL-1 |
| **W7 Hardening + ship**              | —                            | **Parked behind the two manual gates**                        |

## Integration phases (AlphaStudio API — contract at `docs/api/api.md`)

The static law was AMENDED on 2026-07-30 and narrowed on 2026-08-17
(decisions.md): network code is legal only in `src/api/client.ts` and
`src/api/upload.ts`, only when `VITE_API_BASE_URL` is set (`.env.local`, never
committed). Static mode remains the default and the e2e test bed. Hybrid per
entity: covered entities go live, the rest stay static (list below).

**The proxy law (Ward, 2026-08-17) — read this before touching generation.**
Everything AI-generative goes through OUR API's `/orgs/:orgId/alphastudio/*`
with the normal Bearer session. The frontend never talks to the AlphaProStudio
service, never signs anything, holds no service key. `guard-static` now fails
the build on `cloudfront.net`, `x-aps-`, the upstream `v1` route prefix,
`svc[_-]?key` or `edge[_-]?secret` appearing in code under `src/`. The one
non-API request the app is allowed is presigned STORAGE traffic our API just
signed — a `PUT` of file bytes through `src/api/upload.ts`, and the browser's
own `GET` of an asset it is displaying. The e2e law allows exactly that shape
(an AWS SigV4 signature we minted) and nothing else. `Docs/api/alphaprostudio.postman.json`
documents the upstream and is committed; its **environment file holds a live
HMAC key and must never enter the repo** — it is gitignored by name and by
`*.environment.json`.

**Running the live suites:** one spec at a time (`$env:VITE_API_BASE_URL=…;
pnpm e2e --grep live-<phase>`), the way each phase was verified — the API's
documented rate limits (60 s between code sends, 5/hour per email+purpose)
make a single-shot all-file matrix trip 429s by design. Fresh
`qa+<timestamp>` addresses every run; every dev code is 000000.
**Standing rule (2026-08-20, from trap 18): any merge to `main` runs the FULL
live suite — all twelve files, `LIVE_MEDIA` off — never only the phase's own
spec.** The phase that breaks a live spec is rarely the phase that owns it.
**Amended 2026-08-24 (source `Docs/api/live-red-2026-08-23.md`): against a cold
API the full suite runs TWICE. Round 2 is the merge gate; round 1 stabilises
the deployment.** Both rounds are reported; the gate itself is not optional and
a red in round 2 is a red. This is an operating procedure for an API that is
cold, not licence to re-run until green — and it retires the day the function
is kept warm.

| Phase | Scope                                                    | State       |
| ----- | -------------------------------------------------------- | ----------- |
| INT-0 | API client, env switch, guard amendments, docs           | Done (`int/00`, pushed) |
| INT-1 | Auth end to end against the live API                     | Done (`int/01`) · live e2e 7/7 |
| INT-2 | Me + orgs + members + invites                            | Done (`int/02`) · live e2e 12/12 |
| INT-3 | Brand (voices, tones + adapter, sources, topics)         | Done (`int/03`) · live e2e 5/5 |
| INT-4 | Schedules + event sources (+countries) + slots           | Done (`int/04`) · live e2e 3/3 (+1 gated on ingestion) |
| INT-5 | Notifications (list, unread-count, read-all)             | Done (`int/05`) · live e2e 1/1 |
| INT-6 | **Contract refresh, client hardening, the smoke run**    | **Done (`int/06-contract`)** · smoke run green, no live spec (INT-6 ships no UI) |
| INT-7 | Brand rules live + I4's tone preview                    | **Done (`int/07-brand-rules`)** · live e2e 5/5 (+ live-brand 5/5 re-run) |
| INT-8 | Org country + holidays (wizard, I1, C2–C4)              | **Done (`int/08-country`)** · live e2e 4/4 |
| INT-9 | Wallet + usage (balance chip, the 402 state, H3)        | **Done (`int/09-wallet`)** · live e2e 4/4 |
| INT-10 | On-demand generate F1 (batch runs + local run ledger)  | **Done (`int/10-generate`)** · live e2e 2/2 |
| INT-11 | Studio media E1–E4 + I6 knowledge (RAG)               | **Done (`int/11-studio-knowledge`)** · live e2e 4/4 studio (incl. a real render) + 3/3 knowledge |
| INT-12 | **Today on the proposals ledger** (D1/D2, F1 ledger retired) | **Done (`int/12-proposals`)** · live e2e 4/4 |

**INT-0…5 are MERGED to `main` (`b601622`, fast-forward — the int/NN branches
stay as the per-phase record, like w/NN).** INT-6 is on its own branch and NOT
merged.

**What the 2026-08-17 contract changed (INT-6).** 40 paths → 62. Brand voices
gained a required `name`, and voices AND tones gained `rules[]` (do/don't,
embedded in every read, `PATCH` replaces the whole list) — which lifts the
INT-3 restriction (open-items 7 is now partly closed; only a tone's `example`
and a voice's `examples` remain homeless). Orgs gained `country`, plus
`PUT /orgs/:id/country` (~10 s: it loads the holiday calendar) and a read-only
`GET /orgs/:id/holidays` carrying each day's do/don't rules. Two new error
codes: `402 wallet_insufficient` and `502 bad_gateway`. And a whole new
namespace — `/orgs/:orgId/alphastudio/*`: wallet, usage, capability catalog,
posts runs (sync preview + batch generate), media jobs/assets, RAG knowledge —
a **pure proxy** to the external AlphaProStudio service, which the frontend
never addresses directly (decisions.md D-INT-A).

**Still NOT on the wire, and still static:** drafts / Today (D1–D3), the
publish/schedule dialog (D5), channel connections + OAuth (B1–B3), analytics
(G1–G2), any streaming (F1's
token stream — the proxy has no stream endpoint), and proposals +
published-social (they exist upstream but are not proxied). None of it is
invented or faked: where a spec promised something the wire cannot deliver, the
honest subset ships and the deviation is logged. The backend questions live in
open-items 1–13 and 21–27; W7 still waits on the two reopened manual gates.

**On `feat/med-0831` at the ship (2026-08-31, MED-0831 + /R):** lint clean ·
typecheck clean · **521 unit / 47 files** (+18 over CUT's tip: the
uploader, the routing, the filter, `listAssets`, the reducer trio, H5, the
reservation, the role body incl. never-null, `uploadRoleFor`) ·
guard-static **334 files clean** · static e2e **102 passed / 67 skipped /
0 failed** (`med-media.spec.ts` +3; `live-media-upload.spec.ts` authored,
3 self-skipping) · `verify:w00`–`w06` **all PASS** with drains at the
gated tree `2205261` · live rounds ABORTED by the founder (record kept:
auth 7/7 · brand-rules 5/5 · country 4/4 · create-visual 3 skipped);
the /R rider shipped on lint · typecheck · unit alone, his explicit
ruling — Hasan reviews on production.

Before that: **On `feat/cut-0831` (2026-08-31), the full gate at the tip:** lint clean ·
typecheck clean · **503 unit tests / 47 files** (+2: `brand-wire.test.ts`
freezes the tone create/PATCH bodies; the run-plan and body tests moved to
the no-picker shapes) · guard-static **332 files clean** · static e2e
**99 passed / 64 skipped / 0 failed** · `verify:w00`–`w06` **all PASS**
(each with the trap-22 drain) · LIVE, 16 files, `LIVE_MEDIA` off, one file
at a time, two rounds on the final tree: **round 1 15/16** — the one red was
`live-invite-org`'s first signup landing on "Welcome back" once (untouched
by this order, green in six other rounds the same day; 3/3 in round 2) —
**round 2, the merge gate: 16/16, 60 passed / 5 skipped, no red** (840 s /
829 s). Three live specs learned the ruled interim (the per-context language
re-save) during the rounds — deterministic, ours, fixed as
`ensureToneLanguage`; an earlier same-day round pair was aborted for it.

Before that: **Current totals on `main` (`6f45679`, merged 2026-08-30 — the HSN-FINAL
gate, run on the tip):** lint clean, typecheck clean, **501 unit tests / 46
files** (+31, three new files), guard-static **331 files clean**, **static
e2e 99 passed / 64 live-spec skips** (169 specs; `e2e/hsn-series.spec.ts` +6,
`live-create-visual` +3 self-skipping), `verify:w00`–`w06` **all PASS** (w02
and w06 on clean solo runs after the drain — see trap 22's fifth sighting;
w06's `uploads` check was re-pointed at the file HSN-04 moved the input to),
and the FULL live suite — now **16 files**, `live-create-visual` added,
`LIVE_MEDIA` off — under the two-round law: **round 1 15/16 in 724 s**
(`live-auth`'s only red was `net::ERR_CONNECTION_REFUSED` from the LOCAL dev
server on its second test — the harness, not the API, not the product;
7/7 in round 2), **round 2 — the merge gate — 16/16 in 760 s**, 60 passed /
5 skipped, no red anywhere. Before the language fix, an aborted round 1
failed five files deterministically on `Tone created` — the deferred HSN-03
breakage, fixed in `62fb19d`, not the weather. Pre-existing and untouched:
28 files are prettier-dirty on `main` (none HSN-touched except the smoke
script, which was already dirty).

Before that, **on `feat/hsn-04-limits-knowledge` (2026-08-30): build hygiene
only, by the series law** — lint clean, typecheck clean, **470 unit tests**
(43 files, unchanged), guard-static **328 files clean** (one new file),
prettier clean on every changed file. No e2e, no `verify:wNN`, no axe, no
live call.

**On `feat/hsn-03-tone-lang-length` (2026-08-30): build hygiene only, by the
series law** — lint clean, typecheck clean, **470 unit tests** (43 files,
unchanged), guard-static **327 files clean** (two new files), prettier clean
on every changed file. No e2e, no `verify:wNN`, no axe, no live call.

**On `feat/hsn-02-create-visual` (2026-08-30): build hygiene only, by the
series law** — lint clean, typecheck clean, **470 unit tests** (43 files,
unchanged), guard-static **325 files clean** (three new files), prettier
clean. No e2e, no `verify:wNN`, no axe, no live call: the series consolidates
every test into one final-gate order before a single ff merge.

**Current totals on `feat/hsn-01-generate` (2026-08-30): 470 unit tests**
(43 files — one net test fewer than `main`: the deleted over-budget guard's
test went with the guard), **static e2e 93 passed / 61 live-spec skips**,
guard-static **322 files clean**, `verify:w00`–`w06` all PASS, and the FULL
live suite (15 files, `LIVE_MEDIA` off, one file at a time) under the
two-round law — round results in the session entry.

Before that, on `main` (`963c9f7`, merged and shipped 2026-08-30):
**471 unit tests** (43 files), **static e2e 93 passed / 61 live-spec
skips**, guard-static **322 files clean**, `verify:w00`–`w06` all PASS, and the
FULL live suite — now **15 files**, `live-invite-org` added — under the
two-round law. Round results are in the session entry; the standing shape is
that a red which passes solo on the same tree is the API's latency, and a red
that survives one is ours.

Before that, on `feat/onb-03-gate`: **459 unit tests** (42 files), **static
e2e 92 passed / 51 live-spec skips**,
guard-static **320 files clean**, `verify:w00`–`w06` all PASS, and the FULL
live suite — now **14 files**, `live-onboarding` added — under the two-round
law: **round 1 14/14**, **round 2 13/14**. Round 2's single red was
`live-auth`'s 401-purge test, and it is recorded rather than re-run away:
`src/api/` is **byte-identical to `main`** on this branch (`git diff main --
src/api/` is empty), so the whole 401 path is untouched, and six solo runs of
that file put the test at **5 passed / 1 failed** — the one other failure in
that series was a different test timing out on a cold signup POST. It is API
latency on a file this cycle did not change, in the same family as the
`live-auth` round-1 red recorded on 2026-08-24. **Not claimed as green.**

Before that, on `main`: **457 unit tests** (42 files), **static e2e 87
passed / 51 live-spec skips**, guard-static 321 files clean, verify:w00–w06 all
PASS, and the FULL live suite **13/13** on the merged tree (D-M2-F-r2 round 2,
2026-08-24). M2 touches no live code — `src/api` and `src/data` were
byte-identical to `main` throughout — so green there was the expected answer
rather than a discovery. (The static count moved 88 → 87 when D-M2-F-r2 deleted
the allowlist and the test that existed only to keep it honest.)
(On `main`: 423 unit tests / 41 files / static e2e 72 passed / 255 guarded
files, and the FULL live suite green under the two-round rule — 13/13 twice,
2026-08-24.) (On `main` it is 398 unit tests / 38 files / 248 guarded files — the
"394" this line used to claim was already one turn stale.)
(The unit count dips by one: INT-10's localStorage run-ledger tests went with
the ledger it tested — the proposals ledger replaced it server-side.)
**INT-6 … INT-12 are MERGED to `main` (`c6e3489`, fast-forward — no merge
commit, one history) and PUSHED, 2026-08-19.** The seven phase branches stay on
`origin` as the per-phase record.

**Production is STATIC; `live` is where live mode runs.** Production (`main`)
holds no `VITE_API_BASE_URL`, so the deployed build is the same zero-network
artifact it has always been. Live mode is exposed to the team on the Vercel
PREVIEW of the `live` branch, with the variable scoped to that branch — which
is why the branch had to exist before the variable could be bound to it.

**Open-item 1 (CSP `connect-src`) is MOOT on Vercel:** `vercel.json` ships no
CSP at all, so there is no policy to widen. It would return only if the app
moved back behind the CloudFront stack in `infra/`.

**Still NOT on the wire after INT-12:** a list-runs endpoint, the
published-social proxy, any drafts store (so no editing before approval and no
scheduling), publish/schedule (D5), channel connections (B1–B3), analytics
(G1–G2), plans/checkout (H1/H2/H4), and streaming. Open-items 29–31 carry the
questions; 32 carries a real paging bug the frontend is designed around.
**No route is a stub any more** — `PlaceholderScreen` is deleted, and
`verify:w06` fails if it comes back.

**M1 is Abdullah's concept-v2, ported (M2, 2026-08-23, branch only).** The
visitor world is five routes under one layout route — `/` (Hero → Prompts →
OneEvent → RealBrands → Approval → Memory → Arabic → BrandDemo → ClosingCta),
`/pricing`, `/request-demo`, `/terms`, `/privacy` — with `Header`, `Footer` and
`MediaDefs` mounted once above the `Outlet`. Dark, DM Sans + IBM Plex Sans
Arabic **self-hosted** (two new deps, zero network), tokens on
`html[data-mk-world]` and resets on `.mk-world` so nothing reaches an app
screen. Upstream's source is VENDORED file-for-file under
`src/features/marketing/concept/` (58 files) so it can be diffed against the
prototype again; everything outside `concept/` is ours.

**The CTA law (D-M2-D):** every "Get started" is the REAL `/signup`, Login is
the real `/login`, "Request a private demo" is `/request-demo` — one map in
`concept/site.ts`, unit-tested, and `site.test.ts` reads the source to prove no
component types a route by hand. The prototype's purchase flow is deliberately
NOT ported (D-M2-C): next to a real signup it would be a second, fake journey.
The early-access model is retired and `/request-access` redirects to
`/request-demo` — **the founder can veto that at review**, which is why the
path still exists.

**Pricing is marketing's own data (D-M2-B):** `concept/lib/pricing.ts`,
verbatim from Abdullah. `usePlans()` and everything under `src/data` are
untouched and no longer imported by marketing. The W2 verify line "marketing
pricing and H1 pricing assert equal from one module" is superseded; the check
now asserts the SEPARATION.

**Four AA deviations from the prototype (D-M2-F, design.md 7.7),** all
commented at the site of the change and all one-line reversible: the filled
CTA's ink is dark on the unchanged `#ff4e2d` (white was 3.29:1); `--c-text-4`
aliases `--c-text-3` (the prototype's `#5d5a57` was 2.63–2.93:1 on ~40
elements); the approval preview is absent rather than held at `opacity: 0.3`
(1.43:1); the customer monogram moved up a tier. `styles/marketing-tokens.test.ts`
is the new guard, 26 assertions, mirroring `tokens.test.ts`.

**What M1 took with it (D-M2-A):** `marketing-home.tsx`, the whole
`outputs/` engine, `reveal.tsx`, the `pricing-section.tsx` seam, the
`[data-mk-*]` motion layer in `globals.css`, `public/campaigns/`,
`public/brand/og-malaky.png`, `features/system/legal-screens.tsx`, and the
early-access screen + its analytics module. **The bundle did NOT shrink** —
entry chunk 632 kB → 675 kB, main CSS 160 kB → 216 kB — because concept-v2's
home page is a bigger thing than M1 was. Recorded in D-M2-A rather than
explained away.

**Not done, and logged:** `/request-demo` transmits nothing (the module says
so), `hello@malaky.ai` is the ONE invented value in the port, the six legal
values are still `null` and render as `[To be confirmed: …]`, and `/signup`
still wears the app's design so the visitor crosses a visual seam at "Get
started". All of it is open-items 21.

## What W7 needs (from `web-plan.md` §9)

- **Full-app `@golden` walks** of the three journeys. The pieces exist and are
  individually tagged `@golden`; W7 joins them end to end and runs them twice
  consecutively.
- **The message-catalogue completeness test** — every entry in `lib/messages.ts`
  reachable from some screen, and no screen rendering an unlisted error or empty
  string. `MESSAGES` grew a lot in W6; expect this test to find dead entries.
- **Route-level code-splitting + bundle budgets.** The bundle is currently a
  single ~1.2 MB chunk and vite already warns about it — nothing has been split
  yet, by design.
- **Lighthouse CI** (marketing ≥ 95 perf / 100 a11y; app ≥ 85 / 100), which
  needs the staging deploy, which needs the domain + certificate (still parked).
- **Dead-dataset and unused-record pruning.** The `heavy` id is gone; the seven
  worlds now are visitor, fresh, active, low-credits, needs-reauth, past-due and
  quiet-week.

## Rules that have bitten, and will again

These are learned the hard way; each cost a debugging cycle.

1. **`page.goto` in e2e reloads the SPA**, which rebuilds the DEFAULT dataset.
   After switching worlds, navigate **only through in-app links**. Enforced by
   every `verify:wNN` from W3 onward. Use `activateDataset` from `e2e/datasets.ts`.
2. **The shell's `h1` renders during the loading skeleton**, so it is not a
   readiness signal. Wait for `[aria-busy="true"]` to reach 0 before counting
   anything on a screen.
3. **Never dim real text with `opacity`** — it has broken WCAG AA three times
   (marketing logos, calendar day numerals, and nearly the auth panel). Recede
   via the surface or the `muted-foreground` token instead.
4. **Sheets and dialogs must read live provider state**, not a snapshot taken
   when they opened. Hold an id and look the record up, or the panel renders a
   stale version of what the user just changed.
5. **`vitest` runs without `globals`**, so Testing Library's auto-cleanup never
   registers — `src/test/setup.ts` does it explicitly. Component files may not
   export non-components (fast-refresh rule); put hooks and pure helpers in a
   sibling `.ts`.
6. **Scripts under `scripts/` must not import app source.** `tsconfig.node.json`
   has no `@/` alias, and dragging `src/` into it breaks typecheck repo-wide.
   Assertions about data belong in the unit suite.
7. **`sr-only` hides an element but keeps it focusable.** A visually hidden
   control still takes a tab stop and renders no focus indicator, so focus
   appears to vanish. Pair it with `tabIndex={-1}` whenever a visible control is
   the real affordance.
8. **A route whose sections each render the layout will destroy focus.** React
   swaps one component for another, the shared nav unmounts, and the focused
   element goes with it. Shared chrome belongs in a route layout above an
   `Outlet`.
9. **Playwright's `getByText('…')` is case-insensitive substring matching**, and
   the rail's Today link carries its unread count in its accessible name
   (`"Today 5 drafts need review"`), so `{ exact: true }` finds nothing. Scope
   rail clicks to `[data-sidebar="sidebar"]` and match by prefix.
10. **An open Radix menu is modal**: everything behind it is `aria-hidden`, so a
    role query for the trigger returns nothing while its menu is open. Press
    Escape before asserting on what the trigger now says.
11. **A structural check must not match prose.** A `verify` regex against a
    sentence in JSX breaks the first time Prettier wraps the line, and the fix
    people reach for is deleting the check. Match structure — a call, a guard, a
    catalogue key — not copy. The same trap bit twice more on 2026-07-29: a
    length-capped regex broke when a comment lengthened the tag it matched.
    And twice more on 2026-07-30, from both directions: the new cinematic
    checks matched their own doc comments until comments were stripped, and a
    tokens.css comment naming the dark selector broke `tokens.test.ts`, which
    locates the dark block by that string's first occurrence.
12. **A comment stripper that tracks string state will swallow a file.** INT-6
    needed guard-static to read code without comments, and the obvious
    implementation — a lexer that enters "string mode" on a quote — dies on the
    first apostrophe in JSX prose ("Don't"): the string never closes and every
    following line is blanked, so the guard silently stops guarding. That is
    worse than a guard with a known gap. `codeOf()` is line-scoped instead, and
    its two blind spots can only LOSE a match, never invent one. If you extend
    it, keep that direction of failure.
13. **api.md is not the wire.** Three fields the 2026-08-17 docs describe one
    way behave another: `slot` is required on a generate run, `embeddingModel`
    is required on a RAG collection, and a draft's `toneId`/`rationale` live
    INSIDE `outputs[].content`, not beside it. Types for anything under
    `/alphastudio/*` come from `Docs/api/alphastudio-shapes.md`
    (`pnpm smoke:alphastudio`) — never from an example in prose.
14. **Playwright's `count()` does not auto-wait, so it is never a readiness
    gate.** Two specs flaked only under parallel load for this reason (found
    INT-6, present since the 2026-08-11 code-split): the route's lazy chunk was
    still arriving, `count()` returned 0, and the test either skipped its whole
    loop and failed as "no such slot" or compared against a stale zero. Waiting
    for `[aria-busy="true"]` to reach 0 does NOT cover it either — that
    assertion can pass in the window before the fallback even mounts. Assert
    `expect(locator.first()).toBeVisible()` first; that retries, `count()`
    does not.
16. **`getByRole(..., { name })` matches by SUBSTRING too, not just
    `getByText`.** Trap 9 was recorded for `getByText`; INT-12 proved it costs
    just as much on roles. A click on `{ name: 'Approve' }` silently hit the
    **'Approved' tab** — which renders first — so the confirm never opened and
    the failure read as "no dialog". Use `exact: true` and scope to the row.
18. **A LIVE spec you are not running rots exactly like a `verify` you are not
    running (trap 15, second helping).** `live-generate` asserted a heading
    called "Recent runs"; INT-12 renamed that section to "Waiting for review"
    and the spec had been failing on `main` ever since — unnoticed, because
    closing INT-12 ran `live-proposals`, not `live-generate`. Worse, a
    catalogue string still TOLD the user to "check Recent runs", so the app
    named a section that no longer existed. When a rename lands, grep the
    specs and `lib/messages.ts` for the old name, not just the components.
    Corollary found the same day: two more live specs asserted the PLURAL of a
    count ("passages", "members") and only passed because the plural was
    unconditional — fixing the grammar broke them, which is the right way round.

21. **Scoping a vendored stylesheet with a CLASS silently outranks the
    vendor's own rules.** The concept-v2 port's resets were bare element
    selectors upstream (`button { color: inherit }`), so a component class
    like `.primary { color: #fff }` beat them. Scoping them as
    `.mk-world button` flips that — (0,1,1) over (0,1,0) — and the filled CTA
    lost its label colour on every page, silently, because "inherit" from a
    dark page still renders text. `:where(.mk-world) button` contributes no
    specificity, so each rule lands at exactly the weight it had upstream.
    **When you scope someone else's stylesheet, scope it with `:where()` or
    you are also re-ranking it.** Found by axe reporting the wrong foreground
    colour on the button, not by looking at it.

22. **A dev server left running in LIVE mode makes the whole STATIC suite fail
    in confusing ways.** `playwright.config.ts` sets
    `reuseExistingServer: !CI`, so `pnpm e2e` silently adopts whatever is on
    5199 — including a server started by hand with `.env.local` loaded. In
    live mode there is no seeded session, so `/` is the marketing site and
    `/signup` renders instead of redirecting: **63 specs failed on "waiting
    for heading Dashboard"** (69 on this branch, which has more static specs)
    and every one of them looked like a regression in the branch under test.
    It cost two debugging cycles in one afternoon. **Before reading a
    static-suite failure, check what is listening on 5199.**
    The webServer block pins `VITE_API_BASE_URL: ''` for exactly this reason —
    but only for a server IT starts.

    **This one is now guarded, not just recorded** (`fix/live-suite-warmup`):
    `e2e/global-setup.ts` asks the server which mode it is in before anything
    runs — it reads `src/api/config.ts` as Vite serves it, with the env
    inlined, which is the one file documented as deciding the mode — and
    refuses the run with a named error if the server disagrees. Proven in both
    directions. The guard is SILENT when it cannot get a clear answer (no dev
    server, a preview build, a future Vite that inlines differently): a guard
    may fail a run for a reason it is sure of, never for one it guessed.

    **Second sighting, 2026-08-24 (M2 close-out), and a different shape.**
    `verify:w02` came back FAIL inside a sweep that ran `pnpm e2e` and then
    `pnpm verify:w00…w06` back to back — while its OWN structural laws passed
    and the full static e2e passed beside it, seconds earlier. It then passed
    standalone, and passed again in a clean sequential sweep. Nothing in the
    tree changed between the red and the greens. The cause is the same
    `reuseExistingServer: !CI` seam as trap 22 proper: consecutive Playwright
    runs each start and tear down their own server on 5199, and a run that
    begins while the previous one is still releasing the port adopts or races
    it. **The lesson is not "re-run until green" — it is that back-to-back
    Playwright invocations are not independent.** Give a suspicious gate one
    clean solo run before believing it, and if a sweep matters, do not chain
    it directly behind another `pnpm e2e`. A red that cannot be reproduced
    solo AND is contradicted by a neighbouring run of the same specs is
    environmental; a red that survives a solo run is yours.

    **Third sighting, 2026-08-28 (ONB-0827 Phase 2), same shape again.**
    `verify:w03` came back FAIL on a MARKETING font assertion — "expected DM
    Sans Variable, received Inter Variable" — inside a sweep chained behind
    `pnpm e2e` and `verify:w00…w02`. The branch under test had not touched
    marketing at all. It passed solo immediately after, 87/87, with port 5199
    still showing TIME_WAIT sockets from the previous run. Recorded because
    the failing assertion looked plausible (a font really can fail to load),
    and that is exactly when this trap is most expensive.

    **A FOURTH sighting, and then the FIX (2026-08-28, ONB-0827-B).** The same
    marketing FONT assertion failed a fourth time inside a sweep. Four
    identical, sweep-only failures on branches that never touched marketing is
    not weather, it is a bad test: `marketing.spec.ts` sampled `document.fonts`
    ONCE, immediately, and font loading is asynchronous — a `@font-face` is
    only fetched when something uses it. It awaits `document.fonts.ready` and
    polls now, asserting exactly what it asserted before. `verify:w06` went
    green immediately. **A check that keeps reporting the harness instead of
    the branch has stopped working** — fix it rather than learning to read past
    it.

    **A SECOND SEAM, still open and worth knowing.** `verify:w00` failed on
    four `entry-flow` tests that then passed 6/6 solo, while w01–w05 ran the
    identical suite green in the same sweep. w00 is the one phase that runs
    `pnpm build` immediately before `pnpm e2e`. So the port precondition below
    is necessary but not sufficient: a heavy build right before a Playwright
    run is its own kind of load.

    **AND A SHARPENING, same day, worth more than the sighting.** Later in the
    same cycle `verify:w06` failed twice in a row on TWO DIFFERENT tests — the
    marketing font assertion in a chained sweep, then the keyboard walk in what
    looked like a solo run — while a bare `pnpm e2e` passed 92/92 either side of
    both. The "solo" run was not solo enough: `verify:wNN` runs the whole
    `pnpm e2e` inside itself, and it had started seconds after the previous
    verify released port 5199.
    **Waiting for the port to be FULLY released makes it deterministic:**

    ```bash
    until [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; do sleep 5; done
    pnpm verify:w06
    ```

    That run passed — 459 unit, 92 e2e, RESULT PASS. So the rule is not "give it
    a solo run", it is **"wait for TIME_WAIT to drain, then give it a solo
    run"** — a precondition you can check rather than a re-run you hope about.
    Two different tests failing in the same seam is the tell: when consecutive
    reds do not agree on WHAT broke, suspect the harness, not the branch.

    **Fifth sighting, 2026-08-30 (HSN-FINAL), the same tell with numbers.**
    The gate ran the full static suite EIGHT times on one tree (a bare
    `pnpm e2e`, then `verify:w00`–`w06`, each after a full drain). The bare
    run lost THREE tests that do not agree on what broke (the golden tone
    walk at F1's tone select, the knowledge lifecycle's `Ready`, the
    keyboard walk "must reach the main content"); `verify:w02`'s run lost ONE
    (`calendar-connections`' "Syncing, never a zero" hunt); the other SIX
    runs were 99/99, and every red passed on a clean solo run of its file
    minutes later. Four reds across eight runs, never the same one twice,
    never surviving solo: the harness. Two shapes worth naming: the bare
    run was the FIRST Playwright run after `pnpm test` (vitest's workers had
    just released the CPU), and the calendar hunt samples
    `sheet.getByText(/Syncing…/).count()` right after a click — `count()`
    does not wait (trap 14), so under load it can miss the slot and move on.
    Left as it is (one sighting; it is W4's spec and this order did not touch
    it), recorded so the next sighting is the second and the fix is obvious.
    A LIVE cousin the same day: `live-auth` opened round 1 with
    `net::ERR_CONNECTION_REFUSED at http://localhost:5199/login` on its
    SECOND test — the local dev server, not the API — and ran 7/7 in round 2.

19. **"Has the user edited?" is a fact to RECORD, not to infer from a JSON
    diff against a moving reference.** C1 decided whether to adopt a freshly
    synced schedule by comparing its draft to the last pristine it had seen,
    held in a ref. It looked equivalent to knowing, and was not: the brand and
    scheduling halves of the live sync graft INDEPENDENTLY, so the ref can
    advance to the live schedule on a render where the draft has not adopted
    yet — and the next pass reads a perfectly untouched draft as an edit. The
    first B9 fix inherited that inference and pruned a just-saved selection to
    nothing on reload. The flag is set by `patch()` now, the one funnel every
    field change already went through, and cleared on Cancel and on a good
    save. If a screen needs to know what the user did, have the user's own
    handler say so.

23. **The HOST can sleep through a live round, and the red it leaves looks
    like the product's (2026-09-02, the HSN-0902 gate).** Round 2's
    `live-brand-kit` failed on `"Sent to the studio."` not being visible —
    a plausible CORS or wire failure — and the file "took" 51 minutes for a
    150 s test timeout. The Windows power log had the answer: Kernel-Power
    event 42 (entering sleep) at 13:27:48Z, 32 seconds into the file, and
    the resume at 14:18:50Z; the global-setup heartbeat had stopped after 7
    beats (35 s). Nothing in the tree or on the wire was wrong: the file
    re-ran 3/3 in 37 s. **Two tells, either of which settles it:** a
    test's reported duration longer than its own timeout, and a heartbeat
    count that does not match the wall clock. **Check the power log before
    reading the failure** (`Get-WinEvent` on `Microsoft-Windows-Kernel-Power`
    ids 42/107 and `Power-Troubleshooter` id 1). **The precondition for an
    unattended round is a host that cannot sleep** — hold it with a
    process-scoped `SetThreadExecutionState(ES_CONTINUOUS |
    ES_SYSTEM_REQUIRED)` in a background PowerShell for the run's life
    (released when the process ends; no power setting changed), never by
    editing the machine's sleep policy. A red judged as the host's is
    re-run as a RECORDED supplement with the timestamps beside it — the
    two-round law says a red in round 2 is a red, and the supplement is
    how the record says whose.

20. **A null answer from the wire must never fall through to demo data.**
    INT-8 wrote this for `eventSources` — "an empty list is the honest answer
    rather than demo data dressed as live data" — and the reducer two lines
    below it did the opposite for schedules: `...(action.scheduling.schedule ?
    { schedule } : {})` left the SEEDED world in place, so a live org with no
    schedule opened C1 wearing the demo's five active days, three posts a day
    and eight tone ids, presented as its own settings. A missing schedule
    grafts a BLANK one now. Whenever a graft is conditional on the wire having
    answered, check what the screen shows when it did not.

17. **A shadcn ConfirmDialog is `role="alertdialog"`, not `role="dialog"`.**
    And it is modal, so while it is open everything behind it is aria-hidden
    (trap 10) — a `getByRole('dialog')` query against it finds nothing at all,
    which reads like "the dialog never opened" rather than "wrong role".

15. **A `verify:wNN` you are not running is a check that has already broken.**
    `keyboard-focus rules hold` (w06) had been failing since 2026-08-11 because
    the code-split moved route elements behind a lazy loader and its regex
    matched the old literal markup — six days unnoticed, because the rb/02 work
    ran `verify:w02`. The law was intact; only the check was stale. When you
    branch, run the gate you are about to be judged by BEFORE writing code, so
    you know which failures are yours.

## Design laws with automated enforcement

Beyond lint and typecheck, each `verify:wNN` runs **structural** checks that
read source, because these failure modes pass behavioural tests:

- Media entry points are rendered from `canTransition`, never a hand-rolled
  status comparison, and are never `disabled` (W3).
- An unreported metric is `undefined`, never `0` — the "Syncing…" rule (W4).
- D4 and E2 must both render the shared `ComposerBody`; neither may grow its
  own params form (W5).
- The params form is generated from each model's JSON Schema; it may not name a
  model or a parameter (W5).
- The credit balance is summed from the ledger; no entity may store one (W5).
- `past_due` gates from the shell, and refuses generation and publishing (W5).
- One tone editor, three entry points: the sheet and the routed page both render
  the shared `ToneEditorForm`, and no caller may grow tone fields of its own (W6).
- Every screen that shows a tone renders `ToneBadge` (W6).
- F1 renders D2's card, D2's actions and D2's dialogs, and the draft it makes
  enters at `pending_review` (W6).
- The compose scripts live in data; the screen may not name one (W6).
- Every dirty-state screen commits through the shared `SaveBar`; a local
  `useBlocker` fails the phase (W6).
- No route resolves to a placeholder (W6).
- Settings is a route layout with a real tablist, the leave-guard restores
  focus, no `sr-only` file input holds a tab stop, and adding a rule focuses it
  (post-W6 remediation).
- Every posting time renders through `PostingTime`, labelled by GMT offset, and
  no screen claims to know the audience's local time (post-W6 remediation).
- **The visitor-world laws (verify:w02, rewritten for M2).** Thirteen checks
  over `src/features/marketing/`: nothing Next-shaped survived the port (no
  `next/` import, no `"use client"`, no `/concept-v2` path in code); the
  purchase flow's nine modules stay absent; nothing imports `@/data` except
  the layout; the CTA map declares `/signup` and `/login`; every screen sets
  its page meta; the homepage's nine sections render in order; the tokens hang
  off `html[data-mk-world]` and never `:root`, and the layout sets AND removes
  that attribute before paint; the FROZEN section rhythm (both tokens and the
  section-head gap) is byte-exact; the five self-hosted font imports are
  present; `<video>` sits behind the reduced-motion return; the raw-color
  exemption is exactly four artwork files; a quiet text tier never sits on a
  light fill; M1's seven artefacts are gone from the tree and its motion layer
  from `globals.css`; and `index.html` and `site.ts` agree on the homepage
  title and the OG card.
- The M1 cinematic laws are RETIRED with M1 (D-M2-A). They were: the scrub
  never touches `currentTime`; the reduced-motion still path exists; Lenis
  sits behind the motion guard; pricing keeps `usePlans()` with no local plan
  data; every marketing `<video>` is muted+`playsInline`; media paths live in
  `media.ts`; tone chips read `useTones()` and render `ToneBadge`.
- The palette is guarded by `src/styles/tokens.test.ts` — 49 contrast
  assertions, including the `bg-X/10 text-X` badge pattern. **The visitor
  world's palette is guarded the same way** by
  `src/styles/marketing-tokens.test.ts` — 26 assertions over the text-tier ×
  surface matrix, the CTA in both states, the focus ring, and the shape of
  both ramps (M2).
- **A production build boots into `visitor`, never signed-in** (verify:w02,
  2026-08-19). Checked on BOTH sides: the source derives the default from
  `import.meta.env.PROD`, and the emitted `dist/` is read back to confirm it
  really falls back to `"visitor"`. The artifact half exists because the
  incident it prevents had correct source and a wrong deployment.
- **Which org a session works in is ONE selector** (ONB-0827-B). Every
  `orgs[0]` is gone: `selectActiveOrg` answers, the choice is persisted beside
  the session and stamped with the user id, and a remembered org that has
  vanished falls back to a real one and SAYS so. Switching re-grafts rather
  than only re-syncing, because the viewer's ROLE is per-org — a member of one
  workspace can own the next, and a stale role would offer owner controls in a
  workspace where they have none.
- **The readiness gate is ONE selector** (verify:w06, ONB-0827). F1's route,
  the Studio composer and D4's media dialog each read `useReadiness()` and
  render the shared `GenerationBlocked`; the ruling itself lives only in
  `src/data/readiness.ts`; and the tone PREVIEW is asserted to stay UNGATED,
  because previewing is part of creating the first tone. A fifth surface with
  its own idea of "ready" would pass every behavioural test in the suite while
  disagreeing with the checklist the user was just shown.
- The proxy law (INT-6, `guard:static`): `fetch` exists in exactly two files,
  and no code under `src/` may name the upstream origin, its signing headers,
  its route prefix, or either service secret. Comments may name all of them —
  the rules read code only.

## Open manual gates

**Two are REOPENED.** All 13 were walked on 2026-07-29 and signed off, but the
focus, tablist and posting-time work that came out of them moved the semantics
two of the sittings exist to check — so the 360px pass and the screen-reader
walk must run again against the FIXED build, not the one they were signed off
against. See `.agent/open-items.md`. What they found became work, not
backlog: six focus fixes, two data-honesty fixes, and one decision-gated
proposal (timezones) that has not been built.

**The lesson worth carrying:** axe was green on every screen the six focus bugs
lived on, and always had been. It reads markup; it does not tab through
anything. Treat `@axe` as a floor, never as the accessibility safety net —
`e2e/settings-a11y.spec.ts` is the pattern for what actually catches these.

## Still parked (needs a human)

1. **CI on the new remote** — the repo exists and everything is pushed, but no
   workflow has ever run there. The W0 verify item "a canary PR is blocked by
   every check" is still unproven: the checks all pass locally and have never
   been enforced by GitHub.
2. **Domain + ACM certificate** — blocks "staging URL serves the shell". The
   CDK stack (`infra/`, `ABW-<stage>-Web`) synthesises but has never deployed.
   This now also blocks a W7 verify item: Lighthouse budgets are measured on the
   staging deploy.
3. **Arabic**: recorded as decided, not pending — UI stays English; Arabic
   _content_ would need only a font fallback and `dir="auto"`, while Arabic
   _chrome_ is the expensive retrofit. Reopen only on a decision to localize.

## Orientation for a new session

Read in this order: `CLAUDE.md` (rules) → this file → `.agent/conventions.md` →
the last entry in `.agent/sessions.md`. Then `screens4.md` for the screen you
are about to build and `design.md` for how it should look.

Useful commands (full list in `.agent/stack.md`):

```bash
pnpm dev                 # http://localhost:5173
pnpm verify:w06          # the last completed W phase; --skip-e2e for a fast pass
pnpm lint && pnpm typecheck && pnpm test
pnpm smoke:alphastudio   # live: re-observe the proxy shapes (needs VITE_API_BASE_URL)
```

`/dev/datasets` switches tenant worlds, `/dev/states` forces loading, error and
N4's connectivity banners, `/dev/kitchen-sink` shows every design-layer
primitive in both themes.

Two states are reachable only by doing something first, which is deliberate —
they are states an org gets into, not worlds it starts in:

- **F1's refusal**: spend the three on-demand runs (`COMPOSE_LIMIT`). The five
  runs themselves are chosen by the prompt — `competitor` flags a claim
  mid-stream, `breaking` drops the stream, `thread` is long enough that stopping
  is a real choice, anything else is the ordinary run.
- **G1's empty state**: disconnect every analytics-enabled channel. The `fresh`
  world has none, but it has not finished onboarding either, so N3 owns it.
