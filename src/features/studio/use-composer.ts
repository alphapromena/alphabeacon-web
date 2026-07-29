/**
 * The composer's state: model choice, prompt, schema-driven params, the
 * credit arithmetic, and the scripted run.
 *
 * Kept apart from the components that draw it so both modes (D4's dialog and
 * E2's page) share one state machine, and so the component file exports only
 * components. `draftId` is the ONLY thing that differs between the modes.
 */
import { useEffect, useRef, useState } from 'react'
import { useBilling, useCreditBalance, useDataDispatch, useStudioModels } from '@/data/provider'
import type { PlanTier, StudioModel } from '@/data/types'
import { defaultsFromSchema, missingRequired, type ParamValues } from '@/lib/params-schema'

export const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 }

/** How long a scripted job runs before it lands. */
export const COMPOSER_RUN_MS = 2200

export type ComposerPhase = 'compose' | 'generating' | 'failed'

export function useComposer({
  planTier,
  initialModelId,
  draftId,
  onSucceeded,
}: {
  planTier: PlanTier
  initialModelId?: string
  /** Present in draft-scoped mode; the finished asset attaches to it. */
  draftId?: string
  onSucceeded?: (assetId: string) => void
}) {
  const models = useStudioModels()
  const balance = useCreditBalance()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  // A failed payment gates the product, not just the Billing screen.
  const pastDue = billing.status === 'past_due'

  const initial = models.find((model) => model.id === initialModelId)
  const [kind, setKind] = useState<'image' | 'video'>(initial?.kind ?? 'image')
  const [modelId, setModelId] = useState(initialModelId ?? '')
  const [prompt, setPrompt] = useState('')
  const [params, setParams] = useState<ParamValues>(() => defaultsFromSchema(initial?.paramsSchema))
  const [phase, setPhase] = useState<ComposerPhase>('compose')
  const [failure, setFailure] = useState('')
  const timer = useRef<number | undefined>(undefined)

  const visible = models.filter((model) => model.kind === kind)
  const selected = models.find((model) => model.id === modelId) ?? visible[0]
  const locked = selected ? TIER_RANK[selected.tier] > TIER_RANK[planTier] : false
  const cost = selected?.credits ?? 0
  const short = cost > balance
  const missing = selected ? missingRequired(selected.paramsSchema, params) : []

  useEffect(() => () => window.clearTimeout(timer.current), [])

  /**
   * Seed params for whichever model is EFFECTIVELY selected, including the
   * implicit first one when the composer opens with no model named (D4's
   * case). Without this the form starts with a required field unset and the
   * Generate button is disabled for a reason nobody can see.
   */
  const seededFor = useRef<string | undefined>(initial?.id)
  useEffect(() => {
    if (selected && seededFor.current !== selected.id) {
      seededFor.current = selected.id
      setParams(defaultsFromSchema(selected.paramsSchema))
    }
  }, [selected])

  /** Switching models re-seeds params from the NEW schema (via the effect). */
  const chooseModel = (model: StudioModel) => {
    setModelId(model.id)
  }

  const chooseKind = (next: 'image' | 'video') => {
    setKind(next)
    const first = models.find((model) => model.kind === next)
    if (first) chooseModel(first)
  }

  const start = () => {
    if (!selected || short || locked || pastDue || missing.length > 0) return
    const jobId = `job_${draftId ?? 'standalone'}_${Date.now()}`
    dispatch({
      type: 'media/start',
      draftId: draftId ?? '',
      jobId,
      modelId: selected.id,
      prompt,
      params,
    })
    setPhase('generating')
    timer.current = window.setTimeout(() => {
      // The scripted outcome: an empty prompt is the one that fails, so the
      // credits-released path is reachable on purpose rather than by luck.
      if (prompt.trim().length === 0) {
        const reason = 'The model could not work from an empty prompt. Your credits were released.'
        dispatch({ type: 'media/fail', jobId, reason })
        setFailure(reason)
        setPhase('failed')
        return
      }
      const assetId = `asset_${jobId}`
      dispatch({ type: 'media/succeed', jobId, assetId })
      onSucceeded?.(assetId)
    }, COMPOSER_RUN_MS)
  }

  const reset = () => {
    window.clearTimeout(timer.current)
    setPhase('compose')
  }

  return {
    kind,
    chooseKind,
    models: visible,
    selected,
    chooseModel,
    prompt,
    setPrompt,
    params,
    setParams,
    phase,
    failure,
    balance,
    cost,
    short,
    locked,
    missing,
    pastDue,
    start,
    reset,
    planTier,
  }
}

export type ComposerState = ReturnType<typeof useComposer>
