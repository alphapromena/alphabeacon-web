/**
 * /dev/kitchen-sink — every ab/ primitive on one page, in one scroll.
 *
 * It exists because the design layer is a system, not a pile of components:
 * W1's verify runs axe over this route in BOTH themes and the reduced-motion
 * assertion walks the motion section here, so a primitive missing from this
 * page is a primitive nobody checked in dark, at AA, or with motion off. New
 * ab/ work lands here in the same change that adds it.
 *
 * It renders outside AppShell on purpose: the shell is itself under review, and
 * a gallery nested inside the thing it is meant to expose can hide a failure in
 * either one.
 *
 * The fixtures below are local literals, and only here. Screens read through
 * DataProvider hooks; this page renders components, not data, so a dataset
 * would only add a moving part between the reviewer and the primitive.
 */
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Inbox, PlugZap, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'

import { ClaimChip } from '@/components/ab/claim-chip'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { Form, FormActions, SwitchField, TextField } from '@/components/ab/form'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot, SignalSweep } from '@/components/ab/motion'
import { PageHeader } from '@/components/ab/page-header'
import {
  SkeletonCardGrid,
  SkeletonForm,
  SkeletonList,
  SkeletonStatRow,
  SkeletonText,
} from '@/components/ab/skeletons'
import { SlotChip } from '@/components/ab/slot-chip'
import { StatCard } from '@/components/ab/stat-card'
import {
  ConnectionStatusBadge,
  DraftStatusBadge,
  JobStatusBadge,
} from '@/components/ab/status-badge'
import { ThemeToggle } from '@/components/ab/theme-toggle'
import { toastError, toastInfo, toastSuccess } from '@/components/ab/toast'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Claim, ConnectionStatus, JobStatus, Slot, Tone } from '@/data/types'
import { DRAFT_STATUSES } from '@/lib/draft-status'
import { MESSAGES } from '@/lib/messages'

// ---------------------------------------------------------------------------
// Fixtures — display only. Iterated, never hand-listed, so a status added
// upstream shows up on this page without anyone remembering to add it.
// ---------------------------------------------------------------------------

const CONNECTION_STATUSES: readonly ConnectionStatus[] = [
  'not_connected',
  'active',
  'needs_reauth',
  'revoked',
]

const JOB_STATUSES: readonly JobStatus[] = ['queued', 'running', 'succeeded', 'failed']

const SLOT_STATUSES: readonly Slot['status'][] = [
  'pending',
  'generating',
  'review',
  'done',
  'skipped',
]

/** One of every kind of number the product shows, so mono figures can be compared. */
const NUMBER_SPECIMENS: { label: string; value: number | string }[] = [
  { label: 'Credits left', value: 1284 },
  { label: 'Drafts waiting', value: 12 },
  { label: 'Engagement', value: '4.8%' },
  { label: 'Next slot', value: '09:00' },
  { label: 'Draft id', value: 'draft-8f21c4' },
]

const VERIFIED_CLAIM: Claim = {
  id: 'claim-verified',
  source: 'reuters.com/markets/commodities',
  title: 'Brent crude settled higher on Tuesday, its third straight gain.',
  state: 'verified',
}

const FLAGGED_CLAIM: Claim = {
  id: 'claim-flagged',
  source: 'marketwire-daily.com/opinion/outlook',
  title: 'An opinion column we could not corroborate against a primary source.',
  state: 'flagged',
}

const PRESET_TONE: Tone = {
  id: 'tone-analyst',
  name: 'Analyst',
  kind: 'preset',
  description: 'Measured, figures first, no adjective doing a number the work.',
  rules: { do: ['Lead with the figure'], dont: ['Predict prices'] },
}

const CUSTOM_TONE: Tone = {
  id: 'tone-desk-note',
  name: 'Desk note',
  kind: 'custom',
  description: 'The way this desk actually writes to its clients.',
  rules: { do: ['Name the source'], dont: ['Reach for hype words'] },
}

// ---------------------------------------------------------------------------
// Page furniture
// ---------------------------------------------------------------------------

/**
 * One section, one h2, one purpose line. Keeping the outline in a component is
 * what stops the gallery from growing a second h1 or skipping a level — axe
 * checks heading order, and this page is the axe target.
 */
