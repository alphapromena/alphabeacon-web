/**
 * A5 — Onboarding wizard · `/onboarding`.
 *
 * The path from a bare account to a *running pipeline*. Step 4 is the point of
 * the whole flow: "Start pipeline" activates scheduling for the org rather
 * than soft-saving a preference, which is why it is the one step with no
 * "Skip for now" — leaving early is possible, but only through an explicit
 * link that says the pipeline will not run (N3 then brings people back).
 *
 * Progress lives in the provider, not in component state, so N3 can resume at
 * the right step and a mid-flow detour (creating a tone) cannot lose it.
 */
import { CalendarDays, Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router'
import { BeaconDot } from '@/components/ab/motion'
import { ConnectionStatusBadge } from '@/components/ab/status-badge'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useBilling,
  useConnections,
  useDataDispatch,
  useEventSources,
  useGenerationModels,
  useOrg,
  useSchedule,
  useTones,
  type OnboardingStep,
} from '@/data/provider'
import { useAccountActions } from '@/data/account'
import type { CalendarSource, Platform, Tone, Weekday } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { ToneEditorSheet } from '@/features/settings/tone-editor'
import {
  ActiveDaysField,
  GenerationModelField,
  PipelineSummary,
  PostsPerDayField,
  TonesField,
} from './pipeline-fields'
import { WizardShell } from './wizard-shell'

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook Page',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
}

const HOLIDAY_FEEDS = ['Jordan', 'United Arab Emirates', 'Saudi Arabia', 'Egypt', 'Lebanon']

