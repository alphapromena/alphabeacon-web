/**
 * N2 — 404, on any unmatched route.
 *
 * The signal gradient stands in for an illustration: it is the product's one
 * piece of brand imagery, so a wrong turn still looks like AlphaBeacon rather
 * than like a server error page.
 *
 * The secondary route out is a real one. "Contact support" has no destination
 * in a product with no support inbox, so it points at the people who can
 * actually act — the admins in this workspace — instead of a link that goes
 * nowhere.
 */
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/data/provider'

export function NotFoundScreen() {
  const session = useSession()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden
          className="h-1 w-40 rounded-full bg-[image:var(--signal-gradient)] shadow-[var(--glow-signal)]"
        />
        <p className="font-mono text-sm tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">
          The link that brought you here points at something that has moved or never existed.
          Nothing is broken in your workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link to="/">{session.signedIn ? 'Back to the Dashboard' : 'Back to the home page'}</Link>
        </Button>
        {session.signedIn && (
          <Button asChild variant="ghost">
            <Link to="/settings/team">Ask an admin on your team</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
