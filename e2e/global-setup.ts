/**
 * Warm the API before any test budget starts — LIVE RUNS ONLY.
 *
 * ## Why this exists
 *
 * `Docs/api/live-red-2026-08-23.md`: the contract is intact (118 operations,
 * 118 ok, 0 mismatches, byte-identical to the 2026-08-19 baseline) but the
 * deployment's latency TAIL is not. Warm, the API answers `/health` in ~350 ms;
 * after a short idle the first request can take **7–14 s** while the function
 * is re-provisioned. Calls over five seconds went from 1-in-118 to 31-in-118.
 *
 * Nothing about that is a fact about the product, and a suite that measures it
 * is measuring Lambda temperature rather than correctness. The first request of
 * a run is the one that pays, so this pays it before the clock starts on
 * anything that asserts.
 *
 * Ward owns the real fix (provisioned concurrency, or a country lookup that
 * does not block its response). This only stops the suite from reporting the
 * weather.
 *
 * ## Why it warms a FLEET, not a container
 *
 * The first version did what the brief asked — probe until two consecutive
 * answers came back under a second — and the cold run still lost five files.
 * One warm container is not what the app uses. Every screen grafts its state
 * through `Promise.all` groups that run concurrently (`live-sync.ts`: user +
 * orgs, members + invites, schedules + holidays, tones + voices + sources +
 * topics, …), and a captured dashboard load fires fourteen requests at once.
 * Concurrent requests do not share a container: request two lands on a cold
 * one and pays the 7–14 s again, which is exactly what killed `live-auth`'s
 * 5 s wait on the workspace-less landing and `live-scheduling`'s 20 s wait on
 * `aria-busy` after a reload.
 *
 * So phase 1 wakes the service and phase 2 provisions the concurrency the
 * suite is about to ask for. Both phases share one cap.
 *
 * ## Why it keeps a heartbeat
 *
 * Warming once was still not enough, and the reason is worth writing down: the
 * containers are recycled DURING a file, not just between runs. `live-country`
 * warmed in 13.9 s, passed its 57 s wizard test, and then lost its SECOND test
 * on a 5 s `aria-busy` wait — the fleet had gone cold again while the first
 * test was running. A one-shot warm-up cannot survive that; only traffic can.
 *
 * So phase 3 is a heartbeat: a few concurrent `/health` pings every few
 * seconds for the life of the run, torn down when Playwright finishes. It is
 * the cheapest possible request against an endpoint that returns a constant,
 * and it is what turns "warm at the start" into "warm throughout".
 *
 * ## What it does NOT do
 *
 * - It does not run in static mode. Without `VITE_API_BASE_URL` this returns
 *   immediately and makes no request at all: static mode is the zero-network
 *   test bed and that law is older than this file.
 * - It does not retry, mask or soften anything a test asserts. If the API never
 *   warms it FAILS the setup with a named reason, so the run says "the API was
 *   cold" instead of leaving twelve specs to bleed out one timeout at a time.
 */

/** Two consecutive answers this fast mean the container is up and serving. */
const WARM_MS = 1_000

/** The whole warm-up gives up here. Longer than any observed cold start (14 s)
 *  by a wide margin, short enough that a dead API is reported in a minute and a
 *  half rather than after the suite has finished failing. */
const CAP_MS = 90_000

/** One probe's own ceiling, so a hung socket cannot eat the whole cap. */
const PROBE_MS = 20_000

/** Consecutive fast answers required. One could be luck; two is a warm path. */
const CONSECUTIVE = 2

/**
 * How many containers phase 2 provisions. Sized from the app, not guessed: a
 * captured dashboard load fires fourteen requests at once, and the largest
 * single `Promise.all` in `live-sync.ts` is four. Twelve covers every fan-out
 * the suite drives without asking the platform for concurrency the product
 * never uses.
 */
const FLEET = 12

/** Breath between probes — long enough not to hammer, short enough that the
 *  container we just woke is still up when the next probe lands. */
const GAP_MS = 250

/** How often the heartbeat beats. Under the observed recycle window. */
const HEARTBEAT_MS = 5_000

/** How wide each beat is. A third of the fleet keeps the core alive; the rest
 *  re-provision quickly from a warm base, which is the part that used to cost
 *  7–14 s from stone cold. */
const HEARTBEAT_WIDTH = 4

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface Probe {
  ms: number
  status: number | 'error'
  detail?: string
}

async function probe(url: string): Promise<Probe> {
  const started = Date.now()
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(PROBE_MS),
    })
    // Drain the body: an unread response can keep the socket busy.
    await response.text()
    return { ms: Date.now() - started, status: response.status }
  } catch (cause) {
    return { ms: Date.now() - started, status: 'error', detail: String(cause).slice(0, 120) }
  }
}

