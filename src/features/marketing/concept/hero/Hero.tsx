import { HERO_PIECES } from '@/features/marketing/concept/lib/content'
import { useMediaQuery } from '@/features/marketing/concept/useConceptHooks'
import { START_HREF } from '@/features/marketing/concept/site'
import { Button } from '../ui'
import { ActivityTimeline } from './ActivityTimeline'
import { CardStack } from './CardStack'
import { Orbit } from './Orbit'
import styles from './hero.module.css'

export function Hero() {
  // Both compositions stay mounted so there's no hydration flash; only the
  // visible one is allowed to animate.
  const isWide = useMediaQuery('(min-width: 1080px)')

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <span className={styles.glow} aria-hidden="true" />
      <div className={`shell ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 className={styles.title} id="hero-title">
            Your marketing
            <br />
            was <em className={styles.accent}>working</em>
            <br />
            before you were.
          </h1>

          <p className={styles.lead}>
            Malaky learns your business, watches what&rsquo;s coming, and prepares your marketing
            across every channel before you ask.
          </p>

          <div className={styles.ctas}>
            <Button href="#brand-demo" tone="primary" size="lg" arrow>
              See Malaky with your brand
            </Button>
            {/* Still the secondary button, still dark — the gold is the brand
                cue in the first viewport, not a second action competing with
                the orange one. Hero only; the same button elsewhere on the
                site is unchanged.

                It now opens the self-serve route. The demo request has not
                gone anywhere: it is the header link, the pricing page's
                Enterprise card, and the way out of Get started for anyone
                whose deployment is bigger than a page. */}
            <Button href={START_HREF} tone="secondary" size="lg" className={styles.secondaryCta}>
              Get started
            </Button>
          </div>

          <ActivityTimeline />
        </div>

        <div className={styles.visual}>
          <div className={styles.orbitOnly}>
            <Orbit pieces={HERO_PIECES} active={isWide} />
          </div>
          <div className={styles.stackOnly}>
            <CardStack pieces={HERO_PIECES} active={!isWide} />
          </div>
        </div>
      </div>
    </section>
  )
}
