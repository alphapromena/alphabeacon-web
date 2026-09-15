# TEST-0915-2 — Phase 4 on the live app (live2, 2026-09-15T19:04:15.233Z)

Base: http://localhost:5197 · API: <api-host> · sections B, C, D, E, H

| section | result | check | detail |
|---|---|---|---|
| setup | NOTE | the fresh org for A, B, E | org 2314, qa+1789499055325311ab@alphapromena.com |
| B | PASS | motion: the tagged indicator, the rail and the main are the same nodes through Today, Billing, Calendar, Settings | Today: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Billing: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Calendar: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Settings: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} |
| B | NOTE | motion: no marker for Billing | main reads "" |
| B | NOTE | motion: no marker for Settings | main reads "OrganizationBrand voiceTonesSources & topicsKnowledgeTeamBrand setupFinish these and this workspace can write. Each one has its own screen — do them in any orde" |
| B | NOTE | motion: no marker for Studio | main reads "" |
| B | NOTE | motion: arrival markers | Today: "Needs review" · Billing: "" · Settings: "" · Studio: "" · Calendar: "Nothing scheduled yet" |
| B | FAIL | motion: route arrivals live (ms per run, first is cold) — warm hops against the static 22–67 ms range | Today 5/5/5 · Billing -2†/-2†/-2† · Settings -2/-2/-2 · Studio -2†/-2†/-2† · Calendar 4/4/4; median 5 ms, warm max 5 ms; indicator the same node on 15/15 hops |
| B | FAIL | motion: no skeleton painted on a finished screen's warm hop | 6 of 15 hops painted one (cold hops included) |
| B | PASS | reduced motion: the tagged indicator, the rail and the main are the same nodes through Today, Billing, Calendar, Settings | Today: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Billing: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Calendar: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} · Settings: {"tagged":true,"indicators":1,"mains":1,"sameRail":true,"sameMain":true} |
| B | NOTE | reduced motion: no marker for Settings | main reads "OrganizationBrand voiceTonesSources & topicsKnowledgeTeamBrand setupFinish these and this workspace can write. Each one has its own screen — do them in any orde" |
| B | NOTE | reduced motion: no marker for Studio | main reads "" |
| B | NOTE | reduced motion: arrival markers | Today: "Needs review" · Billing: "Malaky Business" · Settings: "" · Studio: "" · Calendar: "Nothing scheduled yet" |
| B | FAIL | reduced motion: route arrivals live (ms per run, first is cold) — warm hops against the static 22–67 ms range | Today 5/6/5 · Billing 798†/922†/935† · Settings -2/-2/-2 · Studio -2†/-2†/-2† · Calendar 5/4/4; median 5 ms, warm max 935 ms; indicator the same node on 15/15 hops |
| B | FAIL | reduced motion: no skeleton painted on a finished screen's warm hop | 6 of 15 hops painted one (cold hops included) |
| C | NOTE | the fresh org for the moments | org 2315, qa+1789499351406641c@alphapromena.com |
| C | FAIL | first light plays once on a fresh account, under the 2000 ms ceiling (page-time mount → removal) | seen true; 2239 ms |
| D | PASS | axe clean while first light is on screen | 0  |
| C | PASS | first light never plays on a reload of the same account | mounted after reload: false |
| D | PASS | live: the "Brand voice saved" toast description reads ≥ 4.5:1 as rendered at +40/+80/+160/+400 ms from its mount | toast mounted 2045 ms after Save; +41 ms → 13.62 (opacity 1); +88 ms → 13.62 (opacity 1); +166 ms → 13.62 (opacity 1); +403 ms → 13.62 (opacity 1) |
| D | PASS | axe clean with a toast up | 0  |
| C | NOTE | the live composer and the wallet chip | composer with a Generate button: true; top bar: "Toggle Sidebar Generate Text posts, on demand No balance yet — subscribe QT" |
| C | NOTE | a generation on the unfunded fresh org | outcome: no terminal line in 60 s; main reads "Tones One to three of your own tones. Each one writes its own draft, with its rules attached. Roastery floor How it writes Balanced Grounded in your knowledge and sources, with fresh phrasing. The def" |
| D | PASS | axe clean on the Generate screen after the run | 0  |
| C | NOTE | moments that need a draft (Generating stages, Approve settle + sweep, §5.7, the toast samples) | not reachable at zero spend on a fresh live org — the wallet is empty by construction and a run is refused with 402; proven on the built app in static mode (Docs/qa/fix-0915/item-76, Docs/qa/test-0915/proofs) and exercised live by the gate on the funded org |
| C | FAIL | moment 1 — the tone sample rewrites beside the picker (data-slot="tone-sample") | 2 tone buttons in the picker; sample present: false |
| D | PASS | axe clean at rest and mid-rewrite on the schedule screen | moment 1 — schedule, tone sample at rest: 0  · moment 1 — mid-rewrite: 0  |
| C | PASS | a waiting screen mounts role="status" + aria-busy at the true start and paints it after the 220 ms threshold | aria-busy at mount: true; first paint 241 ms after mount (138 samples at 4 ms) |
| D | PASS | every app route scans clean inside the frame while its entrance is in flight (19 routes) | /: 0 · /today: 0 · /calendar: 0 · /calendar/settings: 0 · /calendar/sources: 0 · /connections: 0 · /studio: 0 · /studio/new: 0 · /studio/jobs: 0 · /billing: 0 · /billing/balance: 0 · /generate: 0 · /analytics: 0 · /settings/organization: 0 · /settings/brand-voice: 0 · /settings/tones: 0 · /settings/sources: 0 · /settings/knowledge: 0 · /settings/team: 0 |
| D | PASS | reduced motion: a toast ("Brand voice saved") is in its end state at the first sample (opacity 1, transform settled) | toast mounted 2116 ms after Save; +52 ms → opacity 1, matrix(1, 0, 0, 1, 0, 0); +83 ms → opacity 1, matrix(1, 0, 0, 1, 0, 0); +164 ms → opacity 1, matrix(1, 0, 0, 1, 0, 0); +404 ms → opacity 1, matrix(1, 0, 0, 1, 0, 0) |
| E | PASS | 1 · a token expired at boot on `/` lands on login with the toast, the session purged | {"path":"/login","toastSeen":true,"stored":false,"signIn":true} |
| E | NOTE | the revocation from outside | POST /auth/logout → 204 (request e52b2dd0-ff7d-4da4-90fa-59a1e733dcea) |
| E | PASS | 2 · a token revoked mid-session on an authed route lands on login with the toast, not on the website | {"path":"/login","toastSeen":true,"stored":false,"signIn":true} |
| E | PASS | 3 · a dead token on a direct load of Billing lands on login with the toast | {"path":"/login","toastSeen":true,"stored":false,"signIn":true} |
| H | FAIL | section ran to the end | TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('heading', { name: 'Create your account' }) to be visible[22m
 |
