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
  Calendar,
  ChartLine,
  Check,
  ChevronsUpDown,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  PenLine,
  Plug,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot } from '@/components/ab/motion'
import { NavIndicator } from '@/components/ab/nav-indicator'
import { NotificationBell } from '@/components/ab/notification-bell'
import { OfflineBanner } from '@/components/ab/offline-banner'
import { toastError, toastSuccess } from '@/components/ab/toast'
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
import { useAuthActions } from '@/data/auth'
import {
  useBilling,
  useCreditBalance,
  useDataDispatch,
  useDrafts,
  useLiveMode,
  useLiveOrgs,
  useOrg,
  useScreenPhase,
  useSession,
} from '@/data/provider'
import { isUnfunded, useWallet } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

/** Rail order is fixed by screens4.md §0.4 — do not reorder casually. */
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: Inbox, end: false },
  { to: '/generate', label: 'Generate', icon: PenLine, end: false },
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
  const arrived = useSkeletonHandoff()
  return (
    <SidebarProvider
      // 72px icon rail per screens4.md §0.2 (shadcn's default is 48px).
      style={{ '--sidebar-width-icon': '4.5rem' } as CSSProperties}
    >
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chrome is RAISED, the work surface is the CANVAS below it. The top
            bar and the rail share --sidebar so the frame reads as one object
            and the content it frames is the darkest thing on screen — the
            ladder doing the job shadow used to (D-THEME-0913-E). */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-4 md:px-6">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-1 h-4" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
            {context && <p className="truncate text-sm text-muted-foreground">{context}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <PlanCreditChip />
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <OfflineBanner />
        <PastDueBanner />
        {/*
         * THE SECTION RHYTHM LIVES HERE (ORDER THEME-0913 §5.6).
         *
         * Measured across the product, screens were setting their own
         * top-level rhythm at anything from gap-1 (4px) to gap-8 (32px), so
         * two screens in the same product put different amounts of air between
         * their sections and several read as a flat wall of equal-weight rows.
         * Today — the approved reference — uses 32px, so 32px is the rhythm,
         * and it is applied once here instead of asked of every screen.
         *
         * A screen that wraps itself in a single container is unaffected (one
         * child, no gap); a screen with several top-level sections gets the
         * rhythm whether or not it remembered to ask for it.
         */}
        <main
          /*
           * SKELETON TO CONTENT IS A TRANSITION (ORDER MOTION-0914/A §3).
           *
           * React unmounts the skeleton subtree and mounts the content
           * subtree, so there is no element whose style changes and no CSS
           * transition that can span the two. The shell is the one place that
           * can see the change happen, so it marks it here and globals.css
           * carries the arrival.
           *
           * It fires on the loading→ready EDGE and nowhere else — not on first
           * paint, not on a re-render.
           *
           * MEASURED, THAT EDGE IS EVERY NAVIGATION, and the comment that
           * first stood here said the opposite. `useScreenPhase` holds every
           * screen on a designed 400ms skeleton when it mounts (/dev/states
           * calls it "a short designed skeleton"), so there is no such thing
           * here as moving between two already-loaded screens: every screen
           * loads. The entrance therefore plays once per navigation.
           *
           * That is exactly what §3 asked for — skeleton to content is a
           * transition — and it sits against §5, which says a transition must
           * not make a frequent action feel slower. It is REPORTED rather
           * than tuned: the content is interactive for every frame of it (an
           * opacity change plus 4px, nothing that swallows a click), so it
           * delays nobody's input, but it does add 220ms of visual settle to
           * the most frequent action in the product. The call belongs to the
           * founder, not to a tuning knob.
           */
          data-ab-enter={arrived ? 'content' : undefined}
          className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-8 md:px-6"
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

/**
 * True for exactly one render: the one where a screen stopped showing its
 * skeleton and started showing content.
 *
 * Deliberately an EDGE, not a state. `phase === 'ready'` is true for the whole
 * life of a loaded screen, so keying the entrance off it would replay the
 * animation on every re-render — which is the decorative entrance §5 bans.
 *
 * How often the edge occurs is a property of `useScreenPhase`, not of this
 * hook: it holds every screen on a designed 400ms skeleton at mount, so the
 * edge is crossed once per navigation. See the `<main>` comment below for the
 * §5 tension that creates and why it is reported rather than tuned away.
 */
function useSkeletonHandoff(): boolean {
  const phase = useScreenPhase()
  const wasLoading = useRef(false)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    if (phase === 'loading') {
      wasLoading.current = true
      setArrived(false)
      return
    }
    if (phase === 'ready' && wasLoading.current) {
      wasLoading.current = false
      setArrived(true)
    }
  }, [phase])

  // One play, then off — so a re-render for any other reason cannot repeat it.
  useEffect(() => {
    if (!arrived) return
    const timer = window.setTimeout(() => setArrived(false), 600)
    return () => window.clearTimeout(timer)
  }, [arrived])

  return arrived
}

