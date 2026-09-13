/**
 * I2 — Brand voice · `/settings/brand-voice`.
 *
 * The rules that hold regardless of tone. The cross-note to Tones is not
 * decoration: the single most common misreading of this screen is that a tone
 * replaces these rules, when it layers on top of them, and saying so here is
 * cheaper than explaining it later.
 *
 * THREE THINGS CHANGED 2026-09-13 (item 65), all of them the same failure seen
 * from different heights. On org 1867 this screen showed a list flattened from
 * two voice rows and saved it onto ONE of them, so every save wrote the merge
 * back and the row grew — 18 rules to 94 across five saves. Past the wire's
 * 50-rule limit every PATCH answered `400 validation_failed` and the screen
 * said "Brand voice saved" anyway.
 *
 * 1. What is shown is now what a save replaces: the canonical row's rules
 *    (the adapter), with extra rows named out loud rather than hidden.
 * 2. A combined cap of 40 across Do and Don't, below the wire's 50, so the
 *    ceiling is the product's and is said in the product's words.
 * 3. A refusal renders as itself — the wire's own message and request id —
 *    and the green toast fires only after a save that actually succeeded.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SaveBar } from '@/components/ab/save-bar'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useBrandActions } from '@/data/brand'
import { useDataDispatch, useLiveBrandIds, useLiveMode, useOrg } from '@/data/provider'
import { MAX_BRAND_VOICE_RULES } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { RuleList } from './field-editors'

/** Blank rows are how a list editor works, not something to save. */
const clean = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)

/** What a refused save shows, in the shape the Studio composer already uses. */
interface WireFailure {
  message: string
  requestId?: string
}

export function BrandVoiceScreen() {
  const org = useOrg()
  const dispatch = useDataDispatch()
  const brand = useBrandActions()
  const live = useLiveMode()
  const brandIds = useLiveBrandIds()

  const saved = org.brandVoice
  const [draft, setDraft] = useState(saved)
  const [failure, setFailure] = useState<WireFailure | null>(null)

  // A live sync can land after mount; a pristine draft adopts it (the async
  // sibling of state.md rule 4), an edited one is never clobbered.
  const savedKey = JSON.stringify(saved)
  const previousSavedKey = useRef(savedKey)
  useEffect(() => {
    setDraft((current) => (JSON.stringify(current) === previousSavedKey.current ? saved : current))
    previousSavedKey.current = savedKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savedKey is the change signal
  }, [savedKey])

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const empty = saved.do.length === 0 && saved.dont.length === 0

  // The cap is COMBINED because the wire counts one array. A workspace already
  // above it keeps every row listed and removable; only adding stops.
  const total = draft.do.length + draft.dont.length
  const atCap = total >= MAX_BRAND_VOICE_RULES

  const extraVoiceRows = brandIds?.extraVoiceRows ?? []

  return (
    <>
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        {MESSAGES.notices.brandVoiceUnderTones}{' '}
        <Link className="underline underline-offset-4" to="/settings/tones">
          See Tones
        </Link>
        .
      </p>

      {extraVoiceRows.length > 0 && (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
        >
          {MESSAGES.notices.brandVoiceExtraRows}{' '}
          <span className="whitespace-nowrap">
            (<MonoNumber value={extraVoiceRows.length} /> extra{' '}
            {extraVoiceRows.length === 1 ? 'row' : 'rows'},{' '}
            <MonoNumber value={extraVoiceRows.reduce((sum, row) => sum + row.ruleCount, 0)} />{' '}
            rules)
          </span>
        </p>
      )}

      {empty && draft.do.length === 0 && draft.dont.length === 0 && (
        <p className="text-sm text-muted-foreground">{MESSAGES.empty.noBrandVoice}</p>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Rules</span>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          <MonoNumber value={total} /> / <MonoNumber value={MAX_BRAND_VOICE_RULES} /> across Do and
          Don’t
        </span>
      </div>

      {atCap && (
        <p role="status" className="text-sm text-muted-foreground">
          {MESSAGES.errors.brandVoiceCapReached}
        </p>
      )}

      <RuleList
        idPrefix="voice-do"
        label="Do"
        description="Things a draft should reach for."
        placeholder="Name the farm or the roast date when it matters"
        values={draft.do}
        disableAdd={atCap}
        onChange={(next) => setDraft((current) => ({ ...current, do: next }))}
      />

      <RuleList
        idPrefix="voice-dont"
        label="Don't"
        description="Things a draft must never do, in any tone."
        placeholder="Call anything artisanal"
        values={draft.dont}
        disableAdd={atCap}
        onChange={(next) => setDraft((current) => ({ ...current, dont: next }))}
      />

      {live ? (
        // Rules landed on the wire in the 2026-08-17 contract, so both lists
        // above are real now. Examples still have nowhere to be stored, and a
        // control that silently forgot its rows would be a lie.
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.brandExamplesPending}</p>
      ) : (
        <RuleList
          idPrefix="voice-example"
          label="Example"
          description="Optional. A line that sounds like you — illustration, not a rule."
          placeholder="This lot landed Tuesday and we roasted it Thursday."
          values={draft.examples}
          onChange={(next) => setDraft((current) => ({ ...current, examples: next }))}
        />
      )}

      {live && (
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.reachesNextGeneration}</p>
      )}

      {/* A refusal, in the wire's own words. The request id is what makes a
          bug report findable in the server's logs, so it is shown, not hidden. */}
      {failure && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {failure.message}
          {failure.requestId && (
            <span className="block font-mono text-xs opacity-80">request {failure.requestId}</span>
          )}
        </p>
      )}

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings/tones">Manage tones →</Link>
        </Button>
      </div>

      <SaveBar
        dirty={dirty}
        onCancel={() => {
          setDraft(saved)
          setFailure(null)
        }}
        onSave={async () => {
          setFailure(null)
          const next = {
            do: clean(draft.do),
            dont: clean(draft.dont),
            examples: clean(draft.examples),
          }
          const result = await brand.saveBrandVoice(next)
          if (!result.ok) {
            // The wire is the judge and it said why. Its per-field message is
            // the most specific thing available ("expected array to have <=50
            // items"), then its envelope message; the catalogue's generic line
            // is the last resort, not the first.
            const message =
              result.fieldErrors[0]?.message || result.message || MESSAGES.errors.generic
            setFailure({ message, requestId: result.requestId })
            toastError(message)
            return
          }
          dispatch({ type: 'org/update', patch: { brandVoice: next } })
          toastSuccess('Brand voice saved', {
            description: 'It applies underneath every tone from the next draft on.',
          })
        }}
        consequence="Your rule changes will be lost, and drafts keep following the brand voice you had before."
      />
    </>
  )
}
