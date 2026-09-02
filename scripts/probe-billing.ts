// probe-billing: ORDER BIL-0902 Phase 0 — the billing endpoints observed, not
// guessed, on ONE fresh QA org against the DEPLOYED sandbox API.
//
// Why a separate script and a separate file: `pnpm smoke:alphastudio`
// overwrites `Docs/api/alphastudio-shapes.md` wholesale, so billing probes
// get their own record — `Docs/api/billing-shapes.md` — by the founder's
// ruling (decisions.md, BIL-0902 Phase 0). `src/api/types.ts` is transcribed
// from THAT file, never from prose.
//
// What it answers (the order's seven probes, plus two cheap extras):
//   1. GET  /billing/plans         — the exact item shape and the real names
//   2. GET  /billing/subscription  — the full field set at `none`
//   3. GET  /billing/credits       — `{items: [], total: 0}` + paging echo
//   4. GET  /alphastudio/wallet    — the fresh org's starting balance
//   5. POST /billing/checkout {plan:"base"} as the owner — 201 {url, sessionId};
//      the url is NEVER opened; the session is abandoned (test mode, expires)
//   6. POST /billing/checkout as a MEMBER — the forbidden code
//   7. POST /billing/checkout {plan:"gold"} — the bad-plan code
//   +  GET  /billing/plans|subscription|credits as the member (any member reads)
//   +  POST /billing/portal as the owner on a never-subscribed org (what does
//      Manage billing answer when there is nothing to manage?)
//
// Cost discipline: zero spend. No payment is made, no url is opened, nothing
// needs cleaning up — an abandoned Checkout session expires on its own.
//
// Run (PowerShell):
//   pnpm tsx scripts/probe-billing.ts
// The base URL is read from the environment, falling back to .env.local — the
// same one switch the app uses, never a literal in source.
//
// This file is a Node script outside src/, so it is outside the network law's
// jurisdiction by design. It calls OUR API only, with the normal Bearer.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const REPORT_PATH = join(root, 'Docs', 'api', 'billing-shapes.md')

function resolveBaseUrl(): string {
  const fromEnv = process.env.VITE_API_BASE_URL
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
  console.error('probe-billing: no VITE_API_BASE_URL (set it, or put it in .env.local).')
  process.exit(1)
}

const BASE = resolveBaseUrl()
const RUN = Date.now()
const OWNER_EMAIL = `qa+${RUN}bil@alphapromena.com`
const MEMBER_EMAIL = `qa+${RUN}bilm@alphapromena.com`
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const ORG_NAME = `QA Billing Org ${RUN}`

interface Capture {
  title: string
  method: string
  path: string
  status: number
  requestId?: string
  note?: string
  body?: unknown
  actor: 'owner' | 'member' | 'anonymous'
}

const captures: Capture[] = []
const findings: string[] = []

function log(line: string) {
  console.log(line)
}
function finding(line: string) {
  findings.push(line)
  log(`  → ${line}`)
}

interface CallOptions {
  body?: unknown
  query?: Record<string, string | number>
  token?: string | null
  actor?: Capture['actor']
  quiet?: boolean
  note?: string
  /** Redact these top-level string fields to their shape (secrets, links). */
  redact?: string[]
}

function redactValue(value: unknown): string {
  if (typeof value !== 'string') return `<redacted ${typeof value}>`
  return `<redacted: ${value.length} chars, starts "${value.slice(0, 12)}…">`
}

async function call(
  title: string,
  method: string,
  path: string,
  options: CallOptions = {},
): Promise<{ status: number; body: unknown; requestId?: string }> {
  const query = options.query
    ? `?${new URLSearchParams(Object.entries(options.query).map(([k, v]) => [k, String(v)]))}`
    : ''
  const headers: Record<string, string> = { accept: 'application/json' }
  if (options.token) headers.authorization = `Bearer ${options.token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let status = 0
  let body: unknown
  let requestId: string | undefined
  try {
    const response = await fetch(`${BASE}${path}${query}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    status = response.status
    requestId = response.headers.get('x-request-id') ?? undefined
    const text = await response.text()
    body = text ? safeJson(text) : undefined
    // The envelope's requestId is the same id; prefer the header, fall back.
    if (!requestId && body && typeof body === 'object' && 'error' in body) {
      requestId = (body as { error?: { requestId?: string } }).error?.requestId
    }
  } catch (cause) {
    body = { transportError: String(cause) }
  }
  if (!options.quiet) {
    let recorded = body
    if (options.redact && recorded && typeof recorded === 'object') {
      recorded = { ...(recorded as Record<string, unknown>) }
      for (const key of options.redact) {
        if (key in (recorded as Record<string, unknown>)) {
          ;(recorded as Record<string, unknown>)[key] = redactValue(
            (recorded as Record<string, unknown>)[key],
          )
        }
      }
    }
    captures.push({
      title,
      method,
      path: path + query,
      status,
      requestId,
      note: options.note,
      body: recorded,
      actor: options.actor ?? (options.token ? 'owner' : 'anonymous'),
    })
  }
  log(`${method} ${path}${query} → ${status} (request-id ${requestId ?? 'none'})`)
  return { status, body, requestId }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { unparseable: text.slice(0, 400) }
  }
}

