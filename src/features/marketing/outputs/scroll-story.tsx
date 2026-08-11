import { Check } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ApprovalDemo } from './approval-demo'
import { DEMO_BRANDS } from './demo-brands'
import {
  ArabicSocialCard,
  ChannelLabel,
  InstagramCard,
  LinkedInExecutiveCard,
  NewsletterCard,
  XCard,
} from './post-cards'
import { AMBIENT, ambientStyle } from './motion-tokens'
import { CARD_IDS, poseTransform, posesAt, sceneFor, type CardId } from './story-layout'
import { useCinematicLayer, useMediaQuery } from './use-media'

/**
 * The 3D output story (brief §3–§4): one continuous scroll choreography.
 * The engine animates `transform`/`opacity` only, on native scroll, with
 * the same rAF easing discipline as rb/01 — the loop eases scroll progress,
 * never the scroll position. It mounts only when the browser affirms
 * no-preference AND the viewport is wide enough for the field; everywhere
 * else the same story renders as a static, fully readable flow whose card
 * strip swipes natively on mobile (§31).
 */

const SCENE_COPY: { headline: string; body: string }[] = [
  { headline: '', body: '' }, // S1 carries the hero intro instead
  { headline: 'Built overnight.', body: 'Every morning, your marketing is already waiting.' },
  { headline: 'It remembers your business.', body: 'Taught once. Applied to everything it prepares.' },
  {
    headline: "Malaky doesn't wait for a prompt.",
    body: "It knows your brand. It knows what's coming. It remembers what you've approved. And it starts before you ask.",
  },
  { headline: 'You approve what goes out.', body: 'Review. Edit. Approve. Nothing publishes without you.' },
  { headline: 'Approved. Handled.', body: 'After your yes, Malaky handles the next step.' },
]

const MEMORY_CHIPS = [
  'Brand voice',
  'Products',
  'Audience',
  'Campaign history',
  'Previous approvals',
  'Content preferences',
]

function MemoryChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-xs',
        className,
      )}
    >
      <Check aria-hidden className="size-3 text-success" />
      {label}
    </span>
  )
}

function ChannelRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-5 gap-y-2', className)}>
      <ChannelLabel channel="instagram" />
      <ChannelLabel channel="linkedin-company" />
      <ChannelLabel channel="facebook" />
      <ChannelLabel channel="x" comingSoon />
      <ChannelLabel channel="newsletter" />
    </div>
  )
}

/** The six cards, one slot each; the company slot is the approval demo. */
function CardForSlot({ id, active }: { id: CardId; active: boolean }) {
  switch (id) {
    case 'instagram':
      return <InstagramCard brand={DEMO_BRANDS.nura} state="prepared" />
    case 'company':
      return <ApprovalDemo floating active={active} />
    case 'executive':
      return <LinkedInExecutiveCard brand={DEMO_BRANDS.meezan} state="prepared" />
    case 'arabic':
      return <ArabicSocialCard brand={DEMO_BRANDS.zaytoun} state="prepared" />
    case 'newsletter':
      return <NewsletterCard brand={DEMO_BRANDS.falak} state="approved" />
    case 'x':
      return <XCard brand={DEMO_BRANDS.falak} state="prepared" />
  }
}

