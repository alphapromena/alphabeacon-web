/**
 * The two lanes of a live round (ORDER GATE-0910 §3.2, the founder's rulings
 * 2026-09-10 on the Phase 0 table, `Docs/qa/gate-0910/phase0/live-spec-lanes.md`).
 *
 * Lane A runs in parallel: every file mints its own QA org(s) and touches
 * nothing outside them — own-org writes included, which is the fan-out
 * rule's premise. Lane B runs serially, after A: the file spends, writes the
 * one funded org, or creates something outside any org. Billing stays in B
 * (a real Stripe test-mode session per run); wallet is in A on its measured
 * behaviour (its own fresh org's wallet and usage, nothing shared).
 *
 * Every `e2e/live-*.spec.ts` must appear here exactly once; `lanes.test.ts`
 * proves it against the disk, so a new live file cannot slip into a round
 * unlaned.
 */
export type Lane = 'A' | 'B'

export interface LanedSpec {
  /** Basename without `.spec.ts`. */
  file: string
  lane: Lane
  reason: string
}

export const LANES: LanedSpec[] = [
  { file: 'live-auth', lane: 'A', reason: 'two fresh orgs plus an invitee; nothing shared' },
  {
    file: 'live-auth-401',
    lane: 'A',
    reason: 'one fresh org; three dead-token walks, reads only (ORDER-FIX-0915 item 75)',
  },
  { file: 'live-brand-kit', lane: 'A', reason: 'one fresh org; its PDF deleted in-test' },
  { file: 'live-brand', lane: 'A', reason: 'one fresh org; tone, voice, source, topic, schedule' },
  {
    file: 'live-country',
    lane: 'A',
    reason: 'one fresh org; two metered holiday lookups, no wallet movement',
  },
  { file: 'live-invite-org', lane: 'A', reason: 'two fresh orgs; invites between them' },
  {
    file: 'live-knowledge',
    lane: 'A',
    reason: 'one fresh org; RAG ingestion of its own paste and file',
  },
  {
    file: 'live-media-capabilities',
    lane: 'A',
    reason: 'one fresh org; every job refused at 402/400, wallet stays zero',
  },
  { file: 'live-media-upload', lane: 'A', reason: 'one fresh org; its uploads removed in-test' },
  { file: 'live-notifications', lane: 'A', reason: 'one fresh org; read-all on an empty inbox' },
  {
    file: 'live-proposals',
    lane: 'A',
    reason: 'one fresh org; tests 2–5 skip on a zero wallet unless --funded',
  },
  { file: 'live-schedule-repair', lane: 'A', reason: 'one fresh org by direct API calls' },
  { file: 'live-scheduling', lane: 'A', reason: 'one fresh org; tone and schedule' },
  { file: 'live-studio', lane: 'A', reason: 'one fresh org; reads, a render only under --media' },
  { file: 'live-team', lane: 'A', reason: 'two fresh orgs plus an invitee' },
  {
    file: 'live-video-duration',
    lane: 'A',
    reason: 'one fresh org; every job refused, wallet stays zero',
  },
  {
    file: 'live-wallet',
    lane: 'A',
    reason: "its own fresh org's wallet and usage — moved to A on the founder's word",
  },
  {
    file: 'live-billing',
    lane: 'B',
    reason: "a real Stripe test-mode Checkout Session per run — stays in B on the founder's word",
  },
  {
    file: 'live-brand-rules',
    lane: 'B',
    reason: 'test 5 is a paid tone preview on the funded org',
  },
  {
    file: 'live-create-visual',
    lane: 'B',
    reason: 'under --media: a text run and a render on the funded org',
  },
  { file: 'live-generate', lane: 'B', reason: 'one balanced text run on the funded org' },
  {
    file: 'live-onboarding',
    lane: 'B',
    reason: 'test 6 is one balanced text run on the funded org',
  },
]

export function laneOf(file: string): LanedSpec | undefined {
  const base = file.replace(/^.*[\\/]/, '').replace(/\.spec\.ts$/, '')
  return LANES.find((l) => l.file === base)
}

export function filesInLane(lane: Lane): string[] {
  return LANES.filter((l) => l.lane === lane).map((l) => `e2e/${l.file}.spec.ts`)
}
