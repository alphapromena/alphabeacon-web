/**
 * F1 in live mode (INT-10, decisions.md D-INT-G).
 *
 * DEVIATION FROM screens4.md F1, recorded rather than hidden: the spec asks
 * for a token stream and the full D2 action row. The proxy has no stream
 * endpoint and no drafts store, so this ships the honest subset — a queued run
 * with calm progress, then READ-ONLY drafts whose only actions are Copy and
 * Create visual. Approve, decline and schedule are ABSENT, not disabled: an
 * approval that cannot be recorded anywhere would be a button that lies.
 *
 * Three things it must never do, each learned from the contract:
 * - invent a stream (there is nothing to stream from);
 * - hide a guardrail flag or an attribution (both are rendered inline; the
 *   upstream terms require sources to stay visible);
 * - lose a result (there is no list-runs endpoint, so the PROPOSALS ledger is
 *   the way back to one — INT-12 retired the localStorage cache that used to
 *   stand in for it).
 */
import { Copy, Image as ImageIcon, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { InsufficientBalance } from '@/components/ab/insufficient-balance'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  draftsFromRun,
  isRunTerminal,
  useGenerateActions,
  type GenerationPlan,
  type GenerationRun,
  type LiveDraft,
} from '@/data/generate'
import { useProposalActions, type ReviewItem } from '@/data/proposals'
import { useCalendarEvents, useTones } from '@/data/provider'
import { useWallet, useWalletActions } from '@/data/wallet'
import { planRun, reconcileSelection } from './run-plan'
import { errorReference } from '@/lib/error-reference'
import { pluralize, shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MESSAGES } from '@/lib/messages'

/** D-INT-D: the run vocabulary, mapped straight onto the app's model names. */
const PLANS: { id: GenerationPlan; label: string; hint: string }[] = [
  { id: 'balanced', label: 'Balanced', hint: 'Grounded in your brand, sources and knowledge.' },
  { id: 'creative', label: 'Creative', hint: 'Grounded in a curated web search instead.' },
  { id: 'precise', label: 'Precise', hint: 'The most careful writer, also web-grounded.' },
]

/** 1.5s → 3s → 5s, then steady, stopping at 90s (the order's schedule). */
const POLL_DELAYS = [1500, 3000, 5000, 5000, 5000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000]
const POLL_CEILING_MS = 90_000

