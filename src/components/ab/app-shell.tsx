/**
 * The authenticated layout shell (screens4.md §0.4) — collapsing left rail,
 * top bar, toast host, and the persistent plan/credit chip.
 *
 * Every authenticated screen renders inside this, so the things that must
 * never be missed live here exactly once: the beacon live-status dot next to
 * Today (pulsing only while drafts actually wait), the notification bell's
 * quick glance, and the credit balance that gates the Studio.
 *
 * TWO PIECES since ORDER-SHELL-0915 (item 77; state.md trap 8). `AppFrame`
 * is the chrome itself and is mounted ONCE, by the signed-in world's layout
 * route in `routes.tsx`, with every app screen rendered into its outlet — so
 * the rail, the one gold indicator in it, the top bar and the section rhythm
 * survive navigation, and the indicator can travel between screens instead of
 * being re-created at the new row. `AppShell` keeps the signature every
 * screen already renders — title, context, actions, children — and DECLARES
 * that chrome to the frame above rather than mounting one of its own: it is
 * the screen's half of the top bar, and its children go straight into the
 * frame's `<main>`. A screen rendered with no frame above has nothing to
 * declare to and says so loudly; nothing in the product does that.
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
import {
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Link, useLocation } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot } from '@/components/ab/motion'
import { NavIndicator } from '@/components/ab/nav-indicator'
import { NotificationBell } from '@/components/ab/notification-bell'
import { OfflineBanner } from '@/components/ab/offline-banner'
import { ShellChromeContext, type ShellChrome } from '@/components/ab/shell-chrome'
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

/**
 * The frame re-renders whenever a screen declares its top bar and on every
 * arrival. The rail and the top bar's chips take no props and subscribe to
 * their own hooks, so they re-render only for their own reasons — a
 * navigation costs the header, not the whole chrome.
 */
const Rail = memo(AppSidebar)
const CreditChip = memo(PlanCreditChip)
const Bell = memo(NotificationBell)
const Account = memo(AccountMenu)

/**
 * The screen's half of the shell: declare the top bar, render the content.
 * Same props every screen has always passed; the chrome they describe is the
 * frame's, mounted once above the outlet this renders into.
 */
export function AppShell({
  title,
  context,
  actions,
  children,
}: ShellChrome & { children: ReactNode }) {
  const declare = useContext(ShellChromeContext)
  // Before paint, so the top bar never shows the previous screen's title over
  // this screen's content — the frame's state update is flushed in the same
  // commit.
  useLayoutEffect(() => {
    declare?.({ title, context, actions })
  }, [declare, title, context, actions])
  if (!declare) {
    throw new Error(
      "AppShell renders under AppFrame — the signed-in world's layout route mounts the chrome once (item 77); a screen outside it has no frame to declare to.",
    )
  }
  return <>{children}</>
}

/**
 * The chrome, mounted ONCE by the layout route. Its top bar reads whatever the
 * screen in its outlet declared; its main is where the screen renders.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<ShellChrome>({ title: '' })
  // A new location is a new arrival: the entrance re-arms per navigation,
  // exactly as it did when every screen mounted a shell of its own.
  const { key: arrivalKey } = useLocation()
  const arrived = useContentEntrance(arrivalKey)
  return (
    <ShellChromeContext.Provider value={setChrome}>
      <AppFrameChrome chrome={chrome} arrived={arrived}>
        {children}
      </AppFrameChrome>
    </ShellChromeContext.Provider>
  )
}

function AppFrameChrome({
  chrome: { title, context, actions },
  arrived,
  children,
}: {
  chrome: ShellChrome
  arrived: boolean
  children: ReactNode
}) {
  return (
    <SidebarProvider
      // 72px icon rail per screens4.md §0.2 (shadcn's default is 48px).
      style={{ '--sidebar-width-icon': '4.5rem' } as CSSProperties}
    >
      <Rail />
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
            <CreditChip />
            <Bell />
            <Account />
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
           * CONTENT ARRIVES RATHER THAN APPEARING (ORDER MOTION-0914/A §3,
           * kept by the A2 ruling).
           *
           * Where a skeleton preceded it, React unmounts one subtree and
           * mounts another, so no element's style changes and no CSS
           * transition can span the two. The shell is the one place that can
           * see the handover, so it marks it here and globals.css carries it.
           *
           * A2 removed the 400ms artificial wait that used to sit in front of
           * this on every navigation; the 220ms entrance itself was ruled to
           * stay. It is a 4px rise and nothing else — the fade it used to
           * carry put every tight colour pair on the screen under AA for the
           * length of it, which two @axe specs caught and globals.css records.
           * The content is interactive for every frame, so it delays no input;
           * what it cost before was the wait it followed, not itself.
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
 * True for one play, when this screen's content arrives.
 *
 * ORDER MOTION-0914/A2 changed what "arrives" means. It used to be the
 * loading→ready EDGE, which was every navigation only because
 * `useScreenPhase` manufactured a 400ms skeleton on every mount. That delay is
 * gone: a static screen is ready on its first render and there is no edge to
 * catch, so keying off one would have silently retired the entrance the
 * founder ruled should stay.
 *
 * So it fires when the frame first sees `ready` FOR THIS ARRIVAL — immediately
 * when there was nothing to wait for, and after the wait when there was. The
 * frame is mounted once now (ORDER-SHELL-0915), so "first" is keyed on the
 * location: each navigation is a new arrival and plays once, exactly as it
 * did when every screen mounted a shell of its own. A new arrival inside the
 * previous play's 600 ms starts clean — the attribute comes off before paint
 * and goes back on in the next commit, so the animation restarts rather than
 * running out the old clock.
 *
 * Still an edge, not a state: `phase === 'ready'` stays true for the life of a
 * loaded screen, and keying the animation off it would replay on every
 * re-render, which is the decorative entrance §5 bans.
 */
function useContentEntrance(arrivalKey: string): boolean {
  const phase = useScreenPhase()
  const playedFor = useRef<string | null>(null)
  const [arrived, setArrived] = useState(false)

  useLayoutEffect(() => {
    setArrived(false)
  }, [arrivalKey])

  useEffect(() => {
    if (phase !== 'ready' || playedFor.current === arrivalKey) return
    playedFor.current = arrivalKey
    setArrived(true)
  }, [phase, arrivalKey])

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
