/**
 * The data layer's one door to the router (NIGHT-0916 order 2, item 83).
 *
 * The router registers its `navigate` here once it exists (routes.tsx), and
 * the world layout reports every path the router COMMITS. A seam that must
 * move the app BEFORE it changes state awaits both: a deliberate sign-out
 * lands on the marketing home, and the only way to make that the landing the
 * guards see is to be on `/` — committed, not merely requested — before the
 * session clears. A guard on an authed route answers a signed-out render with
 * login (D-FIX-0915-A), and the router's navigation is a React transition,
 * which a plain state update overtakes; so the request alone is not enough,
 * and no timer would make it enough. The 401 handler keeps its own history
 * push: a forced sign-out lands on login, and the guard agrees.
 *
 * With no router registered (a seam under test on its own) the fallback is
 * the same history push the 401 handler uses, which the declarative routers
 * in tests follow. With no reporter mounted, the request is all there is to
 * await.
 */
export type Navigate = (to: string, options?: { replace?: boolean }) => void | Promise<void>

let current: Navigate | null = null
let reporterMounted = false
let committedPathname = ''
let waiters: Array<() => void> = []

export function configureNavigation(navigate: Navigate | null): void {
  current = navigate
}

/** The layout that reports commits says when it is there to report them. */
export function setCommitReporter(mounted: boolean): void {
  reporterMounted = mounted
  if (!mounted) release()
}

/** The router committed a location; whoever was waiting on one may go on. */
export function reportCommittedPath(pathname: string): void {
  committedPathname = pathname
  release()
}

function release(): void {
  const due = waiters
  waiters = []
  for (const resolve of due) resolve()
}

/**
 * Request a navigation and, where the router reports commits, wait for the
 * next one — the requested location, or whatever superseded it (then the
 * guards decide, which is the fallback either way). No timer.
 */
export async function navigateTo(to: string, options?: { replace?: boolean }): Promise<void> {
  if (!current) {
    window.history[options?.replace ? 'replaceState' : 'pushState']({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }
  const pathname = to.split(/[?#]/, 1)[0]
  if (!reporterMounted || committedPathname === pathname) {
    await current(to, options)
    return
  }
  const committed = new Promise<void>((resolve) => waiters.push(resolve))
  await current(to, options)
  await committed
}
