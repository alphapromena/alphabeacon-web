/**
 * F1 — On-demand generate · `/generate`.
 *
 * "I want a post about X right now." The run streams word by word, and when it
 * finishes it stops being a special thing: the result renders as the SAME
 * `DraftCard` the queue uses, wired to the SAME actions, so an on-demand post
 * is reviewed, approved, illustrated and scheduled through the machine that
 * already exists rather than a second one built beside it.
 *
 * Two accessibility decisions worth keeping:
 *   - the streaming text is NOT a live region. Announcing every token would
 *     make the screen unusable with a reader; a separate polite status line
 *     announces the transitions that actually matter instead.
 *   - a guardrail flag never hides text. It arrives alongside the sentence that
 *     earned it and the stream keeps going, because the reviewer is the one who
 *     decides — that is the whole product.
 */
import { Pencil, Sparkles, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ClaimChip } from '@/components/ab/claim-chip'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SignalSweep } from '@/components/ab/motion'
import { SkeletonForm } from '@/components/ab/skeletons'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useBilling,
  useDataDispatch,
  useDrafts,
  useSchedule,
  useScreenPhase,
  useTones,
} from '@/data/provider'
import type { Claim } from '@/data/types'
import { useComposePlayer } from '@/lib/compose-player'
import { MESSAGES } from '@/lib/messages'
import { DraftCard } from '@/features/today/draft-card'
import { DraftDialogs } from '@/features/today/draft-dialogs'
import { useDraftActions } from '@/features/today/use-draft-actions'

/** What the polite status line says at each point in a run. */
const STATUS_LINE = {
  idle: '',
  streaming: 'Writing your draft…',
  complete: 'Draft ready for review.',
  stopped: 'Stopped. What arrived is kept.',
  dropped: 'The run did not finish. What arrived is kept.',
  rate_limited: 'This run was refused.',
} as const

