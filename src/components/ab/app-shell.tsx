/**
 * The authenticated layout shell (screens4.md §0.4) — collapsing left rail,
 * top bar, toast host, and the persistent plan/credit chip.
 *
 * Every authenticated screen renders inside this, so the things that must
 * never be missed live here exactly once: the beacon live-status dot next to
 * Today (pulsing only while drafts actually wait), the notification bell's
 * quick glance, and the credit balance that gates the Studio.
 *
 * Landmarks are deliberate: the rail is <nav>, the top bar a <header> banner,
 * and content a sibling <main> — the shadcn `SidebarInset` is skipped because
 * it *is* the <main>, which would nest the banner inside it.
 */
import {
  Bell,
  Calendar,
  ChartLine,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plug,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot } from '@/components/ab/motion'
import { ThemeToggle } from '@/components/ab/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  useBilling,
  useCreditBalance,
  useDataDispatch,
  useDrafts,
  useNotifications,
  useOrg,
  useSession,
} from '@/data/provider'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Rail order is fixed by screens4.md §0.4 — do not reorder casually. */
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: Inbox, end: false },
  { to: '/calendar', label: 'Calendar', icon: Calendar, end: false },
  { to: '/studio', label: 'Studio', icon: Sparkles, end: false },
  { to: '/analytics', label: 'Analytics', icon: ChartLine, end: false },
  { to: '/connections', label: 'Connections', icon: Plug, end: false },
  { to: '/billing', label: 'Billing', icon: CreditCard, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
] as const

export function AppShell({
  title,
  context,
  actions,
  children,
}: {
  title: string
  /** The one-line status under the title, e.g. "5 drafts ready · generated 6:02 AM". */
  context?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <SidebarProvider
      // 72px icon rail per screens4.md §0.2 (shadcn's default is 48px).
      style={{ '--sidebar-width-icon': '4.5rem' } as CSSProperties}
    >
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
            {context && <p className="truncate text-sm text-muted-foreground">{context}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <PlanCreditChip />
            <NotificationBell />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar() {
  const org = useOrg()
  const drafts = useDrafts()
  const { pathname } = useLocation()
  const awaiting = drafts.filter((d) => d.status === 'pending_review').length

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-1">
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-md bg-[image:var(--signal-gradient)]"
          />
          {/* The kit sets the wordmark in Barlow, all caps (design.md Part 3). */}
          <span className="truncate font-display text-sm font-semibold tracking-[0.14em] uppercase group-data-[collapsible=icon]:hidden">
            AlphaBeacon
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ to, label, icon: Icon, end }) => {
                const isActive = end ? pathname === to : pathname.startsWith(to)
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <Link to={to}>
                        <Icon aria-hidden />
                        <span>{label}</span>
                        {to === '/today' && awaiting > 0 && (
                          <span className="ml-auto flex items-center gap-1.5">
                            <BeaconDot live />
                            <MonoNumber value={awaiting} className="text-xs" />
                            {/* Deliberately not "drafts awaiting review" — that
                                is D1's stat-card label, and two different
                                surfaces should not read as the same control. */}
                            <span className="sr-only">drafts need review</span>
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Organization identity. This becomes a switcher menu the moment an
            account belongs to more than one org (screens4.md §0.4); with a
            single org a menu would be a tease, so it renders as identity. */}
        <div className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm">
          <Avatar className="size-6 shrink-0 rounded-md">
            <AvatarFallback className="rounded-md text-xs">{org.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium group-data-[collapsible=icon]:hidden">
            {org.name}
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/** Always visible, because credits gate the Studio (screens4.md §0.4). */
function PlanCreditChip() {
  const billing = useBilling()
  const credits = useCreditBalance()
  const low = credits < 50
  return (
    <Link
      to="/billing"
      className={cn(
        'hidden items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex',
        low && 'border-warning/60 text-warning',
      )}
    >
      <span className="capitalize">{billing.planId}</span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <MonoNumber value={credits} />
      <span>credits</span>
    </Link>
  )
}

/**
 * N1's quick glance. The full, persistent list lives on the Dashboard (D1) —
 * this dropdown deliberately shows only the most recent few and links there.
 */
function NotificationBell() {
  const notifications = useNotifications()
  const dispatch = useDataDispatch()
  const unread = notifications.filter((n) => !n.read).length
  const recent = notifications.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-1.5 py-0.5 text-xs font-normal"
              onClick={() => dispatch({ type: 'notifications/markAllRead' })}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          recent.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link to={notification.href} className="flex flex-col items-start gap-0.5">
                <span className={cn('text-sm', !notification.read && 'font-medium')}>
                  {notification.message}
                </span>
                <MonoNumber
                  value={relativeTime(notification.at)}
                  className="text-xs text-muted-foreground"
                />
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/">View everything on the Dashboard</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AccountMenu() {
  const session = useSession()
  const dispatch = useDataDispatch()
  const initials =
    session.user?.name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('') ?? '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{session.user?.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{session.user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <UserRound aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings aria-hidden />
            Organization settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => dispatch({ type: 'session/signOut' })}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
