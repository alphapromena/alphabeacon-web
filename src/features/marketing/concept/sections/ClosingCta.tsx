import { Button, Stop } from '../ui'
import { DEMO_HREF } from '@/features/marketing/concept/site'
import styles from './closingCta.module.css'

export function ClosingCta({
  id = 'request-demo',
  title,
  lead,
  cta,
  href = DEMO_HREF,
  secondary,
}: {
  id?: string
  title: string
  lead: string
  cta: string
  href?: string
  /**
   * A second, lower-commitment path. Optional — a page that has only one
   * sensible next step should not manufacture a second one.
   */
  secondary?: { label: string; href: string }
}) {
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
      <div className={`shell ${styles.inner}`}>
        <span className={styles.glow} aria-hidden="true" />
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
          <Stop />
        </h2>
        <p className={styles.lead}>{lead}</p>
        <div className={styles.actions}>
          <Button href={href} tone="primary" size="lg" arrow>
            {cta}
          </Button>
          {secondary && (
            <Button href={secondary.href} tone="secondary" size="lg">
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
