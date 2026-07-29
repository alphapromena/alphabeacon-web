/**
 * B3 — the connect-return states.
 *
 * A real OAuth round trip lands back on a URL carrying an outcome. This app
 * never leaves the browser, so the same three outcomes are reached the same
 * way — `/connections?connect=success|denied|failed&platform=…` — which keeps
 * every one of them walkable, and keeps the eventual real callback a matter of
 * who sets the query string rather than a new screen.
 *
 * "Denied" is deliberately not an error: choosing not to grant access is a
 * legitimate answer, so it reads as a choice you can revisit, not a failure.
 */
import { CheckCircle2, CircleSlash, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { AppShell } from '@/components/ab/app-shell'
import { BeaconDot } from '@/components/ab/motion'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useDataDispatch } from '@/data/provider'
import type { Platform } from '@/data/types'

const LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
}

export function ConnectReturn({
  state,
  platform,
  onDone,
}: {
  state: string
  platform: Platform
  onDone: () => void
}) {
  const dispatch = useDataDispatch()
  const label = LABELS[platform] ?? platform

  // Success is transient by design: it applies the connection and returns to
  // the hub, where the newly-live card is the actual confirmation.
  useEffect(() => {
    if (state !== 'success') return
    const timer = window.setTimeout(() => {
      dispatch({ type: 'connection/reconnect', platform })
      dispatch({ type: 'connections/connect', platform })
      toastSuccess(`${label} connected`, { description: 'Posting and analytics are on.' })
      onDone()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [state, platform, label, dispatch, onDone])

  return (
    <AppShell title="Connections" context={`Connecting ${label}`}>
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        {state === 'success' && (
          <>
            <BeaconDot live />
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">
                Connecting your {label} account…
              </h2>
              <p className="text-sm text-muted-foreground">
                Almost there. We are storing the permissions you granted.
              </p>
            </div>
          </>
        )}

        {state === 'denied' && (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CircleSlash aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">
                You did not grant access to {label}
              </h2>
              <p className="text-sm text-muted-foreground">
                Nothing was changed. You can connect it whenever you are ready — posts to your other
                channels are unaffected.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onDone}>Back to connections</Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <TriangleAlert aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">
                We could not finish connecting {label}
              </h2>
              <p className="text-sm text-muted-foreground">
                The exchange did not complete, so nothing was saved. Trying again usually works — if
                it does not, the platform may be having trouble.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onDone}>Try again</Button>
            </div>
          </>
        )}

        {state === 'already' && (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">{label} is already connected</h2>
              <p className="text-sm text-muted-foreground">
                Nothing to do — this account is live and its permissions are unchanged.
              </p>
            </div>
            <Button onClick={onDone}>Back to connections</Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
