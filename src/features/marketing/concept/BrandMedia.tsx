/* eslint-disable ab/no-raw-color -- DRAWN ARTWORK, not interface.
   Every hex below is a coordinate in an illustration: the gradient stops, the
   graphite grounds and the one accent that the concept creatives are composed
   from. They are the picture, the way a photograph's pixels are the picture,
   and they answer to `styles/marketing.css` — the marketing world's token
   file, whose values they are drawn to match — not to the app's semantic
   tokens, which describe interface state and have nothing to say about a
   shadow under a coffee cup. Same exemption the retired M1 gave
   `demo-brands.ts`, scoped the same way: verify:w02 asserts this list of
   files and no other. */
import {
  ASPECT_CSS,
  focalToObjectPosition,
  focalToPreserveAspectRatio,
  type AspectRatio,
  type FocalPoint,
  type MediaScene,
} from '@/features/marketing/concept/lib/media'
import type { CampaignCreativeId } from '@/features/marketing/concept/lib/campaign-creative'
import { BrandVideo } from './BrandVideo'
import { CampaignCreative } from './CampaignCreative'
import styles from './BrandMedia.module.css'

/**
 * Concept creative, drawn as SVG.
 *
 * Every company on this site is a real Malaky customer, and we hold none of
 * their photography, colours or marks. So none of these scenes borrows any:
 * they are drawn in one neutral, Malaky-owned range — graphite, slate, warm
 * stone and a single restrained accent — and a scene is chosen for what it
 * depicts, not for whose brand it resembles.
 *
 * That neutrality is the point. A card carrying one of these is prepared
 * concept work, and it should look like prepared concept work rather than
 * like something the customer published.
 *
 * Gradients live in <MediaDefs />, rendered once per page, so repeated scenes
 * cost almost nothing.
 */

export function MediaDefs() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <defs>
        {/* Graphite ground, for the abstract scenes. */}
        <linearGradient id="mk-ground" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#141b21" />
          <stop offset="60%" stopColor="#0e151a" />
          <stop offset="100%" stopColor="#080d11" />
        </linearGradient>

        {/* Slate interior — the office scene's air. */}
        <linearGradient id="mk-slate" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#26303a" />
          <stop offset="55%" stopColor="#19222a" />
          <stop offset="100%" stopColor="#0f1519" />
        </linearGradient>

        {/* Dusk beyond a window. Cool, never branded. */}
        <linearGradient id="mk-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d4b58" />
          <stop offset="70%" stopColor="#5b6472" />
          <stop offset="100%" stopColor="#8b8378" />
        </linearGradient>

        {/* Warm stone, for the table and still-life scenes. */}
        <linearGradient id="mk-stone" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#2a241f" />
          <stop offset="55%" stopColor="#1d1916" />
          <stop offset="100%" stopColor="#120f0d" />
        </linearGradient>

        {/* The one warm light in the room. */}
        <radialGradient id="mk-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f0d19c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f0d19c" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Abstract — data and movement
 * ------------------------------------------------------------------ */

/**
 * A lattice of records and the links between them, with a handful of nodes
 * flagged. Reads as monitoring without illustrating any particular product.
 */