const errorCode = (body: unknown) =>
  (body as { error?: { code?: string } } | undefined)?.error?.code ?? '(no envelope)'

// ---------------------------------------------------------------------------

async function main() {
  log(`\n=== probe-billing · ${new Date(RUN).toISOString()} ===`)
  log(`owner: ${OWNER_EMAIL}\nmember: ${MEMBER_EMAIL}\n`)

  // --- The owner: signup → verify → org (the fresh QA org). ----------------
  log('--- owner identity + org ---')
  await call('signup (owner)', 'POST', '/auth/signup', {
    body: { name: 'QA Billing Owner', email: OWNER_EMAIL, password: PASSWORD },
    quiet: true,
  })
  const ownerVerified = await call('verify-email (owner)', 'POST', '/auth/verify-email', {
    body: { email: OWNER_EMAIL, code: CODE },
    quiet: true,
  })
  const ownerToken = (ownerVerified.body as { token?: string })?.token ?? null
  if (!ownerToken) {
    log('probe-billing: no owner token — cannot continue.')
    await writeReport(null)
    process.exit(1)
  }
  const created = await call('create org', 'POST', '/orgs', {
    body: { name: ORG_NAME },
    token: ownerToken,
    note: 'the fresh QA org every probe below runs on',
  })
  const orgId = (created.body as { org?: { id?: string } })?.org?.id
  if (!orgId) {
    log('probe-billing: no org id — cannot continue.')
    await writeReport(null)
    process.exit(1)
  }
  finding(`Fresh QA org: id ${orgId} ("${ORG_NAME}").`)
  const org = (path: string) => `/orgs/${orgId}${path}`
  const billing = (path: string) => org(`/billing${path}`)
  const owner = { token: ownerToken, actor: 'owner' as const }

  // --- The member: a second account, added to the org as `member`. --------
  // An existing user invited to an org is added immediately (D-ONB-F,
  // `invitedNewUser: false`) — no code to redeem, so this is cheap.
  log('\n--- member identity, added to the org ---')
  await call('signup (member)', 'POST', '/auth/signup', {
    body: { name: 'QA Billing Member', email: MEMBER_EMAIL, password: PASSWORD },
    quiet: true,
  })
  const memberVerified = await call('verify-email (member)', 'POST', '/auth/verify-email', {
    body: { email: MEMBER_EMAIL, code: CODE },
    quiet: true,
  })
  const memberToken = (memberVerified.body as { token?: string })?.token ?? null
  let member: { token: string; actor: 'member' } | null = null
  if (memberToken) {
    const invited = await call(
      'invite the member (existing user → added at once)',
      'POST',
      org('/members/invite'),
      {
        body: { email: MEMBER_EMAIL, role: 'member' },
        ...owner,
      },
    )
    const receipt = invited.body as { invitedNewUser?: boolean } | undefined
    if (invited.status === 201 && receipt?.invitedNewUser === false) {
      member = { token: memberToken, actor: 'member' }
      finding(
        'Member-role account arranged: a second QA user, invited as `member`, added immediately.',
      )
    } else {
      finding(
        `Member-role account NOT arranged: invite answered ${invited.status} — the member probes are skipped.`,
      )
    }
  } else {
    finding(
      'Member-role account NOT arranged: no token for the second user — the member probes are skipped.',
    )
  }

  // --- Probe 1: plans ------------------------------------------------------
  log('\n--- 1. plans ---')
  const plans = await call('1 · GET /billing/plans (owner)', 'GET', billing('/plans'), owner)
  const planItems = (plans.body as { items?: Record<string, unknown>[] })?.items ?? []
  finding(
    `Plans: ${plans.status}; ${planItems.length} item(s); keys per item: ${
      planItems[0] ? Object.keys(planItems[0]).join(', ') : '(none)'
    }; names as delivered: ${planItems.map((p) => JSON.stringify(p.name)).join(' · ') || '(none)'}; amounts: ${planItems
      .map((p) => `${p.plan}=${p.amountCents} ${p.currency}/${p.interval}`)
      .join(' · ')}.`,
  )

  // --- Probe 2: subscription at `none` ------------------------------------
  log('\n--- 2. subscription (never subscribed) ---')
  const sub = await call(
    '2 · GET /billing/subscription (owner, never subscribed)',
    'GET',
    billing('/subscription'),
    owner,
  )
  const subBody = (sub.body ?? {}) as Record<string, unknown>
  finding(
    `Subscription at none: ${sub.status}; status=${JSON.stringify(subBody.status)}; fields present: ${Object.keys(
      subBody,
    )
      .map((k) => `${k}=${subBody[k] === null ? 'null' : typeof subBody[k]}`)
      .join(', ')}.`,
  )
  for (const field of [
    'plan',
    'currentPeriodStart',
    'currentPeriodEnd',
    'cancelAtPeriodEnd',
    'canceledAt',
    'updatedAt',
  ]) {
    if (!(field in subBody))
      finding(`Subscription at none: guide field \`${field}\` is ABSENT from the body.`)
  }

  // --- Probe 3: credits ----------------------------------------------------
  log('\n--- 3. credits ---')
  const credits = await call('3 · GET /billing/credits (owner)', 'GET', billing('/credits'), owner)
  const creditsPaged = await call(
    '3b · GET /billing/credits?limit=5&offset=0 (paging echo)',
    'GET',
    billing('/credits'),
    {
      ...owner,
      query: { limit: 5, offset: 0 },
    },
  )
  finding(
    `Credits: ${credits.status} ${JSON.stringify(credits.body)}; with limit/offset: ${creditsPaged.status} ${JSON.stringify(creditsPaged.body)} — top-level keys: ${Object.keys((creditsPaged.body as object) ?? {}).join(', ')}.`,
  )

  // --- Probe 4: wallet -----------------------------------------------------
  log('\n--- 4. wallet ---')
  const wallet = await call(
    '4 · GET /alphastudio/wallet (owner, fresh org)',
    'GET',
    org('/alphastudio/wallet'),
    owner,
  )
  finding(`Wallet on the fresh org: ${wallet.status} ${JSON.stringify(wallet.body)}.`)

  // --- Member reads (the guide: any member reads) --------------------------
  if (member) {
    log('\n--- member reads ---')
    const mp = await call('GET /billing/plans (member)', 'GET', billing('/plans'), member)
    const ms = await call(
      'GET /billing/subscription (member)',
      'GET',
      billing('/subscription'),
      member,
    )
    const mc = await call('GET /billing/credits (member)', 'GET', billing('/credits'), member)
    finding(`Member reads: plans ${mp.status} · subscription ${ms.status} · credits ${mc.status}.`)
  }

  // --- Probe 7 first (bad plan) so the org is still pristine for probe 5. --
  log('\n--- 7. checkout with a bad plan ---')
  const bad = await call(
    '7 · POST /billing/checkout {plan:"gold"} (owner)',
    'POST',
    billing('/checkout'),
    {
      ...owner,
      body: { plan: 'gold' },
    },
  )
  finding(`Bad plan: ${bad.status} code=${errorCode(bad.body)}.`)

  // --- Probe 6: checkout as a member ----------------------------------------
  if (member) {
    log('\n--- 6. checkout as a member ---')
    const forbidden = await call(
      '6 · POST /billing/checkout {plan:"base"} (member)',
      'POST',
      billing('/checkout'),
      {
        ...member,
        body: { plan: 'base' },
      },
    )
    finding(`Member checkout: ${forbidden.status} code=${errorCode(forbidden.body)}.`)
  }

  // --- Extra: portal on a never-subscribed org ------------------------------
  log('\n--- extra: portal with nothing to manage ---')
  const portal = await call(
    'extra · POST /billing/portal (owner, never subscribed)',
    'POST',
    billing('/portal'),
    {
      ...owner,
      body: undefined,
      redact: ['url'],
    },
  )
  finding(
    `Portal at none: ${portal.status} ${portal.status >= 400 ? `code=${errorCode(portal.body)}` : `keys=${Object.keys((portal.body as object) ?? {}).join(', ')}`}.`,
  )

  // --- Probe 5: ONE checkout as the owner — NOT opened, abandoned. ----------
  log('\n--- 5. ONE checkout (owner) — url never opened ---')
  const checkout = await call(
    '5 · POST /billing/checkout {plan:"base"} (owner)',
    'POST',
    billing('/checkout'),
    {
      ...owner,
      body: { plan: 'base' },
      redact: ['url', 'sessionId'],
      note: 'url and sessionId redacted to their shape; the url was NEVER opened and the session is abandoned (test mode, expires on its own)',
    },
  )
  const checkoutBody = (checkout.body ?? {}) as Record<string, unknown>
  let checkoutHost = '(none)'
  try {
    checkoutHost = new URL(String(checkoutBody.url)).host
  } catch {
    /* not a url */
  }
  finding(
    `Checkout: ${checkout.status}; keys: ${Object.keys(checkoutBody).join(', ')}; url host: ${checkoutHost}; sessionId prefix: ${String(checkoutBody.sessionId ?? '').slice(0, 8)}… (${String(checkoutBody.sessionId ?? '').length} chars).`,
  )

  // --- After the (abandoned) checkout: does the subscription move? ---------
  log('\n--- after the abandoned checkout ---')
  const subAfter = await call(
    'GET /billing/subscription (owner, after an unopened checkout)',
    'GET',
    billing('/subscription'),
    owner,
  )
  finding(
    `Subscription after an unopened checkout: status=${JSON.stringify((subAfter.body as { status?: unknown })?.status)} (unchanged is the expectation).`,
  )
  const walletAfter = await call(
    'GET /alphastudio/wallet (owner, after)',
    'GET',
    org('/alphastudio/wallet'),
    owner,
  )
  finding(`Wallet after: ${JSON.stringify(walletAfter.body)}.`)

  await writeReport(orgId)
  log(`\nwrote ${REPORT_PATH}`)
}

