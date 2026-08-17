// smoke-alphastudio: the observation run behind decisions.md D-INT-H.
//
// The /alphastudio/* namespace is a pure proxy: our API forwards the external
// service's response shape unchanged, and the contract says new fields "may
// appear without notice". Types written from prose would be guesses, so this
// script drives one fresh QA org through every proxy surface against the
// DEPLOYED API and writes what actually came back, verbatim, to
// Docs/api/alphastudio-shapes.md. That file — not this script, and not api.md's
// examples — is what src/api/types.ts is transcribed from.
//
// It answers questions the docs cannot:
//   - does the Function URL's CORS policy allow PUT, and the new paths?
//   - which media capabilities is THIS app actually granted (404 = not ours)?
//   - do the catalog's model rows carry a price?
//   - is `slot` required on a generate run?
//   - which RAG media types does the platform accept for extraction?
//   - does object storage take a PUT from outside a browser at all?
//   - what does each call really cost the org's wallet?
//
// Cost discipline (D-INT-I): the org spends only its own starter funding. One
// text run, one tones-preview, one no-slot probe. Renders cost real money and
// are gated behind LIVE_MEDIA=1; the byte-level asset flow (presign → PUT →
// presign → delete) is free and always runs.
//
// Run (PowerShell):
//   $env:VITE_API_BASE_URL="<base>"; pnpm tsx scripts/smoke-alphastudio.ts
//   $env:LIVE_MEDIA="1"; …            # adds one paid render
// The base URL is read from the environment, falling back to .env.local — the
// same one switch the app uses, never a literal in source.
//
// This file is a Node script, not app code: it is outside src/, so it is
// outside the network law's jurisdiction by design (eslint scopes ab/no-network
// to src/**, guard-static scans src/). It still never signs anything and never
// addresses the upstream service — every call below goes to OUR API, which is
// the whole point of Ward's rule.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const REPORT_PATH = join(root, 'Docs', 'api', 'alphastudio-shapes.md')

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function resolveBaseUrl(): string {
  const fromEnv = process.env.VITE_API_BASE_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const envFile = join(root, '.env.local')
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, 'utf8').match(/^\s*VITE_API_BASE_URL\s*=\s*(.+)$/m)
    if (match) return match[1].trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '')
  }
  console.error(
    'smoke-alphastudio: no VITE_API_BASE_URL (set it, or put it in .env.local) — nothing to talk to.',
  )
  process.exit(1)
}

const BASE = resolveBaseUrl()
const RUN = Date.now()
const EMAIL = `qa+${RUN}smoke@alphapromena.com`
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const ORG_NAME = `QA Smoke Org ${RUN}`
/** What the dev server's browser would send, so the preflight answer is real. */
const DEV_ORIGIN = 'http://localhost:5173'
const WITH_MEDIA = process.env.LIVE_MEDIA === '1'

/** One captured exchange, in the order it happened. */
interface Capture {
  title: string
  method: string
  path: string
  status: number
  note?: string
  body?: unknown
  /** Response headers worth recording (CORS answers, mostly). */
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
  query?: Record<string, string | number>
  anonymous?: boolean
  /** Skip capturing the body (setup calls that carry a token). */
  quiet?: boolean
  note?: string
}

