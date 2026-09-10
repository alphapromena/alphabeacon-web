/**
 * The film's scenes (1 to 6, in cut order): each with its length, whether and
 * how it speaks, its script, its references (our own asset ids) and a camera
 * note. The one arithmetic rule the document states — the scenes' seconds
 * add up to the film's `sec` EXACTLY — is shown as a running total beside the
 * list and enforced by the table's validation; on balanced nobody speaks.
 */
import { Plus, Trash2 } from 'lucide-react'
import type { MediaPlan } from '@/data/studio'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyScene,
  FILM_CAMERA_MAX,
  FILM_REFERENCES_MAX,
  FILM_SCENE_SEC_MIN,
  FILM_SCENES_MAX,
  FILM_SCRIPT_MAX,
  FILM_SPEAK,
  type FilmScene,
  type FilmSpeak,
} from '@/data/media-capabilities'
import { AssetPicker } from './asset-picker'

const SPEAK_LABEL: Record<FilmSpeak, string> = {
  none: 'Nobody speaks',
  talking: 'On camera — lips match',
  voiceover: 'Voiceover',
}

export function ScenesEditor({
  id,
  scenes,
  total,
  plan,
  disabled,
  onChange,
}: {
  id: string
  scenes: FilmScene[]
  /** The film's `sec`, which the scenes must add up to. */
  total: number
  plan: MediaPlan | null
  disabled?: boolean
  onChange: (next: FilmScene[]) => void
}) {
  const sum = scenes.reduce((acc, scene) => acc + (Number.isFinite(scene.sec) ? scene.sec : 0), 0)
  const silentLane = plan === 'balanced' || plan === null
  const update = (index: number, patch: Partial<FilmScene>) =>
    onChange(scenes.map((scene, at) => (at === index ? { ...scene, ...patch } : scene)))

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Scenes</legend>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        The scenes add up to <MonoNumber value={sum} /> of <MonoNumber value={total} /> seconds.
        {sum !== total && ' They must match exactly.'}
      </p>
      <ol className="flex flex-col gap-3">
        {scenes.map((scene, index) => (
          <li key={index} className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-sm font-medium">Scene {index + 1}</span>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${id}-${index}-sec`}>Seconds</Label>
                <Input
                  id={`${id}-${index}-sec`}
                  type="number"
                  inputMode="numeric"
                  min={FILM_SCENE_SEC_MIN}
                  step={1}
                  className="w-24"
                  value={Number.isFinite(scene.sec) ? String(scene.sec) : ''}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, {
                      sec: event.target.value === '' ? Number.NaN : Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${id}-${index}-speak`}>Speech</Label>
                <select
                  id={`${id}-${index}-speak`}
                  value={scene.speak}
                  disabled={disabled}
                  onChange={(event) => update(index, { speak: event.target.value as FilmSpeak })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {FILM_SPEAK.map((option) => (
                    <option key={option} value={option} disabled={silentLane && option !== 'none'}>
                      {SPEAK_LABEL[option]}
                      {silentLane && option !== 'none' ? ' — not on balanced' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {scenes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onChange(scenes.filter((_, at) => at !== index))}
                  aria-label={`Remove scene ${index + 1}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              )}
            </div>

            {scene.speak !== 'none' && (
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${id}-${index}-script`}>Script</Label>
                <Textarea
                  id={`${id}-${index}-script`}
                  rows={2}
                  maxLength={FILM_SCRIPT_MAX}
                  value={scene.script}
                  disabled={disabled}
                  onChange={(event) => update(index, { script: event.target.value })}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-${index}-camera`}>Camera</Label>
              <Input
                id={`${id}-${index}-camera`}
                maxLength={FILM_CAMERA_MAX}
                placeholder="wide establishing shot of a sunlit café, morning light"
                value={scene.camera}
                disabled={disabled}
                onChange={(event) => update(index, { camera: event.target.value })}
              />
            </div>

            <AssetPicker
              id={`${id}-${index}-references`}
              label={`Scene ${index + 1} references`}
              hint="The venue, the product — up to four of your own assets."
              assetKind="image"
              min={0}
              max={FILM_REFERENCES_MAX}
              value={scene.references}
              disabled={disabled}
              onChange={(references) => update(index, { references })}
            />
          </li>
        ))}
      </ol>
      {scenes.length < FILM_SCENES_MAX && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={() =>
            onChange([...scenes, emptyScene(Math.max(FILM_SCENE_SEC_MIN, total - sum))])
          }
        >
          <Plus aria-hidden />
          Add scene
        </Button>
      )}
    </fieldset>
  )
}
