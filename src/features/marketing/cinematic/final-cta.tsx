/**
 * The finale: clip 4's dawn beacon, looping calmly behind the one ask.
 * Same beacon as the hero — the noise is gone because the work is done.
 */
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CINEMATIC_MEDIA } from './media'
import { usePrefersReducedMotion } from './use-media-query'

export function FinalCta() {
  const reduced = usePrefersReducedMotion()

  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      {reduced ? (
        <img
          src={CINEMATIC_MEDIA.dawnPoster}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <video
          className="absolute inset-0 size-full object-cover"
          src={CINEMATIC_MEDIA.dawn}
          poster={CINEMATIC_MEDIA.dawnPoster}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-background/55" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-36 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Wake up to tomorrow&apos;s posts.
        </h2>
        <p className="max-w-md text-lg text-muted-foreground">
          Connect a channel tonight. Read your drafts over coffee.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/signup">Start free</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Free plan · cancel anytime</p>
      </div>
    </section>
  )
}