function DataLattice() {
  const cols = [70, 130, 190, 250, 310]
  const rows = [80, 140, 200, 260, 320]
  /* Fixed, not random: the same picture every render, on server and client. */
  const flagged = new Set(['190-140', '130-260', '310-200'])

  return (
    <>
      <rect width="400" height="400" fill="url(#mk-ground)" />
      <ellipse cx="200" cy="180" rx="190" ry="150" fill="url(#mk-lamp)" opacity="0.5" />

      {/* links */}
      <g stroke="#f3ede6" strokeOpacity="0.14" strokeWidth="1">
        {rows.map((y) =>
          cols
            .slice(0, -1)
            .map((x) => <line key={`h${x}-${y}`} x1={x} y1={y} x2={x + 60} y2={y} />),
        )}
        {cols.map((x) =>
          rows
            .slice(0, -1)
            .map((y) => <line key={`v${x}-${y}`} x1={x} y1={y} x2={x} y2={y + 60} />),
        )}
      </g>
      <g stroke="#f3ede6" strokeOpacity="0.07" strokeWidth="1">
        <line x1="70" y1="80" x2="310" y2="320" />
        <line x1="310" y1="80" x2="70" y2="320" />
      </g>

      {/* nodes */}
      {rows.map((y) =>
        cols.map((x) => {
          const on = flagged.has(`${x}-${y}`)
          return (
            <circle
              key={`n${x}-${y}`}
              cx={x}
              cy={y}
              r={on ? 7 : 4}
              fill={on ? '#ff4e2d' : '#f3ede6'}
              opacity={on ? 0.95 : 0.35}
            />
          )
        }),
      )}
      {[...flagged].map((k) => {
        const [x, y] = k.split('-').map(Number)
        return (
          <circle
            key={`r${k}`}
            cx={x}
            cy={y}
            r="15"
            fill="none"
            stroke="#ff4e2d"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
        )
      })}

      {/* a quiet baseline, so the frame has a floor */}
      <rect y="358" width="400" height="1" fill="#f3ede6" opacity="0.1" />
    </>
  )
}

/**
 * Streams crossing a wide frame, one carrying an interruption. Built for the
 * 16:9 and 9:16 crops, so the interest sits near the centre band.
 */
