/**
 * The password strength meter and live checklist shared by signup (A1) and
 * reset-confirm (A4).
 *
 * The checklist is the honest half: a bar alone tells someone they failed
 * without telling them why, so every rule is listed and flips as it is met.
 * Met/unmet is carried by an icon and by the word itself, never by color.
 * The rules live in `password-rules.ts` so the schemas can score without
 * rendering.
 */
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PASSWORD_STRENGTH_LABELS, passwordRules } from './password-rules'

export function PasswordStrength({ value, id }: { value: string; id?: string }) {
  const rules = passwordRules(value)
  const score = rules.filter((rule) => rule.met).length
  const label = PASSWORD_STRENGTH_LABELS[score]

  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index < score ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
        {/* The word carries the meaning; the bars only echo it. */}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <ul className="flex flex-col gap-1">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-2 text-xs',
              rule.met ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {rule.met ? (
              <Check aria-hidden className="size-3.5 text-primary" />
            ) : (
              <Circle aria-hidden className="size-3.5" />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">{rule.met ? '— met' : '— not met yet'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
