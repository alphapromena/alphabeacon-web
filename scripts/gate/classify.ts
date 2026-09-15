/**
 * The classification rule of a live file's result (ORDER GATE-0910 §3.5;
 * the two-round law of `Docs/api/live-red-2026-08-23.md`).
 *
 * A red is never waived. It is one of these, and the runner can name only
 * the first two by itself:
 * - **network-lost** — the socket, not the product;
 * - **error-page** — the API failed the screen and the app said so in its own
 *   words ("Something went wrong", "We couldn't load this screen"), so the
 *   test timed out on a control that never rendered. It is the same class of
 *   evidence as a lost socket: the product did not misbehave, the service
 *   did. Found on 2026-09-13, when `live-knowledge` timed out behind that
 *   screen in one round of four and the runner called it UNCLASSIFIED;
 * - **spec defect**, **code regression** or **environmental** — a human names
 *   these, after the evidence and before any fix.
 *
 * Both of the runner's own classes are RE-RUN solo and must come back green
 * 3/3 to count (`isRerunnable`); everything else stays UNCLASSIFIED, and the
 * gate is red, until a human names it.
 */
import type { E2eSummary, E2eTest } from '../verify-lib'

export type Classification =
  'green' | 'network-lost' | 'error-page' | 'unclassified' | 'skipped-all'

/** The signatures of a lost connection, in Playwright's and Node's own words. */
export const NETWORK_LOST =
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|EPIPE|socket hang up|net::ERR_|API fleet never warmed|API cold|apiRequestContext\.\w+: (read|connect|write) E[A-Z]+/i

/**
 * The app's own failure copy (`src/lib/messages.ts`, `components/ab/error-state.tsx`).
 * Matched against the DOM the runner keeps at a failure, never against a
 * test's assertion text — a spec that asserts one of these strings on purpose
 * fails on its own terms and must not be re-run as weather.
 */
export const APP_ERROR_PAGE =
  /Something went wrong|couldn['’]?t load this screen|Balance could not be read|could not be reached/i

export function classifyResult(
  summary: E2eSummary | null,
  exit: number,
  raw: string,
  errorContext = '',
): Classification {
  if (summary && summary.failed === 0 && exit === 0) {
    return summary.passed === 0 && summary.skipped > 0 ? 'skipped-all' : 'green'
  }
  const errors = `${(summary?.tests ?? []).map((t) => t.error ?? '').join('\n')}\n${raw}`
  if (NETWORK_LOST.test(errors)) return 'network-lost'
  if (errorContext && APP_ERROR_PAGE.test(errorContext)) return 'error-page'
  return 'unclassified'
}

/** The runner re-runs these solo, 3/3, and waives neither. */
export function isRerunnable(classification: Classification): boolean {
  return classification === 'network-lost' || classification === 'error-page'
}

/**
 * The round's verdict (§3.5): green when every file is green, all-skipped, or
 * one of the runner's own re-run classes — which the runner has already
 * downgraded to `unclassified` unless its re-runs came back green 3/3.
 *
 * TEST-0915 proof D found this forgave `network-lost` only: an `error-page`
 * file re-run 3/3 green still read RED, half-wiring the 2026-09-13 rule. Both
 * re-run classes count now, through the one predicate that names them.
 */
export function gateRoundGreen(classifications: Classification[]): boolean {
  return (
    classifications.length > 0 &&
    classifications.every((c) => c === 'green' || c === 'skipped-all' || isRerunnable(c))
  )
}

/**
 * What a skipped test's row says in the record (the founder's ruling,
 * 2026-09-13). Playwright marks every test after a failure in a `serial`
 * file as skipped, with no annotation — printing those as skips with "no
 * reason" undercounts what a red costs. A deliberate skip carries its own
 * reason and keeps it.
 */
export function skipLabel(test: Pick<E2eTest, 'skipReason'>, fileHasFailure: boolean): string {
  const reason = test.skipReason?.trim()
  if (reason) return reason
  return fileHasFailure
    ? 'not run, an earlier test in this file failed'
    : 'skipped, no reason given'
}

/** The record never carries the API host or a presigned url (the repo is public). */
export function redact(text: string, host: string | undefined): string {
  let out = text
  if (host) out = out.split(host).join('<api-host>')
  out = out.replace(/https?:\/\/[^\s"'<>]*amazonaws[^\s"'<>]*/g, '<redacted url>')
  out = out.replace(/https?:\/\/[^\s"'<>]*[?&]X-Amz-[^\s"'<>]*/g, '<redacted url>')
  return out
}
