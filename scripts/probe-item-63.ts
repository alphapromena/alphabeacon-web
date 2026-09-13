/**
 * ITEM 63 — the one measurement Hasan's message needs, at ZERO SPEND.
 *
 * `live-video-duration`'s second test posts the app's video body with a bad
 * `params.durationS` and expects the document's **400 before the wallet**.
 * It passed that way on 2026-09-10 (ORDER HSN-0910's gate, both rounds) and
 * answers **402 `wallet_insufficient`** on 2026-09-13, on the old chain and
 * the new runner alike, every round. The spec asserts status codes only, so
 * no red on that record carries a request-id — and a request-id is what lets
 * Hasan find the call. This probe exists to produce exactly that, verbatim,
 * and nothing else.
 *
 * What it does: mints ONE fresh QA org through the real doors, proves its
 * wallet is zero, posts the two bad bodies (`"abc"` and `999`) byte-identical
 * to the spec's, records each answer with its `x-request-id`, then proves the
 * wallet is still zero and the job list still empty.
 *
 * THE SHIELD: if the org's wallet is not zero the probe REFUSES to send —
 * a body that clears validation on a funded org would mint a paid job. Both
 * bodies here are invalid by design, so on a zero wallet nothing can spend.
 *
 * It runs against dev only: `E2E_API_ENV=dev` is required by the same guard
 * the live suite uses (HSN-0910/D), and a base equal to `PROD_API_BASE_URL`
 * is refused by value.
 *
 * Run: `pnpm probe:item-63` (needs `VITE_API_BASE_URL`, or `.env.local`).
 * Record: `Docs/qa/gate-0910/item-63/` — the API host redacted, the
 * request-ids kept.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertNotProduction } from '../e2e/global-setup'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const RECORD_DIR = join(root, 'Docs', 'qa', 'gate-0910', 'item-63')

function resolveBaseUrl(): string {
  const fromEnv = process.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const envFile = join(root, '.env.local')
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, 'utf8').match(/^\s*VITE_API_BASE_URL\s*=\s*(.+)$/m)
    if (match)
      return match[1]
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\/+$/, '')
  }
  console.error('probe-item-63: no VITE_API_BASE_URL (set it, or put it in .env.local).')
  process.exit(1)
}

const BASE = resolveBaseUrl()
const HOST = BASE.replace(/^https?:\/\//, '')
const CODE = '000000'
const STAMP = `${Date.now()}${Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, '0')}`
const OWNER_EMAIL = `qa+${STAMP}i63@alphapromena.com`
const PASSWORD = 'Roasted2Order!'
const ORG_NAME = `QA Item 63 Org ${STAMP}`

/** The video body the app builds, copied from `e2e/live-video-duration.spec.ts`. */
function videoBody(durationS: unknown) {
  return {
    capability: 'social-posts.media',
    plan: 'balanced',
    kind: 'video',
    posts: [
      {
        ref: 'hsn-0902-shape-probe',
        content:
          'This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.',
        tone: {
          id: 'hsn-0902-probe-tone',
          name: 'Roastery floor',
          description: 'Warm, specific, smells of coffee.',
          rules: [{ kind: 'do', text: 'Name the roast date' }],
        },
      },
    ],
    style: { imgStyle: 'Cinematic', text: true, logo: true },
    guidance: [],
    params: { durationS },
    collection: { use: true },
  }
}

interface Exchange {
  title: string
  method: string
  path: string
  status: number
  requestId: string | null
  ms: number
  requestBody?: unknown
  responseBody?: unknown
}

const exchanges: Exchange[] = []
let token: string | null = null

const redact = (text: string): string => text.split(HOST).join('<api-host>')

function log(line: string): void {
  console.log(redact(line))
}

