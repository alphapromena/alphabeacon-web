/**
 * G1 — Analytics overview · `/analytics`
 * G2 — Channel detail · `/analytics/:connectionId`
 *
 * The honesty rules from C3/C4 carry through here unchanged, because this is
 * where they are easiest to break:
 *
 *   - a metric nobody reported is ABSENT, never 0. A channel that has not
 *     synced says so and is excluded from the org totals, and the totals say
 *     they are partial rather than quietly under-counting.
 *   - a platform that only ever reports part of the picture gets a written
 *     explanation, not an empty chart that reads as "nothing happened".
 *   - a delta with no comparable prior period is not shown at all.
 */
import { ChartLine, Plug } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { AppShell } from '@/components/ab/app-shell'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid, SkeletonStatRow } from '@/components/ab/skeletons'
import { StatCard } from '@/components/ab/stat-card'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  useAnalytics,
  useConnections,
  useDataDispatch,
  useScreenPhase,
  useTones,
} from '@/data/provider'
import type { AnalyticsSeries, Connection } from '@/data/types'
import { shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { PLATFORMS } from '@/features/connections/platforms'
import {
  comparisonNote,
  deltaPercent,
  growth,
  inRange,
  periodSlice,
  priorSlice,
  RANGES,
  rangeLabel,
  sum,
  type RangeDays,
} from './range'
import { Sparkline } from './sparkline'

/** The three metrics a channel can report, and how each is summarised. */
const METRICS = [
  { key: 'reach', label: 'Reach', kind: 'total' },
  { key: 'engagement', label: 'Engagement', kind: 'total' },
  { key: 'followers', label: 'Followers', kind: 'level' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

/** A channel only offers a metric it actually reported — no empty axes. */
function availableMetrics(series?: AnalyticsSeries): MetricKey[] {
  if (!series) return []
  return METRICS.filter((metric) => series[metric.key].length > 0).map((metric) => metric.key)
}

function RangePicker({
  value,
  onChange,
}: {
  value: RangeDays
  onChange: (next: RangeDays) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(next) => next && onChange(Number(next) as RangeDays)}
      aria-label="Date range"
      className="justify-start"
    >
      {RANGES.map((days) => (
        <ToggleGroupItem key={days} value={String(days)} className="text-xs">
          {rangeLabel(days)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// ---------------------------------------------------------------------------
// G1 — Overview
// ---------------------------------------------------------------------------

export function AnalyticsOverviewScreen() {
  const connections = useConnections()
  const analytics = useAnalytics()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [days, setDays] = useState<RangeDays>(7)

  // A channel belongs here when it is connected AND allowed to report. Whether
  // it HAS reported is a different question, answered per card.
  const channels = connections.filter(
    (connection) => connection.status !== 'not_connected' && connection.permissions.analytics,
  )
  const seriesFor = (connection: Connection) =>
    analytics.find((series) => series.connectionId === connection.id)

  const reporting = channels.map(seriesFor).filter((s): s is AnalyticsSeries => Boolean(s?.synced))
  const pending = channels.length - reporting.length

  const totals = useMemo(() => {
    const reach = sum(reporting.flatMap((series) => periodSlice(series.reach, days)))
    const priorReach = sum(reporting.flatMap((series) => priorSlice(series.reach, days)))
    const engagement = sum(reporting.flatMap((series) => periodSlice(series.engagement, days)))
    const priorEngagement = sum(reporting.flatMap((series) => priorSlice(series.engagement, days)))
    const followers = reporting.reduce(
      (total, series) => total + growth(periodSlice(series.followers, days)),
      0,
    )
    const priorFollowers = reporting.reduce(
      (total, series) => total + growth(priorSlice(series.followers, days)),
      0,
    )
    // The same post goes out on several channels; the org published it once.
    const key = (post: { title: string; publishedAt: string }) =>
      `${post.title}|${post.publishedAt}`
    const published = new Set(
      reporting.flatMap((series) =>
        series.posts.filter((post) => inRange(post.publishedAt, days)).map(key),
      ),
    ).size
    const priorPublished = new Set(
      reporting.flatMap((series) =>
        series.posts
          .filter((post) => inRange(post.publishedAt, days * 2) && !inRange(post.publishedAt, days))
          .map(key),
      ),
    ).size
    return {
      reach,
      engagement,
      followers,
      published,
      reachDelta: deltaPercent(reach, priorReach),
      engagementDelta: deltaPercent(engagement, priorEngagement),
      followersDelta: deltaPercent(followers, priorFollowers),
      publishedDelta: deltaPercent(published, priorPublished),
    }
  }, [reporting, days])

  const period = `previous ${days} days`
  // Why a comparison is missing, so an absent delta reads as honest rather
  // than as a card that failed to render.
  const priorWindow = reporting[0] ? priorSlice(reporting[0].labels, days).length : 0
  const note = comparisonNote(priorWindow, days)

  return (
    <AppShell title="Analytics" context="Reach, engagement, and what it came from">
      {phase === 'loading' ? (
        <div className="flex flex-col gap-6">
          <SkeletonStatRow label="Loading analytics" />
          <SkeletonCardGrid cards={3} columns={3} />
        </div>
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : channels.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="No channels reporting yet"
          description={MESSAGES.empty.noAnalytics}
          action={
            <Button asChild>
              <Link to="/connections">
                <Plug aria-hidden />
                Go to Connections
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <RangePicker value={days} onChange={setDays} />

          <section
            aria-label="Summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="Total reach"
              value={totals.reach}
              delta={
                totals.reachDelta === undefined ? undefined : { percent: totals.reachDelta, period }
              }
              deltaNote={totals.reachDelta === undefined ? note : undefined}
            />
            <StatCard
              label="Total engagement"
              value={totals.engagement}
              delta={
                totals.engagementDelta === undefined
                  ? undefined
                  : { percent: totals.engagementDelta, period }
              }
              deltaNote={totals.engagementDelta === undefined ? note : undefined}
            />
            <StatCard
              label="Posts published"
              value={totals.published}
              delta={
                totals.publishedDelta === undefined
                  ? undefined
                  : { percent: totals.publishedDelta, period }
              }
              deltaNote={totals.publishedDelta === undefined ? note : undefined}
            />
            <StatCard
              label="Follower growth"
              value={totals.followers}
              delta={
                totals.followersDelta === undefined
                  ? undefined
                  : { percent: totals.followersDelta, period }
              }
              deltaNote={totals.followersDelta === undefined ? note : undefined}
            />
          </section>

          {/* Partial coverage is stated, not absorbed. A total that quietly
              omits a channel is a wrong number wearing a right one's clothes. */}
          {pending > 0 && (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <MonoNumber value={pending} /> of <MonoNumber value={channels.length} /> channels have
              not reported for this range, so these totals leave them out.
            </p>
          )}

          <section aria-label="Channels" className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">By channel</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((connection) => (
                <ChannelCard
                  key={connection.id}
                  connection={connection}
                  series={seriesFor(connection)}
                  days={days}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

function ChannelCard({
  connection,
  series,
  days,
}: {
  connection: Connection
  series?: AnalyticsSeries
  days: RangeDays
}) {
  const platform = PLATFORMS[connection.platform]
  const Icon = platform.icon
  const reported = series?.synced === true

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          <span className="font-medium">{platform.label}</span>
          {connection.handle && (
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{connection.handle}
            </span>
          )}
        </div>

        {!reported ? (
          <>
            <p className="text-sm text-muted-foreground">{MESSAGES.notices.syncPending}</p>
            {connection.status === 'needs_reauth' && (
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link to="/connections">Reconnect it</Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <Sparkline
              values={periodSlice(series.reach.length > 0 ? series.reach : series.followers, days)}
              label={`${platform.label} trend`}
            />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {series.reach.length > 0 && (
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Reach</dt>
                  <dd>
                    <MonoNumber value={sum(periodSlice(series.reach, days))} />
                  </dd>
                </div>
              )}
              {series.engagement.length > 0 && (
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Engagement</dt>
                  <dd>
                    <MonoNumber value={sum(periodSlice(series.engagement, days))} />
                  </dd>
                </div>
              )}
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">Follower growth</dt>
                <dd>
                  <MonoNumber value={growth(periodSlice(series.followers, days))} />
                </dd>
              </div>
            </dl>
          </>
        )}

        {series?.limited && (
          <p className="text-xs text-muted-foreground">
            Limited reporting — see the channel for what this platform will and will not share.
          </p>
        )}

        <Button asChild variant="ghost" size="sm" className="mt-auto w-fit">
          <Link to={`/analytics/${connection.id}`}>View details →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// G2 — Channel detail
// ---------------------------------------------------------------------------

type SortKey = 'publishedAt' | 'reach' | 'engagement'

export function ChannelDetailScreen() {
  const { connectionId } = useParams()
  const connections = useConnections()
  const analytics = useAnalytics()
  const tones = useTones()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [days, setDays] = useState<RangeDays>(7)
  const [sort, setSort] = useState<SortKey>('publishedAt')

  const connection = connections.find((c) => c.id === connectionId)
  const series = analytics.find((s) => s.connectionId === connectionId)
  const metrics = availableMetrics(series)
  const [metric, setMetric] = useState<MetricKey>('reach')
  const shownMetric = metrics.includes(metric) ? metric : (metrics[0] ?? 'followers')

  const platform = connection ? PLATFORMS[connection.platform] : undefined
  const title = platform ? platform.label : 'Channel'

  const posts = (series?.posts ?? []).filter((post) => inRange(post.publishedAt, days))
  const sorted = [...posts].sort((a, b) => {
    if (sort === 'publishedAt') return b.publishedAt.localeCompare(a.publishedAt)
    return (b.metrics?.[sort] ?? -1) - (a.metrics?.[sort] ?? -1)
  })

  const chartData =
    series && metrics.includes(shownMetric)
      ? periodSlice(series.labels, days).map((label, index) => ({
          label,
          value: periodSlice(series[shownMetric], days)[index],
        }))
      : []

  const chartConfig: ChartConfig = {
    value: {
      label: METRICS.find((m) => m.key === shownMetric)?.label,
      color: 'var(--chart-1)',
    },
  }

  // Secondary chips, each computed only where the numbers exist to compute it.
  const reported = posts.filter((post) => post.metrics)
  const engagementRate =
    reported.length > 0 && sum(reported.map((p) => p.metrics?.reach ?? 0)) > 0
      ? Math.round(
          (sum(reported.map((p) => p.metrics?.engagement ?? 0)) /
            sum(reported.map((p) => p.metrics?.reach ?? 0))) *
            1000,
        ) / 10
      : undefined
  const best = reported.reduce<(typeof reported)[number] | undefined>(
    (top, post) =>
      !top || (post.metrics?.engagement ?? 0) > (top.metrics?.engagement ?? 0) ? post : top,
    undefined,
  )
  const bestTone = tones.find((tone) => tone.id === best?.toneId)

  if (!connection) {
    return (
      <AppShell title="Channel">
        <ErrorState
          title="No such channel"
          message="That connection is not in this workspace. Pick one from the overview."
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      title={title}
      context={connection.handle ? `@${connection.handle}` : 'Channel performance'}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link to="/analytics">← All channels</Link>
        </Button>
      }
    >
      {phase === 'loading' ? (
        <div className="flex flex-col gap-6">
          <SkeletonStatRow cards={3} label="Loading channel analytics" />
          <SkeletonCardGrid cards={1} columns={2} />
        </div>
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <RangePicker value={days} onChange={setDays} />

          {series?.limited && (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {MESSAGES.notices.limitedAnalytics}
            </p>
          )}
          {series && !series.synced && (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {MESSAGES.notices.syncPending}
            </p>
          )}

          <section aria-label="Trend" className="flex flex-col gap-3">
            {metrics.length > 1 && (
              <ToggleGroup
                type="single"
                value={shownMetric}
                onValueChange={(next) => next && setMetric(next as MetricKey)}
                aria-label="Metric"
                className="justify-start"
              >
                {metrics.map((key) => (
                  <ToggleGroupItem key={key} value={key} className="text-xs">
                    {METRICS.find((m) => m.key === key)?.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {chartData.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing to chart for this range.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis width={48} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="value"
                    type="monotone"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </section>

          <section aria-label="Highlights" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Avg. engagement rate</p>
                {engagementRate === undefined ? (
                  <p className="text-sm text-muted-foreground">Not reported yet</p>
                ) : (
                  <MonoNumber value={`${engagementRate}%`} className="text-2xl font-semibold" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Best-performing tone</p>
                {bestTone ? (
                  <div className="pt-1">
                    <ToneBadge tone={bestTone} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not enough posts yet</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Posts in this range</p>
                <MonoNumber value={posts.length} className="text-2xl font-semibold" />
              </CardContent>
            </Card>
          </section>

          <section aria-label="Recent posts" className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">Recent posts</h2>
            {sorted.length === 0 ? (
              <EmptyState
                icon={ChartLine}
                title="Nothing published here yet"
                description={MESSAGES.empty.noPublishedPosts}
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Post
                      </th>
                      <SortableHeader
                        label="Published"
                        active={sort === 'publishedAt'}
                        onClick={() => setSort('publishedAt')}
                      />
                      <SortableHeader
                        label="Reach"
                        active={sort === 'reach'}
                        onClick={() => setSort('reach')}
                      />
                      <SortableHeader
                        label="Engagement"
                        active={sort === 'engagement'}
                        onClick={() => setSort('engagement')}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((post) => (
                      <tr
                        key={`${post.title}-${post.publishedAt}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="size-9 shrink-0 rounded-md bg-brand"
                            />
                            <span className="line-clamp-2 max-w-[36ch]">{post.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <MonoNumber value={shortDate(post.publishedAt)} />
                        </td>
                        <td className="px-4 py-3">
                          {post.metrics ? (
                            <MonoNumber value={post.metrics.reach} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Syncing…</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {post.metrics ? (
                            <MonoNumber value={post.metrics.engagement} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Syncing…</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}

function SortableHeader({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <th scope="col" aria-sort={active ? 'descending' : 'none'} className="px-4 py-2 font-medium">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {label}
        <span aria-hidden className={active ? 'text-primary' : 'text-muted-foreground/50'}>
          ↓
        </span>
      </button>
    </th>
  )
}