/**
 * Phase 2: provision the concurrency, having woken the service.
 *
 * A burst that finds cold containers IS the thing that provisions them, so the
 * first burst is expected to be slow and the second fast. Shares phase 1's cap.
 */
async function warmFleet(url: string, startedAt: number): Promise<void> {
  const elapsed = () => Date.now() - startedAt
  let bursts = 0
  let slowest: Probe | undefined

  while (elapsed() < CAP_MS) {
    bursts += 1
    const results = await Promise.all(Array.from({ length: FLEET }, () => probe(url)))
    slowest = results.reduce((worst, r) => (r.ms > worst.ms ? r : worst))
    const allWarm = results.every((r) => r.status === 200 && r.ms < WARM_MS)

    if (allWarm) {
      console.log(
        `warm-up: ${FLEET}-way fleet warm after ${bursts} burst(s), ` +
          `${(elapsed() / 1000).toFixed(1)}s total — slowest ${slowest.ms}ms\n`,
      )
      return
    }

    console.log(
      `warm-up: burst ${bursts} — slowest of ${FLEET} was ${slowest.status} in ${slowest.ms}ms` +
        (slowest.detail ? ` (${slowest.detail})` : '') +
        ` — fleet not warm yet`,
    )
    await sleep(GAP_MS)
  }

  throw new Error(
    `API fleet never warmed: ${bursts} burst(s) of ${FLEET} concurrent probes of ${url} over ` +
      `${(elapsed() / 1000).toFixed(1)}s, slowest still ${slowest?.status ?? 'none'} in ` +
      `${slowest?.ms ?? 0}ms (wanted every one under ${WARM_MS}ms). The service answers but ` +
      `cannot serve the concurrency the app uses — see Docs/api/live-red-2026-08-23.md.`,
  )
}

/**
 * Phase 3: keep it warm for the life of the run.
 *
 * Returns the teardown Playwright calls when the run ends. Failures here are
 * swallowed on purpose — a heartbeat that could fail the suite would be one
 * more thing measuring the weather.
 */
function startHeartbeat(url: string): () => void {
  let beats = 0
  const timer = setInterval(() => {
    beats += 1
    void Promise.all(Array.from({ length: HEARTBEAT_WIDTH }, () => probe(url))).catch(() => {})
  }, HEARTBEAT_MS)
  // Never let the heartbeat be the reason a process stays alive.
  timer.unref?.()

  console.log(
    `warm-up: heartbeat started — ${HEARTBEAT_WIDTH} probes every ${HEARTBEAT_MS / 1000}s ` +
      `for the life of the run\n`,
  )

  return () => {
    clearInterval(timer)
    console.log(`\nwarm-up: heartbeat stopped after ${beats} beat(s)`)
  }
}

export default async function globalSetup(): Promise<(() => void) | void> {
  const base = process.env.VITE_API_BASE_URL?.trim()
  if (!base) {
    // The static suite. Nothing to warm, and nothing may be requested.
    return
  }

  const url = `${base.replace(/\/+$/, '')}/health`
  const startedAt = Date.now()
  const elapsed = () => Date.now() - startedAt
  let attempts = 0
  let streak = 0
  const warm: number[] = []
  let last: Probe | undefined

  console.log(`\nwarm-up: waking the API before the suite starts (${url})`)

  while (elapsed() < CAP_MS) {
    attempts += 1
    last = await probe(url)

    if (last.status === 200 && last.ms < WARM_MS) {
      streak += 1
      warm.push(last.ms)
      if (streak >= CONSECUTIVE) {
        console.log(
          `warm-up: service awake after ${attempts} probe(s) in ${(elapsed() / 1000).toFixed(1)}s ` +
            `— last ${CONSECUTIVE}: ${warm.slice(-CONSECUTIVE).join('ms, ')}ms`,
        )
        await warmFleet(url, startedAt)
        return startHeartbeat(url)
      }
    } else {
      // A slow or failed answer means the container was not up. The streak
      // starts again from whatever this probe just woke.
      if (streak > 0) warm.length = 0
      streak = 0
      console.log(
        `warm-up: probe ${attempts} — ${last.status} in ${last.ms}ms` +
          (last.detail ? ` (${last.detail})` : '') +
          ` — not warm yet`,
      )
    }

    await sleep(GAP_MS)
  }

  throw new Error(
    `API cold or unreachable: ${attempts} probes of ${url} over ${(elapsed() / 1000).toFixed(1)}s ` +
      `never produced ${CONSECUTIVE} consecutive answers under ${WARM_MS}ms. ` +
      `Last probe: ${last?.status ?? 'none'} in ${last?.ms ?? 0}ms` +
      (last?.detail ? ` (${last.detail})` : '') +
      `. The live suite is not being run against a serving API — see ` +
      `Docs/api/live-red-2026-08-23.md. (Static runs never reach this: without ` +
      `VITE_API_BASE_URL the warm-up makes no request.)`,
  )
}
