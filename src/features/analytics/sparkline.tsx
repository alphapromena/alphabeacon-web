/**
 * The little trend line on G1's channel cards.
 *
 * Deliberately not a chart library instance: nine of these on one screen is a
 * lot of machinery for a shape with no axes, no tooltip and no legend. It draws
 * in `currentColor` so it inherits whatever the card is already using, and it
 * is `aria-hidden` with a written label beside it — a squiggle has nothing to
 * say to a screen reader that the numbers underneath do not say better.
 */
export function Sparkline({
  values,
  label,
  className,
}: {
  values: number[]
  /** Named for sighted context only; the figures below carry the meaning. */
  label: string
  className?: string
}) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const width = 100
  const height = 28

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / span) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className ?? 'h-8 w-full text-primary'}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
