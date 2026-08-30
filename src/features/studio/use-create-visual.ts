/**
 * Create visual — the modal's state machine (HSN-02, decisions.md
 * 2026-08-30; the founder's sync with Hasan, 2026-08-28).
 *
 * Kept apart from the dialog that draws it (component files export only
 * components) and shaped by four laws that are not negotiable:
 *
 * - **One post per call.** The subject is one draft, and the body comes from
 *   `buildPostVisualRequest`, whose type physically cannot carry a second post.
 * - **No retry, ever.** A failure lands in `failed` and stays there until the
 *   user presses the button that returns to the form; only a fresh press of
 *   Create sends again. The `posts[]` path has been seen to create AND BILL a
 *   job and then answer 502 (PROBE-INT13), so every failure is worded as
 *   "unconfirmed — a retry may bill again", never as "nothing ran".
 * - **Single flight.** `submitting` disables the control, and a result that
 *   lands after the dialog was closed is dropped (`epoch`), so a closed dialog
 *   can never flip a later one into a state it did not earn.
 * - **The kind is chosen, not defaulted.** Images and videos are priced
 *   differently, so `kind` starts empty, and the form resets on close so the
 *   next visual is chosen explicitly too.
 *
 * Polling is the Studio's own (`useJobPolling`) — one machinery, not a second
 * poller. In static mode the request resolves through the existing Studio
 * simulation (`media/start` → `media/succeed`) as a STANDALONE job: clearly
 * simulated, zero network, and attached to nothing — this order attaches no
 * visual to any draft; the surfaces that could are reported, untouched.
 */
import { useEffect, useRef, useState } from 'react'
import {
  useBilling,
  useCreditBalance,
  useDataDispatch,
  useLiveMode,
  useStudioModels,
} from '@/data/provider'
import {
  IMG_STYLES,
  MAX_VISUAL_GUIDANCE,
  isJobTerminal,
  useStudioActions,
  type MediaJob,
  type MediaPlan,
  type PostVisualOptions,
  type VisualKind,
} from '@/data/studio'
import type { Tone } from '@/data/types'
import { useWalletActions } from '@/data/wallet'
import { errorReference } from '@/lib/error-reference'
import { MESSAGES } from '@/lib/messages'
import { COMPOSER_RUN_MS, TIER_RANK } from './use-composer'
import { useJobPolling } from './use-job-poll'

/** What a card hands the dialog: the draft, by reference, plus its tone id. */
export interface VisualSubject {
  /** `posts[0].ref` — the proposal id from Today, the run output otherwise. */
  ref: string
  content: string
  toneId?: string
}

/** The form as typed. `kind` is `''` until the user chooses — no default, by law. */
export interface VisualForm {
  kind: '' | VisualKind
  plan: MediaPlan
  imgStyle: string
  text: boolean
  logo: boolean
  guidance: string[]
}

export const EMPTY_VISUAL_FORM: VisualForm = {
  kind: '',
  plan: 'balanced',
  imgStyle: IMG_STYLES[0],
  text: true,
  logo: true,
  guidance: [],
}

export type VisualPhase = 'form' | 'submitting' | 'running' | 'done' | 'failed'

/** The one thing the form can get wrong before the wire sees it. */
export function validateVisualForm(form: VisualForm): string | null {
  if (form.kind !== 'image' && form.kind !== 'video') return MESSAGES.errors.visualKindRequired
  return null
}

function withReference(base: string, failure: { requestId?: string; code?: string }): string {
  const reference = errorReference(failure)
  return reference ? `${base} (${reference})` : base
}

/** The honest upstream reason, when the job carried one. */
function describeJobFailure(job: MediaJob): string {
  const upstream = job.error
  const detail =
    typeof upstream === 'string'
      ? upstream
      : upstream && typeof upstream === 'object' && 'message' in upstream
        ? String((upstream as { message: unknown }).message)
        : upstream
          ? JSON.stringify(upstream)
          : ''
  return detail
    ? `${MESSAGES.errors.visualRenderFailed} ${detail}`
    : MESSAGES.errors.visualRenderFailed
}

