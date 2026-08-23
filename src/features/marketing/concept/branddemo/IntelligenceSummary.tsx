import type { BrandAnalysis } from '@/features/marketing/concept/lib/analysis'
import { CustomerLogo } from '../CustomerLogo'
import { SparkIcon } from '../icons'
import styles from './brandDemo.module.css'

/**
 * What Malaky is working from, shown before any output. This is the causal
 * step — business understood, then opportunity, then the marketing that
 * follows.
 *
 * Every label and value comes from the analysis result, including whether the
 * row is a finding or an example. The component never decides which of the
 * two it is looking at, so it cannot present an example as a fact.
 */
export function IntelligenceSummary({ analysis }: { analysis: BrandAnalysis }) {
  const { company, subtitle, facts, palette, paletteLabel, opportunity } = analysis
  const illustrative = analysis.mode === 'illustrative'

  return (
    <div className={styles.summary}>
      <div className={styles.company}>
        <CustomerLogo customer={company.logo} size={40} />
        <div>
          <p className={styles.companyName}>{company.name}</p>
          <p className={styles.companyMeta}>{subtitle}</p>
        </div>
      </div>

      <dl className={styles.learned}>
        {facts.map((row) => (
          <div key={row.label} className={styles.learnedRow}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {/* Only where colours were genuinely supplied. We hold no customer's
            brand palette, so the row disappears rather than showing four
            plausible swatches we picked ourselves. */}
        {palette.length > 0 && (
          <div className={styles.learnedRow}>
            <dt>{paletteLabel}</dt>
            <dd>
              <span className={styles.swatches}>
                {palette.map((c) => (
                  <span key={c} style={{ background: c }} title={c} />
                ))}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className={styles.opportunity} data-illustrative={illustrative || undefined}>
        <p className={styles.opportunityLabel}>
          <SparkIcon size={13} />
          {opportunity.label}
        </p>
        <p className={styles.opportunityTitle}>{opportunity.title}</p>
        <p className={styles.opportunityDetail}>{opportunity.detail}</p>
      </div>
    </div>
  )
}
