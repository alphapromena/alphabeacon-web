import { ACTIVITY_TIMELINE } from '@/features/marketing/concept/lib/content'
import { InstagramIcon, LinkedInIcon, MailIcon, TargetIcon, XIcon } from '../icons'
import styles from './timeline.module.css'

const ICONS = {
  target: TargetIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  mail: MailIcon,
  x: XIcon,
} as const

/**
 * The overnight record. Entries reveal in sequence on load, which reads as
 * work that already happened rather than a console printing live.
 */
export function ActivityTimeline() {
  return (
    <section className={styles.wrap} aria-labelledby="malaky-working">
      <p className={styles.label} id="malaky-working">
        <span className={styles.dot} aria-hidden="true" />
        Malaky is working
      </p>

      <ol className={styles.track}>
        {ACTIVITY_TIMELINE.map((entry, i) => {
          const Icon = ICONS[entry.icon]
          return (
            <li
              key={entry.time}
              className={styles.step}
              data-kind={entry.kind}
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className={styles.node}>
                <span className={styles.badge}>
                  <Icon size={13} />
                </span>
                <time className={styles.time}>{entry.time}</time>
              </span>
              <span className={styles.text}>{entry.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