function SignalFlow() {
  const lanes = [128, 168, 208, 248, 272]
  return (
    <>
      <rect width="400" height="400" fill="url(#mk-ground)" />
      <ellipse cx="230" cy="200" rx="210" ry="130" fill="url(#mk-lamp)" opacity="0.42" />

      <g>
        {lanes.map((y, i) => (
          <g key={y}>
            <line
              x1="20"
              y1={y}
              x2="380"
              y2={y}
              stroke="#f3ede6"
              strokeOpacity={i === 2 ? 0.3 : 0.13}
              strokeWidth={i === 2 ? 2 : 1}
            />
            {/* packets travelling the lane */}
            {[70, 140, 210, 280].map((x, j) => (
              <rect
                key={x}
                x={x + i * 9}
                y={y - 3}
                width={j % 2 ? 26 : 16}
                height="6"
                rx="3"
                fill="#f3ede6"
                opacity={i === 2 ? 0.5 : 0.22}
              />
            ))}
          </g>
        ))}
      </g>

      {/* the one lane that stops, and the flag on it */}
      <line
        x1="292"
        y1="208"
        x2="380"
        y2="208"
        stroke="#ff4e2d"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeDasharray="5 6"
      />
      <circle cx="292" cy="208" r="9" fill="#ff4e2d" opacity="0.95" />
      <circle
        cx="292"
        cy="208"
        r="19"
        fill="none"
        stroke="#ff4e2d"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      <g fill="#f3ede6" opacity="0.12">
        <rect x="20" y="96" width="120" height="2" />
        <rect x="20" y="306" width="76" height="2" />
      </g>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Depicted — rooms and tables
 * ------------------------------------------------------------------ */

/** A working office at dusk: window bay, city beyond, a desk in shadow. */
function Office() {
  return (
    <>
      <rect width="400" height="400" fill="url(#mk-slate)" />

      <g>
        <rect x="40" y="40" width="320" height="232" fill="url(#mk-dusk)" opacity="0.85" />
        {[40, 148, 256, 356].map((x) => (
          <rect key={x} x={x} y="34" width="5" height="244" fill="#10161b" />
        ))}
        <rect x="40" y="150" width="320" height="4" fill="#10161b" opacity="0.85" />

        {/* city beyond */}
        <g fill="#141c23" opacity="0.72">
          <rect x="62" y="180" width="26" height="92" />
          <rect x="96" y="152" width="18" height="120" />
          <rect x="124" y="196" width="30" height="76" />
          <rect x="170" y="164" width="22" height="108" />
          <rect x="200" y="188" width="34" height="84" />
          <rect x="246" y="156" width="20" height="116" />
          <rect x="274" y="192" width="30" height="80" />
          <rect x="312" y="170" width="24" height="102" />
        </g>
        {/* a few lit windows */}
        <g fill="#f0d19c" opacity="0.5">
          <rect x="100" y="168" width="4" height="6" />
          <rect x="106" y="184" width="4" height="6" />
          <rect x="250" y="176" width="4" height="6" />
          <rect x="316" y="190" width="4" height="6" />
        </g>
      </g>

      <ellipse cx="120" cy="120" rx="150" ry="110" fill="#f3ede6" opacity="0.05" />

      {/* desk */}
      <rect y="286" width="400" height="114" fill="#12181d" />
      <rect y="286" width="400" height="8" fill="#222b33" />
      <ellipse cx="200" cy="300" rx="150" ry="12" fill="#f3ede6" opacity="0.05" />

      {/* what is on it */}
      <g>
        <rect x="70" y="246" width="96" height="42" rx="3" fill="#f3ede6" opacity="0.86" />
        <rect x="80" y="256" width="60" height="3" fill="#12181d" opacity="0.55" />
        <rect x="80" y="264" width="76" height="3" fill="#12181d" opacity="0.38" />
        <rect x="80" y="272" width="44" height="3" fill="#12181d" opacity="0.38" />
        <path d="M244 288v-24c0-8 6-14 14-14s14 6 14 14v24Z" fill="#0f1418" />
        <ellipse cx="258" cy="264" rx="14" ry="4" fill="#8b8378" opacity="0.55" />
      </g>
    </>
  )
}

/** A long table laid for service, lit from above. */
function LongTable() {
  const settings = [78, 152, 226, 300]
  return (
    <>
      <rect width="400" height="400" fill="url(#mk-stone)" />
      <ellipse cx="200" cy="150" rx="180" ry="120" fill="url(#mk-lamp)" opacity="0.75" />

      {/* the table */}
      <rect x="24" y="196" width="352" height="150" rx="6" fill="#241e19" />
      <rect x="24" y="196" width="352" height="7" rx="3" fill="#3a3129" />
      <rect x="40" y="214" width="320" height="112" rx="4" fill="#f3ede6" opacity="0.06" />

      {/* settings */}
      {settings.map((x) => (
        <g key={x}>
          <circle cx={x} cy="252" r="21" fill="#f3ede6" opacity="0.9" />
          <circle cx={x} cy="252" r="13" fill="#e8ddcd" opacity="0.85" />
          <rect x={x + 27} y="238" width="3" height="30" rx="1.5" fill="#c9bfae" opacity="0.75" />
          <rect x={x - 30} y="238" width="3" height="30" rx="1.5" fill="#c9bfae" opacity="0.75" />
          <ellipse cx={x} cy="278" rx="24" ry="5" fill="#000" opacity="0.28" />
        </g>
      ))}

      {/* low light over the length of it */}
      <g>
        {[112, 200, 288].map((x) => (
          <g key={x}>
            <line x1={x} y1="40" x2={x} y2="112" stroke="#3a3129" strokeWidth="2" />
            <path d={`M${x - 22} 112h44l-8 18h-28Z`} fill="#2c251f" />
            <ellipse cx={x} cy="132" rx="16" ry="6" fill="#f0d19c" opacity="0.45" />
          </g>
        ))}
      </g>

      <rect y="346" width="400" height="54" fill="#100d0b" />
    </>
  )
}

/** A close still life: one dish, one glass, close crop. */
function StillLife() {
  return (
    <>
      <rect width="400" height="400" fill="url(#mk-stone)" />
      <ellipse cx="180" cy="170" rx="170" ry="140" fill="url(#mk-lamp)" opacity="0.7" />

      {/* surface */}
      <rect y="250" width="400" height="150" fill="#1c1815" />
      <rect y="250" width="400" height="6" fill="#332b24" />

      {/* the dish */}
      <ellipse cx="176" cy="256" rx="118" ry="34" fill="#000" opacity="0.32" />
      <ellipse cx="176" cy="246" rx="112" ry="40" fill="#f3ede6" opacity="0.94" />
      <ellipse cx="176" cy="243" rx="86" ry="29" fill="#e6dccb" />
      <g opacity="0.9">
        <ellipse cx="150" cy="238" rx="34" ry="15" fill="#c98a4b" />
        <ellipse cx="196" cy="244" rx="30" ry="13" fill="#b9793d" />
        <ellipse cx="172" cy="232" rx="24" ry="10" fill="#dda765" />
      </g>

      {/* glass */}
      <g opacity="0.85">
        <path d="M300 156h44l-6 74h-32Z" fill="#f3ede6" opacity="0.16" />
        <path d="M300 156h44l-2 26h-40Z" fill="#f3ede6" opacity="0.26" />
        <rect x="316" y="230" width="12" height="22" fill="#f3ede6" opacity="0.14" />
        <ellipse cx="322" cy="254" rx="22" ry="6" fill="#f3ede6" opacity="0.2" />
      </g>

      {/* linen */}
      <g fill="#f3ede6" opacity="0.08">
        <rect x="24" y="292" width="132" height="46" rx="4" />
        <rect x="40" y="304" width="100" height="2" />
      </g>
    </>
  )
}

const SCENES: Record<MediaScene, () => React.JSX.Element> = {
  'data-lattice': DataLattice,
  'signal-flow': SignalFlow,
  office: Office,
  'long-table': LongTable,
  'still-life': StillLife,
}

export interface BrandMediaProps {
  /** "image" (default) or "video". */
  type?: 'image' | 'video'
  /** Real asset path. When absent, the drawn scene stands in. */
  src?: string
  srcSet?: string
  /** Video poster, and the whole frame under reduced motion. */
  poster?: string
  /** Malaky-drawn concept creative. */
  scene?: MediaScene
  /** Campaign creative composed in the customer's own design language. */
  creative?: CampaignCreativeId
  alt: string
  aspect?: AspectRatio
  /** Anchors the crop. Omit for centre, which is the historical behaviour. */
  focal?: FocalPoint
  overline?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Renders one creative at one aspect ratio.
 *
 * Three cases, in order: a real video, a real image, or the drawn scene that
 * stands in where no real asset exists. Framing is driven by the asset's focal
 * point in every case, so a 16:9 crop of a portrait subject no longer silently
 * takes the middle of the frame.
 */
export function BrandMedia({
  type = 'image',
  src,
  srcSet,
  poster,
  scene,
  creative,
  alt,
  aspect = '16:9',
  focal,
  overline,
  className,
  children,
}: BrandMediaProps) {
  const wrapper = [styles.media, className].filter(Boolean).join(' ')
  const frame = { aspectRatio: ASPECT_CSS[aspect] }

  /* Composed campaign creative wins over a neutral scene: where we know how a
     customer's campaign actually looks, we should not be drawing an abstract
     stand-in for it. */
  if (creative) {
    return (
      <div className={wrapper} style={frame}>
        <CampaignCreative id={creative} />
        {overline ? <span className={styles.overline}>{overline}</span> : null}
        {children}
      </div>
    )
  }

  if (type === 'video' && src) {
    return (
      <div className={wrapper} style={frame} role="img" aria-label={alt}>
        <BrandVideo src={src} poster={poster} focal={focal} />
        <span className={styles.vignette} aria-hidden="true" />
        {overline ? <span className={styles.overline}>{overline}</span> : null}
        {children}
      </div>
    )
  }

  // A video with no source yet still shows its poster, if one exists.
  const imageSrc = src ?? (type === 'video' ? poster : undefined)

  if (imageSrc) {
    return (
      <div className={wrapper} style={frame}>
        <img
          className={styles.canvas}
          src={imageSrc}
          srcSet={srcSet}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{ objectFit: 'cover', objectPosition: focalToObjectPosition(focal) }}
        />
        <span className={styles.vignette} aria-hidden="true" />
        {overline ? <span className={styles.overline}>{overline}</span> : null}
        {children}
      </div>
    )
  }

  const Scene = scene ? SCENES[scene] : null
  return (
    <div className={wrapper} style={frame} role="img" aria-label={alt}>
      {Scene && (
        <svg
          className={styles.canvas}
          viewBox="0 0 400 400"
          preserveAspectRatio={focalToPreserveAspectRatio(focal)}
          aria-hidden="true"
          focusable="false"
        >
          <Scene />
        </svg>
      )}
      <span className={styles.vignette} aria-hidden="true" />
      {overline ? <span className={styles.overline}>{overline}</span> : null}
      {children}
    </div>
  )
}
