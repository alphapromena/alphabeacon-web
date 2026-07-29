/**
 * C2 — Event sources · `/calendar/sources`.
 *
 * What feeds event-aware scheduling: a country's public holidays, and the
 * user's own calendars. A Google source that has lost its token is shown with
 * a retry rather than removed, because the calendars it selected are worth
 * keeping — losing a token should not lose a configuration.
 */
import { CalendarDays, Flag, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '@/components/ab/app-shell'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { SkeletonList } from '@/components/ab/skeletons'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDataDispatch, useEventSources, useScreenPhase } from '@/data/provider'
import type { CalendarSource } from '@/data/types'
import { MESSAGES } from '@/lib/messages'

const COUNTRIES = [
  'Jordan',
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'Lebanon',
  'Morocco',
  'United Kingdom',
  'United States',
]

export function EventSourcesScreen() {
  const sources = useEventSources()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <AppShell title="Event sources" context="What the calendar plans around">
      {phase === 'loading' ? (
        <SkeletonList rows={3} label="Loading event sources" />
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="mx-auto flex max-w-[680px] flex-col gap-4">
          {sources.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No event sources yet"
              description={MESSAGES.empty.noEventSources}
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus aria-hidden />
                  Add a source
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus aria-hidden />
                  Add source
                </Button>
              </div>

              <ul className="flex flex-col gap-3">
                {sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          {source.kind === 'holiday' ? (
                            <Flag aria-hidden className="size-4" />
                          ) : (
                            <CalendarDays aria-hidden className="size-4" />
                          )}
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{source.label}</span>
                          {source.status === 'needs_reauth' ? (
                            <StatusBadge
                              label="Needs re-auth"
                              tone="warning"
                              icon={RefreshCw}
                              className="self-start"
                            />
                          ) : (
                            <StatusBadge
                              label="Active"
                              tone="success"
                              icon={CalendarDays}
                              className="self-start"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {source.status === 'needs_reauth' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              dispatch({ type: 'eventSources/retry', sourceId: source.id })
                              toastSuccess('Reconnected', {
                                description: 'Events from this source are flowing again.',
                              })
                            }}
                          >
                            <RefreshCw aria-hidden />
                            Retry
                          </Button>
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost">
                              Remove
                            </Button>
                          }
                          title={`Remove ${source.label}?`}
                          consequence="Future slots stop being planned around these events. Posts already scheduled against one keep their date and their event name."
                          confirmLabel="Remove source"
                          onConfirm={() =>
                            dispatch({ type: 'eventSources/remove', sourceId: source.id })
                          }
                        />
                      </div>
                    </div>

                    {source.status === 'needs_reauth' && (
                      <p className="text-sm text-muted-foreground">
                        We could not read this calendar on the last run, so its events are missing
                        from the schedule. Your calendar choices below are kept.
                      </p>
                    )}

                    {source.calendars && source.calendars.length > 0 && (
                      <fieldset className="flex flex-col gap-2 border-t border-border pt-3">
                        <legend className="sr-only">Calendars feeding the schedule</legend>
                        <p className="text-xs tracking-wider text-muted-foreground uppercase">
                          Calendars in use
                        </p>
                        {source.calendars.map((calendar) => (
                          <div key={calendar.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`${source.id}-${calendar.id}`}
                              checked={calendar.enabled}
                              onCheckedChange={(enabled) =>
                                dispatch({
                                  type: 'eventSources/toggleCalendar',
                                  sourceId: source.id,
                                  calendarId: calendar.id,
                                  enabled: Boolean(enabled),
                                })
                              }
                            />
                            <label htmlFor={`${source.id}-${calendar.id}`} className="text-sm">
                              {calendar.name}
                            </label>
                          </div>
                        ))}
                      </fieldset>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <AddSourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(source) => {
          dispatch({ type: 'eventSources/add', source })
          toastSuccess('Source added', { description: `${source.label} now feeds your calendar.` })
          setAddOpen(false)
        }}
      />
    </AppShell>
  )
}

function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (source: CalendarSource) => void
}) {
  const [kind, setKind] = useState<'holiday' | 'google'>('holiday')
  const [country, setCountry] = useState(COUNTRIES[0])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add an event source</DialogTitle>
          <DialogDescription>
            Events shape what gets drafted and when — holidays, launches, anything on a calendar you
            already keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Source type</legend>
            {(
              [
                ['holiday', 'Country holidays', 'Public holidays for a country you sell in.'],
                ['google', 'Google Calendar', 'Your own launches and events.'],
              ] as const
            ).map(([value, label, description]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3"
              >
                <input
                  type="radio"
                  name="source-kind"
                  className="mt-1 accent-primary"
                  checked={kind === value}
                  onChange={() => setKind(value)}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {kind === 'holiday' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="add-country" className="text-sm font-medium">
                Country
              </label>
              <select
                id="add-country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {COUNTRIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onAdd(
                kind === 'holiday'
                  ? {
                      id: `src_${country.toLowerCase().replace(/\s+/g, '_')}`,
                      kind: 'holiday',
                      label: `${country} public holidays`,
                      status: 'active',
                    }
                  : {
                      id: `src_google_${Date.now()}`,
                      kind: 'google',
                      label: 'Google Calendar',
                      status: 'active',
                      calendars: [
                        { id: 'cal_primary', name: 'Primary', enabled: true },
                        { id: 'cal_launches', name: 'Product launches', enabled: true },
                      ],
                    },
              )
            }
          >
            Add source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
