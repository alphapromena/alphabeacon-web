/**
 * How long a live wait should be, derived rather than guessed.
 *
 * Every number here comes out of `Docs/api/live-red-2026-08-23.md`, which
 * measured the deployed API twice — 118 operations on 2026-08-19 and again on
 * 2026-08-23 — and found the contract intact and the latency tail four times
 * worse: p90 1,661 ms → 9,872 ms, and calls over five seconds 1-in-118 →
 * 31-in-118. `e2e/global-setup.ts` warms the fleet and holds a heartbeat so a
 * run does not START cold; these constants are what the waits need once it is
 * accepted that a single request can still be re-provisioned mid-run.
 *
 * Three rungs, and a wait picks the one that matches the work it covers:
 *
 * | rung            | covers                                    | derivation                                    |
 * | --------------- | ----------------------------------------- | --------------------------------------------- |
 * | `ONE_CALL`      | one request — a save, a toast             | warm ~1 s + one cold start (measured 14 s max) |
 * | `SCREEN_SYNC`   | a screen's graft after a reload or login   | two such rounds — `live-sync.ts` fans out in   |
 * |                 |                                            | `Promise.all` groups, and concurrent requests  |
 * |                 |                                            | do not share a container                       |
 * | `AFTER_COUNTRY` | anything downstream of the wizard Finish   | the burst measured 20.3–22.3 s door to door,   |
 * |                 |                                            | of which `PUT /orgs/:id/country` is 12–15 s    |
 *
 * **These are clocks, not expectations.** Nothing here changes what a test
 * asserts or which element it looks for. A wait that fires means the API did
 * not answer in a time the measurements say it should — which is still a
 * failure worth having.
 *
 * Scope: used by the three files whose waits were re-derived on
 * `fix/live-suite-warmup` (`live-brand`, `live-brand-rules`, `live-scheduling`).
 * Every other wait in the suite is untouched, and the Playwright default is
 * unchanged. If a fourth file needs a rung, that is a decision to take on
 * purpose, not by importing this file.
 */

/** One live round-trip that may land on a cold container. */
export const ONE_CALL = 20_000

/** A screen's whole sync: several concurrent groups, each able to be cold. */
export const SCREEN_SYNC = 40_000

/** Downstream of `PUT /orgs/:id/country` — the ~10 s external holiday lookup. */
export const AFTER_COUNTRY = 45_000
