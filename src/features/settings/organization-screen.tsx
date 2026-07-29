/**
 * I1 — Organization profile · `/settings/organization`.
 *
 * The timezone control writes to the SCHEDULE, not to a second field on the
 * org: screens4.md asks for "timezone (mirrors C1, single source)", and two
 * fields holding the same fact is how a product ends up posting at the right
 * time on one screen and the wrong one on another.
 *
 * The logo is read locally with a FileReader and kept as a data URL. Nothing is
 * uploaded anywhere — there is nowhere to upload to — but the preview, the
 * replace and the remove are all real, which is the part the design is about.
 */
import { Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { SaveBar } from '@/components/ab/save-bar'
import { toastSuccess } from '@/components/ab/toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDataDispatch, useOrg, useSchedule } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { TIMEZONES, zoneAbbreviation } from '@/lib/timezone'
import { TagInput } from './field-editors'
import { SettingsLayout } from './settings-layout'

export function OrganizationScreen() {
  const org = useOrg()
  const schedule = useSchedule()
  const dispatch = useDataDispatch()
  const fileInput = useRef<HTMLInputElement>(null)

  const saved = {
    name: org.name,
    offer: org.offer,
    differentiators: org.differentiators,
    ctaText: org.ctaText,
    logo: org.logo,
    timezone: schedule.timezone,
  }
  const [draft, setDraft] = useState(saved)
  const [touched, setTouched] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const nameMissing = draft.name.trim().length === 0
  const offerMissing = draft.offer.trim().length === 0

  const patch = (next: Partial<typeof saved>) => setDraft((current) => ({ ...current, ...next }))

  const readLogo = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => patch({ logo: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <SettingsLayout title="Organization" context="Who you are, and how drafts should sign off">
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 rounded-xl">
            {draft.logo && <AvatarImage src={draft.logo} alt="" />}
            <AvatarFallback className="rounded-xl text-lg">
              {draft.name.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Logo</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden />
                {draft.logo ? 'Replace' : 'Upload'}
              </Button>
              {draft.logo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => patch({ logo: undefined })}
                >
                  <Trash2 aria-hidden />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Square works best. It is shown beside your name, never inside a post.
            </p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose a logo image"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) readLogo(file)
              event.target.value = ''
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-invalid={touched && nameMissing ? true : undefined}
          />
          {touched && nameMissing && (
            <p role="alert" className="text-sm text-destructive">
              {MESSAGES.errors.orgNameRequired}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-offer">What you offer, in one line</Label>
          <p className="text-sm text-muted-foreground">Every draft starts from this sentence.</p>
          <Textarea
            id="org-offer"
            rows={2}
            value={draft.offer}
            onChange={(event) => patch({ offer: event.target.value })}
            aria-invalid={touched && offerMissing ? true : undefined}
          />
          {touched && offerMissing && (
            <p role="alert" className="text-sm text-destructive">
              {MESSAGES.errors.offerRequired}
            </p>
          )}
        </div>

        <TagInput
          id="org-differentiators"
          label="What sets you apart"
          description="Drafts reach for these when they need a reason to believe."
          placeholder="Roasted to order"
          values={draft.differentiators}
          onChange={(differentiators) => patch({ differentiators })}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-cta">Standard call to action</Label>
          <p className="text-sm text-muted-foreground">
            The closing ask a draft falls back to when the post has no better one.
          </p>
          <Input
            id="org-cta"
            value={draft.ctaText}
            placeholder="Order this week’s roast"
            onChange={(event) => patch({ ctaText: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-timezone">Timezone</Label>
          <p className="text-sm text-muted-foreground">
            The same setting as your schedule — changing it here changes it there.
          </p>
          <select
            id="org-timezone"
            value={draft.timezone}
            onChange={(event) => patch({ timezone: event.target.value })}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace('_', ' ')} ({zoneAbbreviation(zone)})
              </option>
            ))}
          </select>
        </div>
      </section>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(saved)}
        onSave={() => {
          setTouched(true)
          if (nameMissing || offerMissing) return
          const { timezone, ...orgPatch } = draft
          dispatch({ type: 'org/update', patch: orgPatch })
          if (timezone !== schedule.timezone) {
            dispatch({ type: 'schedule/update', patch: { timezone } })
          }
          toastSuccess('Organization saved', {
            description: 'New drafts use it from the next run.',
          })
        }}
        consequence="Your profile changes will be lost, and drafts keep using the details you had before."
      />
    </SettingsLayout>
  )
}
