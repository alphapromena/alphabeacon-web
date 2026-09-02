// probe-hsn-0902: ORDER HSN-0902 Phase 0 — three wire questions answered on
// ONE fresh QA org against the DEPLOYED sandbox API, zero spend.
//
//   P1  the brand kit on the media door: presign `{mediaType:"application/pdf",
//       desc:"brandkit", role:"brandkit"}` → does the list echo `role`? (A2's
//       second data point) → DELETE. Plus `role:"brandkit"` on a PNG once
//       (does the door bind role to type?), the `role:"logo"` echo itself,
//       one FREE Node PUT of a tiny PDF, and the storage bucket's CORS answer
//       for the two browser origins (browser truth is Chromium's, not this).
//   P2  `params.durationS` on the video create body. The QA org's wallet is
//       ZERO, so every generation call answers 402 before any spend — that is
//       the shield. Sent ONLY when the wallet reads 0: valid `durationS:8`,
//       then `"abc"` and `999` (a 400 means validation runs BEFORE the wallet
//       check and the field is known; a 402 means the probe is inconclusive),
//       plus an image body with NO `params` key and one with `params:{}`.
//       The wallet and the job list are re-read after each to prove nothing
//       moved. Never a body that can mint a paid job on a funded org.
//   P3  where `whatYouOffer` / `whatSetsYouApart` live: `GET /orgs/:id` first,
//       `PATCH /orgs/:id` with the two fields alone, then with `name` beside
//       them, read back each time (echoed / dropped / refused); a read-first
//       sweep of plausible AlphaStudio org-profile paths (404 expected — the
//       openapi lists none); and, ONLY on a door that echoed, the 501/2001
//       limits and the empty string.
//
// Everything is recorded verbatim with request-ids and APPENDED to
// `Docs/api/alphastudio-shapes.md` under a dated heading (the shapes record;
// `pnpm smoke:alphastudio` overwrites that file wholesale, this never does).
// Presigned urls and the session token are redacted to their shape.
//
// Run (PowerShell):  pnpm tsx scripts/probe-hsn-0902.ts
// The base URL is read from the environment, falling back to .env.local.
// A Node script outside src/, outside the network law by design; it calls OUR
// API with the normal Bearer, plus one PUT and two OPTIONS against the
// presigned storage url our API minted.

import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const REPORT_PATH = join(root, 'Docs', 'api', 'alphastudio-shapes.md')

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
  console.error('probe-hsn-0902: no VITE_API_BASE_URL (set it, or put it in .env.local).')
  process.exit(1)
}

const BASE = resolveBaseUrl()
const RUN = Date.now()
const OWNER_EMAIL = `qa+${RUN}hsn@alphapromena.com`
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const ORG_NAME = `QA HSN-0902 Org ${RUN}`
/** The two origins a browser PUT would come from: the e2e dev server and production. */
const BROWSER_ORIGINS = ['http://localhost:5199', 'https://1.malaky.ai']

interface Capture {
  title: string
  method: string
  path: string
  status: number
  requestId?: string
  note?: string
  body?: unknown
  headers?: Record<string, string>
}

const captures: Capture[] = []
const findings: string[] = []
let token: string | null = null

function log(line: string) {
  console.log(line)
}
function finding(line: string) {
  findings.push(line)
  log(`  → ${line}`)
}

interface CallOptions {
  body?: unknown
  quiet?: boolean
  note?: string
  /** Redact these top-level string fields to their shape (presigned urls). */
  redact?: string[]
}

function redactValue(value: unknown): string {
  if (typeof value !== 'string') return `<redacted ${typeof value}>`
  return `<redacted: ${value.length} chars>`
}

async function call(
  title: string,
  method: string,
  path: string,
  options: CallOptions = {},
): Promise<{ status: number; body: unknown; requestId?: string }> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let status = 0
  let body: unknown
  let requestId: string | undefined
  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    status = response.status
    requestId = response.headers.get('x-request-id') ?? undefined
    const text = await response.text()
    body = text ? safeJson(text) : undefined
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
      path,
      status,
      requestId,
      note: options.note,
      body: options.body !== undefined ? { request: options.body, response: recorded } : recorded,
    })
  }
  log(`${method} ${path} → ${status} (request-id ${requestId ?? 'none'})`)
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

