import { ANALYSIS_STATES } from '@/features/marketing/concept/lib/analysis'
import { CheckIcon } from '../icons'
import styles from './brandDemo.module.css'

/**
 * The six understanding states, revealed one at a time.
 *
 * No terminal, no spinner — the same quiet state-and-check language the
 * approval and memory sections already use.
 */
export function AnalysisSequence({ domain, reached }: { domain: string; reached: number }) {
  const progress = Math.min(reached / ANALYSIS_STATES.length, 1)

  return (
    <div className={styles.analysis}>
      <p className={styles.analysisDomain}>{domain}</p>

      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ transform: `scaleX(${progress})` }} />
      </div>

      <ol className={styles.states} aria-live="polite" aria-label="Analysis progress">
        {ANALYSIS_STATES.map((state, i) => (
          <li
            key={state}
            className={styles.state}
            data-on={i < reached || undefined}
            data-current={i === reached || undefined}
          >
            <span className={styles.stateMark}>
              <CheckIcon size={11} />
            </span>
            {state}
          </li>
        ))}
      </ol>
    </div>
  )
}