function AppSidebar() {
  const org = useOrg()
  const drafts = useDrafts()
  const { pathname } = useLocation()
  const railRef = useRef<HTMLDivElement | null>(null)
  const awaiting = drafts.filter((d) => d.status === 'pending_review').length

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-1">
          {/* The founder-approved Arabic wordmark, exactly as supplied
              (design.md Part 3). There is ONE theme now (D-THEME-0913-B), so
              there is one wordmark: the charcoal-on-light variant and its
              `dark:hidden` twin were unreachable the moment light retired. */}
          <img src="/brand/malaky-logo-white.png" alt="Malaky" className="h-7 w-auto shrink-0" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* `relative` so the one gold indicator below has something to be
                measured against (ORDER MOTION-0914/A §3). */}
            <div ref={railRef} className="relative">
              <NavIndicator
                containerRef={railRef}
                activeSelector="[data-active='true']"
                orientation="vertical"
                activeKey={pathname}
              />
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
                            <span className="ms-auto flex items-center gap-2">
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
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <OrgIdentity name={org.name} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Organization identity — and a SWITCHER once the account has more than one
 * (screens4.md §0.4, built ONB-0827-B).
 *
 * This block always intended to grow a menu; the comment that stood here said
 * so. What made it necessary rather than nice was open-item 38: since every
 * signup mints a workspace, an invited user belongs to two orgs and the app
 * worked in whichever `orgs[0]` happened to be — measured as their own, always,
 * because `/me/orgs` orders by `joinedAt` ascending. Without a way to choose,
 * the org that invited them was unreachable.
 *
 * With ONE org it stays identity: a menu offering a single choice is the
 * disabled-and-teasing pattern wearing a chevron. STATIC mode has one org by
 * construction, so the demo is unchanged.
 */
