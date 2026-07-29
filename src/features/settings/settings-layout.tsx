/**
 * The frame every Settings screen renders inside (I1–I7).
 *
 * It exists so the seven screens share one navigation, one column width, and
 * one loading/error treatment — screens4.md calls I1's states "the standard
 * form pattern … used across every Settings screen", and the only way that
 * stays true is if there is exactly one place it is written down.
 *
 * `pb-24` is not decoration: the sticky save bar sits over the bottom of the
 * column, and a form whose last field hides under it is a form people miss.
 */
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { SkeletonForm } from '@/components/ab/skeletons'
import { useDataDispatch, useScreenPhase } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { to: '/settings/organization', label: 'Organization' },
  { to: '/settings/brand-voice', label: 'Brand voice' },
  { to: '/settings/tones', label: 'Tones' },
  { to: '/settings/sources', label: 'Sources & topics' },
  { to: '/settings/knowledge', label: 'Knowledge' },
  { to: '/settings/team', label: 'Team' },
] as const

export function SettingsLayout({
  title,
  context,
  children,
  /** Wide screens (the tones grid, the team table) opt out of the form column. */
  wide = false,
}: {
  title: string
  context?: string
  children: ReactNode
  wide?: boolean
}) {
  const phase = useScreenPhase()
  const dispatch = useDataDispatch()

  return (
    <AppShell title={title} context={context}>
      <div className="flex flex-col gap-6">
        <nav aria-label="Settings sections" className="-mx-1 overflow-x-auto">
          <ul className="flex min-w-max gap-1 px-1">
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isActive
                        ? 'bg-secondary font-medium text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {phase === 'loading' ? (
          <SkeletonForm fields={4} label={`Loading ${title.toLowerCase()}`} />
        ) : phase === 'error' ? (
          <ErrorState
            message={MESSAGES.errors.screenLoadFailed}
            onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
          />
        ) : (
          <div className={cn('flex flex-col gap-8 pb-24', !wide && 'max-w-[680px]')}>
            {children}
          </div>
        )}
      </div>
    </AppShell>
  )
}
