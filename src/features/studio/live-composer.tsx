/**
 * E2 in live mode (INT-11).
 *
 * The params form is GENERATED from the model's `capabilitySchema` - a real
 * JSON Schema the catalog hands over - which is the same law W5 already holds
 * statically: the form may not name a model or a parameter. The catalog gained
 * that schema without api.md mentioning it (D-INT-H), and it is the reason
 * this screen can offer aspect ratios and formats that are true for the row
 * the plan actually resolves to.
 *
 * `modelAlias` is NEVER sent. The retired field is refused by name upstream -
 * the platform picks the row from `plan`, and the job's answer echoes which
 * one served it.
 */
import { Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { InsufficientBalance } from '@/components/ab/insufficient-balance'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStudioActions, type CapabilityCatalog, type MediaPlan } from '@/data/studio'
import { useWallet, useWalletActions } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'

/** One enum field of a model's params schema, as an option list. */
function enumOptions(schema: Record<string, unknown> | undefined, field: string): string[] {
  const properties = (schema?.properties ?? {}) as Record<string, { enum?: unknown[] }>
  const values = properties[field]?.enum
  return Array.isArray(values) ? values.filter((v): v is string => typeof v === 'string') : []
}

export function LiveComposer() {
  const [params] = useSearchParams()
  const capability = params.get('capability') ?? 'media.generate'
  const studio = useStudioActions()
  const wallet = useWallet()
  const walletActions = useWalletActions()
  const navigate = useNavigate()

  const [catalog, setCatalog] = useState<CapabilityCatalog | null>(null)
  const [plan, setPlan] = useState<MediaPlan>('balanced')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [outputFormat, setOutputFormat] = useState('png')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shortBalance, setShortBalance] = useState(false)

  useEffect(() => {
    void studio.catalog(capability).then(setCatalog)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one read per capability
  }, [capability, studio.orgId])

  // The row the chosen plan resolves to decides which params are legal.
  const model = useMemo(
    () => catalog?.models.find((entry) => entry.plan === plan) ?? catalog?.models[0],
    [catalog, plan],
  )
  const ratios = enumOptions(model?.capabilitySchema, 'aspectRatio')
  const formats = enumOptions(model?.capabilitySchema, 'outputFormat')

  useEffect(() => {
    if (ratios.length > 0 && !ratios.includes(aspectRatio)) setAspectRatio(ratios[0])
    if (formats.length > 0 && !formats.includes(outputFormat)) setOutputFormat(formats[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follow the resolved row
  }, [model?.alias])

  const plans = [...new Set(catalog?.models.map((entry) => entry.plan) ?? [])]

  async function submit() {
    setError(null)
    setShortBalance(false)
    setBusy(true)
    const result = await studio.createJob({
      capability,
      plan,
      kind: model?.kind === 'video' ? 'video' : 'image',
      prompt,
      params: {
        ...(ratios.length > 0 ? { aspectRatio } : {}),
        ...(formats.length > 0 ? { outputFormat } : {}),
      },
      origin: { kind: 'standalone' },
    })
    setBusy(false)
    if (!result.ok) {
      if (result.code === 'wallet_insufficient') {
        // The prompt is deliberately kept: nothing ran, so nothing is lost.
        setShortBalance(true)
        void walletActions.refresh()
        return
      }
      setError(
        result.code === 'bad_gateway'
          ? MESSAGES.errors.upstreamUnavailable
          : result.code === 'rate_limited'
            ? MESSAGES.errors.rateLimited
            : result.message || MESSAGES.errors.generic,
      )
      return
    }
    void walletActions.refresh()
    void navigate(`/studio/jobs?job=${result.job.jobId}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">{capability}</h2>
        {model?.displayHint && (
          <p className="text-sm text-muted-foreground">Rendering on {model.displayHint}.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="media-prompt">What should it show?</Label>
        <Textarea
          id="media-prompt"
          rows={4}
          value={prompt}
          disabled={busy}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A flat-vector graphic of coffee beans in a single clean row on warm ivory"
        />
      </div>

      {plans.length > 1 && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">Quality</legend>
          <div className="flex flex-wrap gap-2">
            {plans.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={plan === option ? 'default' : 'outline'}
                aria-pressed={plan === option}
                disabled={busy}
                onClick={() => setPlan(option as MediaPlan)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Generated from the model's own schema: this form names no parameter
          it was not handed, and no model at all. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ratios.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="media-ratio">Aspect ratio</Label>
            <select
              id="media-ratio"
              value={aspectRatio}
              disabled={busy}
              onChange={(event) => setAspectRatio(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {ratios.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}
        {formats.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="media-format">Format</Label>
            <select
              id="media-format"
              value={outputFormat}
              disabled={busy}
              onChange={(event) => setOutputFormat(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {formats.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {shortBalance && <InsufficientBalance wallet={wallet} />}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy || prompt.trim().length === 0}>
          <Sparkles aria-hidden />
          {busy ? 'Sending…' : 'Render'}
        </Button>
      </div>
    </div>
  )
}
