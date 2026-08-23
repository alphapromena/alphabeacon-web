import { Link } from 'react-router'
import type { ReactNode } from 'react'
import {
  LEGAL,
  PLACEHOLDER_PREFIX,
  formatEffectiveDate,
  isProductionReady,
  legalValue,
} from '@/features/marketing/concept/lib/legal'
import styles from './legal.module.css'
import { HOME_HREF } from '@/features/marketing/concept/site'

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

/**
 * Shell for the two website legal documents.
 *
 * Static, server-rendered, no JavaScript: the contents list is anchor links
 * and the sections are prose. The layout exists to be read — one column at a
 * comfortable measure, numbered sections, and a contents list that becomes a
 * plain list on narrow screens rather than a sticky rail.
 */
export function LegalPage({
  eyebrow,
  title,
  summary,
  sections,
  related,
}: {
  eyebrow: string
  title: string
  summary: ReactNode
  sections: LegalSection[]
  related: { label: string; href: string }
}) {
  const readiness = isProductionReady()

  return (
    /* The route layout already provides <main id="main">. */
    <article className={styles.page}>
      <div className="shell">
        <header className={styles.head}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>

          <div className={styles.meta}>
            <span>Effective {formatEffectiveDate(LEGAL.effectiveDate)}</span>
            <span>Applies to the Malaky public website</span>
          </div>

          <div className={styles.summary}>{summary}</div>

          {/* Said once, where a reader meets the first outstanding value. */}
          {!readiness.ready && (
            <p className={styles.pending}>
              This document is prepared for the concept site. Items shown as{' '}
              <code>[{PLACEHOLDER_PREFIX}: …]</code> are values — company entity, registered
              address, contact addresses, governing law and effective date — that will be supplied
              before this page is published.
            </p>
          )}
        </header>

        <div className={styles.body}>
          <nav className={styles.toc} aria-label="Contents">
            <p className={styles.tocHead}>Contents</p>
            <div className={styles.tocList}>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </nav>

          <div className={styles.sections}>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className={styles.section}>
                <p className={styles.sectionNum}>{String(i + 1).padStart(2, '0')}</p>
                <h2 className={styles.sectionTitle}>{s.title}</h2>
                <div className={styles.prose}>{s.body}</div>
              </section>
            ))}

            <div className={styles.foot}>
              <Link to={related.href}>{related.label}</Link>
              <Link to={HOME_HREF}>Back to Malaky</Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * An undecided legal value, rendered so it reads as undecided.
 *
 * Never falls back to a plausible-looking default — a policy naming an entity
 * that does not exist is worse than one that says the name is still to come.
 */
export function Tbc({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>
  return <span className={styles.tbc}>{legalValue(null, label)}</span>
}
