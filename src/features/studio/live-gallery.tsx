/**
 * E1 in live mode (INT-11) — the gallery IS the catalog.
 *
 * Every card here is read from `GET catalog/capabilities/:c`: the friendly name
 * is the wire's own `displayHint`, the price is its `cost`, the plan gate is
 * `appMetadata.min_plan`. Nothing is hardcoded, and there is nothing to
 * hardcode — the platform speaks only in the app's own aliases and no vendor
 * name ever crosses the wire.
 *
 * A capability that is unknown OR not granted answers 404 identically (the
 * upstream refuses to leak its roadmap), so this probes and lists what came
 * back. Granted capabilities whose request body is not fully known from
 * `capabilitySchema` + the upstream collection are listed WITHOUT a composer
 * rather than given a form built on a guessed body (amendment 6, 2026-08-17).
 */
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import {
  COMPOSABLE_CAPABILITIES,
  GALLERY_CAPABILITIES,
  useStudioActions,
  type CapabilityCatalog,
} from '@/data/studio'
import { MESSAGES } from '@/lib/messages'
import { formatUsdString } from '@/lib/money'

/** A price line, only when the catalog actually exposes one. */
function priceLine(cost: Record<string, string> | undefined): string {
  if (!cost) return MESSAGES.notices.chargedToBalance
  const [unit, value] = Object.entries(cost)[0] ?? []
  if (!unit || !value) return MESSAGES.notices.chargedToBalance
  // A decimal string, shown as given — never parsed into a float (D-INT-E).
  return `${formatUsdString(value)} per ${unit.replace(/_/g, ' ').replace(/s$/, '')}`
}

export function LiveGallery() {
  const studio = useStudioActions()
  const [catalogs, setCatalogs] = useState<CapabilityCatalog[] | null>(null)
  const [kind, setKind] = useState<'all' | 'image' | 'video'>('all')

  useEffect(() => {
    let cancelled = false
    void Promise.all(GALLERY_CAPABILITIES.map((capability) => studio.catalog(capability))).then(
      (results) => {
        if (cancelled) return
        setCatalogs(results.filter((entry): entry is CapabilityCatalog => entry !== null))
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- probed once per org
  }, [studio.orgId])

  if (catalogs === null)
    return <SkeletonCardGrid cards={6} columns={3} label="Loading the studio" />

  const visible = catalogs.filter((entry) =>
    kind === 'all' ? true : entry.models.some((model) => model.kind === kind),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by kind">
        {(['all', 'image', 'video'] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={kind === option ? 'default' : 'outline'}
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className="capitalize"
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((entry) => {
          const composable = (COMPOSABLE_CAPABILITIES as readonly string[]).includes(
            entry.capability,
          )
          return (
            <Card key={entry.capability} className="h-full">
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{entry.capability}</span>
                  {!entry.selectable && (
                    <Badge variant="outline" className="font-normal">
                      Fixed model
                    </Badge>
                  )}
                </div>

                <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {entry.models.map((model) => (
                    <li key={model.alias} className="flex flex-wrap items-center gap-1.5">
                      {/* The wire's own friendly label — never a vendor name. */}
                      <span className="text-foreground">{model.displayHint ?? model.alias}</span>
                      <Badge variant="outline" className="font-normal capitalize">
                        {model.kind}
                      </Badge>
                      <Badge variant="outline" className="font-normal capitalize">
                        {model.plan}
                      </Badge>
                      {typeof model.appMetadata?.min_plan === 'string' && (
                        <Badge variant="outline" className="font-normal capitalize">
                          {model.appMetadata.min_plan}
                        </Badge>
                      )}
                      <span>· {priceLine(model.cost)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {composable ? (
                    <Button asChild size="sm">
                      <Link to={`/studio/new?capability=${entry.capability}`}>
                        <Sparkles aria-hidden />
                        Create
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {MESSAGES.notices.capabilityComingSoon}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {MESSAGES.empty.noCapabilities}
        </p>
      )}
    </div>
  )
}
