/**
 * /dev/states — force the loading or error presentation on any screen. The
 * dataset supplies empty and populated; this switcher covers the other two of
 * the four data states. Dev-only route, excluded from production builds.
 */
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDataDispatch, useDevForce, type DevForce } from '@/data/provider'
import { cn } from '@/lib/utils'

const MODES: { mode: DevForce; label: string; note: string }[] = [
  { mode: 'none', label: 'Normal', note: 'Screens settle after a short designed skeleton.' },
  { mode: 'loading', label: 'Loading', note: 'Every screen stays on its skeleton state.' },
  { mode: 'error', label: 'Error', note: 'Every screen renders its designed error state.' },
]

export function DevStatesScreen() {
  const active = useDevForce()
  const dispatch = useDataDispatch()
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 bg-background px-6 py-10 text-foreground">
      <header>
        <h1 className="font-display text-2xl font-semibold">Presentation states</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The four data states are selected, not awaited. Empty and populated come from the dataset;
          loading and error are forced here.
        </p>
      </header>
      <div role="radiogroup" aria-label="Forced state" className="flex flex-col gap-3">
        {MODES.map(({ mode, label, note }) => (
          <Button
            key={mode}
            role="radio"
            aria-checked={active === mode}
            variant={active === mode ? 'default' : 'outline'}
            className={cn('h-auto justify-start px-4 py-3 text-left')}
            onClick={() => dispatch({ type: 'dev/force', mode })}
          >
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{label}</span>
              <span
                className={cn('text-xs', active === mode ? 'opacity-80' : 'text-muted-foreground')}
              >
                {note}
              </span>
            </span>
          </Button>
        ))}
      </div>
      <nav className="flex gap-4 text-sm">
        <Link className="underline underline-offset-4" to="/">
          ← App
        </Link>
        <Link className="underline underline-offset-4" to="/dev/datasets">
          Dataset switcher
        </Link>
      </nav>
    </div>
  )
}