async function call(
  title: string,
  method: string,
  path: string,
  options: CallOptions = {},
): Promise<{ status: number; body: unknown }> {
  const query = options.query
    ? `?${new URLSearchParams(Object.entries(options.query).map(([k, v]) => [k, String(v)]))}`
    : ''
  const headers: Record<string, string> = { accept: 'application/json' }
  if (token && !options.anonymous) headers.authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let status = 0
  let body: unknown
  try {
    const response = await fetch(`${BASE}${path}${query}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    status = response.status
    const text = await response.text()
    body = text ? safeJson(text) : undefined
    if (!options.quiet) {
      captures.push({ title, method, path: path + query, status, note: options.note, body })
    }
  } catch (cause) {
    status = 0
    body = { transportError: String(cause) }
    if (!options.quiet) {
      captures.push({ title, method, path: path + query, status, note: options.note, body })
    }
  }
  log(`${method} ${path}${query} → ${status}`)
  return { status, body }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { unparseable: text.slice(0, 400) }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------
// Section 1 — CORS: can a browser make these calls at all?
// ---------------------------------------------------------------------------

async function preflight(title: string, method: string, path: string) {
  let status = 0
  const headers: Record<string, string> = {}
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: 'OPTIONS',
      headers: {
        origin: DEV_ORIGIN,
        'access-control-request-method': method,
        'access-control-request-headers': 'authorization, content-type',
      },
    })
    status = response.status
    for (const name of [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-expose-headers',
      'access-control-max-age',
    ]) {
      const value = response.headers.get(name)
      if (value !== null) headers[name] = value
    }
  } catch (cause) {
    headers.transportError = String(cause)
  }

  const allowedMethods = (headers['access-control-allow-methods'] ?? '').toUpperCase()
  const methodAllowed =
    allowedMethods.includes('*') || allowedMethods.split(/[,\s]+/).includes(method)
  captures.push({
    title,
    method: 'OPTIONS',
    path,
    status,
    note: `preflight for ${method}; method allowed: ${methodAllowed ? 'YES' : 'NO'}`,
    headers,
  })
  log(`OPTIONS ${path} (${method}) → ${status} · allow-methods: ${headers['access-control-allow-methods'] ?? '(none)'}`)
  return { methodAllowed, headers }
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

async function main() {
  log(`\n=== smoke-alphastudio · ${new Date(RUN).toISOString()} ===`)
  log(`identity: ${EMAIL}\n`)

  // --- CORS first: a surface a browser cannot reach must not be built on. ---
  log('--- CORS preflights ---')
  const putCountry = await preflight(
    'CORS preflight — PUT /orgs/:orgId/country',
    'PUT',
    '/orgs/1/country',
  )
  const postGenerate = await preflight(
    'CORS preflight — POST /orgs/:orgId/alphastudio/posts/generate',
    'POST',
    '/orgs/1/alphastudio/posts/generate',
  )
  const requestIdAllowed = /x-request-id/i.test(
    putCountry.headers['access-control-allow-headers'] ?? '',
  )
  finding(
    `CORS: PUT ${putCountry.methodAllowed ? 'IS' : 'is NOT'} allowed; the proxy POST path ${postGenerate.methodAllowed ? 'IS' : 'is NOT'} allowed; x-request-id ${requestIdAllowed ? 'IS now' : 'is still NOT'} an allowed request header (open-items 3).`,
  )

  // --- A fresh identity and org: the starter funding is the whole budget. ---
  log('\n--- fresh QA identity + org ---')
  await call('signup', 'POST', '/auth/signup', {
    body: { name: 'QA Smoke', email: EMAIL, password: PASSWORD },
    anonymous: true,
  })
  const verified = await call('verify-email → auth session', 'POST', '/auth/verify-email', {
    body: { email: EMAIL, code: CODE },
    anonymous: true,
    note: 'token redacted below — the shape is what matters',
  })
  token = (verified.body as { token?: string })?.token ?? null
  if (!token) {
    log('smoke-alphastudio: no session token — cannot continue.')
    await writeReport()
    process.exit(1)
  }

  const created = await call('create org (funds the wallet)', 'POST', '/orgs', {
    body: { name: ORG_NAME },
  })
  const orgId = (created.body as { org?: { id?: string } })?.org?.id
  if (!orgId) {
    log('smoke-alphastudio: no org id — cannot continue.')
    await writeReport()
    process.exit(1)
  }
  const org = (path: string) => `/orgs/${orgId}${path}`
  const studio = (path: string) => org(`/alphastudio${path}`)
  finding(
    `Org response carries \`country\`: ${JSON.stringify((created.body as { org?: { country?: unknown } })?.org?.country)} on a fresh org.`,
  )

  // --- Wallet: starter funding, before anything is spent. ----------------
  log('\n--- wallet (before) ---')
  const walletBefore = await call('wallet — fresh org', 'GET', studio('/wallet'))
  const before = walletBefore.body as { cents?: number; availableCents?: number } | undefined
  finding(
    `Starter funding observed: ${JSON.stringify(walletBefore.body)}${
      before?.cents === 0 ? ' — all-zero means funding lagged, not an error (contract).' : ''
    }`,
  )

  // --- Catalog: which capabilities is THIS app actually granted? ---------
  log('\n--- catalog probe ---')
  const CAPABILITIES = [
    'media.generate',
    'social-posts.media',
    'images.edit',
    'photoshoot.generate',
    'brand-assets.generate',
    'logos.generate',
    'logos.redesign',
    'video-ads.generate',
    'tones.preview',
    'social-posts.generate',
  ]
  const granted: string[] = []
  const denied: string[] = []
  const modelFields = new Set<string>()
  for (const capability of CAPABILITIES) {
    const result = await call(
      `catalog — ${capability}`,
      'GET',
      studio(`/catalog/capabilities/${capability}`),
    )
    if (result.status === 200) {
      granted.push(capability)
      const models = (result.body as { models?: Record<string, unknown>[] })?.models ?? []
      for (const model of models) for (const key of Object.keys(model)) modelFields.add(key)
    } else {
      denied.push(`${capability} (${result.status})`)
    }
  }
  finding(`Granted capabilities: ${granted.join(', ') || '(none)'}`)
  finding(`Not granted / unknown: ${denied.join(', ') || '(none)'}`)
  const fields = [...modelFields].sort()
  finding(
    `Catalog model-row fields observed: ${fields.join(', ') || '(none)'} — price exposed: ${
      fields.some((f) => /price|cost|usd|cents/i.test(f)) ? 'YES' : 'NO'
    }.`,
  )

  // --- A voice, so the org has a context bundle to fall back on. --------
  // tones-preview omits brandVoice on purpose (INT-7): the platform then reads
  // the org's pushed bundle, which is what real generation grounds on. A fresh
  // org has no bundle at all, so the contract's 502 is a live possibility —
  // recording WHICH of the two paths answered is the point of this probe.
  log('\n--- tones-preview (sync) ---')
  const TONE = {
    id: 'smoke-tone',
    name: 'Roastery floor',
    description: 'Warm, specific, smells of coffee. Written for people who buy beans weekly.',
    rules: [
      { kind: 'do', text: 'Name the farm or the roast date when it matters.' },
      { kind: 'dont', text: 'No exclamation marks and no hype adjectives.' },
    ],
  }
  let preview = await call('posts/tones-preview — no brandVoice (bundle fallback)', 'POST', studio('/posts/tones-preview'), {
    body: { tone: TONE, language: 'en' },
    note: 'brandVoice deliberately omitted — the fallback path is what real generation uses',
  })
  if (preview.status === 502) {
    finding(
      'tones-preview on an org with NO pushed bundle → 502. INT-7 must hint "save your brand voice first".',
    )
    await call('brand/voices — create the canonical row', 'POST', org('/brand/voices'), {
      body: {
        name: 'Brand voice',
        description: `${ORG_NAME} brand voice`,
        rules: [{ kind: 'do', text: 'Sound like a person who roasts coffee, not a brand.' }],
      },
      note: 'D-INT-B: one canonical voice row named "Brand voice"; its rules are the app do/dont',
    })
    // The bundle push happens after the write commits; give it a moment.
    await sleep(2500)
    preview = await call(
      'posts/tones-preview — retry after the voice exists',
      'POST',
      studio('/posts/tones-preview'),
      { body: { tone: TONE, language: 'en' } },
    )
    finding(
      `tones-preview retry after one voice: ${preview.status}${preview.status === 200 ? ' — the bundle fallback works once a voice exists.' : ''}`,
    )
  } else {
    finding(`tones-preview on a fresh org (no voice): ${preview.status} — no voice was needed.`)
    // Still create the canonical voice: the generate run below should ground on
    // a real bundle, which is what INT-10 will actually ship.
    await call('brand/voices — create the canonical row', 'POST', org('/brand/voices'), {
      body: {
        name: 'Brand voice',
        description: `${ORG_NAME} brand voice`,
        rules: [{ kind: 'do', text: 'Sound like a person who roasts coffee, not a brand.' }],
      },
      note: 'D-INT-B: one canonical voice row named "Brand voice"',
    })
    await sleep(2500)
  }
  // Read the voice back: the rules embed is what INT-7's adapter reads.
  await call('brand/voices — read back (rules embedded)', 'GET', org('/brand/voices'))

  // --- The generate run: where the DRAFT OUTPUT SHAPE is discovered. -----
  log('\n--- posts/generate (batch) ---')
  const today = new Date(RUN).toISOString().slice(0, 10)
  const generate = await call('posts/generate — plan balanced, one tone, perTone 1', 'POST', studio('/posts/generate'), {
    body: {
      tones: [TONE],
      plan: 'balanced',
      slot: { ref: `smoke-${RUN}`, dateISO: today, time: '09:00', timezone: 'Asia/Amman' },
      options: { perTone: 1 },
    },
  })
  const runId = (generate.body as { runId?: string })?.runId
  if (runId) {
    const run = await pollRun(studio, runId)
    const outputs = (run as { outputs?: Record<string, unknown>[] })?.outputs ?? []
    const first = outputs[0] ?? {}
    finding(
      `Run output fields: ${Object.keys(first).sort().join(', ') || '(no outputs)'}${
        first.content ? `; content keys: ${Object.keys(first.content as object).sort().join(', ')}` : ''
      }`,
    )
  }

  // Is `slot` required? The answer decides whether F1 must ask for one.
  const noSlot = await call('posts/generate — WITHOUT slot (is it required?)', 'POST', studio('/posts/generate'), {
    body: { tones: [TONE], plan: 'balanced', options: { perTone: 1 } },
    note: 'a 400 here means F1 must always send a slot; a 202 means it is optional',
  })
  finding(
    `\`slot\` on posts/generate: ${noSlot.status === 202 ? 'OPTIONAL (202 without it)' : `status ${noSlot.status} without it — treat as REQUIRED`}.`,
  )

  await call('posts/runs/:runId — unknown id', 'GET', studio('/posts/runs/run_smoke_missing'), {
    note: 'the ledger must drop an id that answers 404 (D-INT-G)',
  })

  // --- RAG: the knowledge surface, end to end, plus the media-type matrix.
  log('\n--- rag knowledge ---')
  // First: prove what api.md gets wrong. It marks `embeddingModel` optional;
  // the upstream refuses a body without it. Both bodies are recorded so the
  // gap is evidence, not a claim.
  const withoutModel = await call(
    'rag/collections — WITHOUT embeddingModel (api.md says optional)',
    'POST',
    studio('/rag/collections'),
    { body: { name: 'knowledge', scope: 'tenant' }, note: 'expected to fail — see the finding' },
  )
  finding(
    `\`embeddingModel\` on rag/collections: api.md marks it OPTIONAL, the upstream answers ${withoutModel.status} without it — treat as REQUIRED (send \`embed-default\`).`,
  )

  const COLLECTION_BODY = {
    name: 'knowledge',
    scope: 'tenant',
    embeddingModel: 'embed-default',
    chunkProfile: 'default-text',
  }
  const collection = await call('rag/collections — create "knowledge" (scope tenant)', 'POST', studio('/rag/collections'), {
    body: COLLECTION_BODY,
  })
  let collectionId = (collection.body as { collectionId?: string })?.collectionId

  // Then the lazy-create path I6 actually ships: the same name again is a
  // duplicate 400, and the list is how the existing one is found and reused.
  const duplicate = await call('rag/collections — the SAME name again (duplicate)', 'POST', studio('/rag/collections'), {
    body: COLLECTION_BODY,
    note: 'I6 creates lazily: on this 400 it lists and reuses',
  })
  const list = await call('rag/collections — list (the reuse path)', 'GET', studio('/rag/collections'))
  const listed = ((list.body as { collections?: { collectionId: string; name: string }[] })
    ?.collections ?? []).find((entry) => entry.name === 'knowledge')?.collectionId
  finding(
    `Duplicate collection name → ${duplicate.status}; the list then resolves it (${listed ? 'found' : 'NOT found'}) — the lazy-create-then-reuse path holds.`,
  )
  collectionId ??= listed

  if (collectionId) {
    const pushed = await call('rag sources — push markdown', 'POST', studio(`/rag/collections/${collectionId}/sources`), {
      body: {
        kind: 'push',
        title: 'Roasting notes',
        mediaType: 'text/markdown',
        content: '# Roasting notes\n\nEthiopia Guji, washed. Roast date matters more than origin.',
      },
    })
    const sourceId = (pushed.body as { sourceId?: string })?.sourceId
    if (sourceId) await pollSource(studio, sourceId)

    log('\n--- rag presign media-type matrix ---')
    const MEDIA_TYPES = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const accepted: string[] = []
    const refused: string[] = []
    let uploadTicket: { sourceId?: string; uploadUrl?: string; mediaType?: string } | undefined
    for (const mediaType of MEDIA_TYPES) {
      const result = await call(
        `rag sources/presign — ${mediaType}`,
        'POST',
        studio(`/rag/collections/${collectionId}/sources/presign`),
        { body: { filename: `smoke.${extensionFor(mediaType)}`, mediaType } },
      )
      if (result.status === 201) {
        accepted.push(mediaType)
        if (mediaType === 'text/plain') {
          uploadTicket = result.body as typeof uploadTicket
        }
      } else {
        refused.push(`${mediaType} (${result.status})`)
      }
    }
    finding(`RAG extractable media types — accepted: ${accepted.join(', ') || '(none)'}`)
    finding(`RAG media types refused: ${refused.join(', ') || '(none)'}`)

    // Does object storage take a PUT from outside a browser? (The browser
    // question is CORS and can only be answered in a browser — open-items.)
    if (uploadTicket?.uploadUrl && uploadTicket.mediaType) {
      const put = await putBytes(
        uploadTicket.uploadUrl,
        Buffer.from('Roast dates, not origins.\n', 'utf8'),
        uploadTicket.mediaType,
      )
      captures.push({
        title: 'PUT bytes to the RAG presigned url (from Node)',
        method: 'PUT',
        path: '(presigned storage url — not our API)',
        status: put.status,
        note: 'proves the signature works; the BROWSER path additionally needs S3 CORS',
        body: put.body,
      })
      finding(`RAG presigned PUT from Node: ${put.status} — ${put.status < 300 ? 'storage accepts it' : 'refused'}.`)
      if (uploadTicket.sourceId) await pollSource(studio, uploadTicket.sourceId)
    }

    if (sourceId) {
      await call('rag/sources/:id — DELETE (200 WITH a body)', 'DELETE', studio(`/rag/sources/${sourceId}`))
      await call('rag/sources/:id — re-read after delete', 'GET', studio(`/rag/sources/${sourceId}`), {
        note: 'expected 404',
      })
    }
  }

  // --- Media assets: the free byte flow always; a render only on demand. --
  log('\n--- media assets (free) ---')
  const assetTicket = await call('media/assets/presign — image/png', 'POST', studio('/media/assets/presign'), {
    body: { mediaType: 'image/png' },
  })
  const ticket = assetTicket.body as { assetId?: string; uploadUrl?: string; mediaType?: string }
  if (ticket?.uploadUrl && ticket.assetId) {
    const put = await putBytes(ticket.uploadUrl, onePixelPng(), ticket.mediaType ?? 'image/png')
    captures.push({
      title: 'PUT a 1×1 PNG to the media presigned url (from Node)',
      method: 'PUT',
      path: '(presigned storage url — not our API)',
      status: put.status,
      note: 'the reference-image door; the browser path additionally needs S3 CORS',
      body: put.body,
    })
    finding(`Media presigned PUT from Node: ${put.status}.`)
    await call('media/assets/:id/presign — download url', 'POST', studio(`/media/assets/${ticket.assetId}/presign`))
    await call('media/assets/:id — DELETE', 'DELETE', studio(`/media/assets/${ticket.assetId}`), {
      note: 'expected 204',
    })
  }
  await call('media/jobs — list (empty or prior jobs, no presigned urls)', 'GET', studio('/media/jobs'))

  if (WITH_MEDIA) {
    log('\n--- media render (LIVE_MEDIA=1 — this one costs money) ---')
    const job = await call('media/jobs — media.generate, balanced, 1:1 png', 'POST', studio('/media/jobs'), {
      body: {
        capability: 'media.generate',
        plan: 'balanced',
        kind: 'image',
        prompt:
          'a minimal flat-vector graphic of coffee beans arranged in a single clean row on a warm ivory field, generous negative space, crisp geometry, no text',
        params: { aspectRatio: '1:1', outputFormat: 'png' },
        origin: { kind: 'standalone' },
      },
      note: 'never send modelAlias — it is refused by name',
    })
    const jobId = (job.body as { jobId?: string })?.jobId
    if (jobId) {
      const finished = await pollJob(studio, jobId)
      const assets = (finished as { assets?: { assetId: string }[] })?.assets ?? []
      finding(`Render produced ${assets.length} asset(s).`)
      for (const asset of assets.slice(0, 1)) {
        await call('media/assets/:id — DELETE a render output', 'DELETE', studio(`/media/assets/${asset.assetId}`))
      }
    }
  } else {
    log('\n(media render skipped — set LIVE_MEDIA=1 to spend on one)')
    findings.push('Media render NOT run this pass (LIVE_MEDIA unset) — the render shape is still unobserved.')
  }

  // --- Usage + the wallet again: what did all of that actually cost? -----
  log('\n--- usage + wallet (after) ---')
  const from = new Date(RUN - 29 * 86_400_000).toISOString().slice(0, 10)
  const to = new Date(RUN).toISOString().slice(0, 10)
  await call('usage — group_by=capability', 'GET', studio('/usage'), {
    query: { from, to, group_by: 'capability' },
  })
  await call('usage — group_by=model', 'GET', studio('/usage'), {
    query: { from, to, group_by: 'model' },
  })
  await call('usage — malformed window (expect 400)', 'GET', studio('/usage'), {
    query: { from: 'yesterday', to, group_by: 'model' },
    note: 'local validation, never reaches the upstream',
  })
  const walletAfter = await call('wallet — after the run', 'GET', studio('/wallet'))
  const after = walletAfter.body as { cents?: number; availableCents?: number } | undefined
  if (typeof before?.cents === 'number' && typeof after?.cents === 'number') {
    finding(
      `Wallet: ${before.cents} → ${after.cents} cents (available ${before.availableCents} → ${after.availableCents}). Spend this pass: ${before.cents - after.cents} cents.`,
    )
  }

  // --- Holidays, so INT-8 has a real shape to build against. ------------
  log('\n--- org country + holidays ---')
  if (putCountry.methodAllowed) {
    await call('PUT /orgs/:id/country — JO (slow: loads the calendar)', 'PUT', org('/country'), {
      body: { country: 'JO' },
      note: 'expect ~10 s',
    })
    await call('PUT /orgs/:id/country — same country again', 'PUT', org('/country'), {
      body: { country: 'jo' },
      note: 'expect reloaded:false, a cheap no-op',
    })
    await call('GET /orgs/:id/holidays — calendar order', 'GET', org('/holidays'), {
      query: { limit: 3 },
    })
  } else {
    findings.push(
      'PUT is not allowed by the Function URL CORS policy — the country surface is UNBUILDABLE from a browser. Logged as an infra question; INT-8 stops at that gate.',
    )
    log('  (skipped: a browser cannot make this call)')
  }

  await writeReport()
  log(`\nwrote ${REPORT_PATH}`)
}

function extensionFor(mediaType: string): string {
  if (mediaType === 'application/pdf') return 'pdf'
  if (mediaType === 'text/plain') return 'txt'
  if (mediaType === 'text/markdown') return 'md'
  return 'docx'
}

/** A valid 1×1 transparent PNG — the smallest thing that proves a real upload. */
function onePixelPng(): Uint8Array<ArrayBuffer> {
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function putBytes(url: string, bytes: Uint8Array<ArrayBuffer>, mediaType: string) {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      // Exactly the media type the presign was issued for — it is part of the
      // signature, so a mismatch is a rejected upload, not a mislabelled file.
      headers: { 'content-type': mediaType },
      body: new Blob([bytes]),
    })
    const text = await response.text()
    return { status: response.status, body: text ? text.slice(0, 400) : undefined }
  } catch (cause) {
    return { status: 0, body: String(cause) }
  }
}

