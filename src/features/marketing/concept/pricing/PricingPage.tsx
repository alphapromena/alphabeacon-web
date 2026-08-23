import {
  ADDITIONAL_SCOPE,
  ANNUAL_NOTE,
  CAPACITY_NOTE,
  COMPARISON,
  MANAGED,
  PLANS,
  PLATFORM,
  PLATFORM_PLANNED,
  PRICE_FROM_LINE,
  SCOPED_ITEMS,
  SCOPED_NOTE,
  SETUP_CLOSE,
  SETUP_PRICE_LINE,
  SETUP_STEPS,
  formatUsd,
  managedCombinations,
} from '@/features/marketing/concept/lib/pricing'
import { Button, Stop } from '../ui'
import { CheckIcon } from '../icons'
import { DEMO_HREF, START_HREF } from '@/features/marketing/concept/site'
import styles from './pricing.module.css'

/**
 * Fully static — no billing toggle, no interactive state, so this renders on
 * the server and ships no JavaScript of its own. The one interactive element
 * is a native <details>, which needs none.
 *
 * The order is the argument: what the platform is, then how much of the
 * organisation each deployment covers, then who operates it with you, then
 * what configuring it involves, then only the differences, then the
 * conversation.
 */
export function PricingPage() {
  const combinations = managedCombinations()

  return (
    <>
      {/* --- opening ------------------------------------------------ */}
      <section className={styles.top}>
        <span className={styles.topGlow} aria-hidden="true" />
        <div className={`shell ${styles.topInner}`}>
          <h1 className={styles.title}>
            Malaky is not another tool.
            <br />
            <span className={styles.titleAccent}>It&rsquo;s your marketing operation</span>
            <Stop />
          </h1>
          <p className={styles.lead}>
            Choose how much of your marketing operation you want Malaky to run — and add a human
            operator if you want it managed with you.
          </p>
          <p className={styles.priceFrom}>{PRICE_FROM_LINE}</p>
        </div>
      </section>

      {/* --- the platform, stated once ------------------------------ */}
      <section className={styles.platformSection} aria-labelledby="platform-title">
        <div className="shell">
          <div className={styles.platformGrid}>
            <div>
              <h2 className={styles.sectionTitle} id="platform-title">
                Every Malaky deployment includes
                <Stop />
              </h2>

              {/* Named rather than omitted — both were previously implied by
                  plan features that read as shipped. */}
              <div className={styles.planned}>
                <p className={styles.plannedHead}>Described here, still to be built</p>
                <ul className={styles.plannedList}>
                  {PLATFORM_PLANNED.map((c) => (
                    <li key={c.title}>
                      <span>{c.title}</span> — {c.body}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className={styles.platform}>
              {PLATFORM.map((c) => (
                <li key={c.title} className={styles.capability}>
                  <CheckIcon size={13} className={styles.capabilityCheck} />
                  <div>
                    <p className={styles.capabilityTitle}>{c.title}</p>
                    <p className={styles.capabilityBody}>{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- plans -------------------------------------------------- */}
      <section className={styles.plansSection} aria-labelledby="plans-title">
        <div className="shell">
          <h2 className="visually-hidden" id="plans-title">
            Deployments
          </h2>

          <div className={styles.plans}>
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={styles.plan}
                data-scoped={plan.monthly == null || undefined}
                aria-labelledby={`${plan.id}-name`}
              >
                <h3 className={styles.planName} id={`${plan.id}-name`}>
                  {plan.name}
                </h3>
                <p className={styles.planTagline}>{plan.tagline}</p>

                <div className={styles.priceBlock}>
                  {plan.monthly != null ? (
                    <p className={styles.price}>
                      <span className={styles.priceNum}>{formatUsd(plan.monthly)}</span>
                      <span className={styles.pricePer}>/month</span>
                    </p>
                  ) : (
                    <p className={styles.price}>
                      <span className={styles.priceNum}>{plan.priceNote}</span>
                    </p>
                  )}

                  <dl className={styles.priceMeta}>
                    <div>
                      <dt>{plan.setup.label}</dt>
                      <dd>
                        {plan.setup.fee != null
                          ? formatUsd(plan.setup.fee)
                          : plan.setup.includedLabel}
                      </dd>
                    </div>
                    {plan.term && (
                      <div>
                        <dt>Term</dt>
                        <dd>{plan.term}</dd>
                      </div>
                    )}
                  </dl>

                  {/* One line, and it points at the section that explains the
                      layer rather than doing arithmetic inside the card. */}
                  {plan.managedAvailable && (
                    <p className={styles.managedAdd}>
                      <a href="#managed">{MANAGED.addLine}</a>
                    </p>
                  )}
                </div>

                {/* The offer: how much of the marketing operation this covers. */}
                <dl className={styles.coverage}>
                  {plan.coverage.map((row) => (
                    <div key={row.label} className={styles.coverageRow}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className={styles.capacity}>{plan.capacity}</p>

                {plan.footnote && <p className={styles.planFootnote}>{plan.footnote}</p>}

                {/* Business and Scale can be bought; Enterprise is scoped in a
                    conversation, so it keeps the demo route. Same button,
                    different destination — the difference in the offer is what
                    makes the difference in the action. */}
                <div className={styles.planCta}>
                  {plan.monthly != null ? (
                    <Button href={START_HREF} tone="primary" full arrow>
                      Get started
                    </Button>
                  ) : (
                    <Button href={DEMO_HREF} tone="secondary" full>
                      Request a private demo
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Terms, not features. Closed by default and native, so it needs no
              JavaScript and stays keyboard-operable. */}
          <div className={styles.belowPlans}>
            <details className={styles.capacityDetails}>
              <summary>Operating capacity</summary>
              <div className={styles.capacityBody}>
                <p className={styles.capacityNote}>{CAPACITY_NOTE}</p>
              </div>
            </details>

            {/* Said once on the page, not inside three cards. */}
            <p className={styles.annual}>{ANNUAL_NOTE}</p>
          </div>
        </div>
      </section>

      {/* --- Malaky Managed ----------------------------------------- */}
      <section className={styles.managedSection} id="managed" aria-labelledby="managed-title">
        <div className="shell">
          <div className={styles.managed}>
            <div className={styles.managedMain}>
              <p className={styles.managedEyebrow}>{MANAGED.eyebrow}</p>
              <h2 className={styles.managedTitle} id="managed-title">
                {MANAGED.name}
                <span className={styles.managedPrice}>
                  +{formatUsd(MANAGED.monthly)} <span>/month</span>
                </span>
              </h2>

              <p className={styles.managedQuestion}>
                {MANAGED.question} {MANAGED.positioning}
              </p>

              {/* The idea, before the mechanics. */}
              <p className={styles.managedCouplet}>
                {MANAGED.couplet[0]}
                <br />
                <span>{MANAGED.couplet[1]}</span>
              </p>

              <p className={styles.managedBody}>{MANAGED.description}</p>
            </div>

            <div className={styles.managedSide}>
              <p className={styles.managedListHead}>What your operator does</p>
              <ul className={styles.managedList}>
                {MANAGED.responsibilities.map((item) => (
                  <li key={item}>
                    <CheckIcon size={12} className={styles.managedCheck} />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Arithmetic, stated plainly. No selection, no cart, no total
                  that changes — the page is not a checkout. */}
              <div className={styles.combined}>
                {combinations.map((c) => (
                  <p key={c.planName} className={styles.combinedRow}>
                    <span className={styles.combinedPlan}>{c.planName}</span>
                    <span className={styles.combinedSum}>
                      {formatUsd(c.planMonthly)} + {formatUsd(MANAGED.monthly)}
                    </span>
                    <span className={styles.combinedTotal}>
                      {formatUsd(c.total)}
                      <span>/month</span>
                    </span>
                  </p>
                ))}
              </div>

              <p className={styles.managedNote}>{MANAGED.clarification}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- intelligence setup ------------------------------------- */}
      <section className={styles.setupSection} aria-labelledby="setup-title">
        <div className={`shell ${styles.setupInner}`}>
          <div className={styles.setupHead}>
            <h2 className={styles.setupTitle} id="setup-title">
              Your Malaky deployment starts with Intelligence Setup
              <Stop />
            </h2>
            <div>
              <p className={styles.setupLead}>
                Malaky is configured, not activated. Before it operates, our team builds your
                company into it — the brand, the voices, the facts your team has approved, the
                calendar and the way work gets signed off.
              </p>
              <p className={styles.setupPrice}>{SETUP_PRICE_LINE}</p>
            </div>
          </div>

          <ol className={styles.setupSteps}>
            {SETUP_STEPS.map((step, i) => (
              <li key={step} className={styles.setupStep}>
                <span className={styles.setupNum}>{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>

          <p className={styles.setupClose}>{SETUP_CLOSE}</p>
        </div>
      </section>

      {/* --- what changes between plans ----------------------------- */}
      <section className={styles.compareSection} aria-labelledby="compare-title">
        <div className="shell">
          <h2 className={styles.sectionTitle} id="compare-title">
            What changes between deployments
            <Stop />
          </h2>

          {/* One table at every width. Narrow screens scroll it sideways —
              stacking it per plan would reprint the coverage already in the
              cards above, which is the duplication this page is removing. */}
          <div
            className={styles.tableWrap}
            tabIndex={0}
            role="region"
            aria-labelledby="compare-title"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Coverage</th>
                  {PLANS.map((p) => (
                    <th key={p.id} scope="col">
                      {p.name.replace('Malaky ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.business}</td>
                    <td>{row.scale}</td>
                    <td>{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scope lives here rather than inside the Enterprise card, where it
              stretched the row and left the other two cards half empty. */}
          <div className={styles.additional}>
            <p className={styles.additionalHead}>Additional scope</p>
            <div>
              <p className={styles.additionalBody}>{ADDITIONAL_SCOPE}</p>
              <ul className={styles.scopedList}>
                {SCOPED_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={styles.additionalNote}>{SCOPED_NOTE}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
