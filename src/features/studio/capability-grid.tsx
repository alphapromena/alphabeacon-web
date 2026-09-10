/**
 * E1 (ORDER HSN-0910/A): ONE CARD PER CAPABILITY the catalog grants — an image
 * with the feature's name on it (Hasan's point 2), click → that capability's
 * own screen. The 13 come from the table; whether each is granted comes from
 * the wire (a 404 = unknown OR not granted, on purpose), so a card the tenant
 * does not hold is absent, not disabled.
 *
 * The image is decorative under the name label (`aria-hidden`, empty alt —
 * the name is the accessible label); the file is a plain WebP Abdullah may
 * replace (addendum A2, `Docs/qa/hsn-0910/card-art.md`). The price line is
 * the catalog's own decimal string, shown, never parsed.
 */
import { Film, ImageIcon, Mic, Sparkles, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ab/empty-state'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import {
  cardImagePath,
  MEDIA_CAPABILITIES,
  type MediaCapability,
  type OutputKind,
} from '@/data/media-capabilities'
import { useStudioActions, type CapabilityCatalog, type CatalogModel } from '@/data/studio'
import { MESSAGES } from '@/lib/messages'
import { formatUsdString } from '@/lib/money'

type KindFilter = 'all' | OutputKind

const UNIT_LABEL: Record<string, string> = {
  images: 'per image',
  video_seconds: 'per second',
  audio_text_units: 'per 1000 characters',
}

/**
 * The lowest price among the rows, on the unit the capability is priced in —
 * compared as decimal strings, exactly, never as floats (D-INT-E).
 */
function cheapestPrice(models: CatalogModel[]): { unit: string; price: string } | null {
  let best: { unit: string; price: string } | null = null
  for (const model of models) {
    for (const [unit, price] of Object.entries(model.cost ?? {})) {
      if (typeof price !== 'string' || !UNIT_LABEL[unit]) continue
      if (!best || lessThan(price, best.price)) best = { unit, price }
    }
  }
  return best
}

function lessThan(a: string, b: string): boolean {
  const [aWhole, aFraction = ''] = a.split('.')
  const [bWhole, bFraction = ''] = b.split('.')
  const scale = Math.max(aFraction.length, bFraction.length)
  return (
    BigInt(`${aWhole}${aFraction.padEnd(scale, '0')}`) <
    BigInt(`${bWhole}${bFraction.padEnd(scale, '0')}`)
  )
}

function priceLine(catalog: CapabilityCatalog): string {
  const cheapest = cheapestPrice(catalog.models)
  if (!cheapest) return MESSAGES.notices.chargedToBalance
  const money = `${formatUsdString(cheapest.price)} ${UNIT_LABEL[cheapest.unit]}`
  return catalog.selectable ? `from ${money}` : money
}

const KIND_ICON: Record<OutputKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: Film,
}

export function CapabilityGrid() {
  const studio = useStudioActions()
  const [granted, setGranted] = useState<Map<string, CapabilityCatalog> | null>(null)
  const [kind, setKind] = useState<KindFilter>('all')

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      MEDIA_CAPABILITIES.map(async (entry) => [entry.id, await studio.catalog(entry.id)] as const),
    ).then((results) => {
      if (cancelled) return
      const next = new Map<string, CapabilityCatalog>()
      for (const [id, catalog] of results) if (catalog) next.set(id, catalog)
      setGranted(next)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- probed once per org
  }, [studio.orgId])

  if (granted === null) return <SkeletonCardGrid cards={6} columns={3} label="Loading the studio" />

  const visible = MEDIA_CAPABILITIES.filter((entry) => granted.has(entry.id)).filter((entry) =>
    kind === 'all' ? true : entry.output.includes(kind),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by kind">
          {(['all', 'image', 'video', 'audio'] as const).map((option) => (
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
        <Button asChild variant="ghost" size="sm">
          <Link to="/studio/jobs">Your renders →</Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={granted.size === 0 ? 'Nothing here yet' : 'Nothing of that kind'}
          description={
            granted.size === 0 ? MESSAGES.empty.noCapabilities : MESSAGES.empty.noCapabilitiesOfKind
          }
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <li key={entry.id} className="min-w-0">
              <CapabilityCard capability={entry} catalog={granted.get(entry.id)!} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CapabilityCard({
  capability,
  catalog,
}: {
  capability: MediaCapability
  catalog: CapabilityCatalog
}) {
  const Icon = KIND_ICON[capability.output[0]]
  return (
    <Card className="h-full overflow-hidden py-0">
      <Link
        to={`/studio/new?capability=${capability.id}`}
        className="flex h-full flex-col focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        data-capability={capability.id}
        aria-label={capability.name}
      >
        {/* Decorative: the name below is the label. */}
        <img
          src={cardImagePath(capability.id)}
          alt=""
          aria-hidden
          loading="lazy"
          width={1280}
          height={716}
          className="aspect-video w-full object-cover"
        />
        <CardContent className="flex flex-1 flex-col gap-2 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{capability.name}</span>
            {!catalog.selectable && (
              <Badge variant="outline" className="font-normal">
                Fixed model
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{capability.usecase}</p>
          <p className="mt-auto text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{priceLine(catalog)}</span>
            <span className="sr-only">, {capability.id}</span>
          </p>
        </CardContent>
      </Link>
    </Card>
  )
}
