/**
 * On-demand generation (INT-10, decisions.md D-INT-G).
 *
 * F1 IS BATCH IN LIVE MODE, NOT A STREAM. The proxy has no stream endpoint, so
 * there is no token feed to render: the run is queued, polled, and its drafts
 * arrive whole. Faking a stream from a finished result would be theatre, and
 * the one thing this screen must not do is perform work it did not do.
 *
 * THE LOCAL RUN LEDGER IS RETIRED (INT-12, D-INT-G amended). It existed only
 * because nothing server-side indexed an org's runs, so a reload lost every
 * result the user had just produced. The proposals ledger now does index them
 * — every draft becomes a proposal stamped with its `runId` — so "recent runs"
 * is a real, shared, cross-device fact instead of a per-browser cache, and it
 * includes runs this frontend never started. `readLedger` and friends are gone
 * with it; `src/data/proposals.ts` is where run history lives now.
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
import type { CalendarEvent, Tone, ToneLanguage } from '@/data/types'

export type { ApiPlan as GenerationPlan } from '@/api/types'
/**
 * The run shape screens read, re-exported from the seam. Features may not
 * import `@/api/*` — the boundary is structural, not stylistic — and a run is
 * one of the few upstream shapes that passes through unadapted, because the
 * screen renders exactly what the platform reported.
 */
export type { ApiRun as GenerationRun } from '@/api/types'

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

/**
 * Our tone to the inline object a run carries (used, never stored upstream).
 *
 * HSN-03: `length` travels per Hasan's 2026-08-28 reference envelope, sourced
 * from the tone and OMITTED when the tone has none — a pre-HSN-03 tone never
 * gets a value invented for it. (That closes HSN-01's divergence #1.)
 */
export function toRunTone(tone: Tone): ApiRunTone {
  return {
    id: tone.id,
    name: tone.name,
    description: tone.description,
    rules: joinRules(tone.rules),
    ...(tone.example ? { example: tone.example } : {}),
    ...(tone.length ? { length: tone.length } : {}),
  }
}

/**
 * A tone the generate body can carry (CUT-0831): its language is its OWN,
 * set in Settings — there is no page-level default and no fallback anywhere
 * on the wire. A tone without one is not selectable on the Generate page.
 */
export type RunnableTone = Tone & { language: ToneLanguage }

export function isRunnableTone(tone: Tone): tone is RunnableTone {
  return tone.language !== undefined
}

export interface GenerateInput {
  tones: RunnableTone[]
  plan: PostsGenerateRequest['plan']
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
          // CUT-0831: the tone's OWN language, nothing else — the page picker
          // and its `??` fallback are gone; a tone without a language never
          // reaches this body. The reference envelope shows no `language` —
          // HSN-01 divergence #2 stays recorded; Hasan consumes it later.
          language: tone.language,
        })),
        plan: input.plan,
        slot: {
          ref: `f1-${now.getTime()}`,
          dateISO: now.toISOString().slice(0, 10),
          time: now.toTimeString().slice(0, 5),
          timezone: schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
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
        return { ok: true, runId: receipt.runId }
      } catch (error) {
        if (isApiError(error)) {
          return {
            ok: false,
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldDetails,
            retryAfterSeconds: error.retryAfterSeconds,
            // THE GATE IS UX, NOT SECURITY (ORDER ONB-0827, D-ONB-D). The
            // server is still the authority, so a refusal that slipped past
            // the client's readiness check has to arrive with the handle a
            // bug report needs — the Phase-0 probe's zero-tone 400 carried a
            // requestId and no field details, which is exactly the shape that
            // is unactionable without it.
            requestId: error.requestId,
          }
        }
        throw error
      }
    },

    /**
     * Read a run back. `null` means the id is gone (404); `undefined` means
     * this read failed but the id may still be good, so a poll keeps trying
     * rather than discarding the user's work.
     */
    async readRun(runId: string): Promise<ApiRun | null | undefined> {
      if (!live || !orgId) return undefined
      try {
        return await api<ApiRun>('GET', `/orgs/${orgId}/alphastudio/posts/runs/${runId}`)
      } catch (error) {
        if (isApiError(error) && error.code === 'not_found') return null
        return undefined
      }
    },
  }
}
