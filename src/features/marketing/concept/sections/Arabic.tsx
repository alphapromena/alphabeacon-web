import { getCustomer } from '@/features/marketing/concept/lib/customers'
import { BILINGUAL_CAMPAIGN } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { CustomerLogo } from '../CustomerLogo'
import { SectionHead, Stop } from '../ui'
import { ArrowRight } from '../icons'
import styles from './arabic.module.css'

type Side = typeof BILINGUAL_CAMPAIGN.en | typeof BILINGUAL_CAMPAIGN.ar

function CampaignPanel({
  side,
  dir,
  lang,
  tint,
}: {
  side: Side
  dir: 'ltr' | 'rtl'
  lang: string
  tint: string
}) {
  const customer = getCustomer(BILINGUAL_CAMPAIGN.customerId)
  const rtl = dir === 'rtl'
  return (
    <figure
      className={styles.panel}
      dir={dir}
      lang={lang}
      style={{ '--tint': tint } as React.CSSProperties}
    >
      {/* The customer now leads the panel rather than sitting as a 24px mark
          inside the copy column. Mark, name and what the campaign is for —
          then the language label, which is the smaller fact of the two. */}
      <figcaption className={styles.panelHead}>
        <span className={styles.brandLockup}>
          <CustomerLogo customer={customer} size={44} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>{customer.name}</span>
            <span className={styles.brandContext}>{BILINGUAL_CAMPAIGN.context}</span>
          </span>
        </span>
        <span className={styles.badge}>{side.badge}</span>
      </figcaption>
      <p className={rtl ? styles.labelAr : styles.label}>{side.label}</p>

      <div className={styles.body}>
        <div className={styles.copy}>
          <h3 className={rtl ? styles.headlineAr : styles.headline}>{side.headline}</h3>
          <p className={rtl ? styles.subAr : styles.sub}>{side.subhead}</p>
          <p className={rtl ? styles.textAr : styles.text}>{side.body}</p>
          <span className={rtl ? styles.ctaAr : styles.cta}>
            {side.cta}
            <ArrowRight size={13} style={rtl ? { transform: 'rotate(180deg)' } : undefined} />
          </span>
        </div>

        <div className={styles.media}>
          <BrandMedia creative={side.creative} alt={side.alt} aspect="4:5" />
        </div>
      </div>
    </figure>
  )
}

/**
 * Two campaigns for the same brand and the same moment, each composed in its
 * own language. The Arabic panel is not a translation of the English one.
 */
export function Arabic() {
  return (
    <section className={styles.section} id="arabic" aria-labelledby="arabic-title">
      <div className="shell">
        <SectionHead
          id="arabic-title"
          title={
            <>
              Arabic isn&rsquo;t a language toggle
              <Stop />
            </>
          }
          lead="It's a native experience. Malaky writes Arabic as its own campaign — its own opening, its own rhythm, its own call to action — rather than running the English through a translator."
        />

        <div className={styles.pair}>
          {/* Neutral tints. They separate the two panels; they are not anyone's
              brand colours, because we hold none. */}
          <CampaignPanel side={BILINGUAL_CAMPAIGN.en} dir="ltr" lang="en" tint="38, 48, 58" />
          <CampaignPanel side={BILINGUAL_CAMPAIGN.ar} dir="rtl" lang="ar" tint="46, 39, 33" />
        </div>

        <p className={styles.note}>{BILINGUAL_CAMPAIGN.note} Both campaigns prepared by Malaky.</p>
      </div>
    </section>
  )
}