async function call(
  title: string,
  method: string,
  path: string,
  options: { body?: unknown; anonymous?: boolean; keepRequestBody?: boolean } = {},
): Promise<Exchange> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (!options.anonymous && token) headers.authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  const started = Date.now()
  let status = 0
  let requestId: string | null = null
  let responseBody: unknown
  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(90_000),
    })
    status = response.status
    requestId = response.headers.get('x-request-id')
    const raw = await response.text()
    try {
      responseBody = raw ? (JSON.parse(raw) as unknown) : undefined
    } catch {
      responseBody = { textPreview: raw.slice(0, 400) }
    }
    if (!requestId && responseBody && typeof responseBody === 'object' && 'error' in responseBody) {
      requestId = (responseBody as { error?: { requestId?: string } }).error?.requestId ?? null
    }
  } catch (cause) {
    responseBody = { transportError: String(cause) }
  }

  const exchange: Exchange = {
    title,
    method,
    path,
    status,
    requestId,
    ms: Date.now() - started,
    ...(options.keepRequestBody ? { requestBody: options.body } : {}),
    responseBody,
  }
  exchanges.push(exchange)
  log(`${method} ${path} → ${status} (request-id ${requestId ?? 'none'}) in ${exchange.ms} ms`)
  return exchange
}

function writeRecord(verdict: string): void {
  mkdirSync(RECORD_DIR, { recursive: true })
  const payload = {
    order: 'GATE-0910 · item 63',
    measured: new Date().toISOString(),
    apiHost: '<api-host>',
    org: { email: '<qa owner>', name: ORG_NAME },
    verdict,
    exchanges,
  }
  writeFileSync(
    join(RECORD_DIR, 'probe.json'),
    `${redact(JSON.stringify(payload, null, 2))}\n`,
    'utf8',
  )

  const row = (e: Exchange) =>
    `| ${e.title} | \`${e.status}\` | \`${e.requestId ?? 'none'}\` | ${e.ms} ms |`
  const lines = [
    '# Item 63 — `social-posts.media` and the order of validation against the wallet',
    '',
    `Measured ${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z at zero spend on one`,
    'fresh QA org, through `pnpm probe:item-63`. The API host is redacted; the',
    "request-ids are the server's own `x-request-id`, kept verbatim so Hasan can",
    'find each call.',
    '',
    '## What was sent',
    '',
    'The video body `buildPostVisualRequest` builds, byte-identical to the one',
    '`e2e/live-video-duration.spec.ts` posts, with `params.durationS` replaced:',
    'first the string `"abc"`, then `999`. Both are invalid by the capabilities',
    'document, which says validation precedes the wallet.',
    '',
    '## What answered',
    '',
    '| Call | Status | `x-request-id` | Time |',
    '| --- | --- | --- | ---: |',
    ...exchanges.map(row),
    '',
    '## The reading',
    '',
    verdict,
    '',
    '**On 2026-09-10** the same spec, posting the same two bodies, was green in',
    "both of ORDER HSN-0910's gate rounds — the wire answered 400. **On",
    '2026-09-13** it answers 402 in six rounds out of six, across the old chain',
    'and the new runner. The capabilities document still says a bad field is',
    'refused before the wallet.',
    '',
    '**Asked of Hasan:** which order is the contract now — validation before the',
    'wallet, as the document says, or the wallet first? The spec stays as the',
    'document says until he answers, and the gate records the red with its',
    'values every run.',
    '',
    '_Zero spend: the org was never funded, both bodies are invalid, and the',
    'wallet and job list were re-read afterwards to prove nothing moved._',
    '',
  ]
  writeFileSync(join(RECORD_DIR, 'README.md'), `${redact(lines.join('\n'))}\n`, 'utf8')
  log(`record written: Docs/qa/gate-0910/item-63/`)
}