export function useCreateVisual({ subject, tone }: { subject: VisualSubject | null; tone?: Tone }) {
  const live = useLiveMode()
  const studio = useStudioActions()
  const walletActions = useWalletActions()
  const dispatch = useDataDispatch()
  const models = useStudioModels()
  const balance = useCreditBalance()
  const billing = useBilling()

  const [form, setForm] = useState<VisualForm>(EMPTY_VISUAL_FORM)
  const [phase, setPhase] = useState<VisualPhase>('form')
  const [error, setError] = useState<string | null>(null)
  const [shortBalance, setShortBalance] = useState(false)
  const [job, setJob] = useState<MediaJob | null>(null)
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const [simulatedAssetId, setSimulatedAssetId] = useState<string | null>(null)
  const epoch = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // The Studio's poller, watching exactly one job.
  const { timedOut } = useJobPolling(job ? [job] : null, async () => {
    if (!job) return []
    const mine = epoch.current
    const full = await studio.readJob(job.jobId)
    // A failed read is not a settled job: keep watching the one we have.
    if (!full || mine !== epoch.current) return [job]
    setJob(full)
    return [full]
  })

  // The job settled: mint what it made — a url per asset, only now — or say
  // why it failed, in the platform's own words when it gave any.
  useEffect(() => {
    if (!job || !isJobTerminal(job)) return
    if (/succeeded/i.test(job.status)) {
      const mine = epoch.current
      void (async () => {
        for (const asset of job.assets ?? []) {
          const url = asset.url ?? (await studio.assetUrl(asset.assetId))
          if (url && mine === epoch.current) {
            setAssetUrls((current) => ({ ...current, [asset.assetId]: url }))
          }
        }
      })()
      setPhase('done')
      return
    }
    setPhase('failed')
    setError(describeJobFailure(job))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when it settles
  }, [job?.jobId, job?.status])

  const patch = (changes: Partial<VisualForm>) => setForm((current) => ({ ...current, ...changes }))

  const addGuidance = () =>
    setForm((current) =>
      current.guidance.length >= MAX_VISUAL_GUIDANCE
        ? current
        : { ...current, guidance: [...current.guidance, ''] },
    )

  const setGuidance = (index: number, value: string) =>
    setForm((current) => ({
      ...current,
      guidance: current.guidance.map((entry, at) => (at === index ? value : entry)),
    }))

  const removeGuidance = (index: number) =>
    setForm((current) => ({
      ...current,
      guidance: current.guidance.filter((_, at) => at !== index),
    }))

  /**
   * Static mode: the existing Studio simulation, standalone. The same three
   * refusals the composer makes (no model of that kind, a failed payment, a
   * short balance) are made here, in the same order, so the demo never
   * reserves credits it does not have.
   */
  function simulate(content: string, options: PostVisualOptions) {
    const ofKind = models.filter((entry) => entry.kind === options.kind)
    const model =
      ofKind.find((entry) => TIER_RANK[entry.tier] <= TIER_RANK[billing.planId]) ?? ofKind[0]
    if (!model) {
      setPhase('failed')
      setError(MESSAGES.errors.generic)
      return
    }
    if (billing.status === 'past_due') {
      setPhase('failed')
      setError(MESSAGES.errors.generatePaused)
      return
    }
    if (model.credits > balance) {
      setPhase('failed')
      setError(MESSAGES.errors.visualCreditsShort)
      return
    }
    const jobId = `job_visual_${Date.now()}`
    const guidance = options.guidance.map((entry) => entry.trim()).filter(Boolean)
    dispatch({
      type: 'media/start',
      // Standalone on purpose: this order attaches nothing to the draft.
      draftId: '',
      jobId,
      modelId: model.id,
      prompt: content,
      params: {
        capability: 'social-posts.media',
        plan: options.plan,
        imgStyle: options.imgStyle,
        text: options.text,
        logo: options.logo,
        ...(guidance.length > 0 ? { guidance: guidance.join(' | ') } : {}),
      },
    })
    setPhase('running')
    const mine = epoch.current
    timer.current = window.setTimeout(() => {
      const assetId = `asset_${jobId}`
      // The job finishes whether or not this dialog is still open — "it keeps
      // going if you close this" is true of the demo too (HSN-FINAL gate).
      // Only the dialog's OWN state is gated on the epoch.
      dispatch({ type: 'media/succeed', jobId, assetId })
      if (mine !== epoch.current) return
      setSimulatedAssetId(assetId)
      setPhase('done')
    }, COMPOSER_RUN_MS)
  }

  async function submit() {
    if (!subject || !tone || phase === 'submitting' || phase === 'running') return
    const invalid = validateVisualForm(form)
    if (invalid) {
      setError(invalid)
      return
    }
    const options: PostVisualOptions = {
      kind: form.kind as VisualKind,
      plan: form.plan,
      imgStyle: form.imgStyle,
      text: form.text,
      logo: form.logo,
      guidance: form.guidance,
    }
    setError(null)
    setShortBalance(false)
    if (!live) {
      simulate(subject.content, options)
      return
    }
    setPhase('submitting')
    const mine = epoch.current
    const result = await studio.createPostVisual(
      { ref: subject.ref, content: subject.content, tone },
      options,
    )
    if (mine !== epoch.current) return
    if (!result.ok) {
      setPhase('failed')
      if (result.code === 'wallet_insufficient') {
        // Refused at intake, before anything ran — the one failure that did
        // not bill. The form is kept: losing it would punish the user for the
        // platform's accounting.
        setShortBalance(true)
        void walletActions.refresh()
        return
      }
      setError(
        result.code === 'rate_limited'
          ? `${MESSAGES.errors.rateLimited} ${result.retryAfterSeconds ?? 60}s.`
          : withReference(
              result.code === 'bad_gateway' || result.code === 'unconfirmed_receipt'
                ? MESSAGES.errors.visualUnconfirmed
                : MESSAGES.errors.visualFailed,
              result,
            ),
      )
      return
    }
    setJob(result.job)
    setPhase('running')
    // The hold lands at intake; the balance chip should show it moving.
    void walletActions.refresh()
  }

  /** Close: forget everything, including the kind — the next one is chosen afresh. */
  function reset() {
    // The epoch bump is what detaches a closed dialog from its job; the
    // simulation's timer is left to finish so the demo's job settles.
    epoch.current += 1
    setForm(EMPTY_VISUAL_FORM)
    setPhase('form')
    setError(null)
    setShortBalance(false)
    setJob(null)
    setAssetUrls({})
    setSimulatedAssetId(null)
  }

  /** After a failure: back to the form, input kept. Sending again is a fresh press. */
  function backToForm() {
    setPhase('form')
    setError(null)
    setShortBalance(false)
  }

  return {
    live,
    form,
    patch,
    addGuidance,
    setGuidance,
    removeGuidance,
    phase,
    error,
    shortBalance,
    job,
    assetUrls,
    simulatedAssetId,
    timedOut,
    submit,
    reset,
    backToForm,
  }
}

export type CreateVisualState = ReturnType<typeof useCreateVisual>