/** A minimal, valid single-page PDF (what a "tiny PDF" honestly is). */
function tinyPdf(): Uint8Array<ArrayBuffer> {
  const text = [
    '%PDF-1.1',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj',
    'trailer<</Root 1 0 R>>',
    '%%EOF',
    '',
  ].join('\n')
  // Copied into a plain ArrayBuffer: `TextEncoder` types its output over
  // `ArrayBufferLike`, which `Blob` refuses (the smoke script's shape).
  const encoded = new TextEncoder().encode(text)
  const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength))
  bytes.set(encoded)
  return bytes
}

async function putBytes(url: string, bytes: Uint8Array<ArrayBuffer>, mediaType: string) {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': mediaType },
      body: new Blob([bytes]),
    })
    const text = await response.text()
    return { status: response.status, body: text ? text.slice(0, 400) : undefined }
  } catch (cause) {
    return { status: 0, body: String(cause) }
  }
}

/** The browser's preflight, from Node: what would Chromium be told? */
async function storagePreflight(url: string, origin: string) {
  const wanted = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'access-control-max-age',
  ]
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type',
      },
    })
    const headers: Record<string, string> = {}
    for (const name of wanted) {
      const value = response.headers.get(name)
      if (value !== null) headers[name] = value
    }
    return { status: response.status, headers }
  } catch (cause) {
    return { status: 0, headers: { transportError: String(cause) } }
  }
}

// ---------------------------------------------------------------------------

