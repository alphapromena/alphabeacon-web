/**
 * Product truth: the staged morning (clip 3) handing over to the REAL app —
 * a recording of /today from a dev session, playing inside a browser frame.
 * The generated film earns attention; the recording earns trust. Neither is
 * asked to do the other's job, and the caption says which is which.
 *
 * The recording keeps native controls in every mode (WCAG 2.2.2 — a pause
 * that always exists); autoplay is dropped under reduced motion and the clip-3
 * interlude becomes its poster.
 */
import { MonoNumber } from '@/components/ab/mono-number'
import { CINEMATIC_MEDIA } from './media'
import { usePrefersReducedMotion } from './use-media-query'

export function ProductTruth() {
  const reduced = usePrefersReducedMotion()

  return (
    <section id="product" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      {/* The staged morning — cinema, and labelled as such. */}
      <div className="dark relative overflow-hidden rounded-2xl bg-background text-foreground">
        {reduced ? (
          <img
            src={CINEMATIC_MEDIA.morningPoster}
            alt=""
            className="aspect-video w-full object-cover"
          />
        ) : (
          <video
            className="aspect-video w-full object-cover"
            src={CINEMATIC_MEDIA.morning}
            poster={CINEMATIC_MEDIA.morningPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}
        {/* Ink scrim so the caption clears the sunlit frame. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-[image:linear-gradient(to_top,var(--ab-ink),transparent)]"
        />
        <p className="absolute bottom-4 left-5 font-display text-lg font-semibold sm:text-2xl">
          <MonoNumber value="07:00" />. The queue was ready before you were.
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-3 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          The film ends here. This is the actual product.
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          The Today queue, recorded from the app — the same review-and-approve loop every plan
          gets, drafts and all.
        </p>
      </div>

      {/* The browser frame: real footage, honestly framed. */}
      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-border" />
          <span aria-hidden className="size-2.5 rounded-full bg-border" />
          <span aria-hidden className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            alphabeacon.com/today
          </span>
        </div>
        <video
          className="w-full"
          src={CINEMATIC_MEDIA.product}
          poster={CINEMATIC_MEDIA.productPoster}
          controls
          muted
          loop
          playsInline
          autoPlay={!reduced}
          preload="metadata"
          aria-label="A screen recording of the Today review queue in the real product"
        />
      </div>
    </section>
  )
}
