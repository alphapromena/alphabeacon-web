/**
 * D5 — Schedule / publish, opened from an approved or media-ready draft.
 *
 * Only channels that are actually allowed to post appear. A channel needing
 * re-auth is shown, disabled, with the way to fix it inline — the others still
 * publish, which is why the result is reported per channel rather than as one
 * verdict. Partial success is the normal case for multi-channel publishing and
 * a single "failed" would be a lie about the channels that worked.
 */
import { AlertTriangle, CalendarClock, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
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
import { Input } from '@/components/ui/input'
import { useBilling, useConnections, useDataDispatch } from '@/data/provider'
import type { Draft, Platform } from '@/data/types'
import { cn } from '@/lib/utils'

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook Page',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
}

/** Per-channel limits, so a post that cannot fit says so before it is sent. */
const LIMITS: Partial<Record<Platform, { chars: number; video?: string }>> = {
  facebook: { chars: 2000 },
  instagram: { chars: 2200 },
  linkedin: { chars: 3000 },
}

export function ScheduleDialog({
  draft,
  open,
  onOpenChange,
}: {
  draft: Draft | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const connections = useConnections()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  const pastDue = billing.status === 'past_due'

  const publishable = connections.filter((c) => c.permissions.posting)
  const [selected, setSelected] = useState<Platform[]>([])
  const [when, setWhen] = useState('')

  if (!draft) return null

  const toggle = (platform: Platform) =>
    setSelected((current) =>
      current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform],
    )

  const submit = (publishNow: boolean) => {
    if (selected.length === 0 || pastDue) return
    const scheduledFor = publishNow
      ? new Date().toISOString()
      : when
        ? new Date(when).toISOString()
        : (draft.scheduledFor ?? new Date().toISOString())
    dispatch({ type: 'draft/schedule', draftId: draft.id, scheduledFor, platforms: selected })
    if (publishNow) dispatch({ type: 'draft/publish', draftId: draft.id })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Schedule this post</DialogTitle>
          <DialogDescription>Pick when it goes out, and where.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {pastDue && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              Publishing is paused while your payment is unresolved. Your schedule and drafts are
              untouched — update your payment method and this post can go out.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="schedule-when" className="text-sm font-medium">
              When
            </label>
            <Input
              id="schedule-when"
              type="datetime-local"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to keep this draft&apos;s own slot time.
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Channels</legend>
            {publishable.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                No channel is allowed to post yet.{' '}
                <Link
                  className="font-medium text-primary underline underline-offset-4"
                  to="/connections"
                >
                  Connect one
                </Link>{' '}
                and this post can go out.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {publishable.map((connection) => {
                  const needsReauth = connection.status === 'needs_reauth'
                  const limit = LIMITS[connection.platform]
                  const tooLong = limit ? draft.copy.length > limit.chars : false
                  return (
                    <li
                      key={connection.id}
                      className={cn(
                        'flex flex-col gap-1 rounded-lg border border-border p-3',
                        needsReauth && 'opacity-90',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`channel-${connection.platform}`}
                          checked={selected.includes(connection.platform)}
                          disabled={needsReauth}
                          onCheckedChange={() => toggle(connection.platform)}
                        />
                        <label htmlFor={`channel-${connection.platform}`} className="text-sm">
                          {PLATFORM_LABELS[connection.platform]}
                        </label>
                        {connection.handle && (
                          <span className="text-xs text-muted-foreground">
                            @{connection.handle}
                          </span>
                        )}
                      </div>

                      {needsReauth && (
                        // Disabled, but never a dead end: the fix is one click.
                        <p className="flex items-center gap-1.5 text-xs text-warning">
                          <AlertTriangle aria-hidden className="size-3" />
                          Needs re-auth —{' '}
                          <Link
                            className="font-medium underline underline-offset-4"
                            to="/connections"
                          >
                            reconnect
                          </Link>
                          . Other channels still publish.
                        </p>
                      )}

                      {tooLong && limit && (
                        <p className="flex items-center gap-1.5 text-xs text-warning">
                          <AlertTriangle aria-hidden className="size-3" />
                          Too long for this channel by{' '}
                          <MonoNumber value={draft.copy.length - limit.chars} /> characters.
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={selected.length === 0 || pastDue}
            onClick={() => submit(true)}
          >
            <Send aria-hidden />
            Publish now
          </Button>
          <Button disabled={selected.length === 0 || pastDue} onClick={() => submit(false)}>
            <CalendarClock aria-hidden />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
