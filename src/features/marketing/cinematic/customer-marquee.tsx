/**
 * The customer strip as a slow marquee, and the page's grade from ink to the
 * off-white body — the seam gradient at the top of this section is where the
 * hero's void hands over to daylight.
 *
 * Three renderings of the names, one readable at a time:
 * - an `sr-only` list — screen readers get a plain list, never moving text;
 * - the marquee track, `aria-hidden`, two copies for a seamless -50% loop,
 *   paused on hover (WCAG 2.2.2) and REMOVED under reduced motion by the
 *   `data-ab-motion` kill switch;
 * - a static wrapped row that exists only under reduced motion.
 */
const CUSTOMERS = ['Atlas Roasters', 'Nova Skincare', 'Cedar & Co', 'Marrakesh Studio']

function NameRow({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-16 pr-16">
      {CUSTOMERS.map((name) => (
        <span
          key={name}
          className="font-display text-sm font-semibold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
        >
          {name}
        </span>
      ))}
    </div>
  )
}

export function CustomerMarquee() {
  return (
    <section aria-label="Customers" className="relative">
      {/* The grade: ink → whatever --background is. */}
      <div aria-hidden className="h-44 bg-[image:var(--ab-cinema-seam)]" />
      <div className="bg-background pt-2 pb-10">
        <p className="mb-6 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Trusted by marketing teams at
        </p>

        <ul className="sr-only">
          {CUSTOMERS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>

        <div className="overflow-hidden" aria-hidden>
          <div data-ab-motion="marquee" className="flex w-max">
            <NameRow />
            <NameRow hidden />
          </div>
        </div>

        {/* Reduced motion: the same names, standing still. */}
        <div aria-hidden className="hidden flex-wrap justify-center gap-x-10 gap-y-3 px-6 motion-reduce:flex">
          {CUSTOMERS.map((name) => (
            <span
              key={name}
              className="font-display text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
