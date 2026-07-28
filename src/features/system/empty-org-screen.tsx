/**
 * N3 — Empty-org first run. Shown when someone reaches an authenticated screen
 * before finishing onboarding.
 *
 * It resumes at the step they actually stopped on rather than restarting the
 * wizard, which is the difference between a helpful redirect and a punishment
 * for leaving early.
 */
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { STEP_TITLES } from '@/features/onboarding/wizard-shell'

export function EmptyOrgScreen() {
  const org = useOrg()
  const step = org.onboarding.resumeStep

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span aria-hidden className="size-10 rounded-xl bg-[image:var(--signal-gradient)]" />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {MESSAGES.notices.setupIncomplete}
        </h1>
        <p className="text-sm text-muted-foreground">
          You stopped at step {step} of 5 — {STEP_TITLES[step - 1]}. Pick up exactly there.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/onboarding">
          Resume setup <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
