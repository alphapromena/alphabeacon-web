/**
 * The password rules themselves, kept apart from the meter that draws them so
 * the zod schemas in A1 and A4 can score a password without importing a
 * component (and so fast refresh keeps working in the component file).
 *
 * Rules are stated positively and checked independently — the meter shows all
 * three at once, because a bar that only says "weak" tells someone they failed
 * without telling them what to change.
 */
export interface PasswordRule {
  id: string
  label: string
  met: boolean
}

export function passwordRules(value: string): PasswordRule[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    {
      id: 'case',
      label: 'An upper and a lower case letter',
      met: /[a-z]/.test(value) && /[A-Z]/.test(value),
    },
    { id: 'number', label: 'A number or a symbol', met: /[\d\W_]/.test(value) },
  ]
}

/** 0–3. The forms treat fewer than 2 met rules as too weak to submit. */
export function passwordScore(value: string): number {
  return passwordRules(value).filter((rule) => rule.met).length
}

export const PASSWORD_STRENGTH_LABELS = ['Too short', 'Weak', 'Getting there', 'Strong'] as const