function OrgIdentity({ name }: { name: string }) {
  const { orgs, activeOrgId, fellBack } = useLiveOrgs()
  const dispatch = useDataDispatch()

  /**
   * Say the fallback out loud, once (part 3). A remembered workspace that
   * quietly became a different one is precisely the silent failure this rule
   * exists to prevent — so it is a toast, not a log line, and it is
   * acknowledged so a resync cannot repeat it.
   */
  const announced = useRef(false)
  useEffect(() => {
    if (!fellBack) {
      // A new episode may announce itself later; arm for it.
      announced.current = false
      return
    }
    // ONCE per episode. The flag is sticky on purpose — the fallback is
    // decided by the live sync, which lands after first paint, and a flag that
    // cleared itself would be a message nobody saw. Sticky plus a dispatch,
    // though, can be re-set by the next sync before the dispatch is read, and
    // StrictMode runs effects twice in dev: either way the user gets the same
    // sentence twice. The latch is what makes "say it once" true.
    if (announced.current) return
    announced.current = true
    toastError(MESSAGES.notices.activeOrgFellBack)
    dispatch({ type: 'org/fallbackAcknowledged' })
  }, [fellBack, dispatch])

  const identity = (
    <>
      <Avatar className="size-6 shrink-0 rounded-md">
        <AvatarFallback className="rounded-md text-xs">{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="truncate font-medium group-data-[collapsible=icon]:hidden">{name}</span>
    </>
  )

  if (orgs.length < 2) {
    return <div className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm">{identity}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-start text-sm hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {identity}
          <ChevronsUpDown
            aria-hidden
            className="ms-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
          />
          <span className="sr-only">Switch workspace</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((entry) => (
          <DropdownMenuItem
            key={entry.id}
            // The current one is not a no-op waiting to happen: selecting it
            // changes nothing, and the check says which one you are in.
            onSelect={() => {
              if (entry.id === activeOrgId) return
              dispatch({ type: 'org/setActive', orgId: entry.id })
            }}
          >
            <Check
              aria-hidden
              className={cn('size-4', entry.id === activeOrgId ? 'opacity-100' : 'opacity-0')}
            />
            <span className="truncate">{entry.name}</span>
            {entry.id === activeOrgId && <span className="sr-only">(current)</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A failed payment is a product-wide condition, not a Billing screen's private
 * business: it stops publishing and Studio runs, so it is announced on every
 * authenticated screen until it clears (screens4.md H2).
 */
function PastDueBanner() {
  const billing = useBilling()
  if (billing.status !== 'past_due') return null
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-2 md:px-6"
    >
      <p className="text-sm font-medium text-destructive">
        Your payment failed. Publishing and Studio generation are paused.
      </p>
      <Button asChild size="sm" variant="outline">
        <Link to="/billing/subscription">Update payment method</Link>
      </Button>
    </div>
  )
}

/**
 * Always visible, because the balance gates the Studio (screens4.md §0.4).
 *
 * Two currencies of discourse, never converted into each other (D-INT-E): the
 * static demo counts CREDITS from its ledger, live mode shows MONEY from the
 * wallet. `availableCents` is the number shown, not `cents`, because it is the
 * one the next request is actually checked against — a wallet whose balance is
 * entirely held cannot spend a penny of it, and showing the larger number
 * would be the more comforting lie.
 */
function PlanCreditChip() {
  const billing = useBilling()
  const credits = useCreditBalance()
  const wallet = useWallet()
  const live = useLiveMode()
  const phase = useScreenPhase()

  if (live) {
    // The plan is the only funding (BIL-0902): an all-zero wallet is a
    // workspace that has never subscribed, and the chip says so and leads to
    // the page that fixes it — not "funding pending", not an error.
    const unfunded = isUnfunded(wallet)
    // ...and a wallet nobody has read yet is not a wallet that is missing.
    // The chip mounts on every screen, so the two-to-five seconds the org sync
    // takes were long enough to read as a verdict (E2E-0820 F9).
    const unread = wallet === null
    const loading = unread && phase === 'loading'
    const low = wallet !== null && (unfunded || wallet.availableCents < 100)
    return (
      <Link
        to={unfunded ? '/billing' : '/billing/balance'}
        className={cn(
          'hidden items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex',
          low && 'border-warning/60 text-warning',
        )}
      >
        {loading ? (
          <span className="text-muted-foreground">{MESSAGES.notices.balanceLoading}</span>
        ) : unread ? (
          <span className="text-muted-foreground">{MESSAGES.notices.balanceUnread}</span>
        ) : unfunded ? (
          <span>{MESSAGES.notices.balanceUnfunded}</span>
        ) : (
          <>
            <span>{formatCents(wallet.availableCents)}</span>
            {wallet.heldCents > 0 && (
              <span className="text-muted-foreground">
                · {formatCents(wallet.heldCents)} reserved
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  const low = credits < 50
  return (
    <Link
      // The demo's subscription page (H2) — its plan and its credits ledger.
      // `/billing` itself is the product's plans page since BIL-0902.
      to="/billing/subscription"
      className={cn(
        'hidden items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex',
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

function AccountMenu() {
  const session = useSession()
  const auth = useAuthActions()
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
        <DropdownMenuLabel className="flex flex-col gap-1">
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
        <DropdownMenuItem onSelect={() => void auth.signOut()}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
        {/* logout-all (docs/api/api.md): revokes every session, this one
            included. In static mode it simply signs out. */}
        <DropdownMenuItem
          onSelect={async () => {
            const result = await auth.signOutEverywhere()
            if (result.ok) {
              toastSuccess('Signed out everywhere', {
                description:
                  result.revoked !== undefined
                    ? `${result.revoked} session${result.revoked === 1 ? '' : 's'} ended.`
                    : undefined,
              })
            }
          }}
        >
          <LogOut aria-hidden />
          Sign out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