async function main() {
  log(`\n=== probe-hsn-0902 · ${new Date(RUN).toISOString()} ===`)
  log(`owner: ${OWNER_EMAIL}\n`)

  // --- The owner and the fresh QA org. --------------------------------------
  log('--- owner identity + org ---')
  await call('signup (owner)', 'POST', '/auth/signup', {
    body: { name: 'QA HSN-0902 Owner', email: OWNER_EMAIL, password: PASSWORD },
    quiet: true,
  })
  const verified = await call('verify-email (owner)', 'POST', '/auth/verify-email', {
    body: { email: OWNER_EMAIL, code: CODE },
    quiet: true,
  })
  token = (verified.body as { token?: string })?.token ?? null
  if (!token) {
    log('probe-hsn-0902: no owner token — cannot continue.')
    await writeReport(null)
    process.exit(1)
  }
  const created = await call('create org', 'POST', '/orgs', {
    body: { name: ORG_NAME },
    note: 'the fresh QA org every probe below runs on',
  })
  const orgId = (created.body as { org?: { id?: string } })?.org?.id
  if (!orgId) {
    log('probe-hsn-0902: no org id — cannot continue.')
    await writeReport(null)
    process.exit(1)
  }
  finding(`Fresh QA org: id ${orgId} ("${ORG_NAME}").`)
  const org = (path: string) => `/orgs/${orgId}${path}`
  const studio = (path: string) => org(`/alphastudio${path}`)

  const wallet0 = await call('wallet — the fresh org (the 402 shield)', 'GET', studio('/wallet'))
  const available = (wallet0.body as { availableCents?: number })?.availableCents
  finding(`Wallet on the fresh org: ${wallet0.status} ${JSON.stringify(wallet0.body)}.`)

  // ==========================================================================
  // P1 — the brand kit on the media door
  // ==========================================================================
  log('\n--- P1 · brand kit presign (application/pdf, desc "brandkit", role "brandkit") ---')
  const kit = await call(
    'P1 · media/assets/presign — application/pdf, desc "brandkit", role "brandkit"',
    'POST',
    studio('/media/assets/presign'),
    {
      body: { mediaType: 'application/pdf', desc: 'brandkit', role: 'brandkit' },
      redact: ['uploadUrl'],
    },
  )
  const kitTicket = kit.body as { assetId?: string; uploadUrl?: string; mediaType?: string }
  finding(
    `P1 brand-kit presign (PDF): ${kit.status}${kit.status >= 400 ? ` code=${errorCode(kit.body)}` : ` assetId=${kitTicket.assetId} mediaType=${kitTicket.mediaType}`}.`,
  )

  if (kitTicket.uploadUrl && kitTicket.assetId) {
    // The bucket's CORS answer for the browser origins — recorded, not acted on.
    for (const origin of BROWSER_ORIGINS) {
      const pre = await storagePreflight(kitTicket.uploadUrl, origin)
      captures.push({
        title: `P1 · storage CORS preflight (OPTIONS, from Node) — Origin ${origin}`,
        method: 'OPTIONS',
        path: '(presigned storage url — not our API)',
        status: pre.status,
        headers: pre.headers,
        note: 'what Chromium would be told before its PUT; browser truth is still the browser’s',
      })
      finding(
        `Storage CORS for ${origin}: ${pre.status}; allow-origin=${pre.headers['access-control-allow-origin'] ?? '(none)'}; allow-methods=${pre.headers['access-control-allow-methods'] ?? '(none)'}.`,
      )
    }

    // One FREE Node PUT of a tiny PDF: the door takes a PDF end to end.
    const put = await putBytes(
      kitTicket.uploadUrl,
      tinyPdf(),
      kitTicket.mediaType ?? 'application/pdf',
    )
    captures.push({
      title: 'P1 · PUT a tiny PDF to the media presigned url (from Node — NOT browser truth)',
      method: 'PUT',
      path: '(presigned storage url — not our API)',
      status: put.status,
      body: put.body,
      note: `${tinyPdf().byteLength} bytes, content-type exactly the ticket's mediaType`,
    })
    finding(`Node PUT of a ${tinyPdf().byteLength}-byte PDF: ${put.status}.`)

    const list1 = await call(
      'P1 · media/assets — list (does the row echo role?)',
      'GET',
      studio('/media/assets'),
    )
    const rows1 = (list1.body as { assets?: Record<string, unknown>[] })?.assets ?? []
    const kitRow = rows1.find((row) => row.assetId === kitTicket.assetId)
    finding(
      `P1 list after the PDF presign: ${list1.status}; the brand-kit row ${kitRow ? `is listed with keys [${Object.keys(kitRow).join(', ')}]; kind=${JSON.stringify(kitRow.kind)}; role ${'role' in kitRow ? `ECHOED as ${JSON.stringify(kitRow.role)}` : 'NOT echoed'}` : 'is NOT in the list'}.`,
    )

    const readBack = await call(
      'P1 · media/assets/:id/presign — download url for the PDF',
      'POST',
      studio(`/media/assets/${kitTicket.assetId}/presign`),
      { redact: ['url'] },
    )
    finding(`P1 read-presign of the PDF asset: ${readBack.status}.`)

    const del = await call(
      'P1 · media/assets/:id — DELETE the brand kit',
      'DELETE',
      studio(`/media/assets/${kitTicket.assetId}`),
      {
        note: 'expected 204',
      },
    )
    finding(`P1 DELETE: ${del.status}.`)
    const list1b = await call(
      'P1 · media/assets — list re-read after the delete',
      'GET',
      studio('/media/assets'),
    )
    finding(`P1 list re-read: ${list1b.status} ${JSON.stringify(list1b.body)}.`)
  }

  log('\n--- P1b · role "brandkit" on image/png (does the door bind role to type?) ---')
  const kitPng = await call(
    'P1b · media/assets/presign — image/png, desc "brandkit", role "brandkit"',
    'POST',
    studio('/media/assets/presign'),
    { body: { mediaType: 'image/png', desc: 'brandkit', role: 'brandkit' }, redact: ['uploadUrl'] },
  )
  const kitPngTicket = kitPng.body as { assetId?: string }
  finding(
    `P1b role "brandkit" on a PNG: ${kitPng.status}${kitPng.status >= 400 ? ` code=${errorCode(kitPng.body)} — the door binds role to type` : ' — the door does NOT bind role to type; the PDF allowlist is the client’s'}.`,
  )
  if (kitPngTicket.assetId) {
    await call(
      'P1b · media/assets/:id — DELETE',
      'DELETE',
      studio(`/media/assets/${kitPngTicket.assetId}`),
      {
        note: 'expected 204',
      },
    )
  }

  log('\n--- P1c · role "logo" (A2: does the list echo the logo role?) ---')
  const logo = await call(
    'P1c · media/assets/presign — image/png, desc "logo", role "logo" (the org logo’s exact body)',
    'POST',
    studio('/media/assets/presign'),
    { body: { mediaType: 'image/png', desc: 'logo', role: 'logo' }, redact: ['uploadUrl'] },
  )
  const logoTicket = logo.body as { assetId?: string }
  if (logoTicket.assetId) {
    const listLogo = await call(
      'P1c · media/assets — list (the logo row)',
      'GET',
      studio('/media/assets'),
    )
    const rows = (listLogo.body as { assets?: Record<string, unknown>[] })?.assets ?? []
    const logoRow = rows.find((row) => row.assetId === logoTicket.assetId)
    finding(
      `A2 (role "logo" echo): ${logoRow ? `row keys [${Object.keys(logoRow).join(', ')}]; role ${'role' in logoRow ? `ECHOED as ${JSON.stringify(logoRow.role)}` : 'NOT echoed'}` : 'the row is not listed'}.`,
    )
    await call(
      'P1c · media/assets/:id — DELETE the logo probe row',
      'DELETE',
      studio(`/media/assets/${logoTicket.assetId}`),
      {
        note: 'expected 204',
      },
    )
  } else {
    finding(
      `A2 probe: the logo presign answered ${logo.status} code=${errorCode(logo.body)} — no row to read.`,
    )
  }

  // ==========================================================================
  // P2 — durationS on the video door, behind the zero-wallet shield
  // ==========================================================================
  log('\n--- P2 · durationS on the video create body ---')
  if (available !== 0) {
    finding(
      `P2 NOT RUN: the fresh org's wallet reads availableCents=${String(available)} — not zero, so the 402 shield does not hold and no generation body was sent (the order forbids a body that could mint a paid job).`,
    )
  } else {
    const tone = {
      id: 'hsn-0902-probe-tone',
      name: 'Roastery floor',
      description: 'Warm, specific, smells of coffee.',
      rules: [{ kind: 'do', text: 'Name the roast date' }],
    }
    const post = {
      ref: 'hsn-0902-probe-draft',
      content:
        'This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.',
      tone,
    }
    const videoBody = (params: unknown) => ({
      capability: 'social-posts.media',
      plan: 'balanced',
      kind: 'video',
      posts: [post],
      style: { imgStyle: 'Cinematic', text: true, logo: true },
      guidance: [],
      params,
      collection: { use: true },
    })
    const imageBodyNoParams = {
      capability: 'social-posts.media',
      plan: 'balanced',
      kind: 'image',
      posts: [post],
      style: { imgStyle: 'Cinematic', text: true, logo: true },
      guidance: [],
      collection: { use: true },
    }
    const imageBodyEmptyParams = { ...imageBodyNoParams, params: {} }

    const probes: { title: string; body: unknown }[] = [
      {
        title: 'P2a · media/jobs — video, params:{durationS:8} (Hasan’s example; 402 expected)',
        body: videoBody({ durationS: 8 }),
      },
      {
        title:
          'P2b · media/jobs — video, params:{durationS:"abc"} (400 = validated before the wallet)',
        body: videoBody({ durationS: 'abc' }),
      },
      {
        title:
          'P2c · media/jobs — video, params:{durationS:999} (400 = a max is enforced before the wallet)',
        body: videoBody({ durationS: 999 }),
      },
      {
        title: 'P2d · media/jobs — image, NO params key (the ruled image body)',
        body: imageBodyNoParams,
      },
      {
        title: 'P2e · media/jobs — image, params:{} (HSN-02’s shape, the control)',
        body: imageBodyEmptyParams,
      },
    ]
    for (const probe of probes) {
      const answer = await call(probe.title, 'POST', studio('/media/jobs'), {
        body: probe.body,
        note: 'sent ONLY because the wallet read 0 — the 402 shield',
      })
      finding(`${probe.title.split(' — ')[1]}: ${answer.status} code=${errorCode(answer.body)}.`)
    }
    const walletAfter = await call(
      'P2 · wallet — after the five refused bodies',
      'GET',
      studio('/wallet'),
    )
    const jobsAfter = await call(
      'P2 · media/jobs — list after (no job may exist)',
      'GET',
      studio('/media/jobs'),
    )
    const jobCount = (jobsAfter.body as { jobs?: unknown[] })?.jobs?.length
    finding(
      `P2 after: wallet ${JSON.stringify(walletAfter.body)}; jobs listed: ${String(jobCount)}.`,
    )
  }

  // ==========================================================================
  // P3 — where do whatYouOffer / whatSetsYouApart live?
  // ==========================================================================
  log('\n--- P3 · the org fields ---')
  const root0 = await call('P3 · GET /orgs/:id — the org record before any write', 'GET', org(''))
  const orgKeys0 = Object.keys(((root0.body as { org?: object })?.org ?? {}) as object)
  finding(`P3 org record keys before: [${orgKeys0.join(', ')}].`)

  const OFFER = 'Specialty coffee, roasted to order and shipped within 48 hours.'
  const APART = 'Roasted to order. Direct-trade sourcing. Carbon-neutral shipping.'
  const fieldsOnly = await call('P3a · PATCH /orgs/:id — the two fields ALONE', 'PATCH', org(''), {
    body: { whatYouOffer: OFFER, whatSetsYouApart: APART },
  })
  const echoOf = (body: unknown) => {
    const record = ((body as { org?: Record<string, unknown> })?.org ??
      (body as Record<string, unknown>) ??
      {}) as Record<string, unknown>
    return {
      whatYouOffer: record.whatYouOffer,
      whatSetsYouApart: record.whatSetsYouApart,
      present: 'whatYouOffer' in record || 'whatSetsYouApart' in record,
    }
  }
  const read1 = await call('P3a · GET /orgs/:id — read back', 'GET', org(''))
  const echo1 = echoOf(read1.body)
  finding(
    `P3a fields alone: PATCH ${fieldsOnly.status}${fieldsOnly.status >= 400 ? ` code=${errorCode(fieldsOnly.body)}` : ''}; read-back ${echo1.present ? `ECHOES whatYouOffer=${JSON.stringify(echo1.whatYouOffer)} whatSetsYouApart=${JSON.stringify(echo1.whatSetsYouApart)}` : 'carries NEITHER field'}.`,
  )

  const withName = await call(
    'P3b · PATCH /orgs/:id — the two fields beside `name`',
    'PATCH',
    org(''),
    { body: { name: ORG_NAME, whatYouOffer: OFFER, whatSetsYouApart: APART } },
  )
  const read2 = await call('P3b · GET /orgs/:id — read back', 'GET', org(''))
  const echo2 = echoOf(read2.body)
  finding(
    `P3b fields beside name: PATCH ${withName.status}${withName.status >= 400 ? ` code=${errorCode(withName.body)}` : ` (PATCH response ${echoOf(withName.body).present ? 'carries' : 'does not carry'} the fields)`}; read-back ${echo2.present ? `ECHOES whatYouOffer=${JSON.stringify(echo2.whatYouOffer)} whatSetsYouApart=${JSON.stringify(echo2.whatSetsYouApart)}` : 'carries NEITHER field'}.`,
  )
  const accepted = echo1.whatYouOffer === OFFER || echo2.whatYouOffer === OFFER

  log('\n--- P3c · read-first sweep for an AlphaStudio org-profile door (404 expected) ---')
  const candidates = [
    studio('/profile'),
    studio('/org'),
    studio('/organization'),
    studio('/brand'),
    studio('/context'),
    org('/profile'),
    org('/brand/profile'),
  ]
  const sweep: string[] = []
  for (const path of candidates) {
    const answer = await call(`P3c · GET ${path.replace(orgId, ':id')}`, 'GET', path)
    sweep.push(`${path.replace(orgId, ':id')} → ${answer.status}`)
  }
  finding(`P3c org-profile sweep (read-only): ${sweep.join(' · ')}.`)

  if (accepted) {
    log('\n--- P3d · the limits on the accepting door ---')
    const over500 = 'x'.repeat(501)
    const over2000 = 'y'.repeat(2001)
    const l1 = await call('P3d · PATCH /orgs/:id — whatYouOffer 501 chars', 'PATCH', org(''), {
      body: { whatYouOffer: over500 },
    })
    finding(`P3d whatYouOffer at 501: ${l1.status} code=${errorCode(l1.body)}.`)
    const l2 = await call('P3d · PATCH /orgs/:id — whatSetsYouApart 2001 chars', 'PATCH', org(''), {
      body: { whatSetsYouApart: over2000 },
    })
    finding(`P3d whatSetsYouApart at 2001: ${l2.status} code=${errorCode(l2.body)}.`)
    const l3 = await call(
      'P3d · PATCH /orgs/:id — whatYouOffer exactly 500, whatSetsYouApart exactly 2000',
      'PATCH',
      org(''),
      {
        body: { whatYouOffer: 'x'.repeat(500), whatSetsYouApart: 'y'.repeat(2000) },
      },
    )
    finding(`P3d at exactly 500/2000: ${l3.status} code=${errorCode(l3.body)}.`)
    const l4 = await call(
      'P3d · PATCH /orgs/:id — both EMPTY strings (can a field be cleared?)',
      'PATCH',
      org(''),
      {
        body: { whatYouOffer: '', whatSetsYouApart: '' },
      },
    )
    const read4 = await call(
      'P3d · GET /orgs/:id — read back after the empty write',
      'GET',
      org(''),
    )
    const echo4 = echoOf(read4.body)
    finding(
      `P3d empty strings: ${l4.status} code=${errorCode(l4.body)}; read-back whatYouOffer=${JSON.stringify(echo4.whatYouOffer)} whatSetsYouApart=${JSON.stringify(echo4.whatSetsYouApart)}.`,
    )
  } else {
    finding('P3d NOT RUN: no door echoed the fields, so there are no limits to measure.')
  }

  await writeReport(orgId)
  log(`\nappended to ${REPORT_PATH}`)
}

