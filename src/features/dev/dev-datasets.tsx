/**
 * /dev/datasets — swap the whole-tenant world the app reads. Dev-only route,
 * excluded from production builds.
 */
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDataDispatch, useDatasetInfo } from '@/data/provider'
import { cn } from '@/lib/utils'

export function DevDatasetsScreen() {
  const { id: activeId, all } = useDatasetInfo()
  const dispatch = useDataDispatch()
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 bg-background px-6 py-10 text-foreground">
      <header>
        <h1 className="font-display text-2xl font-semibold">Datasets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One tap swaps the world the whole app reads. In-memory only — a refresh resets to the
          dataset's initial state. Nothing here is persistence.
        </p>
      </header>
      <div className="flex flex-col gap-3">
        {all.map((dataset) => (
          <Card key={dataset.id} className={cn(dataset.id === activeId && 'border-primary')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{dataset.label}</CardTitle>
              {dataset.id === activeId ? (
                <span className="text-sm font-medium text-primary">Active</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dispatch({ type: 'dataset/switch', id: dataset.id })}
                >
                  Activate
                </Button>
              )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {dataset.description}
            </CardContent>
          </Card>
        ))}
      </div>
      <nav className="flex gap-4 text-sm">
        <Link className="underline underline-offset-4" to="/">
          ← App
        </Link>
        <Link className="underline underline-offset-4" to="/dev/states">
          State switcher
        </Link>
      </nav>
    </div>
  )
}
