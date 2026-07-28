/**
 * D1 — Dashboard (seeded W0 version, rebuilt on the W1 design layer).
 *
 * Proves the data flow end to end: the stat row is computed from the active
 * dataset, the feed merges notifications with activity, and all four
 * presentation states render from `useScreenPhase`. Every visual decision now
 * comes from `ab/` primitives rather than local markup, so W3 can finish this
 * screen (quick-links grid, feed filters) without re-litigating any of them.
 */
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  Coins,
  CreditCard,
  Inbox,
  Plug,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonList, SkeletonStatRow } from '@/components/ab/skeletons'
import { StatCard } from '@/components/ab/stat-card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
import { relativeTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

/** Mirrors the rail exactly (screens4.md D1). */
const QUICK_LINKS: { to: string; label: string; description: string; icon: LucideIcon }[] = [
  { to: '/today', label: "Today's queue", description: 'Approve, edit, reject', icon: Inbox },
  {
    to: '/calendar',
    label: 'Calendar',
    description: 'What is scheduled, and how it did',
    icon: Calendar,
  },
  { to: '/studio', label: 'Creative Studio', description: 'Images and video', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', description: 'Reach and engagement', icon: BarChart3 },
  { to: '/connections', label: 'Connections', description: 'Channels and permissions', icon: Plug },
  { to: '/billing', label: 'Billing', description: 'Plan and credits', icon: CreditCard },
  { to: '/settings', label: 'Settings', description: 'Brand voice, tones, team', icon: Settings },
]

type FeedFilter = 'all' | 'notifications' | 'activity'

export function DashboardScreen() {
  const [filter, setFilter] = useState<FeedFilter>('all')
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

  const feed = [
    ...(filter === 'activity'
      ? []
      : notifications.map((n) => ({
          id: n.id,
          message: n.message,
          at: n.at,
          unread: !n.read,
        }))),
    ...(filter === 'notifications'
      ? []
      : activity.map((a) => ({ id: a.id, message: a.message, at: a.at, unread: false }))),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const context =
    awaiting > 0
      ? `Good to see you, ${firstName} — ${awaiting} drafts are ready for review`
      : `Good to see you, ${firstName} — nothing is waiting on you right now`

  return (
    <AppShell title="Dashboard" context={context}>
      {phase === 'loading' ? (
        <div className="flex flex-col gap-6">
          <SkeletonStatRow label="Loading dashboard" />
          <SkeletonList rows={4} className="max-w-2xl" />
        </div>
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {!org.onboarding.completed && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
              <p className="text-sm font-medium">
                Let&apos;s finish setting up your workspace — your pipeline hasn&apos;t started yet.
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
            <StatCard label="Drafts awaiting review" value={awaiting} icon={Inbox} to="/today" />
            <StatCard
              label="Scheduled this week"
              value={scheduled}
              icon={CalendarCheck}
              to="/calendar"
            />
            <StatCard
              label="Credits balance"
              value={credits}
              icon={Coins}
              to="/studio"
              tone={credits < 50 ? 'warning' : 'default'}
            />
            <StatCard
              label="Connections needing attention"
              value={needsAttention}
              icon={AlertTriangle}
              to="/connections"
              tone={needsAttention > 0 ? 'warning' : 'default'}
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* The literal "dashboard with all the pages" — this grid mirrors
                the rail exactly, so there is never a corner of the product
                reachable only from one of them. */}
            <section aria-label="Go to" className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold">Go to</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUICK_LINKS.map(({ to, label, description, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon aria-hidden className="size-4 text-muted-foreground" />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-label="Notifications and activity" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Bell aria-hidden className="size-4" /> Notifications &amp; activity
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

              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(next) => next && setFilter(next as FeedFilter)}
                className="justify-start"
                aria-label="Filter the feed"
              >
                <ToggleGroupItem value="all" className="text-xs">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="notifications" className="text-xs">
                  Notifications
                </ToggleGroupItem>
                <ToggleGroupItem value="activity" className="text-xs">
                  Activity
                </ToggleGroupItem>
              </ToggleGroup>

              {feed.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Nothing here yet"
                  description={MESSAGES.empty.noNotifications}
                />
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {feed.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                      <span className={cn('text-sm', item.unread && 'font-medium')}>
                        {item.message}
                      </span>
                      <MonoNumber
                        value={relativeTime(item.at)}
                        className="shrink-0 text-xs text-muted-foreground"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  )
}
