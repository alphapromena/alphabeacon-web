import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/** N2 — 404 (W0 seed; W6 adds the on-brand illustration + support link). */
export function NotFoundScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="font-display text-6xl font-bold tracking-tight">404</p>
      <p className="text-muted-foreground">Page not found.</p>
      <Button asChild>
        <Link to="/">Back to the Dashboard</Link>
      </Button>
    </div>
  )
}