async function writeReport(orgId: string | null) {
  const lines: string[] = []
  lines.push('# Billing endpoints — observed, not guessed (ORDER BIL-0902 Phase 0)')
  lines.push('')
  lines.push(
    'Captured by `pnpm tsx scripts/probe-billing.ts` against the deployed SANDBOX API on one',
    "fresh QA org. Ward's frontend guide is `Docs/api/billing-frontend.md`; this file is what",
    '`src/api/types.ts` transcribes the billing shapes from. It is its OWN file because',
    '`pnpm smoke:alphastudio` overwrites `alphastudio-shapes.md` wholesale (founder-approved',
    'ruling, decisions.md BIL-0902 Phase 0). Re-run the script when the backend changes.',
  )
  lines.push('')
  lines.push(`- Run: \`${new Date(RUN).toISOString()}\``)
  lines.push(`- Owner identity: \`${OWNER_EMAIL}\` · member identity: \`${MEMBER_EMAIL}\``)
  lines.push(`- Fresh QA org: \`${orgId ?? '(none)'}\``)
  lines.push(
    '- Spend: none. One Checkout session was created and NEVER opened (abandoned; test mode).',
  )
  lines.push('')
  lines.push(
    'Session tokens are never recorded. The checkout url and sessionId are redacted to their',
    'shape (a Stripe test-mode link is harmless but it is still a link into a payment page);',
    "every other field is verbatim. Request-ids are the server's `x-request-id` (or the",
    "envelope's `requestId` on an error).",
  )
  lines.push('')
  lines.push('## What this run established')
  lines.push('')
  for (const line of findings) lines.push(`- ${line}`)
  lines.push('')
  lines.push('## Captured exchanges, in order')
  lines.push('')
  for (const capture of captures) {
    lines.push(`### ${capture.title}`)
    lines.push('')
    lines.push(
      `\`${capture.method} ${capture.path}\` → **${capture.status}** · as ${capture.actor} · request-id \`${capture.requestId ?? 'none'}\``,
    )
    if (capture.note) lines.push(`> ${capture.note}`)
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(capture.body ?? null, null, 2))
    lines.push('```')
    lines.push('')
  }
  writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8')
}

main().catch(async (error) => {
  console.error(error)
  await writeReport(null)
  process.exit(1)
})
