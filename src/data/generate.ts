/**
 * On-demand generation (INT-10, decisions.md D-INT-G).
 *
 * F1 IS BATCH IN LIVE MODE, NOT A STREAM. The proxy has no stream endpoint, so
 * there is no token feed to render: the run is queued, polled, and its drafts
 * arrive whole. Faking a stream from a finished result would be theatre, and
 * the one thing this screen must not do is perform work it did not do.
 *
 * THE RUN LEDGER exists because the wire has no list-runs endpoint - only
 * `GET posts/runs/:runId`. Without a local record of the ids it minted, a
 * reload loses every result the user just produced. So the ids (and the
 * `proposalId` each draft carries, against the day proposals are proxied) are
 * kept per org in localStorage. It is deliberately not a history: it holds ids,
 * not content, and an id the server answers 404 for is dropped on sight.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type {
  ApiPostDraftContent,
  ApiRun,
  ApiRunTone,
  PostsGenerateRequest,
  RunReceipt,
} from '@/api/types'
import { joinRules } from '@/data/adapters/brand-adapter'
import type { AuthActionResult } from '@/data/auth'
import { useLiveWorkingOrgId, useSchedule } from '@/data/provider'
import type { CalendarEvent, Tone } from '@/data/types'

export type { ApiPlan as GenerationPlan } from '@/api/types'
/**
 * The run shape screens read, re-exported from the seam. Features may not
 * import `@/api/*` — the boundary is structural, not stylistic — and a run is
 * one of the few upstream shapes that passes through unadapted, because the
 * screen renders exactly what the platform reported.
 */
export type { ApiRun as GenerationRun } from '@/api/types'

/** The upstream cap: `tones.length x perTone` may not exceed this. */
export const MAX_FANOUT = 6

/** One draft, flattened out of the observed run shape for a screen to render. */
export interface LiveDraft {
  runId: string
  index: number
  content: string
  toneId?: string
  rationale?: string
  /** Guardrail findings - rendered inline, never hidden (design law). */
  flags: unknown[]
  /** Sources. Upstream terms require these stay visible. */
  attributions: unknown[]
  /** Kept for the day proposals are proxied; never rendered. */
  proposalId?: string
}

export interface RunLedgerEntry {
  runId: string
  at: string
  proposalIds: string[]
}

const LEDGER_LIMIT = 20
const ledgerKey = (orgId: string) => `ab-live-runs-${orgId}`

export function readLedger(orgId: string | null): RunLedgerEntry[] {
  if (!orgId) return []
  try {
    const raw = window.localStorage.getItem(ledgerKey(orgId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is RunLedgerEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RunLedgerEntry).runId === 'string',
    )
  } catch {
    // A corrupt ledger is not worth an error state - it is a cache of ids.
    return []
  }
}

export function writeLedger(orgId: string | null, entries: RunLedgerEntry[]): void {
  if (!orgId) return
  try {
    window.localStorage.setItem(ledgerKey(orgId), JSON.stringify(entries.slice(0, LEDGER_LIMIT)))
  } catch {
    // Storage full or blocked: the run still works, it just is not re-pullable.
  }
}

/** Newest first, and never twice. */
export function rememberRun(orgId: string | null, runId: string): RunLedgerEntry[] {
  const existing = readLedger(orgId).filter((entry) => entry.runId !== runId)
  const next = [{ runId, at: new Date().toISOString(), proposalIds: [] }, ...existing]
  writeLedger(orgId, next)
  return next
}

export function forgetRun(orgId: string | null, runId: string): RunLedgerEntry[] {
  const next = readLedger(orgId).filter((entry) => entry.runId !== runId)
  writeLedger(orgId, next)
  return next
}

/** The observed output shape to what a card renders (alphastudio-shapes.md). */
export function draftsFromRun(run: ApiRun): LiveDraft[] {
  return (run.outputs ?? []).map((output) => {
    // `toneId` and `rationale` live INSIDE `content` - reading them off the
    // output would silently yield undefined forever (D-INT-H).
    const content = (output.content ?? {}) as ApiPostDraftContent
    return {
      runId: run.runId,
      index: output.index,
      content: typeof content.content === 'string' ? content.content : '',
      toneId: content.toneId,
      rationale: content.rationale,
      flags: output.flags ?? [],
      attributions: output.attributions ?? [],
      proposalId: output.proposalId,
    }
  })
}

/** A run is terminal when it will not change again. Runs, NOT media jobs. */
export function isRunTerminal(run: ApiRun | null): boolean {
  return run?.status === 'completed' || run?.status === 'failed'
}

/** Our tone to the inline object a run carries (used, never stored upstream). */
export function toRunTone(tone: Tone): ApiRunTone {
  return {
    id: tone.id,
    name: tone.name,
    description: tone.description,
    rules: joinRules(tone.rules),
    ...(tone.example ? { example: tone.example } : {}),
  }
}

export interface GenerateInput {
  tones: Tone[]
  plan: PostsGenerateRequest['plan']
  language: 'en' | 'ar'
  perTone: 1 | 2
  /** An occasion from the org's own calendar; its rules outrank every other. */
  occasion?: CalendarEvent
}

type Failure = Extract<AuthActionResult, { ok: false }>

export function useGenerateActions() {
  const orgId = useLiveWorkingOrgId()
  const schedule = useSchedule()
  const live = isLiveMode()

  return {
    orgId,

    /**
     * Queue a run. Answers `202 { runId }`; the drafts are pulled separately.
     *
     * `slot` is REQUIRED - a body without it comes back 400, which the smoke
     * run proved and api.md does not say. It is built from NOW in the
     * schedule's timezone, because that is the clock the org's posting day is
     * measured in; the browser's zone is the fallback before a schedule exists.
     */
    async generate(input: GenerateInput): Promise<{ ok: true; runId: string } | Failure> {
      const now = new Date()
      const body: PostsGenerateRequest = {
        tones: input.tones.map((tone) => ({
          ...toRunTone(tone),
          language: input.language,
        })),
        plan: input.plan,
        slot: {
          ref: `f1-${now.getTime()}`,
          dateISO: now.toISOString().slice(0, 10),
          time: now.toTimeString().slice(0, 5),
          timezone: schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        options: { perTone: input.perTone },
        ...(input.occasion
          ? {
              attachedEvent: {
                title: input.occasion.name,
                dateISO: input.occasion.date,
                rules: input.occasion.rules ?? [],
              },
            }
          : {}),
      }
      try {
        const receipt = await api<RunReceipt>('POST', `/orgs/${orgId}/alphastudio/posts/generate`, {
          body,
        })
        rememberRun(orgId, receipt.runId)
        return { ok: true, runId: receipt.runId }
      } catch (error) {
        if (isApiError(error)) {
          return {
            ok: false,
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldDetails,
            retryAfterSeconds: error.retryAfterSeconds,
          }
        }
        throw error
      }
    },

    /**
     * Read a run back. `null` means the id is gone (404) and the ledger has
     * dropped it; `undefined` means this read failed but the id may still be
     * good, so a poll keeps trying rather than discarding the user's work.
     */
    async readRun(runId: string): Promise<ApiRun | null | undefined> {
      if (!live || !orgId) return undefined
      try {
        return await api<ApiRun>('GET', `/orgs/${orgId}/alphastudio/posts/runs/${runId}`)
      } catch (error) {
        if (isApiError(error) && error.code === 'not_found') {
          forgetRun(orgId, runId)
          return null
        }
        return undefined
      }
    },
  }
}