// --- Pollers. Each records only its terminal read, so the report stays the
// --- shapes and not a transcript of "queued" fifteen times over.

async function pollRun(studio: (path: string) => string, runId: string): Promise<unknown> {
  const delays = [1500, 3000, 5000, 5000, 8000, 8000, 10_000, 10_000, 15_000, 20_000]
  let last: unknown
  let status = ''
  for (const delay of delays) {
    await sleep(delay)
    const response = await fetch(`${BASE}${studio(`/posts/runs/${runId}`)}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
    })
    last = safeJson(await response.text())
    status = (last as { status?: string })?.status ?? String(response.status)
    log(`  poll run ${runId} → ${status}`)
    if (status === 'completed' || status === 'failed') break
  }
  captures.push({
    title: `posts/runs/:runId — terminal read (${status})`,
    method: 'GET',
    path: studio(`/posts/runs/${runId}`),
    status: 200,
    note: 'THE draft output shape — what INT-10 renders from',
    body: last,
  })
  return last
}

async function pollSource(studio: (path: string) => string, sourceId: string): Promise<unknown> {
  const delays = [1500, 3000, 5000, 8000, 10_000, 15_000]
  let last: unknown
  let status = ''
  for (const delay of delays) {
    await sleep(delay)
    const response = await fetch(`${BASE}${studio(`/rag/sources/${sourceId}`)}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
    })
    last = safeJson(await response.text())
    status = (last as { status?: string })?.status ?? String(response.status)
    log(`  poll source ${sourceId} → ${status}`)
    if (status === 'Ready' || status === 'Failed') break
  }
  captures.push({
    title: `rag/sources/:sourceId — terminal read (${status})`,
    method: 'GET',
    path: studio(`/rag/sources/${sourceId}`),
    status: 200,
    body: last,
  })
  return last
}