export function GenerateScreen() {
  const tones = useTones()
  const schedule = useSchedule()
  const billing = useBilling()
  const drafts = useDrafts()
  const dispatch = useDataDispatch()
  const screen = useScreenPhase()
  const player = useComposePlayer()
  const actions = useDraftActions()

  const [prompt, setPrompt] = useState('')
  const [toneId, setToneId] = useState(() => schedule.toneIds[0] ?? tones[0]?.id ?? '')
  const [source, setSource] = useState('')
  const [touched, setTouched] = useState(false)
  const [createdId, setCreatedId] = useState<string | undefined>(undefined)

  const pastDue = billing.status === 'past_due'
  const tone = tones.find((t) => t.id === toneId)
  const promptMissing = prompt.trim().length === 0
  // The finished draft is read back out of the provider, never held here: the
  // card must show the record as it is now, including whatever the action row
  // just did to it.
  const created = drafts.find((draft) => draft.id === createdId)

  /** A completed run becomes an ordinary draft, exactly once. */
  useEffect(() => {
    if (player.phase !== 'complete' || createdId || !player.script) return
    const id = `draft_gen_${Date.now()}`
    const at = new Date().toISOString()
    const grounding: Claim[] = source.trim()
      ? [
          ...player.claims,
          {
            id: `claim_source_${id}`,
            source: source.trim(),
            title: 'You pointed this draft at this source.',
            state: 'verified',
          },
        ]
      : player.claims
    dispatch({
      type: 'draft/create',
      draft: {
        id,
        status: 'pending_review',
        copy: player.text,
        rationale: player.script.rationale,
        toneId,
        claims: grounding,
        createdAt: at,
        timeline: [{ status: 'pending_review', at }],
      },
    })
    setCreatedId(id)
  }, [player.phase, player.script, player.text, player.claims, createdId, dispatch, toneId, source])

  const startOver = () => {
    player.reset()
    setCreatedId(undefined)
  }

  const submit = () => {
    setTouched(true)
    if (promptMissing || pastDue) return
    setCreatedId(undefined)
    player.start(prompt)
  }

  const collapsed = player.phase !== 'idle'

  return (
    <AppShell
      title="What should we write about?"
      context="On-demand — the result lands in your review queue like any other draft"
    >
      {screen === 'loading' ? (
        <div className="mx-auto w-full max-w-[720px]">
          <SkeletonForm fields={3} label="Loading the composer" />
        </div>
      ) : screen === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
          {/* The input collapses upward once a run starts, so the result gets
              the column — but the prompt stays visible, because "what did I
              ask for" is the first question the output raises. */}
          {collapsed ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-sm">{prompt}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {tone && <ToneBadge tone={tone} />}
                  {source.trim() && (
                    <span className="font-mono text-xs text-muted-foreground">{source.trim()}</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={startOver}>
                <Pencil aria-hidden />
                Edit prompt
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="compose-prompt">Prompt</Label>
                <Textarea
                  id="compose-prompt"
                  rows={5}
                  value={prompt}
                  placeholder="The Kirinyaga AA that landed this week, and why roast date matters more than origin"
                  onChange={(event) => setPrompt(event.target.value)}
                  aria-invalid={touched && promptMissing ? true : undefined}
                />
                {touched && promptMissing && (
                  <p role="alert" className="text-sm text-destructive">
                    {MESSAGES.errors.promptRequired}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="compose-tone">Tone</Label>
                  <select
                    id="compose-tone"
                    value={toneId}
                    onChange={(event) => setToneId(event.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {tones.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Your schedule&apos;s tones, and any you have written.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="compose-source">Source to ground it in (optional)</Label>
                  <Input
                    id="compose-source"
                    value={source}
                    placeholder="sca.coffee/research/kenya-flavour-wheel"
                    onChange={(event) => setSource(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The draft cites it, so the claim travels with the post.
                  </p>
                </div>
              </div>

              {pastDue && (
                <p role="alert" className="text-sm text-destructive">
                  {MESSAGES.errors.generatePaused}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <MonoNumber value={player.runsLeft} /> on-demand runs left today
                </p>
                <Button onClick={submit} disabled={pastDue}>
                  <Sparkles aria-hidden />
                  Generate
                </Button>
              </div>
            </div>
          )}

          {/* One polite announcement per transition — not one per token. */}
          <p role="status" className="sr-only">
            {STATUS_LINE[player.phase]}
          </p>

          {player.phase === 'rate_limited' ? (
            <ErrorState
              title="Out of on-demand runs"
              message={MESSAGES.errors.generateRateLimited}
              retryLabel="Edit the prompt"
              onRetry={startOver}
            />
          ) : (
            player.phase !== 'idle' && (
              <div className="flex flex-col gap-4">
                {created ? (
                  <DraftCard
                    draft={created}
                    zone={schedule.timezone}
                    tone={tones.find((t) => t.id === created.toneId)}
                    {...actions.handlersFor(created)}
                  />
                ) : (
                  <Card className="relative overflow-hidden">
                    <SignalSweep active={player.phase === 'streaming'} />
                    <CardContent className="flex flex-col gap-4">
                      <p className="text-lg/relaxed whitespace-pre-wrap">
                        {player.text}
                        {player.phase === 'streaming' && (
                          <span aria-hidden className="text-muted-foreground">
                            {' '}
                            ▌
                          </span>
                        )}
                      </p>

                      {player.claims.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {player.claims.map((claim) => (
                            <li key={claim.id}>
                              <ClaimChip claim={claim} />
                            </li>
                          ))}
                        </ul>
                      )}

                      {player.phase === 'streaming' && (
                        <Button variant="outline" size="sm" className="w-fit" onClick={player.stop}>
                          <Square aria-hidden />
                          Stop generating
                        </Button>
                      )}

                      {player.phase === 'stopped' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="w-full text-sm text-muted-foreground">
                            Stopped. What arrived is kept — pick it up or start again.
                          </p>
                          <Button size="sm" onClick={player.resume}>
                            Continue writing
                          </Button>
                          <Button size="sm" variant="ghost" onClick={startOver}>
                            Start over
                          </Button>
                        </div>
                      )}

                      {player.phase === 'dropped' && (
                        <div
                          role="alert"
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
                        >
                          <p className="w-full text-sm text-destructive">
                            {player.script?.dropReason}
                          </p>
                          <Button size="sm" onClick={player.resume}>
                            Pick it up from here
                          </Button>
                          <Button size="sm" variant="ghost" onClick={startOver}>
                            Start over
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {created && (
                  <p className="text-sm text-muted-foreground">
                    It is in your queue now —{' '}
                    <Link className="underline underline-offset-4" to="/today">
                      review it with the rest
                    </Link>
                    , or write another above.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}

      <DraftDialogs actions={actions} />
    </AppShell>
  )
}
