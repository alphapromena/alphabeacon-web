import { useEffect, useRef, useState } from 'react'
import type { AnalysisChannel, BrandAnalysis } from '@/features/marketing/concept/lib/analysis'
import { track } from '@/features/marketing/concept/lib/analytics'
import { usePrefersReducedMotion } from '@/features/marketing/concept/useConceptHooks'
import { PostCard } from '../posts'
import { CheckIcon, CheckCircleIcon, MemoryIcon } from '../icons'
import styles from './brandDemo.module.css'

/**
 * Channel selector plus the one dominant preview.
 *
 * The selector is a real tablist: arrow keys move between channels, and the
 * preview is its panel. Approval here is deliberately a light echo of the
 * full approval section rather than a second copy of it.
 */
export function OutputStage({
  analysis,
  selected,
  onSelect,
}: {
  analysis: BrandAnalysis
  selected: AnalysisChannel
  onSelect: (channel: AnalysisChannel) => void
}) {
  const [approved, setApproved] = useState(false)
  const [remembered, setRemembered] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const timer = useRef<number | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const outputs = analysis.outputs
  const index = outputs.findIndex((o) => o.channel === selected)
  const active = outputs[index] ?? outputs[0]

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  // A new company resets the approval state.
  useEffect(() => {
    setApproved(false)
    setRemembered(false)
  }, [analysis.company.domain])

  const approve = () => {
    if (approved) return
    setApproved(true)
    track('brand_demo_approved', {
      domain: analysis.company.domain,
      channel: active.channel,
    })
    if (reducedMotion) {
      setRemembered(true)
      return
    }
    timer.current = window.setTimeout(() => setRemembered(true), 620)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = outputs.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    if (next == null) return
    e.preventDefault()
    onSelect(outputs[next].channel)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <div className={styles.selector}>
        <p className={styles.selectorLabel}>Channels prepared</p>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Prepared channels"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
        >
          {outputs.map((output, i) => (
            <button
              key={output.channel}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`channel-${output.channel}`}
              aria-selected={output.channel === selected}
              aria-controls="channel-panel"
              tabIndex={output.channel === selected ? 0 : -1}
              className={styles.tab}
              data-on={output.channel === selected || undefined}
              onClick={() => onSelect(output.channel)}
            >
              {output.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewBar}>
          <p className={styles.previewState}>
            Prepared by Malaky
            <span className={styles.previewDot} aria-hidden="true" />
            <span data-approved={approved || undefined}>
              {approved ? 'Approved' : 'Ready for review'}
            </span>
            {approved && <CheckIcon size={12} className={styles.previewCheck} />}
          </p>

          <button type="button" className={styles.approve} onClick={approve} disabled={approved}>
            <CheckCircleIcon size={15} />
            {approved ? 'Approved' : 'Approve'}
          </button>
        </div>

        <div
          className={styles.previewCard}
          id="channel-panel"
          role="tabpanel"
          aria-labelledby={`channel-${active.channel}`}
          tabIndex={-1}
        >
          {/* Keying on the channel restarts the entrance transition. */}
          <div className={styles.previewInner} key={active.channel}>
            <PostCard piece={active.piece} />
          </div>
        </div>

        <div className={styles.remembered} data-on={remembered || undefined}>
          <MemoryIcon size={14} />
          Preference remembered
        </div>
      </div>
    </>
  )
}
