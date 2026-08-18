/**
 * The org's country — and, in live mode, the ONE holiday control there is.
 *
 * decisions.md D-INT-F (confirmed by the backend 2026-08-17): setting a country
 * loads that country's public holidays server-side and scheduling consumes them
 * automatically. There is no event source to create and no slot to keep or
 * skip, so this control replaces the whole C2 "add a holidays source" step.
 *
 * Three things this component exists to get right:
 *
 * 1. **It takes about ten seconds.** A new country calls an external lookup, so
 *    the button holds a calm progress label for the duration and refuses a
 *    second press. Silence for ten seconds reads as a broken control, and a
 *    double press would run the lookup twice.
 * 2. **A no-op says so.** Re-sending the current country is a cheap success
 *    that fetches nothing (`reloaded: false`). Announcing "loaded 11 holidays"
 *    for a call that loaded nothing is a small lie, so that case gets its own
 *    quiet line.
 * 3. **A failure changed nothing.** The contract guarantees a 502 leaves both
 *    the country and the calendar exactly as they were, which is why the copy
 *    can promise it rather than hedge.
 */
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { MonoNumber } from '@/components/ab/mono-number'
import { useSchedulingActions, type Country } from '@/data/scheduling'
import { useOrg } from '@/data/provider'
import { useTeamPermissions } from '@/data/team'
import { MESSAGES } from '@/lib/messages'

export function CountryPicker({ idPrefix = 'org-country' }: { idPrefix?: string }) {
  const org = useOrg()
  const scheduling = useSchedulingActions()
  const permissions = useTeamPermissions()

  const [countries, setCountries] = useState<Country[] | null>(null)
  const [choice, setChoice] = useState(org.country ?? '')
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    void scheduling.listCountries().then((list) => {
      if (!list) return
      setCountries(list)
      setChoice((current) => current || (org.country ?? ''))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- global reference data, fetched once
  }, [])

  // A sync can land after mount; an untouched control adopts the server's
  // answer (the same rule the settings forms follow).
  useEffect(() => {
    setChoice((current) => (current === '' ? (org.country ?? '') : current))
  }, [org.country])

  const canWrite = permissions.canManageMembers
  const current = countries?.find((entry) => entry.code === org.country)
  const dirty = choice !== '' && choice !== (org.country ?? '')

  if (!canWrite) {
    // Members read the calendar; only an admin or owner sets what feeds it.
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Country</p>
        <p className="text-sm text-muted-foreground">
          {current
            ? `${current.name} — public holidays are loaded for this country.`
            : MESSAGES.empty.noCountry}
        </p>
        <p className="text-xs text-muted-foreground">{MESSAGES.notices.countryAdminOnly}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idPrefix} className="text-sm font-medium">
        Country
      </label>
      <p className="text-sm text-muted-foreground">{MESSAGES.notices.countryLoadsHolidays}</p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          id={idPrefix}
          value={choice}
          disabled={saving || countries === null}
          onChange={(event) => {
            setChoice(event.target.value)
            setFieldError(null)
          }}
          aria-describedby={fieldError ? `${idPrefix}-error` : undefined}
          aria-invalid={fieldError ? true : undefined}
          className="h-9 min-w-56 rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-100"
        >
          <option value="">Choose a country…</option>
          {(countries ?? []).map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>

        <Button
          type="button"
          // Disabled while the lookup runs AND when nothing would change:
          // the ten seconds are real, and spending them on a no-op is unkind.
          disabled={saving || !dirty}
          onClick={async () => {
            setSaving(true)
            setFieldError(null)
            const result = await scheduling.setCountry(choice)
            setSaving(false)
            if (!result.ok) {
              if (result.code === 'validation_failed' || result.code === 'bad_request') {
                // The API names the offending field when it can; fall back to
                // the catalogue rather than surfacing a raw server string.
                const detail = result.fieldErrors.find((entry) => entry.field === 'country')
                setFieldError(detail?.message ?? MESSAGES.errors.countryInvalid)
                return
              }
              toastError(
                result.code === 'bad_gateway'
                  ? MESSAGES.errors.upstreamUnavailable
                  : MESSAGES.errors.generic,
              )
              return
            }
            if (result.reloaded === false) {
              toastSuccess(MESSAGES.notices.countryUnchanged)
              return
            }
            toastSuccess('Country updated', {
              description: `${result.holidaysCount ?? 0} public holidays loaded for the year.`,
            })
          }}
        >
          {saving ? MESSAGES.notices.countryLoading : 'Save country'}
        </Button>
      </div>

      {fieldError && (
        <p id={`${idPrefix}-error`} className="text-sm text-destructive">
          {fieldError}
        </p>
      )}

      {org.country && !dirty && (
        <p className="text-xs text-muted-foreground">
          <MonoNumber value={org.country} /> — holidays for this country are already loaded.
        </p>
      )}
    </div>
  )
}
