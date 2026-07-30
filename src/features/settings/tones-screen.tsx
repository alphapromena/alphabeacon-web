/**
 * I3 — Tones library · `/settings/tones`, and I4's routed page.
 *
 * The durable home for what onboarding step 4 and C1 create inline. Presets are
 * view-only — they are the floor everyone starts from, and an org that could
 * edit "Educational" into something else would break every other org's mental
 * model of it. Custom tones sit in the SAME card shape with the same badge
 * treatment, because `ToneBadge`'s law (a tone you wrote is not a second-class
 * tone) has to hold on the screen that manages them too.
 */
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTones } from '@/data/provider'
import { useBrandActions } from '@/data/brand'
import type { Tone } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { ToneEditorForm } from './tone-editor'

export function TonesScreen() {
  const tones = useTones()
  const brand = useBrandActions()

  const presets = tones.filter((tone) => tone.kind === 'preset')
  const custom = tones.filter((tone) => tone.kind === 'custom')

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

        {custom.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="No custom tones yet"
            description={MESSAGES.empty.noCustomTones}
            action={
              <Button asChild>
                <Link to="/settings/tones/new">Create custom tone</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((tone) => (
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
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Presets</h2>
        <p className="text-sm text-muted-foreground">
          Always available, in every workspace. Write a custom tone to say something these do not.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((tone) => (
            <ToneCard key={tone.id} tone={tone} />
          ))}
        </div>
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
          <Badge variant="outline" className="font-normal capitalize">
            {tone.kind}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{tone.description}</p>

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
