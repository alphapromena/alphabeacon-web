/**
 * C1 — Schedule configuration · `/calendar/settings`.
 *
 * The durable home for everything onboarding step 4 set up, so it renders the
 * SAME field components (`pipeline-fields.tsx`) rather than a second copy —
 * screens4.md calls C1 "the durable, editable home for" step 4, and two
 * implementations of one form is how they drift.
 *
 * Edits are held locally until saved, which is what makes the sticky save bar
 * and the dirty guard honest: nothing changes under the user while they are
 * still deciding, and leaving with unsaved work has to be refused out loud.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { SaveBar } from '@/components/ab/save-bar'
import { SkeletonForm } from '@/components/ab/skeletons'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useBilling,
  useDataDispatch,
  useEventSources,
  useGenerationModels,
  useSchedule,
  useScreenPhase,
  useTones,
} from '@/data/provider'
import type { Schedule, Tone, Weekday } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { TIMEZONES, zoneAbbreviation } from '@/lib/timezone'
import { ToneEditorSheet } from '@/features/settings/tone-editor'
import {
  ActiveDaysField,
  GenerationModelField,
  PipelineSummary,
  PostsPerDayField,
  TonesField,
} from '@/features/onboarding/pipeline-fields'

export function ScheduleConfigScreen() {
  const saved = useSchedule()
  const tones = useTones()
  const models = useGenerationModels()
  const billing = useBilling()
  const sources = useEventSources()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const [draft, setDraft] = useState<Schedule>(saved)
  const [toneEditorOpen, setToneEditorOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const invalid = draft.activeDays.length === 0 || draft.toneIds.length === 0 || !draft.modelId

  const patch = (next: Partial<Schedule>) => setDraft((current) => ({ ...current, ...next }))
  const modelName = models.find((m) => m.id === draft.modelId)?.name ?? ''

  return (
    <AppShell title="Schedule" context="When drafts are generated, how many, and in which voices">
      {phase === 'loading' ? (
        <SkeletonForm fields={5} label="Loading your schedule" />
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="mx-auto flex max-w-[680px] flex-col gap-8 pb-24">
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-lg font-semibold">When</h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <p className="text-sm text-muted-foreground">
                Slot times are wall-clock in this zone, so daylight saving never moves your posts.
              </p>
              <select
                id="timezone"
                value={draft.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace('_', ' ')} ({zoneAbbreviation(zone)})
                  </option>
                ))}
              </select>
            </div>

            <ActiveDaysField
              value={draft.activeDays}
              onChange={(activeDays: Weekday[]) => patch({ activeDays })}
            />
            {touched && draft.activeDays.length === 0 && (
              <p role="alert" className="text-sm text-destructive">
                {MESSAGES.errors.activeDaysRequired}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="generate-at">Generate at</Label>
              <p className="text-sm text-muted-foreground">
                Drafts are ready by this time, so they are waiting when you start.
              </p>
              <Input
                id="generate-at"
                type="time"
                className="w-40"
                value={draft.generateAt}
                onChange={(event) => patch({ generateAt: event.target.value })}
              />
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="font-display text-lg font-semibold">How much, and how</h2>
            <PostsPerDayField
              value={draft.postsPerDay}
              onChange={(postsPerDay) => patch({ postsPerDay: postsPerDay as 1 | 2 | 3 })}
            />
            <GenerationModelField
              models={models}
              value={draft.modelId}
              planTier={billing.planId}
              onChange={(modelId) => patch({ modelId })}
            />
            {touched && !draft.modelId && (
              <p role="alert" className="text-sm text-destructive">
                {MESSAGES.errors.modelRequired}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Tones</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings/tones">Manage tones →</Link>
              </Button>
            </div>
            <TonesField
              tones={tones}
              value={draft.toneIds}
              onChange={(toneIds) => patch({ toneIds })}
              onCreate={() => setToneEditorOpen(true)}
            />
            {touched && draft.toneIds.length === 0 && (
              <p role="alert" className="text-sm text-destructive">
                {MESSAGES.errors.toneRequired}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">Events</h2>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="attach-events">Attach posts to events</Label>
                <p className="text-sm text-muted-foreground">
                  Slots near a holiday or launch borrow its name and date.
                </p>
              </div>
              <Switch
                id="attach-events"
                checked={draft.attachToEvents}
                onCheckedChange={(attachToEvents) => patch({ attachToEvents })}
              />
            </div>
            {draft.attachToEvents && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <span className="text-muted-foreground">
                  {sources.length > 0
                    ? `${sources.length} source${sources.length === 1 ? '' : 's'} feeding events`
                    : MESSAGES.empty.noEventSources}
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/calendar/sources">Manage sources →</Link>
                </Button>
              </div>
            )}
          </section>

          <PipelineSummary
            activeDays={draft.activeDays.length}
            postsPerDay={draft.postsPerDay}
            toneCount={draft.toneIds.length}
            modelName={modelName}
          />
        </div>
      )}

      <SaveBar
        dirty={dirty && phase === 'ready'}
        onCancel={() => setDraft(saved)}
        onSave={() => {
          setTouched(true)
          if (invalid) return
          dispatch({ type: 'schedule/update', patch: draft })
          toastSuccess('Schedule saved', {
            description: 'New slots follow it from the next run.',
          })
        }}
        consequence="Your schedule changes will be lost, and generation keeps following the settings you had before."
      />

      <ToneEditorSheet
        open={toneEditorOpen}
        onOpenChange={setToneEditorOpen}
        onSave={(tone: Tone) => {
          dispatch({ type: 'tones/create', tone })
          patch({ toneIds: [...draft.toneIds, tone.id] })
          setToneEditorOpen(false)
          toastSuccess('Tone saved', { description: `${tone.name} is selected for this schedule.` })
        }}
      />
    </AppShell>
  )
}
