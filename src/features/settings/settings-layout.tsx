/**
 * The frame every Settings screen renders inside (I1–I7).
 *
 * It is a ROUTE layout, not a wrapper each screen renders for itself, and that
 * distinction is a bug fix rather than a tidy-up: when every section rendered
 * its own copy, changing section swapped one component for another, React
 * unmounted the whole navigation, and the focused tab went with it — dropping
 * focus to `document.body` and making a keyboard user tab back in from the top
 * of the page every single time. Mounted once, above the `Outlet`, the tab the
 * user is standing on survives the navigation.
 *
 * The sections are a real tablist: roving tabindex, arrow keys to move, Enter
 * to follow. Activation is manual (arrows move focus but do not navigate),
 * because these tabs change the URL and arrowing through them would otherwise
 * fire six navigations on the way past.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { NavLink, Outlet, useLocation, useMatches } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { SkeletonForm } from '@/components/ab/skeletons'
import { useDataDispatch, useScreenPhase, useTones } from '@/data/provider'
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

const PANEL_ID = 'settings-panel'
const tabId = (index: number) => `settings-tab-${index}`

/** Each settings route carries its own heading in `handle` (see routes.tsx). */
export interface SettingsHandle {
  title: string
  context?: string
  /** Wide screens (the tones grid, the team table) opt out of the form column. */
  wide?: boolean
}

export function SettingsLayout() {
  const phase = useScreenPhase()
  const dispatch = useDataDispatch()
  const matches = useMatches()
  const { pathname } = useLocation()
  const tones = useTones()
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const deepest = matches[matches.length - 1]
  const handle = (deepest?.handle ?? {}) as Partial<SettingsHandle>

  // The one dynamic heading in Settings: editing a tone names the tone. The
  // layout owns the title, so the lookup has to live here.
  const editingToneId = (deepest?.params as { toneId?: string } | undefined)?.toneId
  const editingTone = editingToneId ? tones.find((tone) => tone.id === editingToneId) : undefined
  const title = editingTone ? `Edit ${editingTone.name}` : (handle.title ?? 'Settings')

  const activeIndex = SECTIONS.findIndex((section) => pathname.startsWith(section.to))
  const selected = activeIndex < 0 ? 0 : activeIndex
  const [focusIndex, setFocusIndex] = useState(selected)
  useEffect(() => setFocusIndex(selected), [selected])

  const moveFocus = (next: number) => {
    const index = (next + SECTIONS.length) % SECTIONS.length
    setFocusIndex(index)
    tabRefs.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: focusIndex + 1,
      ArrowLeft: focusIndex - 1,
      Home: 0,
      End: SECTIONS.length - 1,
    }
    const next = keys[event.key]
    if (next === undefined) return
    event.preventDefault()
    moveFocus(next)
  }

  return (
    <AppShell title={title} context={handle.context}>
      <div className="flex flex-col gap-6">
        {/* py-1 is load-bearing: `overflow-x-auto` clips vertically too, and
            without the room the focus ring on a tab renders sliced off. */}
        <nav aria-label="Settings sections" className="overflow-x-auto py-1">
          <ul role="tablist" className="flex min-w-max gap-1 px-1" onKeyDown={onKeyDown}>
            {SECTIONS.map((section, index) => {
              const isSelected = index === selected
              return (
                <li key={section.to} role="presentation">
                  <NavLink
                    to={section.to}
                    id={tabId(index)}
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={PANEL_ID}
                    tabIndex={index === focusIndex ? 0 : -1}
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    onFocus={() => setFocusIndex(index)}
                    className={cn(
                      'inline-flex rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isSelected
                        ? 'bg-secondary font-medium text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {section.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* The panel is always in the DOM so `aria-controls` always resolves,
            including while the section is still loading. */}
        <div id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(selected)}>
          {phase === 'loading' ? (
            <SkeletonForm fields={4} label={`Loading ${title.toLowerCase()}`} />
          ) : phase === 'error' ? (
            <ErrorState
              message={MESSAGES.errors.screenLoadFailed}
              onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
            />
          ) : (
            <div className={cn('flex flex-col gap-8 pb-24', !handle.wide && 'max-w-[680px]')}>
              <Outlet />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
