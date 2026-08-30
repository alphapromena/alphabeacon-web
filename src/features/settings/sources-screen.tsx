/**
 * I5 — Followed sources & topics · `/settings/sources`.
 *
 * Two different things that both answer "what should drafts be about": sources
 * are where material comes FROM, topics are what it should be ABOUT. The note
 * about social feeds is load-bearing — people reasonably assume a connected
 * Instagram is also an input, and finding out otherwise three weeks later is
 * the kind of surprise this screen exists to prevent.
 *
 * Topics save immediately (a tag list has no half-finished state worth
 * guarding); sources save on add, which is why there is no save bar here.
 */
import { Rss, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/ab/empty-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBrandActions } from '@/data/brand'
import { useFollowedSources, useTopics } from '@/data/provider'
import { MAX_FOLLOWED_SOURCES, MAX_TOPICS } from '@/data/types'
import { shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { TagInput } from './field-editors'
import { deriveSourceName, isSourceUrlValid, normalizeSourceUrl } from '@/lib/source-url'

export function SourcesScreen() {
  const sources = useFollowedSources()
  const topics = useTopics()
  const brand = useBrandActions()

  const [entry, setEntry] = useState('')
  const [error, setError] = useState<string | null>(null)

  const detected = isSourceUrlValid(entry) ? deriveSourceName(entry) : ''
  // HSN-04: a ceiling, enforced here and again in the seam. A workspace
  // already above it (possible from another client) keeps every row listed;
  // only adding stops.
  const atCap = sources.length >= MAX_FOLLOWED_SOURCES

  const add = async () => {
    if (atCap) {
      setError(MESSAGES.errors.sourcesCapReached)
      return
    }
    const url = normalizeSourceUrl(entry)
    if (!url) {
      setError(MESSAGES.errors.sourceUrlRequired)
      return
    }
    if (!isSourceUrlValid(url)) {
      setError(MESSAGES.errors.sourceUrlInvalid)
      return
    }
    setError(null)
    const result = await brand.addSource(url)
    if (!result.ok) {
      // The server may refuse what the local check accepted (its URL parser
      // is the authority); its per-field message lands where the local one
      // would have.
      setError(result.fieldErrors[0]?.message ?? MESSAGES.errors.sourceUrlInvalid)
      return
    }
    setEntry('')
    toastSuccess('Source added', { description: 'Drafts start reading it on the next run.' })
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold">Sources</h2>
          <p className="text-sm text-muted-foreground">
            RSS feeds, news pages, and blogs. Connected social accounts are publish targets, not
            sources — nothing is read back from them.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Label htmlFor="source-url">Add a source</Label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              <MonoNumber value={sources.length} /> / <MonoNumber value={MAX_FOLLOWED_SOURCES} />
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              id="source-url"
              value={entry}
              placeholder="perfectdailygrind.com/feed"
              disabled={atCap}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setEntry(event.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void add()
                }
              }}
            />
            <Button type="button" disabled={atCap} onClick={() => void add()}>
              Add source
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : atCap ? (
            <p role="status" className="text-sm text-muted-foreground">
              {MESSAGES.errors.sourcesCapReached}
            </p>
          ) : (
            detected && (
              <p className="text-sm text-muted-foreground">
                We&apos;ll list this as <span className="font-medium">{detected}</span>.
              </p>
            )
          )}
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon={Rss}
            title="No sources yet"
            description={MESSAGES.empty.noFollowedSources}
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{source.name}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {source.url}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <MonoNumber
                    value={shortDate(source.addedAt)}
                    className="text-xs text-muted-foreground"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${source.name}`}
                    onClick={async () => {
                      const result = await brand.removeSource(source.id)
                      if (!result.ok) toastError(MESSAGES.errors.generic)
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold">Topics</h2>
          <p className="text-sm text-muted-foreground">
            Subjects worth writing about, whether or not a source mentions them this week.
          </p>
        </div>

        <TagInput
          id="topic-entry"
          label="Add a topic"
          placeholder="single origin"
          values={topics}
          onChange={(next) => void brand.setTopics(next)}
          max={MAX_TOPICS}
          capMessage={MESSAGES.errors.topicsCapReached}
        />

        {topics.length === 0 && (
          <p className="text-sm text-muted-foreground">{MESSAGES.empty.noTopics}</p>
        )}
      </section>
    </>
  )
}