export function OnboardingScreen() {
  const org = useOrg()
  const dispatch = useDataDispatch()
  const account = useAccountActions()
  const navigate = useNavigate()
  const step = org.onboarding.resumeStep

  const goTo = (next: OnboardingStep) => dispatch({ type: 'onboarding/goToStep', step: next })

  return (
    <>
      {step === 1 && <StepBrand onNext={() => goTo(2)} />}
      {step === 2 && <StepConnect onBack={() => goTo(1)} onNext={() => goTo(3)} />}
      {step === 3 && <StepCalendar onBack={() => goTo(2)} onNext={() => goTo(4)} />}
      {step === 4 && (
        <StepPipeline
          onBack={() => goTo(3)}
          onStarted={() => {
            dispatch({ type: 'schedule/start' })
            goTo(5)
          }}
        />
      )}
      {step === 5 && (
        <StepReady
          onFinish={async () => {
            // Finishing the wizard is where the workspace becomes real: in
            // live mode this creates the org (the creator becomes its first
            // owner) under the name step 1 collected; the resync that follows
            // flips the world onto it. Static completes exactly as before.
            const result = await account.createOrg(org.name)
            if (!result.ok) {
              toastError(MESSAGES.errors.generic, {
                retry: { label: 'Try again', onClick: () => {} },
              })
              return
            }
            dispatch({ type: 'onboarding/complete' })
            navigate('/')
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Brand basics
// ---------------------------------------------------------------------------

function StepBrand({ onNext }: { onNext: () => void }) {
  const org = useOrg()
  const dispatch = useDataDispatch()
  const [name, setName] = useState(org.name)
  const [offer, setOffer] = useState(org.offer)
  const [differentiators, setDifferentiators] = useState<string[]>(org.differentiators)
  const [draft, setDraft] = useState('')
  const [touched, setTouched] = useState(false)

  const offerMissing = touched && offer.trim().length === 0
  const diffsMissing = touched && differentiators.length === 0

  const addDifferentiator = () => {
    const value = draft.trim()
    if (!value || differentiators.length >= 5) return
    setDifferentiators([...differentiators, value])
    setDraft('')
  }

  return (
    <WizardShell
      step={1}
      title="Tell us about your brand"
      description="Every draft starts from these three answers, so they are worth a minute."
      primary={
        <Button
          onClick={() => {
            setTouched(true)
            if (!offer.trim() || differentiators.length === 0) return
            dispatch({ type: 'onboarding/saveBrand', name, offer, differentiators })
            onNext()
          }}
        >
          Continue
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="org-name">Company name</Label>
          <Input id="org-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-offer">What you offer, in one line</Label>
          <Textarea
            id="org-offer"
            rows={2}
            value={offer}
            aria-invalid={offerMissing || undefined}
            aria-describedby={offerMissing ? 'org-offer-error' : undefined}
            placeholder="Specialty coffee, roasted to order and shipped within 48 hours."
            onChange={(event) => setOffer(event.target.value)}
          />
          {offerMissing && (
            <p id="org-offer-error" role="alert" className="text-sm text-destructive">
              {MESSAGES.errors.offerRequired}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-diff">What sets you apart</Label>
          <p className="text-sm text-muted-foreground">
            Three to five short phrases. Drafts lean on these for specifics.
          </p>
          <div className="flex gap-2">
            <Input
              id="org-diff"
              value={draft}
              placeholder="Roasted to order"
              aria-invalid={diffsMissing || undefined}
              aria-describedby={diffsMissing ? 'org-diff-error' : undefined}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addDifferentiator()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addDifferentiator}
              disabled={!draft.trim() || differentiators.length >= 5}
            >
              <Plus aria-hidden />
              Add
            </Button>
          </div>
          {differentiators.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {differentiators.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setDifferentiators(differentiators.filter((d) => d !== item))}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item}
                    <X aria-hidden className="size-3" />
                    <span className="sr-only">Remove {item}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {diffsMissing && (
            <p id="org-diff-error" role="alert" className="text-sm text-destructive">
              {MESSAGES.errors.differentiatorsRequired}
            </p>
          )}
        </div>
      </div>
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Connect your accounts (condensed B1)
// ---------------------------------------------------------------------------

function StepConnect({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const connections = useConnections()
  const dispatch = useDataDispatch()

  return (
    <WizardShell
      step={2}
      title="Connect your accounts"
      description="Connect at least one to publish. You can add the rest later."
      onBack={onBack}
      onSkip={onNext}
      primary={<Button onClick={onNext}>Continue</Button>}
    >
      <ul className="flex flex-col gap-3">
        {connections.map((connection) => {
          const comingSoon = connection.platform === 'x'
          const connected = connection.status === 'active'
          return (
            <li
              key={connection.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{PLATFORM_LABELS[connection.platform]}</span>
                <ConnectionStatusBadge status={connection.status} />
              </div>
              {comingSoon ? (
                // Absent-not-teasing does not apply here: screens4.md asks for X
                // to stay visible and explained, so the disabled control carries
                // its reason in a tooltip rather than being silently dead.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="rounded-md">
                      <Button variant="outline" size="sm" disabled>
                        Coming soon
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{MESSAGES.notices.xComingSoon}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant={connected ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() =>
                    dispatch(
                      connected
                        ? { type: 'connections/disconnect', platform: connection.platform }
                        : { type: 'connections/connect', platform: connection.platform },
                    )
                  }
                >
                  {connected ? 'Disconnect' : 'Connect'}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Connect your calendar (condensed C2)
// ---------------------------------------------------------------------------

function StepCalendar({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const sources = useEventSources()
  const dispatch = useDataDispatch()
  const [country, setCountry] = useState(HOLIDAY_FEEDS[0])

  const addHolidays = () => {
    const source: CalendarSource = {
      id: `src_${country.toLowerCase().replace(/\s+/g, '_')}`,
      kind: 'holiday',
      label: `${country} public holidays`,
      status: 'active',
    }
    if (sources.some((s) => s.id === source.id)) return
    dispatch({ type: 'eventSources/add', source })
  }

  return (
    <WizardShell
      step={3}
      title="Connect your calendar"
      description="So we can plan posts around what matters to your audience — launches, holidays, local events."
      onBack={onBack}
      onSkip={onNext}
      primary={<Button onClick={onNext}>Continue</Button>}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="holiday-country">Country holidays</Label>
          <div className="flex gap-2">
            <select
              id="holiday-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
            >
              {HOLIDAY_FEEDS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={addHolidays}>
              <Plus aria-hidden />
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="google-calendar">Google Calendar</Label>
          <Button
            id="google-calendar"
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() =>
              dispatch({
                type: 'eventSources/add',
                source: {
                  id: 'src_google',
                  kind: 'google',
                  label: 'Google Calendar',
                  status: 'active',
                  calendars: [{ id: 'cal_primary', name: 'Primary', enabled: true }],
                },
              })
            }
            disabled={sources.some((s) => s.kind === 'google')}
          >
            <CalendarDays aria-hidden />
            {sources.some((s) => s.kind === 'google')
              ? 'Google Calendar connected'
              : 'Connect Google Calendar'}
          </Button>
        </div>

        {sources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {MESSAGES.empty.noEventSources}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Check aria-hidden className="size-4 text-primary" />
                  {source.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'eventSources/remove', sourceId: source.id })}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Start your pipeline
// ---------------------------------------------------------------------------

function StepPipeline({ onBack, onStarted }: { onBack: () => void; onStarted: () => void }) {
  const schedule = useSchedule()
  const tones = useTones()
  const models = useGenerationModels()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  const [toneEditorOpen, setToneEditorOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  const modelName = models.find((m) => m.id === schedule.modelId)?.name ?? ''
  const daysMissing = touched && schedule.activeDays.length === 0
  const tonesMissing = touched && schedule.toneIds.length === 0
  const modelMissing = touched && !schedule.modelId

  return (
    <WizardShell
      step={4}
      title="Start your pipeline"
      description="This is the setting that makes drafts appear. You can change all of it later."
      onBack={onBack}
      primary={
        <Button
          onClick={() => {
            setTouched(true)
            if (!schedule.activeDays.length || !schedule.toneIds.length || !schedule.modelId) return
            onStarted()
          }}
        >
          Start pipeline
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <ActiveDaysField
          value={schedule.activeDays}
          onChange={(activeDays: Weekday[]) =>
            dispatch({ type: 'schedule/update', patch: { activeDays } })
          }
        />
        {daysMissing && (
          <p role="alert" className="-mt-4 text-sm text-destructive">
            {MESSAGES.errors.activeDaysRequired}
          </p>
        )}

        <PostsPerDayField
          value={schedule.postsPerDay}
          onChange={(postsPerDay) =>
            dispatch({
              type: 'schedule/update',
              patch: { postsPerDay: postsPerDay as 1 | 2 | 3 },
            })
          }
        />

        <GenerationModelField
          models={models}
          value={schedule.modelId}
          planTier={billing.planId}
          onChange={(modelId) => dispatch({ type: 'schedule/update', patch: { modelId } })}
        />
        {modelMissing && (
          <p role="alert" className="-mt-4 text-sm text-destructive">
            {MESSAGES.errors.modelRequired}
          </p>
        )}

        <TonesField
          tones={tones}
          value={schedule.toneIds}
          onChange={(toneIds) => dispatch({ type: 'schedule/update', patch: { toneIds } })}
          onCreate={() => setToneEditorOpen(true)}
        />
        {tonesMissing && (
          <p role="alert" className="-mt-4 text-sm text-destructive">
            {MESSAGES.errors.toneRequired}
          </p>
        )}

        <PipelineSummary
          activeDays={schedule.activeDays.length}
          postsPerDay={schedule.postsPerDay}
          toneCount={schedule.toneIds.length}
          modelName={modelName}
        />

        <p className="text-xs text-muted-foreground">
          Not ready?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/">
            I&apos;ll set this up later
          </Link>{' '}
          — your workspace opens without a running pipeline, and we&apos;ll remind you.
        </p>
      </div>

      <ToneEditorSheet
        open={toneEditorOpen}
        onOpenChange={setToneEditorOpen}
        onSave={(tone: Tone) => {
          // Saving returns here with the new tone already selected and the
          // wizard's progress untouched (screens4.md A5 step 4).
          dispatch({ type: 'tones/create', tone })
          dispatch({ type: 'schedule/update', patch: { toneIds: [...schedule.toneIds, tone.id] } })
          setToneEditorOpen(false)
          toastSuccess('Tone saved', { description: `${tone.name} is selected for this pipeline.` })
        }}
      />
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Ready
// ---------------------------------------------------------------------------

function StepReady({ onFinish }: { onFinish: () => void }) {
  const schedule = useSchedule()
  const tones = useTones()
  const models = useGenerationModels()
  const connections = useConnections()
  const sources = useEventSources()

  const connected = connections.filter((c) => c.status === 'active').length
  const modelName = models.find((m) => m.id === schedule.modelId)?.name ?? '—'

  return (
    <WizardShell
      step={5}
      title="Your pipeline is running"
      description="Drafts will be waiting the next time your slot comes around."
      primary={<Button onClick={onFinish}>Go to your dashboard</Button>}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3">
          <BeaconDot live />
          <span className="text-sm font-medium">Pipeline active</span>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <SummaryRow label="Generating on" value={`${schedule.activeDays.length} days a week`} />
          <SummaryRow label="Posts per day" value={String(schedule.postsPerDay)} />
          <SummaryRow label="Drafted by" value={modelName} />
          <SummaryRow
            label="Tones"
            value={schedule.toneIds
              .map((id) => tones.find((t) => t.id === id)?.name)
              .filter(Boolean)
              .join(', ')}
          />
          <SummaryRow label="Channels connected" value={String(connected)} />
          <SummaryRow label="Event sources" value={String(sources.length)} />
        </dl>
      </div>
    </WizardShell>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2">
      <dt className="text-xs tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  )
}