export function LiveGenerate() {
  const tones = useTones()
  const occasions = useCalendarEvents()
  const generate = useGenerateActions()
  const proposals = useProposalActions()
  const wallet = useWallet()
  const walletActions = useWalletActions()

  const [selected, setSelected] = useState<string[]>(() => tones.slice(0, 1).map((t) => t.id))
  const [plan, setPlan] = useState<GenerationPlan>('balanced')
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [perTone, setPerTone] = useState<1 | 2>(1)
  const [occasionId, setOccasionId] = useState('')
  const [notes, setNotes] = useState('')

  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'failed' | 'slow'>('idle')
  const [drafts, setDrafts] = useState<LiveDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shortBalance, setShortBalance] = useState(false)
  const [recent, setRecent] = useState<ReviewItem[]>([])
  const cancelled = useRef(false)

  // The unmount guard is its OWN effect, with no dependencies. Sharing it with
  // the ledger effect latched `cancelled` to true the first time `orgId`
  // changed — and because nothing ever reset it, every later poll returned at
  // its first check and the screen sat on "Writing your drafts…" forever.
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  /**
   * "Recent runs" is the PROPOSALS ledger now, not a localStorage cache
   * (D-INT-J). It survives a reload, follows the user to another device, and
   * shows runs this browser never started — which the old ledger could not do
   * by construction.
   */
  const loadRecent = useCallback(async () => {
    const result = await proposals.review('pending', 1)
    if (!cancelled.current) setRecent(result.items)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- per org
  }, [generate.orgId])

  useEffect(() => {
    void loadRecent()
  }, [loadRecent])

  /**
   * Tones arrive from the live sync AFTER first paint and REPLACE the seeded
   * world, so an id picked against the pre-sync world can stop existing while
   * it is still selected. Pruning keeps the picker, the counter and the
   * request body describing the same run (E2E-0820 F5).
   */
  useEffect(() => {
    setSelected((current) => reconcileSelection(tones, current))
  }, [tones])

  // Upstream refuses an over-budget fan-out rather than truncating it, so the
  // client refuses first and says which number to change.
  const runPlan = planRun(tones, selected, perTone)
  const { fanout, overBudget, empty: noTone } = runPlan
  const busy = phase === 'running'

  const toggleTone = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : // 1-3 inline tones per the contract.
          current.length >= 3
          ? current
          : [...current, id],
    )

  async function poll(runId: string) {
    const startedAt = Date.now()
    for (let attempt = 0; ; attempt += 1) {
      const wait = POLL_DELAYS[Math.min(attempt, POLL_DELAYS.length - 1)]
      await new Promise((resolve) => setTimeout(resolve, wait))
      if (cancelled.current) return
      const run: GenerationRun | null | undefined = await generate.readRun(runId)
      if (cancelled.current) return
      if (run === null) {
        // The id is gone from the platform entirely.
        setPhase('failed')
        setError(MESSAGES.errors.runMissing)
        return
      }
      if (run && isRunTerminal(run)) {
        void walletActions.refresh()
        if (run.status === 'failed') {
          setPhase('failed')
          setError(MESSAGES.errors.runFailed)
          return
        }
        setDrafts(draftsFromRun(run))
        setPhase('done')
        return
      }
      if (Date.now() - startedAt > POLL_CEILING_MS) {
        // Still working is not failed: the run keeps going server-side and the
        // queue will carry it once it lands, so say that rather than erroring.
        setPhase('slow')
        return
      }
    }
  }

  async function submit() {
    setError(null)
    setShortBalance(false)
    setDrafts([])
    setPhase('running')
    const result = await generate.generate({
      tones: runPlan.tones,
      plan,
      language,
      perTone,
      occasion: occasions.find((event) => event.id === occasionId),
    })
    void loadRecent()
    if (!result.ok) {
      setPhase('idle')
      if (result.code === 'wallet_insufficient') {
        // The input is deliberately NOT cleared: the refusal happened before
        // anything ran, and losing the setup would punish the user for the
        // platform's accounting.
        setShortBalance(true)
        void walletActions.refresh()
        return
      }
      /**
       * The server has the last word (ORDER ONB-0827, D-ONB-D). The readiness
       * gate means a user should never reach this screen's form without the
       * four brand entities — but the gate is UX, and a run can still be
       * refused for a reason only the platform knows. A refusal is quoted with
       * its reference so the report is actionable: `bad_request` is the shape
       * the Phase-0 probe measured for a body the capability's schema rejects,
       * and on its own it tells the user nothing.
       */
      const reference = errorReference(result)
      const base =
        result.code === 'rate_limited'
          ? `${MESSAGES.errors.rateLimited} ${result.retryAfterSeconds ?? 60}s.`
          : result.code === 'bad_gateway'
            ? MESSAGES.errors.upstreamUnavailable
            : result.code === 'bad_request' || result.code === 'validation_failed'
              ? MESSAGES.errors.generationRefused
              : MESSAGES.errors.generic
      setError(reference ? `${base} (${reference})` : base)
      return
    }
    await poll(result.runId)
  }

  async function reopen(runId: string) {
    setError(null)
    setDrafts([])
    setPhase('running')
    const run = await generate.readRun(runId)
    void loadRecent()
    if (run === null) {
      setPhase('failed')
      setError(MESSAGES.errors.runMissing)
      return
    }
    if (run && isRunTerminal(run)) {
      setDrafts(draftsFromRun(run))
      setPhase(run.status === 'failed' ? 'failed' : 'done')
      if (run.status === 'failed') setError(MESSAGES.errors.runFailed)
      return
    }
    await poll(runId)
  }

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Tones</legend>
          <p className="text-sm text-muted-foreground">
            One to three of your own tones. Each one writes its own draft, with its rules attached.
          </p>
          <div className="flex flex-wrap gap-2">
            {tones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                aria-pressed={selected.includes(tone.id)}
                onClick={() => toggleTone(tone.id)}
                disabled={busy}
                // Selection shows on the WRAPPER, never on the badge: a tone
                // renders identically everywhere by design law, so a "muted"
                // variant would make a deselected tone look like a lesser one.
                className={cn(
                  'rounded-full ring-offset-2 ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  selected.includes(tone.id) ? 'ring-2 ring-primary' : 'opacity-100',
                )}
              >
                <ToneBadge tone={tone} />
              </button>
            ))}
          </div>
          {noTone && <p className="text-sm text-destructive">{MESSAGES.errors.toneRequired}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium">How it writes</legend>
            {PLANS.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="plan"
                  className="mt-1 accent-primary"
                  checked={plan === option.id}
                  disabled={busy}
                  onChange={() => setPlan(option.id)}
                />
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gen-language">Language</Label>
              <select
                id="gen-language"
                value={language}
                disabled={busy}
                onChange={(event) => setLanguage(event.target.value as 'en' | 'ar')}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gen-pertone">Drafts per tone</Label>
              <select
                id="gen-pertone"
                value={perTone}
                disabled={busy}
                onChange={(event) => setPerTone(Number(event.target.value) === 2 ? 2 : 1)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>

            {occasions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gen-occasion">Attach an occasion (optional)</Label>
                <select
                  id="gen-occasion"
                  value={occasionId}
                  disabled={busy}
                  onChange={(event) => setOccasionId(event.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">No occasion</option>
                  {occasions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} · {shortDate(event.date)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{MESSAGES.notices.occasionOutranks}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gen-notes">Anything to steer it? (optional)</Label>
          <Textarea
            id="gen-notes"
            rows={2}
            value={notes}
            disabled={busy}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="This week's arrival, the Guji lot"
          />
          <p className="text-xs text-muted-foreground">{MESSAGES.notices.generateNotesPending}</p>
        </div>

        {overBudget && (
          <p role="alert" className="text-sm text-destructive">
            {MESSAGES.errors.fanoutTooLarge}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {shortBalance && <InsufficientBalance wallet={wallet} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" role="status">
            {busy
              ? MESSAGES.notices.generateWorking
              : noTone
                ? ''
                : `${fanout} draft${fanout === 1 ? '' : 's'}`}
          </p>
          <Button onClick={submit} disabled={busy || noTone || overBudget}>
            <Sparkles aria-hidden />
            {busy ? 'Writing…' : 'Generate'}
          </Button>
        </div>
      </section>

      {phase === 'slow' && (
        <p role="status" className="rounded-lg border border-border bg-muted p-4 text-sm">
          {MESSAGES.notices.generateStillWorking}
        </p>
      )}

      {phase === 'done' && drafts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">
            {drafts.length} draft{drafts.length === 1 ? '' : 's'}
          </h2>
          {drafts.map((draft) => (
            <DraftCard key={`${draft.runId}-${draft.index}`} draft={draft} />
          ))}
          <p className="text-xs text-muted-foreground">
            {MESSAGES.notices.draftsReadOnly}{' '}
            <Link className="underline underline-offset-4" to="/today">
              Open Today
            </Link>
          </p>
        </section>
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Waiting for review</h2>
          <p className="text-sm text-muted-foreground">{MESSAGES.notices.recentRunsFromLedger}</p>
          <ul className="flex flex-col gap-1">
            {[...new Set(recent.map((item) => item.proposal.runId))].map((runId) => (
              <li key={runId}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void reopen(runId)}
                >
                  {recent.filter((item) => item.proposal.runId === runId).length}{' '}
                  {pluralize(
                    recent.filter((item) => item.proposal.runId === runId).length,
                    'draft',
                  )}{' '}
                  ·{' '}
                  {runId.slice(0, 14)}…
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/**
 * A finished draft, read-only.
 *
 * Flags and attributions are rendered INLINE and unconditionally when present:
 * a guardrail finding that is hidden is worse than no guardrail, and the
 * upstream terms require sources to stay visible. The rationale is shown for
 * the same reason the preview shows its rule list — it is how someone can tell
 * whether the tone actually did what they asked.
 */
function DraftCard({ draft }: { draft: LiveDraft }) {
  const tones = useTones()
  const tone = tones.find((entry) => entry.id === draft.toneId)

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        {tone ? (
          <ToneBadge tone={tone} />
        ) : (
          draft.toneId && <span className="text-xs text-muted-foreground">{draft.toneId}</span>
        )}
      </div>

      <p className="text-sm whitespace-pre-wrap">{draft.content}</p>

      {draft.flags.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-warning/60 bg-warning/10 p-3">
          <p className="text-xs font-medium">Flagged for review</p>
          <ul className="flex flex-col gap-1 text-xs">
            {draft.flags.map((flag, index) => (
              <li key={index}>{typeof flag === 'string' ? flag : JSON.stringify(flag)}</li>
            ))}
          </ul>
        </div>
      )}

      {draft.attributions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Sources</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {draft.attributions.map((attribution, index) => (
              <li key={index}>
                {typeof attribution === 'string' ? attribution : JSON.stringify(attribution)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.rationale && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Why it wrote this: </span>
          {draft.rationale}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard
              .writeText(draft.content)
              .then(() => toastSuccess('Draft copied'))
              .catch(() => toastError(MESSAGES.errors.generic))
          }}
        >
          <Copy aria-hidden />
          Copy
        </Button>
        <Button variant="outline" size="sm" disabled title={MESSAGES.notices.visualComingNext}>
          <ImageIcon aria-hidden />
          Create visual
        </Button>
      </div>
    </article>
  )
}
