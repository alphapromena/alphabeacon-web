/**
 * I2 — Brand voice · `/settings/brand-voice`.
 *
 * The rules that hold regardless of tone. The cross-note to Tones is not
 * decoration: the single most common misreading of this screen is that a tone
 * replaces these rules, when it layers on top of them, and saying so here is
 * cheaper than explaining it later.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SaveBar } from '@/components/ab/save-bar'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useBrandActions } from '@/data/brand'
import { useDataDispatch, useLiveMode, useOrg } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { RuleList } from './field-editors'

/** Blank rows are how a list editor works, not something to save. */
const clean = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)

export function BrandVoiceScreen() {
  const org = useOrg()
  const dispatch = useDataDispatch()
  const brand = useBrandActions()
  const live = useLiveMode()

  const saved = org.brandVoice
  const [draft, setDraft] = useState(saved)

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

  return (
    <>
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        {MESSAGES.notices.brandVoiceUnderTones}{' '}
        <Link className="underline underline-offset-4" to="/settings/tones">
          See Tones
        </Link>
        .
      </p>

      {empty && draft.do.length === 0 && draft.dont.length === 0 && (
        <p className="text-sm text-muted-foreground">{MESSAGES.empty.noBrandVoice}</p>
      )}

      <RuleList
        idPrefix="voice-do"
        label="Do"
        description="Things a draft should reach for."
        placeholder="Name the farm or the roast date when it matters"
        values={draft.do}
        onChange={(next) => setDraft((current) => ({ ...current, do: next }))}
      />

      <RuleList
        idPrefix="voice-dont"
        label="Don't"
        description="Things a draft must never do, in any tone."
        placeholder="Call anything artisanal"
        values={draft.dont}
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

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings/tones">Manage tones →</Link>
        </Button>
      </div>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(saved)}
        onSave={async () => {
          const next = {
            do: clean(draft.do),
            dont: clean(draft.dont),
            examples: clean(draft.examples),
          }
          const result = await brand.saveBrandVoice(next)
          if (!result.ok) {
            toastError(MESSAGES.errors.generic)
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
