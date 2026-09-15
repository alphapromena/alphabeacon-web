# Item 74 — the runner's static half takes a worker count (ORDER-FIX-0915)

**Probe finding.** `scripts/verify-all.ts` spawned `pnpm exec playwright test
--reporter=list,json` with no `--workers`, so the static suite ran at
Playwright's default (half the cores) whatever `pnpm gate --workers` said —
the gate's `--workers` reached only the live lanes. TEST-0915 therefore ran
the static suite by hand at `--workers=1` and the seven `verify:wNN` report
checks were not part of its gate record. `playwright.config.ts` sets no
`workers`, and was not to be edited.

**Fix.** `verify-all.ts` takes `--workers <n>` (also `--workers=<n>`): outside
CI the default is ONE unless the caller says otherwise; in CI nothing is
passed and Playwright's own default stands, exactly as before. A value that is
not a positive integer stops the run with a plain message. `gate.ts` hands its
own `--workers` down (`pnpm verify:all --workers <n>`), so the runner's one
flag now governs both halves. `playwright.config.ts` untouched.

**Proof — the runner's static half, once, with the flag.**
`pnpm gate --skip-live --workers 1 --series fix-0915`:

- run 1, record `Docs/qa/fix-0915/gate/20260915-125446/` (`gate-run.log` here
  is the runner's own stdout): `static/verify-all.log` shows the e2e step's
  command line ending in `--workers=1`; the suite's own log
  (`.gate/reports/e2e.log`, first line copied to `e2e-head-run1.txt`) reads
  **`Running 207 tests using 1 worker`** — 117 passed / 0 failed / 90 skipped
  in 5.8 min; verify:all PASS in 426 s; unit 825 / 825 in 73 files.
  The seven `verify:wNN` checks then FAILED and the record reads RED — for a
  reason of this session's making, not the code's: the runner's stdout was
  redirected into an untracked file INSIDE the repo (`gate-run.log`), and
  `treeHash()` hashes untracked content, so the tree "moved" between the hash
  taken before the suites and the one the checks take (`stale suite report
  (made for tree 08b3a00c5a29, this tree is 53ac97d5087d)`). The runner was
  right to refuse it.
- run 2, the same command with the runner's stdout kept OUTSIDE the repo
  (`gate-run2.log`, copied in afterwards): **GREEN** — record
  `Docs/qa/fix-0915/gate/20260915-130402/`: verify:all PASS in 424 s, the
  e2e log `Running 207 tests using 1 worker` (`e2e-head-run2.txt`), 117 / 0 /
  90 in 5.7 min, unit 825 / 825, and the seven `verify:wNN` checks all PASS.

**Cheap checks on this tree.** The static half IS them — lint · typecheck ·
guard-static · unit · build · static e2e at one worker — all inside
`verify:all`, PASS.
