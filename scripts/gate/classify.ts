/**
 * The classification rule of a live file's result (ORDER GATE-0910 §3.5;
 * the two-round law of `Docs/api/live-red-2026-08-23.md`).
 *
 * A red is never waived. It is one of three things, and the runner can name
 * only the first by itself:
 * - **network-lost** — the socket, not the product: the file is re-run solo
 *   and must be green 3/3 to count;
 * - **spec defect** or **code regression** — a human names it, after the
 *   evidence and before any fix;
 * - **environmental** — the API's weather on a surface the change never
 *   touched, named by a human the same way.
 * Until a human names it, a red is UNCLASSIFIED and the gate is red.
 */
import type { E2eSummary } from '../verify-lib'

export type Classification = 'green' | 'network-lost' | 'unclassified' | 'skipped-all'

/** The signatures of a lost connection, in Playwright's and Node's own words. */
export const NETWORK_LOST =
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|EPIPE|socket hang up|net::ERR_|API fleet never warmed|API cold|apiRequestContext\.\w+: (read|connect|write) E[A-Z]+/i

export function classifyResult(
  summary: E2eSummary | null,
  exit: number,
  raw: string,
): Classification {
  if (summary && summary.failed === 0 && exit === 0) {
    return summary.passed === 0 && summary.skipped > 0 ? 'skipped-all' : 'green'
  }
  const errors = (summary?.tests ?? []).map((t) => t.error ?? '').join('\n') + '\n' + raw
  return NETWORK_LOST.test(errors) ? 'network-lost' : 'unclassified'
}

/** The record never carries the API host or a presigned url (the repo is public). */
export function redact(text: string, host: string | undefined): string {
  let out = text
  if (host) out = out.split(host).join('<api-host>')
  out = out.replace(/https?:\/\/[^\s"'<>]*amazonaws[^\s"'<>]*/g, '<redacted url>')
  out = out.replace(/https?:\/\/[^\s"'<>]*[?&]X-Amz-[^\s"'<>]*/g, '<redacted url>')
  return out
}
