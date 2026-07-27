/**
 * Status badges — the "status is never color-only" law made reusable.
 *
 * Color alone vanishes in grayscale, under common color-vision deficiencies,
 * and in a screen reader. `StatusBadge` welds an icon and a text label into one
 * element and exposes no prop combination that yields a bare colored dot, so a
 * caller cannot accidentally ship a status that only sighted users can read.
 *
 * Each family maps its domain status through one exhaustive `Record` with no
 * default branch: a status added upstream fails the typecheck until someone
 * decides its copy, tone, and icon. The compiler carries the law, not review.
 */
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  ImageIcon,
  Inbox,
  Loader,
  PlugZap,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConnectionStatus, JobStatus } from '@/data/types'
import type { DraftStatus } from '@/lib/draft-status'
import { cn } from '@/lib/utils'

/** A reading, not a palette — features name the meaning and the theme picks the color. */
export type StatusTone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger'

/**
 * Semantic tokens only (ab/no-raw-color). The /10 washes keep the fill quiet so
 * the label does the talking and the text keeps its AA contrast in both themes.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-secondary text-secondary-foreground',
  progress: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
}

/**
 * The one place a status renders. Callers choose the words and the meaning,
 * never whether the non-color cue exists.
 */
export function StatusBadge({
  label,
  tone,
  icon: Icon,
  className,
}: {
  label: string
  tone: StatusTone
  /** Decorative by construction: the label already carries the meaning. */
  icon: LucideIcon
  className?: string
}) {
  return (
    <Badge variant="secondary" className={cn(TONE_CLASSES[tone], className)}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

type StatusMeta = { label: string; tone: StatusTone; icon: LucideIcon }

/**
 * Sentence case, and the label persists through the flow that produced it, so a
 * draft never changes vocabulary between the button that moved it and the badge
 * that reports it. `Loader` deliberately does not spin: `ab/motion` holds the
 * product's only two animations, so work in flight reads from the word.
 */
const DRAFT_STATUS_META: Record<DraftStatus, StatusMeta> = {
  pending_review: { label: 'Needs review', tone: 'info', icon: Inbox },
  approved: { label: 'Approved', tone: 'success', icon: CheckCircle2 },
  media_pending: { label: 'Generating…', tone: 'progress', icon: Loader },
  media_ready: { label: 'Media ready', tone: 'success', icon: ImageIcon },
  scheduled: { label: 'Scheduled', tone: 'info', icon: CalendarClock },
  published: { label: 'Published', tone: 'success', icon: Send },
  rejected: { label: 'Rejected', tone: 'neutral', icon: XCircle },
  expired: { label: 'Expired', tone: 'neutral', icon: Clock },
  publish_failed: { label: 'Publish failed', tone: 'danger', icon: AlertTriangle },
}

/** Where a draft stands in the state machine, in the same words the buttons use. */
export function DraftStatusBadge({
  status,
  className,
}: {
  status: DraftStatus
  className?: string
}) {
  const { label, tone, icon } = DRAFT_STATUS_META[status]
  return <StatusBadge label={label} tone={tone} icon={icon} className={className} />
}

/**
 * `needs_reauth` is warning, not danger: the connection keeps its history and
 * the fix is one sign-in away, so the badge must not read like a failure.
 */
const CONNECTION_STATUS_META: Record<ConnectionStatus, StatusMeta> = {
  not_connected: { label: 'Not connected', tone: 'neutral', icon: PlugZap },
  active: { label: 'Active', tone: 'success', icon: CheckCircle2 },
  needs_reauth: { label: 'Needs re-auth', tone: 'warning', icon: AlertTriangle },
  revoked: { label: 'Revoked', tone: 'danger', icon: Ban },
}

/** Whether a platform connection can actually publish right now. */
export function ConnectionStatusBadge({
  status,
  className,
}: {
  status: ConnectionStatus
  className?: string
}) {
  const { label, tone, icon } = CONNECTION_STATUS_META[status]
  return <StatusBadge label={label} tone={tone} icon={icon} className={className} />
}

/** Studio jobs borrow the draft vocabulary so both queues read the same way. */
const JOB_STATUS_META: Record<JobStatus, StatusMeta> = {
  queued: { label: 'Queued', tone: 'neutral', icon: Clock },
  running: { label: 'Running', tone: 'progress', icon: Loader },
  succeeded: { label: 'Succeeded', tone: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'danger', icon: XCircle },
}

/** Where a studio job stands, without a spinner standing in for a sentence. */
export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const { label, tone, icon } = JOB_STATUS_META[status]
  return <StatusBadge label={label} tone={tone} icon={icon} className={className} />
}
