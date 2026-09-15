# Item 73 — a refused Brand voice save never resyncs (ORDER-FIX-0915)

**Probe finding.** `saveBrandVoice` (`src/data/brand.ts`) called `resync()` in
its catch — `dispatch({ type: 'live/resync' })` — after a 4xx refusal. The
resync puts `liveSyncPhase` on `syncing`, `settings-layout.tsx` swaps the
screen for its skeleton while the sync runs, and the screen remounts pristine
when it lands: the draft the user typed, the in-screen `role="alert"` with the
wire's message and request id, and the Save button were gone within a second
(TEST-0915 proof C, org 2199). Nothing had changed on the wire, so nothing
needed re-reading. The screen's own draft-adoption effect keeps an edited
draft only while the screen stays mounted; the remount is what erased it.

**Fix.** The catch returns the failure and does not resync. A resync still
follows a save that lands (unchanged), and the user's own Try again on the
error state still re-reads (unchanged). Ruled D-FIX-0915-B. The same
`catch { resync(); return failure }` idiom stands in one other seam, the
topics save (`saveTopics`, optimistic `topics/set` first) — out of this
item's scope and recorded as a new open item rather than changed here.

**Seam tests (red before the fix).** `src/data/brand-voice.test.ts` — the
provider's dispatch is now one shared spy (`vi.hoisted`) so a test can read
what a save sent it; three cases added under "a refused save never resyncs":
a 400 on the PATCH dispatches nothing; a 400 on the first save's POST
dispatches nothing; a save that lands dispatches `live/resync` exactly once.
`unit-before-fix.log`: the two refusal cases red (`expected "spy" to not be
called at all, but actually been called 1 times`); `unit-after-fix.log`:
10 / 10.

**Live proof (the order's bounded exception).** `e2e/live-brand.spec.ts`
gained "a refused save keeps the draft, the alert and Save on screen (item
73)": on the fresh org the file makes, the canonical row's PATCH is fulfilled
at the browser with the wire's own 400 envelope (`validation_failed`,
`details[0].message` "Too big: expected array to have <=50 items", request id
`fix-0915-refused-save`; the preflight and every other request reach the API),
Save is pressed with a new Do rule typed, and the spec asserts: the field
message in the toast and never "Brand voice saved" (as before), then — three
seconds on too — the alert with the request id still up, the typed rule still
in "Do rule 2", the Save button still enabled; the route is removed, the same
draft saves for real and survives a reload. Run once, alone, `--workers=1`,
`E2E_API_ENV=dev`, one fresh QA org: **6 / 6 in 1.3 min**
(`live-brand-run1.log`, `.json`). The spec's log carries no org id (the file
never printed one); the org is the one `qa+<runStamp>b@alphapromena.com` made
at 12:31Z.

**Cheap checks on this tree.** `lint.log` clean · `typecheck.log` clean ·
`guard-static.log` clean · `unit.log` 825 / 825 in 73 files ·
`static-e2e.log` **116 passed / 0 failed / 90 skipped** in 346 s, one worker
(`Running 206 tests using 1 worker`; 89 skipped + the new live test).
