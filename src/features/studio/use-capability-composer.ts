/**
 * The capability composer's state (ORDER HSN-0910/A): one hook for all 13,
 * driven by the table in `src/data/media-capabilities.ts`.
 *
 * What it owns: the catalog reads (the plain one, and one per plan when the
 * catalog says `selectable` — the per-plan read is the only mapping from a
 * plan to its row and price), the plan, the values, the validation (the
 * document's refusals, before any round-trip), the cost line (the catalog's
 * decimal strings, never a float), and the submit — live: mint a read url per
 * reference asset, build the body, `POST media/jobs`; static: the demo
 * render, a timer and a demo asset, nothing sent anywhere.
 *
 * The wire remains the judge: a 400 that still arrives renders as itself
 * (open-item 49 — its sentence names no field), a 402 renders the wallet
 * state with everything typed kept, and a 502 says nothing was charged.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { MediaPlan } from '@/data/studio'
import {
  asIds,
  buildCapabilityBody,
  defaultValues,
  estimateCost,
  fieldsOnPlan,
  MEDIA_PLANS,
  validateCapabilityInput,
  type CapabilityField,
  type CapabilityValues,
  type FieldValue,
  type MediaCapability,
} from '@/data/media-capabilities'
import { useBilling, useDataDispatch, useLiveMode } from '@/data/provider'
import { useStudioActions, type CapabilityCatalog, type CatalogModel } from '@/data/studio'
import { useWallet, useWalletActions } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'

/** How long the demo render runs before it lands (the static composer's own clock). */
export const DEMO_RENDER_MS = 2200

export type ComposerPhase = 'compose' | 'sending' | 'rendering'

export interface WireFailure {
  message: string
  requestId?: string
}

/** One enum property of a row's params schema, as its allowed values. */
export function schemaEnum(
  schema: Record<string, unknown> | undefined,
  property: string,
): string[] | null {
  const properties = (schema?.properties ?? {}) as Record<string, { enum?: unknown[] }>
  const values = properties[property]?.enum
  if (!Array.isArray(values) || values.length === 0) return null
  return values.map(String)
}

/** The row a plan resolves to: the per-plan read's first row, else the plain read's row for that plan. */
export function rowForPlan(
  plain: CapabilityCatalog | null,
  perPlan: Partial<Record<MediaPlan, CapabilityCatalog | null>>,
  plan: MediaPlan | null,
): CatalogModel | undefined {
  if (!plain) return undefined
  if (!plan) return plain.models[0]
  const read = perPlan[plan]
  if (read && read.models.length > 0) return read.models[0]
  return plain.models.find((model) => model.plan === plan) ?? plain.models[0]
}