function Section({
  title,
  purpose,
  children,
}: {
  title: string
  purpose: string
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{purpose}</p>
      </div>
      {children}
    </section>
  )
}

/** A labelled row of specimens, so a reviewer knows which variant they're looking at. */
function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs tracking-wider text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  )
}

/** The note under a specimen — what to look for, or what the law says about it. */
function Caption({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-xs text-muted-foreground">{children}</p>
}

/**
 * A real form, not a screenshot of one: the reviewer submits it empty and reads
 * the catalogued sentence the schema names, which is exactly what W1 verifies.
 */
const scheduleSchema = z.object({
  timezone: z.string().min(1, MESSAGES.errors.timezoneRequired),
  attachToEvents: z.boolean(),
})

type ScheduleValues = z.infer<typeof scheduleSchema>

function KitchenSinkForm() {
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { timezone: '', attachToEvents: false },
  })
  // The label persists through the flow: Save schedule → Saved, and back again
  // once an edit means there is something new to save.
  const [saved, setSaved] = useState(false)
  const settled = saved && !form.formState.isDirty

  return (
    <Form
      form={form}
      className="max-w-md"
      onSubmit={(values) => {
        // Re-baselining the defaults is what makes `isDirty` answer the real
        // question: has anything changed since the last save?
        form.reset(values)
        setSaved(true)
        toastSuccess('Schedule saved', { description: 'New slots follow it from tonight.' })
      }}
    >
      <TextField
        name="timezone"
        label="Timezone"
        description="Slots are scheduled in this timezone."
        placeholder="Asia/Amman"
      />
      <SwitchField
        name="attachToEvents"
        label="Generate around calendar events"
        description="A slot near an event borrows its name and date."
      />
      <FormActions>
        <Button type="submit">{settled ? 'Saved' : 'Save schedule'}</Button>
      </FormActions>
    </Form>
  )
}

// ---------------------------------------------------------------------------
// The gallery
// ---------------------------------------------------------------------------

