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
import { useEffect, useRef, useState } from 'react'
import { CountryPicker } from '@/components/ab/country-picker'
import { SaveBar } from '@/components/ab/save-bar'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDataDispatch, useLiveMode, useOrg, useSchedule } from '@/data/provider'
import { SetupChecklist } from '@/components/ab/setup-checklist'
import { useAccountActions } from '@/data/account'
import { MESSAGES } from '@/lib/messages'
import { TIMEZONES, zoneAbbreviation } from '@/lib/timezone'
import { AccountSection } from './account-section'
import { TagInput } from './field-editors'

export function OrganizationScreen() {
  const org = useOrg()
  const live = useLiveMode()
  const schedule = useSchedule()
  const dispatch = useDataDispatch()
  const account = useAccountActions()
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

  // The world can change under a mounted form (the live sync lands after
  // mount; another reducer writes the org). A PRISTINE draft adopts the new
  // truth; an edited one is the user's and is never clobbered — the async
  // sibling of state.md rule 4.
  const savedKey = JSON.stringify(saved)
  const previousSavedKey = useRef(savedKey)
  useEffect(() => {
    setDraft((current) => (JSON.stringify(current) === previousSavedKey.current ? saved : current))
    previousSavedKey.current = savedKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savedKey is the change signal
  }, [savedKey])

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
    <>
      {/*
       * THE SETTINGS ENTRY for the setup checklist (ORDER ONB-0827, D-ONB-D).
       * It lives here because /settings redirects to this screen, so this is
       * the door every route into Settings comes through — the checklist is
       * seen without having to be looked for. It renders in both states: a
       * finished workspace gets one calm line saying so, which is what makes
       * it a reference list rather than a nag.
       */}
      <SetupChecklist heading="Brand setup" />

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
            // The visible button is the affordance. Left tabbable, this steals a
            // tab stop that shows nothing — focus appears to vanish. It keeps
            // its name, so it is still reachable and operable by control name.
            tabIndex={-1}
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

      {live && (
        // The country is NOT part of this form's draft: it saves through its
        // own ~10-second call and the save bar's all-or-nothing commit would
        // either block on it or lie about it. It lives here because I1 is
        // where "where we operate" belongs (D-INT-F).
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Where you operate</h2>
            <p className="text-sm text-muted-foreground">
              Your country decides which public holidays Malaky plans around.
            </p>
          </div>
          <CountryPicker idPrefix="i1-country" />
        </section>
      )}

      <AccountSection />

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(saved)}
        onSave={async () => {
          setTouched(true)
          if (nameMissing || offerMissing) return
          const { timezone, ...orgPatch } = draft
          // The NAME is the one org field the API stores; it goes to the
          // server first so a failure keeps the bar dirty and honest. The
          // rest (offer, differentiators, CTA, logo) stay in the world —
          // their API home arrives with the brand phase.
          if (orgPatch.name !== org.name) {
            const result = await account.updateOrgName(orgPatch.name)
            if (!result.ok) {
              toastError(MESSAGES.errors.generic)
              return
            }
          }
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
    </>
  )
}
