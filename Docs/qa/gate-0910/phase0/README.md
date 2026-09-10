# GATE-0910 Phase 0 — measure and classify (2026-09-10)

The record of ORDER GATE-0910 §2, on `feat/gate-0910` off `main` at
`4d98942`. Nothing here changes the gate's law (§0); it measures where the
time goes and what a faster runner must respect. Report-and-stop at the end
of Phase 0; the build waits for the founder's word.

| File                                     | What it is                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `live-spec-lanes.md`                     | §2.1 — the 21 live specs: durations from the HSN-0910 gate's two rounds, spend, shared state, fresh-or-reads, the proposed lane, and what a parallel lane must respect.         |
| `verify-conditions.md`                   | §2.2 — the seven verify scripts: the six suite runs they all repeat (19 min today), their 33 own assertions over the tree (kept), their manual checklists (kept).               |
| `preview-probe.md`                       | §2.3 — `vite preview` versus the dev server: NOT identical for live-auth test 3, twice; the cause in the app (item 59); what §3.3 must know (the tripwire is blind on preview). |
| `preview-probe.sh`                       | The probe runner: builds nothing (run `pnpm build` first), owns the preview on 5199 by pid, refuses a busy port, holds the host awake, redacts the log.                         |
| `preview-probe-run{1,2}.log`             | The two preview runs, full Playwright output, the API host redacted.                                                                                                            |
| `run{1,2}-error-context.md`              | The DOM at the failure, both runs — N3 "Name your workspace", not the Dashboard.                                                                                                |
| `dev-control.log`                        | The dev-server control of the same file, 7/7.                                                                                                                                   |
| `preview-server.log`, `keep-awake-*.log` | The preview process's own output (exit 143 = stopped by the runner) and the keep-awake holds.                                                                                   |

Zero spend: every run minted its own QA orgs; `LIVE_MEDIA` unset; the funded
org untouched. `E2E_API_ENV=dev` on every Playwright invocation.
