/**
 * Saying which part of a half-built workspace is missing (E2E-0820 F12).
 *
 * `finishOnboarding` attempts every step and reports the ones that failed, so
 * the wizard can name them instead of falling back to "something went wrong".
 * The steps map onto the Settings sections that can repair them, which is why
 * the labels read as places rather than as API calls.
 *
 * A step can arrive more than once, so steps are deduplicated and reported in
 * the order Finish attempts them.
 */
import type { FinishStepFailure } from '@/data/account'
import { errorReference } from '@/lib/error-reference'

const STEP_ORDER: FinishStepFailure['step'][] = ['schedule', 'country']

const STEP_LABEL: Record<FinishStepFailure['step'], string> = {
  schedule: 'your posting schedule',
  country: 'your country',
}

/** "Your posting schedule and your country did not save. …" — or `undefined`. */
export function describeIncomplete(failures: FinishStepFailure[]): string | undefined {
  const steps = STEP_ORDER.filter((step) => failures.some((failure) => failure.step === step))
  if (steps.length === 0) return undefined

  const labels = steps.map((step) => STEP_LABEL[step])
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`

  // One reference per distinct failure, so a bug report can name the request
  // that failed rather than the step that contained it.
  const references = [...new Set(failures.map(errorReference).filter(Boolean))]
  const suffix = references.length > 0 ? ` (${references.join(', ')})` : ''

  return `${capitalize(list)} did not save — set ${steps.length === 1 ? 'it' : 'them'} in Settings.${suffix}`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
