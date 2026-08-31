/**
 * I3 — Tones library · `/settings/tones`, and I4's routed page.
 *
 * The durable home for what C1 creates inline. ONE list (CUT-0831 — the
 * preset concept is gone): every tone is the org's own, every tone gets Edit
 * and Delete, and no section, badge or copy claims some tones are the
 * platform's. Two shapes: no tones at all (ORDER ONB-0827 — a live workspace
 * starts with zero and its owner writes the first one here), or the list.
 */
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTones } from '@/data/provider'
import { useBrandActions } from '@/data/brand'
import type { Tone } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { ToneEditorForm } from './tone-editor'
import { toneLanguageLabel, toneLengthLabel } from './tone-fields'

export function TonesScreen() {
  const tones = useTones()
  const brand = useBrandActions()

  /**
   * A workspace with nothing to speak in (ORDER ONB-0827). Live orgs are no
   * longer seeded with presets, so this is a real state now and it gets ONE
   * honest empty state. The demo worlds carry sample tones, so they never
   * land here.
   */
  if (tones.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Your tones</h2>
        <EmptyState
          icon={Palette}
          title="No tones yet"
          description={MESSAGES.empty.noTones}
          action={
            <Button asChild>
              <Link to="/settings/tones/new">
                <Plus aria-hidden />
                Create your first tone
              </Link>
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Your tones</h2>
          <Button asChild>
            <Link to="/settings/tones/new">
              <Plus aria-hidden />
              Create custom tone
            </Link>
          </Button>
        </div>

        {
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tones.map((tone) => (
              <ToneCard
                key={tone.id}
                tone={tone}
                onDelete={async () => {
                  const result = await brand.deleteTone(tone.id)
                  if (!result.ok) {
                    toastError(MESSAGES.errors.generic)
                    return
                  }
                  toastSuccess('Tone deleted', {
                    description: `${tone.name} is no longer available for new drafts.`,
                  })
                }}
              />
            ))}
          </div>
        }
      </section>
    </>
  )
}

function ToneCard({ tone, onDelete }: { tone: Tone; onDelete?: () => void }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{tone.name}</span>
        </div>
        <p className="text-sm text-muted-foreground">{tone.description}</p>

        {/* HSN-03: an absent value reads "Not set" — a tone created before the
            fields existed is never shown with a default it was not given. */}
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt className="font-medium text-foreground">Language</dt>
            <dd>{toneLanguageLabel(tone.language) ?? 'Not set'}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium text-foreground">Length</dt>
            <dd>{toneLengthLabel(tone.length) ?? 'Not set'}</dd>
          </div>
        </dl>

        <dl className="flex flex-col gap-1 text-xs text-muted-foreground">
          {tone.rules.do.length > 0 && (
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">Do</dt>
              <dd>{tone.rules.do.join(' · ')}</dd>
            </div>
          )}
          {tone.rules.dont.length > 0 && (
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">Don&apos;t</dt>
              <dd>{tone.rules.dont.join(' · ')}</dd>
            </div>
          )}
        </dl>

        {onDelete && (
          <div className="mt-auto flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/settings/tones/${tone.id}`}>
                <Pencil aria-hidden />
                Edit
              </Link>
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <Trash2 aria-hidden />
                  Delete
                </Button>
              }
              title="Delete this tone?"
              consequence="Drafts already using it keep their existing copy, but you won't be able to select it for new ones."
              confirmLabel="Delete tone"
              onConfirm={onDelete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * I4 as a full page. Same form as the sheet — only the frame differs, and where
 * it returns to when it is done.
 */
export function ToneEditorScreen() {
  const { toneId } = useParams()
  const tones = useTones()
  const brand = useBrandActions()
  const navigate = useNavigate()

  const existing = toneId ? tones.find((tone) => tone.id === toneId) : undefined
  const editing = Boolean(toneId)

  if (editing && !existing) {
    return (
      <>
        <EmptyState
          icon={Palette}
          title="That tone no longer exists"
          description={MESSAGES.empty.noCustomTones}
          action={
            <Button asChild>
              <Link to="/settings/tones">Back to tones</Link>
            </Button>
          }
        />
      </>
    )
  }

  return (
    <>
      <ToneEditorForm
        initial={existing}
        submitLabel={existing ? 'Save changes' : 'Create tone'}
        onCancel={() => navigate('/settings/tones')}
        onSave={async (tone) => {
          const result = existing ? await brand.updateTone(tone) : await brand.createTone(tone)
          if (!result.ok) {
            toastError(MESSAGES.errors.generic)
            return
          }
          toastSuccess(existing ? 'Tone saved' : 'Tone created', {
            description: `${tone.name} is available wherever tones are picked.`,
          })
          navigate('/settings/tones')
        }}
      />
    </>
  )
}
