/**
 * I2 — Brand voice · `/settings/brand-voice`.
 *
 * The rules that hold regardless of tone. The cross-note to Tones is not
 * decoration: the single most common misreading of this screen is that a tone
 * replaces these rules, when it layers on top of them, and saying so here is
 * cheaper than explaining it later.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { SaveBar } from '@/components/ab/save-bar'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useDataDispatch, useOrg } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { RuleList } from './field-editors'

/** Blank rows are how a list editor works, not something to save. */
const clean = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)

export function BrandVoiceScreen() {
  const org = useOrg()
  const dispatch = useDataDispatch()

  const saved = org.brandVoice
  const [draft, setDraft] = useState(saved)

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

      <RuleList
        idPrefix="voice-example"
        label="Example"
        description="Optional. A line that sounds like you — illustration, not a rule."
        placeholder="This lot landed Tuesday and we roasted it Thursday."
        values={draft.examples}
        onChange={(next) => setDraft((current) => ({ ...current, examples: next }))}
      />

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings/tones">Manage tones →</Link>
        </Button>
      </div>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(saved)}
        onSave={() => {
          dispatch({
            type: 'org/update',
            patch: {
              brandVoice: {
                do: clean(draft.do),
                dont: clean(draft.dont),
                examples: clean(draft.examples),
              },
            },
          })
          toastSuccess('Brand voice saved', {
            description: 'It applies underneath every tone from the next draft on.',
          })
        }}
        consequence="Your rule changes will be lost, and drafts keep following the brand voice you had before."
      />
    </>
  )
}
