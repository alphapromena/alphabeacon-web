import {
  EVENT_FANOUT,
  FANOUT_NOTE,
  SOURCE_EVENT,
  type DrawnPlatform,
} from '@/features/marketing/concept/lib/content'
import { getCustomer } from '@/features/marketing/concept/lib/customers'
import { useReveal } from '@/features/marketing/concept/useConceptHooks'
import { CustomerLogo, isWordmark } from '../CustomerLogo'
import { PostCard } from '../posts'
import { RealPostCard } from '../RealPost'
import { SectionHead, Stop } from '../ui'
import { XIcon, CalendarIcon, InstagramIcon, LinkedInIcon, MailIcon, ReelIcon } from '../icons'
import styles from './oneEvent.module.css'

/* Every fan-out output is a piece this concept draws itself, so the map is
   over DrawnPlatform — a real screenshot has no channel icon to add. */
const CHANNEL_ICON: Record<DrawnPlatform, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  'linkedin-company': LinkedInIcon,
  'linkedin-executive': LinkedInIcon,
  x: XIcon,
  newsletter: MailIcon,
  reel: ReelIcon,
} as const

/**
 * One business event, adapted six ways. Each output is written for its own
 * channel in the data layer — the point of the section is that the copy is
 * genuinely different, so the cards are sized to be read.
 */
export function OneEvent() {
  const customer = getCustomer(SOURCE_EVENT.customerId)
  const [ref, reveal] = useReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section className={styles.section} id="how-it-works" aria-labelledby="one-event-title">
      <div className="shell">
        <SectionHead
          id="one-event-title"
          title={
            <>
              One event becomes everything
              <Stop />
            </>
          }
          lead="Malaky turns one business moment into the right message for every channel — not the same sentence reformatted four times."
        >
          <article className={styles.event}>
            <div className={styles.eventTop}>
              <CustomerLogo customer={customer} size={26} />
              <div>
                {/* The wordmark already says it. */}
                {!isWordmark(customer) && (
                  <span className={styles.eventBrand}>{customer.name}</span>
                )}
                <span className={styles.eventKind}>
                  <CalendarIcon size={11} /> {SOURCE_EVENT.kind}
                </span>
              </div>
            </div>
            <h3 className={styles.eventTitle}>{SOURCE_EVENT.title}</h3>
            <p className={styles.eventDetail}>{SOURCE_EVENT.detail}</p>
          </article>
        </SectionHead>

        <div className={styles.fan} ref={ref} data-reveal={reveal}>
          <span className={styles.stem} aria-hidden="true" />

          <ol className={styles.grid}>
            {EVENT_FANOUT.map((piece, i) => {
              /* One card is the customer's own screenshot, which has no drawn
                 channel to take an icon from; it takes LinkedIn's, because
                 that is the channel it ran on. */
              const Icon =
                piece.platform === 'real-screenshot'
                  ? LinkedInIcon
                  : CHANNEL_ICON[piece.platform as DrawnPlatform]
              return (
                <li
                  key={piece.id}
                  className={styles.col}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className={styles.tick} aria-hidden="true" />
                  <p className={styles.channel}>
                    <Icon size={13} />
                    {piece.label}
                  </p>
                  {piece.platform === 'real-screenshot' && piece.realPostId ? (
                    <RealPostCard id={piece.realPostId} sizes="(max-width: 900px) 84vw, 280px" />
                  ) : (
                    <PostCard piece={piece} />
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        {/* One line for four cards. The business moment above is Ataccama's
            and is real; everything in the cards is ours. Minimum disclosure,
            said once, rather than a badge on every card. */}
        <p className={styles.prepared}>{FANOUT_NOTE}</p>
      </div>
    </section>
  )
}