async function main(): Promise<void> {
  // The same rule the live suite runs under: QA companies on dev only.
  assertNotProduction({ ...process.env, VITE_API_BASE_URL: BASE })

  log(`probe-item-63 · <api-host> · ${new Date().toISOString()}`)
  log('--- one fresh QA org, through the real doors ---')
  await call('signup (owner)', 'POST', '/auth/signup', {
    body: { name: 'QA Item 63 Owner', email: OWNER_EMAIL, password: PASSWORD },
    anonymous: true,
  })
  const verified = await call('verify-email (owner)', 'POST', '/auth/verify-email', {
    body: { email: OWNER_EMAIL, code: CODE },
    anonymous: true,
  })
  token = (verified.responseBody as { token?: string })?.token ?? null
  if (!token) {
    writeRecord('STOPPED: no owner token — verify-email did not answer one.')
    process.exit(1)
  }
  const created = await call('create org', 'POST', '/orgs', { body: { name: ORG_NAME } })
  const orgId = (created.responseBody as { org?: { id?: string } })?.org?.id
  if (!orgId) {
    writeRecord('STOPPED: no org id — POST /orgs did not answer one.')
    process.exit(1)
  }

  const walletPath = `/orgs/${orgId}/alphastudio/wallet`
  const jobsPath = `/orgs/${orgId}/alphastudio/media/jobs`

  const before = await call('wallet before', 'GET', walletPath)
  const availableBefore = (before.responseBody as { availableCents?: number })?.availableCents
  if (availableBefore !== 0) {
    writeRecord(
      `REFUSED: the org's wallet is ${String(availableBefore)} cents, not zero — a body that cleared validation could mint a PAID job. Nothing was sent.`,
    )
    process.exit(1)
  }

  log('--- the two bad bodies, on a zero wallet ---')
  await call('POST media/jobs · durationS "abc"', 'POST', jobsPath, {
    body: videoBody('abc'),
    keepRequestBody: true,
  })
  await call('POST media/jobs · durationS 999', 'POST', jobsPath, {
    body: videoBody(999),
    keepRequestBody: true,
  })

  const after = await call('wallet after', 'GET', walletPath)
  const listed = await call('job list after', 'GET', jobsPath)
  const availableAfter = (after.responseBody as { availableCents?: number })?.availableCents
  const jobCount = ((listed.responseBody as { jobs?: unknown[] })?.jobs ?? []).length

  const posts = exchanges.filter((e) => e.method === 'POST' && e.path === jobsPath)
  const [wrongType, overMax] = posts.map((e) => e.status)
  const moved = `Wallet ${String(availableBefore)} → ${String(availableAfter)} cents, ${jobCount} job(s) listed after: nothing moved.`
  const verdict =
    wrongType === 400 && overMax === 400
      ? `Both bad bodies answered **400** — validation precedes the wallet for the TYPE and for the MAXIMUM, as the document says. Nothing to ask; the spec's expectation holds. ${moved}`
      : wrongType === 400 && overMax === 402
        ? `**The two halves of the field are no longer enforced in the same place.** A wrong TYPE (\`"abc"\`) is still refused **400 \`bad_request\`** before the wallet. A value over the MAXIMUM (\`999\`) passes validation and reaches the wallet, which refuses it **402 \`wallet_insufficient\`** — so on an unfunded org the cap is never reached, and on a FUNDED org that body would be paid for before anything checks its length. ${moved}`
        : wrongType === 402 && overMax === 402
          ? `Both bad bodies answered **402 wallet_insufficient** — the WALLET is checked before the field is validated at all, which contradicts the capabilities document. ${moved}`
          : `Answers ${posts.map((e) => `${String(e.requestBody && typeof e.requestBody === 'object' && 'params' in e.requestBody ? JSON.stringify((e.requestBody as { params?: unknown }).params) : '?')} → ${e.status}`).join(', ')} — read the table above. ${moved}`

  log(`--- ${redact(verdict)}`)
  writeRecord(verdict)
}

void main().catch((error: unknown) => {
  console.error(`probe-item-63: ${redact(String(error))}`)
  process.exit(1)
})