async function pollJob(studio: (path: string) => string, jobId: string): Promise<unknown> {
  const delays = [2000, 5000, 10_000, 10_000, 15_000, 20_000, 30_000, 30_000]
  let last: unknown
  let status = ''
  for (const delay of delays) {
    await sleep(delay)
    const response = await fetch(`${BASE}${studio(`/media/jobs/${jobId}`)}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
    })
    last = safeJson(await response.text())
    status = (last as { status?: string })?.status ?? String(response.status)
    log(`  poll job ${jobId} → ${status}`)
    if (/succeed|complet|fail|cancel/i.test(status)) break
  }
  captures.push({
    title: `media/jobs/:jobId — terminal read (${status})`,
    method: 'GET',
    path: studio(`/media/jobs/${jobId}`),
    status: 200,
    note: 'the render shape, assets with 1-hour presigned urls',
    body: last,
  })
  return last
}

// ---------------------------------------------------------------------------
// The report — the actual deliverable
// ---------------------------------------------------------------------------

/**
 * Two things must not land in a committed file: the session token, and any
 * presigned url (each carries its own signature). Everything else is verbatim,
 * because a shortened shape is a guess again — attribution urls in particular
 * are exactly what INT-10 has to render, so an ordinary url survives.
 */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = typeof inner === 'string' && isSecret(key, inner)
        ? `<redacted ${key}: ${inner.length} chars>`
        : redact(inner)
    }
    return out
  }
  return value
}

function isSecret(key: string, value: string): boolean {
  if (/^token$/i.test(key)) return true
  // A presigned url, whatever the field is called.
  return /[?&](x-amz-signature|signature|sig)=/i.test(value)
}

async function writeReport() {
  const lines: string[] = []
  lines.push('# AlphaStudio proxy shapes — observed, not guessed')
  lines.push('')
  lines.push(
    'Captured by `pnpm tsx scripts/smoke-alphastudio.ts` against the deployed API.',
    'The `/alphastudio/*` namespace forwards the external service\'s response shape',
    'unchanged and the contract says new fields may appear without notice, so',
    '`src/api/types.ts` is transcribed from THIS file rather than from prose',
    '(decisions.md D-INT-H). Re-run the script when the upstream changes.',
  )
  lines.push('')
  lines.push(`- Run: \`${new Date(RUN).toISOString()}\``)
  lines.push(`- Identity: \`${EMAIL}\` (fresh QA org, starter funding only)`)
  lines.push(`- Media render included: ${WITH_MEDIA ? 'yes (LIVE_MEDIA=1)' : 'no'}`)
  lines.push('')
  lines.push('Session tokens and presigned urls are redacted; every other field is verbatim.')
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
    lines.push(`\`${capture.method} ${capture.path}\` → **${capture.status}**`)
    if (capture.note) lines.push(`> ${capture.note}`)
    lines.push('')
    if (capture.headers) {
      lines.push('```')
      for (const [name, value] of Object.entries(capture.headers)) lines.push(`${name}: ${value}`)
      lines.push('```')
      lines.push('')
    }
    if (capture.body !== undefined) {
      lines.push('```json')
      lines.push(JSON.stringify(redact(capture.body), null, 2))
      lines.push('```')
      lines.push('')
    }
  }
  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8')
}

main().catch(async (cause) => {
  console.error('smoke-alphastudio: failed —', cause)
  findings.push(`RUN ABORTED: ${String(cause)}`)
  await writeReport()
  process.exit(1)
})