export function useCapabilityComposer(capability: MediaCapability) {
  const live = useLiveMode()
  const studio = useStudioActions()
  const wallet = useWallet()
  const walletActions = useWalletActions()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  const navigate = useNavigate()

  const [plain, setPlain] = useState<CapabilityCatalog | null | 'unread'>('unread')
  const [perPlan, setPerPlan] = useState<Partial<Record<MediaPlan, CapabilityCatalog | null>>>({})
  const [plan, setPlan] = useState<MediaPlan>('balanced')
  const [values, setValues] = useState<CapabilityValues>(() => defaultValues(capability))
  const [phase, setPhase] = useState<ComposerPhase>('compose')
  const [failure, setFailure] = useState<WireFailure | null>(null)
  const [shortBalance, setShortBalance] = useState(false)
  const [touched, setTouched] = useState(false)
  /** A motion clip's known length, when the chosen asset came from one of our renders. */
  const [clipSeconds, setClipSeconds] = useState<Record<string, number>>({})
  const timer = useRef<number | undefined>(undefined)

  // A new capability is a new composer: the values start from its defaults.
  useEffect(() => {
    setValues(defaultValues(capability))
    setPlan('balanced')
    setPhase('compose')
    setFailure(null)
    setShortBalance(false)
    setTouched(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new capability is a new composer
  }, [capability.id])

  useEffect(() => {
    let cancelled = false
    setPlain('unread')
    setPerPlan({})
    void studio.catalog(capability.id).then(async (catalog) => {
      if (cancelled) return
      setPlain(catalog)
      if (!catalog?.selectable) return
      // The per-plan reads: the plain read carries `plan: null` on the
      // own-model rows, so this is the only mapping to a row and its price.
      const reads = await Promise.all(
        MEDIA_PLANS.map(
          async (candidate) => [candidate, await studio.catalog(capability.id, candidate)] as const,
        ),
      )
      if (cancelled) return
      setPerPlan(Object.fromEntries(reads))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one read per capability per org
  }, [capability.id, studio.orgId])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const catalog = plain === 'unread' ? null : plain
  const granted = plain !== 'unread' && plain !== null
  const selectable = catalog?.selectable === true
  const effectivePlan: MediaPlan | null = selectable ? plan : null
  const model = rowForPlan(catalog, perPlan, effectivePlan)
  const schema = model?.capabilitySchema

  /** The fields on this plan, with enums the resolved row narrows (some rows drop `webp`; the voices live only here). */
  const fields = useMemo(
    () =>
      fieldsOnPlan(capability, effectivePlan).map((field): CapabilityField => {
        if (field.kind !== 'enum' || !field.optionsFromSchema) return field
        const fromSchema = schemaEnum(schema, field.optionsFromSchema)
        return fromSchema ? { ...field, options: fromSchema } : field
      }),
    [capability, effectivePlan, schema],
  )
  const voiceOptions = schemaEnum(schema, 'voice') ?? []

  // A value an enum no longer offers (the plan changed, the row dropped it)
  // snaps to the first allowed one, so the body never carries a dead option.
  useEffect(() => {
    setValues((current) => {
      let next = current
      for (const field of fields) {
        if (field.kind !== 'enum' || field.options.length === 0) continue
        const value = current[field.key]
        if (typeof value === 'string' && value && !field.options.includes(value)) {
          next = { ...next, [field.key]: field.options[0] }
        }
        if (field.required && !value) next = { ...next, [field.key]: field.options[0] }
      }
      return next
    })
  }, [fields])

  const issues = validateCapabilityInput(capability, effectivePlan, values, { voiceOptions })
  const motionClip = capability.pricing.unit === 'video_seconds' && 'motion' in capability.pricing
  const chosenClip = motionClip ? asIds(values.video)[0] : undefined
  const cost = estimateCost(capability, values, model?.cost, {
    clipSeconds: chosenClip ? clipSeconds[chosenClip] : undefined,
  })
  const pastDue = billing.status === 'past_due'

  const setValue = (key: string, value: FieldValue) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  /** The per-plan price line for the plan chips. */
  const priceForPlan = (candidate: MediaPlan) => rowForPlan(catalog, perPlan, candidate)?.cost

  async function submit() {
    setTouched(true)
    setFailure(null)
    setShortBalance(false)
    if (issues.length > 0 || pastDue || phase !== 'compose') return

    if (!live) {
      // The demo render: a timer, then a demo job and asset — nothing is sent.
      setPhase('rendering')
      const stamp = Date.now()
      const jobId = `job_${capability.id}_${stamp}`
      const assetId = `asset_${jobId}`
      timer.current = window.setTimeout(() => {
        dispatch({
          type: 'studio/demoRender',
          jobId,
          capability: capability.id,
          kind: capability.output[0] === 'video' ? 'video' : 'image',
          prompt: demoPromptOf(values),
          assetId,
        })
        void navigate(`/studio/assets/${assetId}`)
      }, DEMO_RENDER_MS)
      return
    }

    setPhase('sending')
    // A `url` field carries our read-presigned url per asset, minted NOW so
    // the hour it is good for starts at submit, not at pick.
    const urls: Record<string, string> = {}
    for (const field of fields) {
      if (field.kind !== 'assets' || field.mode !== 'url') continue
      for (const id of asIds(values[field.key])) {
        const url = await studio.assetUrl(id)
        if (!url) {
          setPhase('compose')
          setFailure({ message: MESSAGES.errors.studioReferenceUnavailable })
          return
        }
        urls[id] = url
      }
    }
    const body = buildCapabilityBody(capability, effectivePlan, values, {
      includePlan: selectable,
      urls,
      originRef: `studio:${capability.id}`,
    })
    const result = await studio.createJob(body)
    setPhase('compose')
    if (!result.ok) {
      if (result.code === 'wallet_insufficient') {
        setShortBalance(true)
        void walletActions.refresh()
        return
      }
      setFailure({
        message:
          result.code === 'bad_gateway'
            ? MESSAGES.errors.upstreamUnavailable
            : result.code === 'rate_limited'
              ? MESSAGES.errors.rateLimited
              : result.message || MESSAGES.errors.generic,
        requestId: result.requestId,
      })
      return
    }
    void walletActions.refresh()
    void navigate(`/studio/jobs?job=${result.job.jobId}`)
  }

  return {
    live,
    catalog,
    granted,
    unread: plain === 'unread',
    selectable,
    plan,
    setPlan,
    priceForPlan,
    model,
    fields,
    values,
    setValue,
    issues,
    touched,
    cost,
    phase,
    failure,
    shortBalance,
    wallet,
    pastDue,
    submit,
    setClipSeconds: (assetId: string, seconds: number) =>
      setClipSeconds((current) => ({ ...current, [assetId]: seconds })),
  }
}

/** What the demo job lists as its prompt: the first text the user typed. */
function demoPromptOf(values: CapabilityValues): string {
  for (const key of ['prompt', 'instruction']) {
    const value = values[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return 'Demo render'
}

export type CapabilityComposerState = ReturnType<typeof useCapabilityComposer>
