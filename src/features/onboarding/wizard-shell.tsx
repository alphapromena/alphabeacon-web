/**
 * A5's frame: a step indicator, the card, and the footer actions.
 *
 * The indicator is a real landmark, not decoration — it names where you are
 * ("Step 3 of 5") and marks completed steps, because a wizard that hides its
 * length feels endless. Steps 2 and 3 are skippable; step 4 is not, since
 * starting the pipeline is the entire point of onboarding (screens4.md A5).
 */
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const STEP_TITLES = [
  'Brand basics',
  'Connect your accounts',
  'Connect your calendar',
  'Start your pipeline',
  'Ready',
] as const

export function WizardShell({
  step,
  title,
  description,
  children,
  onBack,
  onSkip,
  primary,
}: {
  step: 1 | 2 | 3 | 4 | 5
  title: string
  description?: string
  children: ReactNode
  onBack?: () => void
  /** Present only on the skippable steps (2 and 3). */
  onSkip?: () => void
  primary: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-4 py-8 sm:py-14">
      <div className="flex w-full max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-display text-sm font-semibold tracking-[0.14em] uppercase">
          <span aria-hidden className="size-6 rounded-md bg-[image:var(--signal-gradient)]" />
          AlphaBeacon
        </div>

        <ol className="flex items-center gap-2" aria-label={`Step ${step} of 5`}>
          {STEP_TITLES.map((stepTitle, index) => {
            const position = index + 1
            const done = position < step
            const current = position === step
            return (
              <li key={stepTitle} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={cn('h-1 rounded-full', done || current ? 'bg-primary' : 'bg-muted')}
                />
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    current ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {done && <Check aria-hidden className="size-3 text-primary" />}
                  <span className="hidden sm:inline">{stepTitle}</span>
                  <span className="sr-only">
                    {done ? 'completed' : current ? 'current step' : 'not started'}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-wider text-muted-foreground uppercase">
              Step <MonoNumber value={step} /> of <MonoNumber value={5} />
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="mt-6">{children}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
            {primary}
          </div>
        </div>
      </div>
    </div>
  )
}