function StoryEngine({ intro }: { intro: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<Partial<Record<CardId, HTMLDivElement | null>>>({})
  const [scene, setScene] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let current = 0
    let target = 0
    let raf = 0
    let running = false
    let renderedScene = -1

    const apply = () => {
      const poses = posesAt(current)
      for (const id of CARD_IDS) {
        const node = cardRefs.current[id]
        if (!node) continue
        const pose = poses[id]
        node.style.transform = poseTransform(pose)
        node.style.opacity = String(pose.o)
        node.style.zIndex = String(pose.z)
      }
      const sceneNow = sceneFor(current)
      if (sceneNow !== renderedScene) {
        renderedScene = sceneNow
        setScene(sceneNow)
      }
    }

    const tick = () => {
      current += (target - current) * 0.16
      if (Math.abs(target - current) < 0.0005) current = target
      apply()
      if (current !== target) {
        raf = requestAnimationFrame(tick)
      } else {
        running = false
      }
    }

    const kick = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const readTarget = () => {
      const rect = section.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      target = span > 0 ? Math.min(Math.max(-rect.top / span, 0), 1) : 0
    }

    const onScroll = () => {
      readTarget()
      kick()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    readTarget()
    kick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section ref={sectionRef} data-mk-engine className="relative h-[620vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Copy rail — one block per scene, cross-fading on scene changes. */}
        <div className="absolute top-1/2 left-[max(1.5rem,4vw)] z-20 w-[30vw] max-w-md -translate-y-1/2">
          <div data-mk-stage={scene === 0 ? 'in' : ''} inert={scene !== 0 || undefined}>
            {intro}
          </div>
          {SCENE_COPY.slice(1).map((copy, index) => (
            <div
              key={copy.headline}
              data-mk-stage={scene === index + 1 ? 'in' : ''}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2"
            >
              <p className="font-display text-4xl font-semibold tracking-tight text-balance">
                {copy.headline}
              </p>
              <p className="mt-3 max-w-[38ch] text-lg text-muted-foreground">{copy.body}</p>
            </div>
          ))}
        </div>

        {/* The card field. */}
        <div className="absolute inset-0">
          {CARD_IDS.map((id) => (
            <div
              key={id}
              ref={(node) => {
                cardRefs.current[id] = node
              }}
              className="absolute top-[44%] left-[64%] w-72 will-change-transform"
            >
              {/* Nested on purpose: the engine writes `transform` on the
                  outer slot, the ambient drift animates this inner wrapper —
                  the two never touch the same element (no fighting). Paused
                  while the approval moment owns the company card. */}
              <div
                data-mk-ambient={id === 'company' && scene === 4 ? 'paused' : ''}
                style={ambientStyle(AMBIENT[id])}
              >
                <CardForSlot id={id} active={scene === 4} />
              </div>
            </div>
          ))}

          {/* S3 — memory chips floating near the work. */}
          <div data-mk-stage={scene === 2 ? 'in' : ''} className="pointer-events-none">
            {MEMORY_CHIPS.map((label, index) => (
              <MemoryChip
                key={label}
                label={label}
                className={cn(
                  'absolute',
                  [
                    'top-[16%] left-[46%]',
                    'top-[12%] left-[70%]',
                    'top-[30%] left-[88%]',
                    'top-[74%] left-[43%]',
                    'top-[82%] left-[64%]',
                    'top-[72%] left-[86%]',
                  ][index],
                )}
              />
            ))}
          </div>

          {/* S6 — the channels the work is heading toward. */}
          <div
            data-mk-stage={scene === 5 ? 'in' : ''}
            className="pointer-events-none absolute right-0 bottom-[8%] left-[34%]"
          >
            <ChannelRow />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The same story with no engine: reduced motion, narrow viewports, and any
 * browser that cannot affirm the gate. Content is complete and readable in
 * document flow; the card strip scroll-snaps, so on a phone the story is a
 * swipe through the same cards (§31).
 */
function StoryStatic({ intro }: { intro: ReactNode }) {
  return (
    <div className="flex flex-col gap-16 py-16">
      <div className="mx-auto w-full max-w-3xl px-6">{intro}</div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
        {CARD_IDS.map((id) => (
          <div key={id} className="w-[85vw] max-w-xs shrink-0 snap-center">
            {/* Reduced amplitude on the swipe strip (brief §20); under
                reduced motion the drift never runs at all. */}
            <div data-mk-ambient="" style={ambientStyle(AMBIENT[id], 0.5)}>
              {id === 'company' ? (
                <ApprovalDemo active={false} />
              ) : (
                <CardForSlot id={id} active={false} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6">
        {SCENE_COPY.slice(1, 4).map((copy) => (
          <div key={copy.headline}>
            <p className="font-display text-3xl font-semibold tracking-tight">{copy.headline}</p>
            <p className="mt-2 max-w-[46ch] text-muted-foreground">{copy.body}</p>
            {copy.headline === 'It remembers your business.' && (
              <div className="mt-4 flex flex-wrap gap-2">
                {MEMORY_CHIPS.map((label) => (
                  <MemoryChip key={label} label={label} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div>
          <p className="font-display text-3xl font-semibold tracking-tight">
            {SCENE_COPY[4].headline}
          </p>
          <p className="mt-2 max-w-[46ch] text-muted-foreground">{SCENE_COPY[4].body}</p>
          <ApprovalDemo className="mt-5 max-w-sm" />
        </div>

        <div>
          <p className="font-display text-3xl font-semibold tracking-tight">
            {SCENE_COPY[5].headline}
          </p>
          <p className="mt-2 max-w-[46ch] text-muted-foreground">{SCENE_COPY[5].body}</p>
          <ChannelRow className="mt-4 justify-start" />
        </div>
      </div>
    </div>
  )
}

export function OutputStory({ intro }: { intro: ReactNode }) {
  const cinematic = useCinematicLayer()
  const wide = useMediaQuery('(min-width: 1024px)')
  return cinematic && wide ? <StoryEngine intro={intro} /> : <StoryStatic intro={intro} />
}
