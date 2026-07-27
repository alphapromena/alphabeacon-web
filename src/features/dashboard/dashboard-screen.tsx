/**
 * D1 — Dashboard (seeded W0 version). Proves the data flow end to end:
 * stat row computed from the active dataset, merged notifications/activity
 * feed, setup-incomplete banner, all four presentation states. W3 completes
 * it (quick-links grid, feed filters) per screens4.md.
 */
import { AlertTriangle, ArrowRight, Bell, CalendarCheck, Coins, Inbox } from 'lucide-react'
import { Link } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useActivity,
  useConnections,
  useCreditBalance,
  useDataDispatch,
  useDrafts,
  useNotifications,
  useOrg,
  useScreenPhase,
  useSession,
} from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

export function DashboardScreen() {
  const org = useOrg()
  const session = useSession()
  const drafts = useDrafts()
  const connections = useConnections()
  const credits = useCreditBalance()
  const notifications = useNotifications()
  const activity = useActivity()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const awaiting = drafts.filter((d) => d.status === 'pending_review').length
  const scheduled = drafts.filter((d) => d.status === 'scheduled').length
  const needsAttention = connections.filter((c) => c.status === 'needs_reauth').length
  const firstName = session.user?.name.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'Drafts awaiting review', value: awaiting, icon: Inbox, to: '/today' },
    { label: 'Scheduled this week', value: scheduled, icon: CalendarCheck, to: '/calendar' },
    { label: 'Credits balance', value: credits, icon: Coins, to: '/studio' },
    {
      label: 'Connections needing attention',
      value: needsAttention,
      icon: AlertTriangle,
      to: '/connections',
      warn: needsAttention > 0,
    },
  ]

  const feed = [
    ...notifications.map((n) => ({ id: n.id, message: n.message, at: n.at, kind: 'notification' })),
    ...activity.map((a) => ({ id: a.id, message: a.message, at: a.at, kind: 'activity' })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const context =
    awaiting > 0
      ? `Good to see you, ${firstName} — ${awaiting} drafts are ready for review`
      : `Good to see you, ${firstName} — nothing is waiting on you right now`

  return (
    <AppShell title="Dashboard" context={context}>
      {phase === 'loading' ? (
        <DashboardSkeleton />
      ) : phase === 'error' ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-6"
        >
          <p className="font-medium">{MESSAGES.errors.screenLoadFailed}</p>
          <Button variant="outline" onClick={() => dispatch({ type: 'dev/force', mode: 'none' })}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {!org.onboarding.completed && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
              <p className="text-sm font-medium">
                Let's finish setting up your workspace — your pipeline hasn't started yet.
              </p>
              <Button asChild size="sm">
                <Link to="/onboarding">
                  Resume setup <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )}

          <section
            aria-label="Key stats"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, to, warn }) => (
              <Link key={label} to={to} className="group focus-visible:outline-none">
                <Card
                  className={cn(
                    'transition-colors group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                    warn && 'border-warning/60',
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {label}
                    </CardTitle>
                    <Icon
                      aria-hidden
                      className={cn('size-4 text-muted-foreground', warn && 'text-warning')}
                    />
                  </CardHeader>
                  <CardContent>
                    <MonoNumber
                      value={value}
                      className={cn('text-3xl font-semibold', warn && 'text-warning')}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>

          <section aria-label="Notifications and activity" className="max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Bell aria-hidden className="size-4" /> Notifications & activity
              </h2>
              {notifications.some((n) => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'notifications/markAllRead' })}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            {feed.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                {MESSAGES.empty.noNotifications}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {feed.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                    <span className="text-sm">{item.message}</span>
                    <MonoNumber
                      value={new Date(item.at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      className="shrink-0 text-xs text-muted-foreground"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="flex max-w-2xl flex-col gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  )
}