export function DevKitchenSinkScreen() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4">
          <PageHeader
            eyebrow="Dev"
            title="Kitchen sink"
            description="Every ab/ primitive on one page, so the design layer can be reviewed and axe-scanned in light and dark."
            actions={<ThemeToggle />}
          />
          <nav aria-label="Dev pages" className="flex flex-wrap items-center gap-4 text-sm">
            <Link className="underline underline-offset-4" to="/">
              App
            </Link>
            <Link className="underline underline-offset-4" to="/dev/datasets">
              Datasets
            </Link>
            <Link className="underline underline-offset-4" to="/dev/states">
              States
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        <Section
          title="Typography and numbers"
          purpose="The three faces, the heading scale, and every number that matters going through MonoNumber."
        >
          <Specimen label="Faces">
            <div className="flex flex-col gap-2">
              <p className="font-display text-xl">Space Grotesk — display, for titles</p>
              <p className="font-sans text-base">Geist — interface text, labels, and body copy</p>
              <p className="font-mono text-base">Geist Mono — figures, times, and identifiers</p>
            </div>
          </Specimen>

          <Specimen label="Scale">
            <div className="flex flex-col gap-2">
              <p className="font-display text-2xl font-semibold tracking-tight">Page title</p>
              <p className="font-display text-lg font-semibold tracking-tight">Section title</p>
              <p className="text-sm">Body copy sits here — calm, concrete, sentence case.</p>
              <p className="text-xs text-muted-foreground">Caption and helper text</p>
            </div>
          </Specimen>

          <Specimen label="Numbers">
            <dl className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
              {NUMBER_SPECIMENS.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
                >
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd>
                    <MonoNumber value={value} className="text-sm font-medium" />
                  </dd>
                </div>
              ))}
            </dl>
            <Caption>
              Counts, credits, percentages, times, and ids all render through MonoNumber, so figures
              line up column to column and never drift into the UI face.
            </Caption>
          </Specimen>
        </Section>

        <Section
          title="Status badges"
          purpose="Every draft, connection, and job status — each an icon plus a word, so status is never color alone."
        >
          <Specimen label="Draft">
            <div className="flex flex-wrap gap-2">
              {DRAFT_STATUSES.map((status) => (
                <DraftStatusBadge key={status} status={status} />
              ))}
            </div>
          </Specimen>

          <Specimen label="Connection">
            <div className="flex flex-wrap gap-2">
              {CONNECTION_STATUSES.map((status) => (
                <ConnectionStatusBadge key={status} status={status} />
              ))}
            </div>
          </Specimen>

          <Specimen label="Studio job">
            <div className="flex flex-wrap gap-2">
              {JOB_STATUSES.map((status) => (
                <JobStatusBadge key={status} status={status} />
              ))}
            </div>
          </Specimen>

          <Caption>
            Read this section in greyscale: every badge still says what it means, because the word
            and the glyph carry the status and the tint only agrees with them.
          </Caption>
        </Section>

        <Section
          title="Claim chips"
          purpose="Grounding travels with the claim — source, verification state, and an optional figure."
        >
          <div className="flex flex-wrap items-center gap-3">
            <ClaimChip claim={VERIFIED_CLAIM} />
            <ClaimChip claim={VERIFIED_CLAIM} count={1284} />
            <ClaimChip claim={FLAGGED_CLAIM} />
            <ClaimChip claim={FLAGGED_CLAIM} count={37} />
          </div>
          <Caption>
            Tab to a chip to reach its full title — the grounding is keyboard-reachable, not
            hover-only. A flagged claim shows flagged; it is never quietly dropped. Figures count up
            once on mount, and reduced motion shows them settled instead.
          </Caption>
        </Section>

        <Section
          title="Stat cards"
          purpose="One metric per tile: the value always mono, a warning always carrying an icon and a word."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Drafts waiting"
              value={12}
              icon={Inbox}
              hint="Review them before tonight's slot."
              to="/dev/states"
            />
            <StatCard
              label="Published this week"
              value={34}
              icon={Send}
              hint="Across four connected accounts."
            />
            <StatCard
              label="Credits left"
              value={180}
              tone="warning"
              hint="Enough for two more video jobs."
              to="/dev/datasets"
            />
            <StatCard
              label="Accounts needing re-auth"
              value={1}
              tone="warning"
              icon={PlugZap}
              hint="Reconnect to keep publishing."
            />
          </div>
          <Caption>
            The first and third tiles are links — tab through them to check the focus ring survives
            in both themes. The warning tiles carry a hidden status word beside the tint.
          </Caption>
        </Section>

        <Section
          title="Slot chips"
          purpose="The calendar day cell at its real density, in every status a slot can hold."
        >
          <Specimen label="Statuses">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SLOT_STATUSES.map((status) => (
                <SlotChip key={status} time="09:00" status={status} toneName="Analyst" />
              ))}
            </div>
          </Specimen>

          <Specimen label="With an event and with a metric">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <SlotChip time="12:30" status="review" eventName="Eid al-Adha" toneName="Warm" />
              <SlotChip time="18:00" status="done" toneName="Analyst" metric="1.2k reach" />
            </div>
          </Specimen>

          <Caption>
            A month grid has room for a dot, not a badge, so this is the one place where color is
            the only visible cue — and it pays for that by putting the status word in every chip's
            accessible name.
          </Caption>
        </Section>

        <Section title="Tone badges" purpose="A tone's name, wherever a tone is shown.">
          <div className="flex flex-wrap items-center gap-3">
            <ToneBadge tone={PRESET_TONE} />
            <ToneBadge tone={CUSTOM_TONE} />
          </div>
          <Caption>
            One of these is a preset and one is written by the user, and there is no way to tell
            which from the badge. That is the law: no accent dot, no "Custom" suffix, no quieter
            variant. If these two ever stop looking identical, the law broke.
          </Caption>
        </Section>

        <Section
          title="Empty state"
          purpose="Nothing here yet, plus the next step — the copy comes from the message catalogue."
        >
          <EmptyState
            icon={Inbox}
            title="No drafts yet"
            description={MESSAGES.empty.noDrafts}
            action={
              <Button asChild>
                <Link to="/dev/datasets">Switch dataset</Link>
              </Button>
            }
          />
          <Caption>
            An empty state without an invitation is a dead end, so the action slot is where the flow
            this screen is missing actually starts.
          </Caption>
        </Section>

        <Section
          title="Error state"
          purpose="What happened and how to fix it, with a retry that really runs."
        >
          <ErrorState
            message={MESSAGES.errors.screenLoadFailed}
            onRetry={() =>
              toastInfo('Retry sent', { description: 'This dev page has nothing to reload.' })
            }
          />
          <Caption>
            The whole block is one alert, so assistive tech hears the title, the explanation, and
            the way out in a single announcement.
          </Caption>
        </Section>

        <Section
          title="Skeletons"
          purpose="The wait, shaped like the content it stands in for, so nothing jumps when data lands."
        >
          <Specimen label="Text">
            <SkeletonText lines={3} />
          </Specimen>
          <Specimen label="Stat row">
            <SkeletonStatRow />
          </Specimen>
          <Specimen label="List">
            <SkeletonList rows={3} />
          </Specimen>
          <Specimen label="Card grid">
            <SkeletonCardGrid cards={3} columns={3} />
          </Specimen>
          <Specimen label="Form">
            <SkeletonForm fields={2} />
          </Specimen>
          <Caption>
            Each pattern announces itself as busy and hides its placeholder shapes from assistive
            tech. The pulse is the one loading animation this product allows.
          </Caption>
        </Section>

        <Section
          title="Confirm dialog"
          purpose="Destructive actions name what they cost, before they run."
        >
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete tone</Button>}
            title="Delete this tone?"
            consequence="Drafts already using it keep their copy, but you won't be able to select it for new ones."
            confirmLabel="Delete tone"
            onConfirm={() =>
              toastSuccess('Tone deleted', {
                description: 'Drafts already using it kept their copy.',
              })
            }
          />
          <Caption>
            The consequence is a required prop, so a bare "Are you sure?" cannot compile. The
            confirm button repeats the verb from the trigger rather than saying OK.
          </Caption>
        </Section>

        <Section
          title="Toasts"
          purpose="Three verbs and no fourth: success, error with a way out, and information."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                toastSuccess('Draft approved', { description: 'Media generation is next.' })
              }
            >
              Fire a success toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toastError(MESSAGES.errors.generic, {
                  retry: { label: 'Try again', onClick: () => toastInfo('Retry sent') },
                })
              }
            >
              Fire an error toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toastInfo('Generation queued', {
                  description: 'The draft appears here when it finishes.',
                })
              }
            >
              Fire an info toast
            </Button>
          </div>
          <Caption>
            An error toast carries the way out of the failure and nothing else — that is why the
            wrapper takes a retry rather than a free-form action.
          </Caption>
        </Section>

        <Section
          title="Motion"
          purpose="The only two animations in this product, and the reduced-motion promise about both."
        >
          <Specimen label="Beacon dot">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <BeaconDot live label="Something needs attention" />
                Live — the ring pulses only while something needs attention
              </span>
              <span className="flex items-center gap-2">
                <BeaconDot />
                Idle — no pulse, no glow
              </span>
            </div>
          </Specimen>

          <Specimen label="Signal sweep">
            {/* The sweep is absolutely positioned, so the Card owns the containing block. */}
            <Card className="relative overflow-hidden">
              <SignalSweep active />
              <CardHeader>
                <CardTitle className="text-base">Generating…</CardTitle>
                <CardDescription>
                  A gradient line sweeps the top edge while work is in flight.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                It stops when the work does. The sweep reports a state; it is not decoration.
              </CardContent>
            </Card>
          </Specimen>

          <Caption>
            Under prefers-reduced-motion both are removed outright rather than slowed — the pulse
            and the sweep stop rendering, and the count-up in a claim chip hands over the finished
            figure on its first frame.
          </Caption>
        </Section>

        <Section
          title="Form"
          purpose="One live form — submit it empty and the sentence you read is the one the schema names."
        >
          <KitchenSinkForm />
          <Caption>
            The form is noValidate, so the browser never wins the race with its own wording. The
            message comes from the catalogue, and it is attached to the control assistive tech is
            sitting on, not floating beside it.
          </Caption>
        </Section>
      </main>
    </div>
  )
}
