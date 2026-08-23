import { Link } from 'react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ANALYSIS_STATES,
  analyzeBrandAsync,
  type AnalysisChannel,
  type BrandAnalysis,
} from '@/features/marketing/concept/lib/analysis'
import { track } from '@/features/marketing/concept/lib/analytics'
import { DEMO_HREF, START_HREF } from '@/features/marketing/concept/site'
import { usePrefersReducedMotion } from '@/features/marketing/concept/useConceptHooks'
import { Button, Stop } from '../ui'
import { InfoIcon } from '../icons'
import { AnalysisSequence } from './AnalysisSequence'
import { DomainForm } from './DomainForm'
import { IntelligenceSummary } from './IntelligenceSummary'
import { OutputStage } from './OutputStage'
import styles from './brandDemo.module.css'

type Phase = 'idle' | 'analyzing' | 'ready'

/** Roughly five seconds end to end, inside the 4–7s the sequence should take. */
const STATE_INTERVAL_MS = 760
const SETTLE_MS = 520

/**
 * "See Malaky with your brand".
 *
 * Nothing is fetched and no website is read — `analyzeBrandAsync` is a local
 * mock (see concept/lib/analysis.ts). It is already awaited here, so a real
 * ingestion call can replace it without touching this component.
 */
export function BrandDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [domain, setDomain] = useState('')
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null)
  const [reached, setReached] = useState(0)
  const [channel, setChannel] = useState<AnalysisChannel>('linkedin-company')

  const timers = useRef<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const start = useCallback(
    async (nextDomain: string) => {
      clearTimers()
      setDomain(nextDomain)
      setPhase('analyzing')
      setReached(0)
      setChannel('linkedin-company')
      track('brand_demo_started', { domain: nextDomain })

      // Resolved up front; the sequence below is presentation, not polling.
      const result = await analyzeBrandAsync(nextDomain)

      const finish = () => {
        setAnalysis(result)
        setPhase('ready')
        track('brand_demo_analysis_completed', {
          domain: nextDomain,
          company: result.company.name,
          channels: result.outputs.length,
        })
      }

      if (reducedMotion) {
        setReached(ANALYSIS_STATES.length)
        timers.current.push(window.setTimeout(finish, 150))
        return
      }

      ANALYSIS_STATES.forEach((_, i) => {
        timers.current.push(window.setTimeout(() => setReached(i + 1), (i + 1) * STATE_INTERVAL_MS))
      })
      timers.current.push(
        window.setTimeout(finish, ANALYSIS_STATES.length * STATE_INTERVAL_MS + SETTLE_MS),
      )
    },
    [reducedMotion],
  )

  const reset = () => {
    clearTimers()
    setPhase('idle')
    setAnalysis(null)
    setDomain('')
    setReached(0)
    setChannel('linkedin-company')
    track('brand_demo_reset')
    // Focus belongs back on the input the visitor is about to use.
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const selectChannel = (next: AnalysisChannel) => {
    setChannel(next)
    track('brand_demo_channel_viewed', { domain, channel: next })
  }

  /* An illustrative run must not describe itself as a reading of the
     visitor's business — including in the heading and the line under it,
     which is where a claim is easiest to make by accident. */
  const illustrative = analysis?.mode === 'illustrative'

  const heading =
    phase === 'idle'
      ? 'See Malaky with your brand'
      : phase === 'analyzing'
        ? 'Understanding your business'
        : illustrative
          ? "Here's the shape of what Malaky prepares"
          : "Here's what Malaky would prepare today"

  const lead =
    phase === 'idle'
      ? 'Enter your company website. Malaky will show you what it would prepare.'
      : phase === 'analyzing'
        ? 'Working through the business before writing anything.'
        : illustrative
          ? 'An example of the output and the thinking behind it — not an analysis of your website.'
          : 'Built from what Malaky learned about your business.'

  return (
    <section className={styles.section} id="brand-demo" aria-labelledby="demo-title">
      <div className="shell">
        <div className={styles.head}>
          <h2 className={styles.title} id="demo-title">
            {heading}
            <Stop />
          </h2>
          <div className={styles.leadCol}>
            <p className={styles.lead}>{lead}</p>
            {/* Stated before anything runs, and kept on screen throughout, so
                no part of this section can be mistaken for a live reading of
                the visitor's website. */}
            <p className={styles.notice} id="demo-notice">
              <InfoIcon size={13} className={styles.noticeIcon} />
              <span>
                <b>Concept preview</b> — Malaky is not reading this website yet. This shows how a
                real company analysis will work.
              </span>
            </p>
          </div>
        </div>

        {phase === 'idle' && <DomainForm ref={inputRef} onSubmit={start} />}

        {phase === 'analyzing' && <AnalysisSequence domain={domain} reached={reached} />}

        {/* IntelligenceSummary and OutputStage are direct grid children, so
            the grid-areas in the stylesheet can place the summary and channel
            selector on the left and the preview on the right. */}
        {phase === 'ready' && analysis && (
          <div className={styles.result} ref={resultRef}>
            <IntelligenceSummary analysis={analysis} />
            <OutputStage analysis={analysis} selected={channel} onSelect={selectChannel} />
          </div>
        )}

        {phase === 'ready' && (
          <div className={styles.footRow}>
            <button type="button" className={styles.tryAnother} onClick={reset}>
              Try another company
            </button>
            <p className={styles.note}>Preview only — nothing is published or connected.</p>
          </div>
        )}

        {/* The honest end of an illustrative run: the example has shown the
            shape, and nothing here has read anyone's website.

            Two ways forward, ranked. Get started is the default because
            Business and Scale are self-serve; the demo request stays as a
            quiet link beside it for the buyer who wants a conversation, in the
            same shape the header uses. Two filled buttons would make them look
            like alternatives rather than a default and an exception. */}
        {phase === 'ready' && analysis?.mode === 'illustrative' && (
          <div className={styles.convert}>
            <div>
              <p className={styles.convertTitle}>Want Malaky to actually learn your company?</p>
              <p className={styles.convertBody}>
                We&rsquo;ll configure your real brand, business context and marketing priorities.
              </p>
            </div>
            <div className={styles.convertActions}>
              <Link to={DEMO_HREF} className={styles.convertLink}>
                Request a private demo
              </Link>
              <Button href={START_HREF} tone="primary" size="lg" arrow>
                Get started
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
