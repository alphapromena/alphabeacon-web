# M-BIL-1 on production — the record (2026-09-03)

The founder's billing manual gate (open-item 45, ORDER M-BIL-1/auto), run ONCE
by a headed Chromium session on `https://1.malaky.ai` against the deployed
sandbox API, Stripe in TEST mode (card 4242, nothing charged). The narrative
with every request-id and timing is `.agent/sessions.md`, entry
**"2026-09-03 13:20 — M-BIL-1 on production"**; the shapes a payment reveals
are in `Docs/api/billing-shapes.md` (the M-BIL-1 addendum).

This folder lives under `Docs/qa/` on the founder's word: it was first written
under `test-results/m-bil-1/`, which is Playwright's outputDir, and the very
next `pnpm e2e` cleaned it (state.md trap 24). **Records never live under a
runner's output directory.**

| File                                           | What it is                                                                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `report.json`                                  | The runner's own record of steps 1–8: every rid, status, body and timing. Verbatim as printed at 13:04Z, re-saved after the wipe; the consumed Stripe session id truncated before commit (the one edit, noted inside).         |
| `run-m-bil-1.mjs`                              | The one-off runner exactly as it ran (13:01–13:04Z). Not a spec — the suite's "never drive the Stripe page" stands.                                                                                                             |
| `run.log`                                      | The runner's log, PARTIAL (reconstructed from the lines read before the wipe).                                                                                                                                                 |
| `live-funded-run2.log`                         | Step 9's first funded live run, serial: `live-generate` 2/2 (the balanced run executed on org 1813 through `skipUnlessFunded`), `live-wallet` 4/4 — "6 passed (2.3m)".                                                          |
| `recover-m-bil-1.mjs` · `recovery.json`        | The READ-ONLY recovery at 13:15Z after the wipe: sign-ins and GETs only, no Stripe page, nothing that can bill. Its reads carry NEW rids; the run's own are in `report.json`.                                                     |
| `recovered-*.png`                              | Five frames of the PERSISTED state, re-taken by the recovery: org 1813's dashboard chip, `/billing` (Manage billing + the invoice row), `/billing/balance`, the bell's "Wallet credited"; org 1814's cancelled deep link.        |
| `recovery-api-calls.json` · `network-recovery.api.har` | The recovery's API traffic with request-ids. Scrubbed before commit: `/auth/` bodies and every `authorization`/`cookie` value redacted; the HAR keeps API-origin entries only (the raw 10 MB HAR was never committed). |

> **THESE FIVE FRAMES PREDATE THE DARK THEME, AND THEY STAY THAT WAY**
> (noted 2026-09-14, ORDER THEME-0913 close-out). They show the LIGHT palette
> the product wore on 2026-09-03, because that is what it wore when this gate
> ran. They are **evidence of a payment event**, not a design reference: the
> orgs are real (1813, 1814), Stripe was live in test mode, and this README's
> own rule is that the Stripe pages are driven once and nothing that can bill
> is retried.
>
> So they are **not re-taken**. Re-shooting them in the new theme would produce
> pictures of a run that never happened, which is worse than a stale record —
> it would be a false one. A record is a record of its moment.
>
> Regenerating the *screens* (not the payment) would still need a live run
> against real orgs, which this order explicitly excludes. Filed as
> **open-items 69** so the decision is visible rather than assumed.

**Lost for good** (deleted by the step-9 `pnpm e2e` before anyone could copy
them): the run's eleven frames — the Stripe Checkout page (both orgs), the
Stripe portal, the confirming and active success states, the `/billing` states
in between — and its two HARs (`network-org1.har` 66 MB, `network-org2.har`
21 MB) with `api-calls.json`. No step was re-driven to replace them: the
Stripe pages are driven once, and nothing that can bill is retried.

The funded QA org's owner credentials are NOT here and never will be: they are
the QA-creds store (`QA_FUNDED_EMAIL` / `QA_FUNDED_PASSWORD`, User-scope
environment variables on the dev machine — `.agent/stack.md`).