async function writeReport(orgId: string | null) {
  const lines: string[] = []
  lines.push('')
  lines.push(
    `## HSN-0902 Phase 0 — brand kit role, durationS, and the org fields (${new Date(RUN).toISOString().slice(0, 10)})`,
  )
  lines.push('')
  lines.push(
    'Captured by `pnpm tsx scripts/probe-hsn-0902.ts` against the deployed SANDBOX API on one',
    `fresh QA org — **${orgId ?? '(none)'}** (\`${OWNER_EMAIL}\`) — org 619 untouched. Zero spend:`,
    'presigns, one free Node PUT, list reads, deletes, org reads and PATCHes, and five',
    'generation bodies sent ONLY behind the zero-wallet shield (each refused before any',
    'spend; the wallet and the job list are re-read after). Bodies verbatim; presigned',
    "urls and the token redacted. Request-ids are the server's `x-request-id` (or the",
    "envelope's `requestId` on an error). Run stamp: `" + new Date(RUN).toISOString() + '`.',
  )
  lines.push('')
  lines.push('### What this run established')
  lines.push('')
  for (const line of findings) lines.push(`- ${line}`)
  lines.push('')
  lines.push('### Captured exchanges, in order')
  lines.push('')
  for (const capture of captures) {
    lines.push(`#### ${capture.title}`)
    lines.push('')
    lines.push(
      `\`${capture.method} ${capture.path}\` → **${capture.status}** · request-id \`${capture.requestId ?? 'none'}\``,
    )
    if (capture.note) lines.push(`> ${capture.note}`)
    lines.push('')
    if (capture.headers) {
      lines.push('```json')
      lines.push(JSON.stringify(capture.headers, null, 2))
      lines.push('```')
      lines.push('')
    }
    if (capture.body !== undefined) {
      lines.push('```json')
      lines.push(JSON.stringify(capture.body ?? null, null, 2))
      lines.push('```')
      lines.push('')
    }
  }
  appendFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8')
}

main().catch(async (error) => {
  console.error(error)
  await writeReport(null)
  process.exit(1)
})
