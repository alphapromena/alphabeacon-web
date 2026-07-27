/**
 * The authenticated layout shell — W0 ships a functional basic version
 * (rail + top bar + content); W1 completes it (collapsing rail, org
 * switcher, bell, account menu) per screens4.md §0.4.
 */
import {
  Calendar,
  ChartLine,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Plug,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { ThemeToggle } from '@/components/ab/theme-toggle'
import { useBilling, useCreditBalance, useDrafts } from '@/data/provider'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: Inbox },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/studio', label: 'Studio', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: ChartLine },
  { to: '/connections', label: 'Connections', icon: Plug },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function AppShell({
  title,
  context,
  children,
}: {
  title: string
  context?: string
  children: ReactNode
}) {
  const drafts = useDrafts()
  const billing = useBilling()
  const credits = useCreditBalance()
  const awaiting = drafts.filter((d) => d.status === 'pending_review').length

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <span
            aria-hidden
            className="size-2.5 rounded-full bg-primary shadow-[var(--glow-signal)]"
          />
          <span className="font-display text-lg font-semibold tracking-tight">AlphaBeacon</span>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              <Icon aria-hidden className="size-4" />
              <span className="flex-1">{label}</span>
              {label === 'Today' && awaiting > 0 && (
                <span
                  aria-label={`${awaiting} drafts awaiting review`}
                  className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
                />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
          <span className="capitalize">{billing.planId}</span> · <MonoNumber value={credits} />{' '}
          credits
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border px-4 md:px-8">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h1>
            {context && <p className="truncate text-sm text-muted-foreground">{context}</p>}
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
