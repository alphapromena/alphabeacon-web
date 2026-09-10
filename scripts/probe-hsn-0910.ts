// probe-hsn-0910: ORDER HSN-0910 Phase 0 — the 13 media capabilities of Hasan's
// document (Docs/api/media-capabilities.md), the approve door, State under
// Country and the environment facts, measured on ONE fresh QA org against the
// DEPLOYED sandbox API at ZERO spend. Report-and-stop follows; nothing is built
// on what this measures until the founder answers.
//
//   §3.1  the catalog for each of the 13 (granted 200 vs 404; `selectable`,
//         `field`, `models[]` and the price rows); `voice.speak` also read per
//         plan (the approved voice list is a catalog fact, Hasan says); the
//         three own-model capabilities (avatar / film / motion) confirmed.
//   §3.2  ONE valid minimal body per capability, exactly the document's example
//         with our own read-presigned urls / asset ids where a url or an id is
//         required → 402 expected. THE SHIELD: the wallet must read 0 first,
//         and every body is sent ONLY because it did (an invalid body answers
//         400 BEFORE the wallet check; a valid one answers 402 AT it).
//   §3.3  one trap per capability from the document's own refusals → 400
//         expected BEFORE the wallet; item 49 stands, so each 400 is read for
//         whether it names the field now.
//   §3.4  the job envelope for a multi-asset output — READ ONLY on the funded
//         QA org (org 1813's owner from the QA-creds store), never a POST there.
//   §3.5  `POST …/media/assets/:id/approve` on an asset we own — proxied or 404.
//   §3.7  State under Country: the countries list (does a row carry states?),
//         `PUT /orgs/:id/country {country:"US", state:"CA"}`, the event-source
//         body with `state`, the holiday rows' shape, and a read-only sweep of
//         plausible state-list paths.
//   §3.8  environment facts: `/health` and `/openapi` (an environment name?),
//         the org root's keys, and which deployment carries the API base
//         inlined (malaky.ai = the apex, 1.malaky.ai = the `live` preview,
//         alphabeacon-web.vercel.app = the project's production alias).
//
// Everything is recorded verbatim with request-ids: the raw JSON per exchange
// under Docs/qa/hsn-0910/phase0/ (the durable copy — `pnpm smoke:alphastudio`
// overwrites alphastudio-shapes.md wholesale, and test-results/ is cleaned by
// every Playwright run, trap 24) and a dated section APPENDED to
// Docs/api/alphastudio-shapes.md. Presigned urls, the API base and every token
// are redacted to their shape; the funded owner's password is read and never
// written anywhere.
//
// Run (PowerShell or Git Bash):  pnpm probe:hsn-0910
//   pnpm probe:hsn-0910 -- --render
//       re-renders findings.md and the shapes-doc section from the raw record
//       (captures.json + summary.json) without touching the wire.
//   pnpm probe:hsn-0910 -- --motion-supplement --owner <qa+…@alphapromena.com>
//       the motion.generate ladder alone, on an EXISTING zero-wallet QA org of
//       that owner (no new org — the dev tenant is crowded enough, Hasan says),
//       recorded under phase0/supplement-motion/ and appended as a sub-section.
//   LIVE_MEDIA=1 pnpm probe:hsn-0910 -- --funded-proofs [--image <png>]
//       §3.6 on the FUNDED QA org, the founder's word (2026-09-10): three PAID
//       renders — logos.generate balanced ×1, voice.speak balanced one unit,
//       images.edit with OUR read-presigned url (the A3 proof) — the wallet
//       before and after, every receipt and terminal envelope, and what each
//       output url answers when fetched. Recorded under phase0/funded/ and
//       appended as a sub-section. Refuses to run without LIVE_MEDIA=1.
// The base URL is read from the environment, falling back to .env.local. A Node
// script outside src/, outside the network law by design; it calls OUR API with
// the normal Bearer, PUTs five tiny files to the presigned storage urls our API
// minted, and GETs three public deployments' entry bundles (no auth, no state).

import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const SHAPES_PATH = join(root, 'Docs', 'api', 'alphastudio-shapes.md')
const RECORD_DIR = join(root, 'Docs', 'qa', 'hsn-0910', 'phase0')
/** Where raw files go — the main record, or its supplement sub-folder. */
let recordDir = RECORD_DIR
/** The run a record describes — this run, or the loaded one under `--render`. */
let recordStamp = ''
let recordOwner = ''

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
  console.error('probe-hsn-0910: no VITE_API_BASE_URL (set it, or put it in .env.local).')
  process.exit(1)
}

const BASE = resolveBaseUrl()
const API_HOST = new URL(BASE).host
const RUN = Date.now()
const STAMP = new Date(RUN).toISOString()
const OWNER_EMAIL = `qa+${RUN}hsn0910@alphapromena.com`
recordStamp = STAMP
recordOwner = OWNER_EMAIL
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const ORG_NAME = `QA HSN-0910 Org ${RUN}`
/**
 * The deployments the order asks about (§3.8): the apex (meant to be `main`),
 * `1.` (the `live` preview) and the project's own production alias — the last
 * because `*.vercel.app` can be unreachable from some networks, and the record
 * should say so rather than guess.
 */
const DEPLOYMENTS = [
  'https://malaky.ai',
  'https://1.malaky.ai',
  'https://alphabeacon-web.vercel.app',
] as const
/** The QA-creds store (stack.md): User-scope env vars on this machine, never committed. */
const FUNDED_EMAIL_VAR = 'QA_FUNDED_EMAIL'
const FUNDED_PASSWORD_VAR = 'QA_FUNDED_PASSWORD'

/** Hasan's 13, in the document's order. `social-posts.media` is NOT one of them (A1). */
const CAPABILITIES = [
  'media.generate',
  'images.edit',
  'photoshoot.generate',
  'brand-assets.generate',
  'logos.generate',
  'logos.redesign',
  'avatars.generate',
  'avatars.imagine',
  'avatar.generate',
  'video-ads.generate',
  'voice.speak',
  'film.generate',
  'motion.generate',
] as const
type Capability = (typeof CAPABILITIES)[number]
const PLANS = ['balanced', 'creative', 'precise'] as const

// ---------------------------------------------------------------------------
// Capture + call
// ---------------------------------------------------------------------------

type Section =
  | 'setup'
  | 'environment'
  | 'catalog'
  | 'approve'
  | 'valid'
  | 'trap'
  | 'after'
  | 'state'
  | 'multi-asset'
  | 'cleanup'
  | 'funded'

interface Capture {
  seq: number
  section: Section
  title: string
  method: string
  path: string
  status: number
  ms: number
  requestId?: string
  note?: string
  request?: unknown
  response?: unknown
  headers?: Record<string, string>
  /** Where the raw copy of this exchange lives under RECORD_DIR, when it has one. */
  file?: string
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

/**
 * Every http(s) string that is not a public schema id is redacted to its
 * shape: presigned storage urls carry signatures, and the API base is never
 * committed (the guard's http-literal ban is about source, but the record is
 * public too — the repo is PUBLIC, state.md 2026-09-03).
 */
function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value) && !/^https:\/\/json-schema\.org\//i.test(value)) {
      return `<redacted url: ${value.length} chars>`
    }
    return value
  }
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, redact(entry)]),
    )
  }
  return value
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { unparseable: text.slice(0, 400) }
  }
}

interface CallOptions {
  body?: unknown
  /** Not captured at all — the auth calls, whose bodies carry a password or a token. */
  quiet?: boolean
  note?: string
  section?: Section
  /** Send with THIS token instead of the fresh owner's (the funded org's read-only walk). */
  tokenOverride?: string | null
  /** Send with no Authorization at all. */
  anonymous?: boolean
  /** Record these response headers (names lower-cased). */
  recordHeaders?: boolean
  /** Name of the raw file to write under RECORD_DIR (without .json). */
  file?: string
  /** Absolute url instead of BASE + path (the deployment sniff). */
  absolute?: boolean
  /** Read the body as text and record only the first N characters. */
  textOnly?: number
}

interface Answer {
  status: number
  body: unknown
  requestId?: string
  ms: number
  headers: Record<string, string>
  text?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let seq = 0

async function call(
  title: string,
  method: string,
  path: string,
  options: CallOptions = {},
): Promise<Answer> {
  const headers: Record<string, string> = { accept: 'application/json' }
  const bearer = options.anonymous ? null : (options.tokenOverride ?? token)
  if (bearer) headers.authorization = `Bearer ${bearer}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  const url = options.absolute ? path : `${BASE}${path}`
  const started = Date.now()
  let status = 0
  let body: unknown
  let text: string | undefined
  let requestId: string | undefined
  const responseHeaders: Record<string, string> = {}
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(90_000),
    })
    status = response.status
    requestId = response.headers.get('x-request-id') ?? undefined
    response.headers.forEach((value, name) => {
      if (name === 'set-cookie' || name === 'authorization') return
      responseHeaders[name] = value
    })
    const raw = await response.text()
    if (options.textOnly !== undefined) {
      text = raw
      body = { textPreview: raw.slice(0, options.textOnly), length: raw.length }
    } else {
      body = raw ? safeJson(raw) : undefined
    }
    if (!requestId && body && typeof body === 'object' && 'error' in body) {
      requestId = (body as { error?: { requestId?: string } }).error?.requestId
    }
  } catch (cause) {
    body = { transportError: String(cause) }
  }
  const ms = Date.now() - started

  // A rate limit is not an answer about the body: honour Retry-After once.
  if (status === 429 && !options.quiet) {
    const retryAfter = Number(responseHeaders['retry-after'] ?? '5')
    const wait = Math.min(Number.isFinite(retryAfter) ? retryAfter : 5, 60) * 1000
    log(
      `${method} ${path} → 429 (request-id ${requestId ?? 'none'}) — waiting ${wait / 1000}s once`,
    )
    captures.push({
      seq: (seq += 1),
      section: options.section ?? 'setup',
      title: `${title} — 429, retried once after ${wait / 1000}s`,
      method,
      path: displayPath(path, options.absolute),
      status,
      ms,
      requestId,
      request: redact(options.body),
      response: redact(body),
    })
    await sleep(wait)
    return call(title, method, path, options)
  }

  if (!options.quiet) {
    const capture: Capture = {
      seq: (seq += 1),
      section: options.section ?? 'setup',
      title,
      method,
      path: displayPath(path, options.absolute),
      status,
      ms,
      requestId,
      note: options.note,
    }
    if (options.body !== undefined) capture.request = redact(options.body)
    if (body !== undefined) capture.response = redact(body)
    if (options.recordHeaders) capture.headers = responseHeaders
    if (options.file) {
      capture.file = `${options.file}.json`
      writeRaw(options.file, {
        title,
        method,
        path: capture.path,
        status,
        ms,
        requestId,
        note: options.note,
        request: capture.request,
        response: capture.response,
        headers: capture.headers,
      })
    }
    captures.push(capture)
  }
  log(
    `${method} ${displayPath(path, options.absolute)} → ${status} (request-id ${requestId ?? 'none'}, ${ms} ms)`,
  )
  return { status, body, requestId, ms, headers: responseHeaders, text }
}

/** The org id out of a recorded path, so the record reads `/orgs/:id/…`. */
let orgIdForDisplay: string | null = null
function displayPath(path: string, absolute?: boolean): string {
  if (absolute) return String(redact(path))
  return orgIdForDisplay ? path.replace(`/orgs/${orgIdForDisplay}`, '/orgs/:id') : path
}

function writeRaw(name: string, data: unknown) {
  const target = join(recordDir, `${name}.json`)
  mkdirSync(join(target, '..'), { recursive: true })
  writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

const errorCode = (body: unknown) =>
  (body as { error?: { code?: string } } | undefined)?.error?.code ?? '(no envelope)'
const errorMessage = (body: unknown) =>
  (body as { error?: { message?: string } } | undefined)?.error?.message ?? ''
const errorDetails = (body: unknown) =>
  (body as { error?: { details?: unknown } } | undefined)?.error?.details

/** Does a 400 name the field it refused? Item 49 asked for exactly this. */
function namesField(body: unknown, field: string): 'details' | 'message' | 'no' {
  const details = errorDetails(body)
  if (Array.isArray(details) && details.length > 0) return 'details'
  if (errorMessage(body).toLowerCase().includes(field.toLowerCase())) return 'message'
  return 'no'
}

/** Reads a User-scope env var on this machine when the process did not inherit it. */
function userScopeEnv(name: string): string | undefined {
  const inherited = process.env[name]?.trim()
  if (inherited) return inherited
  if (process.platform !== 'win32') return undefined
  try {
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `[Environment]::GetEnvironmentVariable('${name}','User')`],
      { encoding: 'utf8' },
    ).trim()
    return out || undefined
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Bytes: a 1×1 PNG and a 3-second MP4 (ffmpeg when present, a stub otherwise)
// ---------------------------------------------------------------------------

function toBytes(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(input.byteLength))
  out.set(input)
  return out
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

/**
 * A solid PNG of the given side when ffmpeg is on the machine — the document
 * puts a 340 px floor on the motion still, so the example is sent with one
 * that honours it — else the 1×1 stands in and the record says the floor was
 * NOT honoured.
 */
function solidPng(size: number): { bytes: Uint8Array<ArrayBuffer>; source: string } {
  const target = join(tmpdir(), `hsn-0910-still-${size}-${RUN}.png`)
  try {
    execFileSync(
      'ffmpeg',
      [
        '-loglevel',
        'error',
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=navy:s=${size}x${size}`,
        '-frames:v',
        '1',
        '-update',
        '1',
        target,
      ],
      { stdio: 'ignore' },
    )
    const bytes = toBytes(readFileSync(target))
    return {
      bytes,
      source: `ffmpeg lavfi colour source, ${size}×${size}, ${bytes.byteLength} bytes`,
    }
  } catch {
    return {
      bytes: onePixelPng(),
      source: `ffmpeg not found — the 1×1 PNG stands in (the ${size} px floor NOT honoured)`,
    }
  }
}

/**
 * A real 64×64 MP4 of the given length when ffmpeg is on the machine (so a door
 * that fetches the motion source finds a playable clip of a known length), else
 * a 24-byte `ftyp` stub — the zero-wallet probe only validates the BODY either
 * way, and the record says which it was.
 */
function tinyMp4(seconds: number): { bytes: Uint8Array<ArrayBuffer>; source: string } {
  const target = join(tmpdir(), `hsn-0910-motion-${seconds}s-${RUN}.mp4`)
  try {
    execFileSync(
      'ffmpeg',
      [
        '-loglevel',
        'error',
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=navy:s=64x64:d=${seconds}:r=10`,
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        target,
      ],
      { stdio: 'ignore' },
    )
    const bytes = toBytes(readFileSync(target))
    return {
      bytes,
      source: `ffmpeg lavfi colour source, ${seconds} s, 64×64, ${bytes.byteLength} bytes`,
    }
  } catch {
    const stub = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02,
      0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    ])
    return {
      bytes: toBytes(stub),
      source: 'ffmpeg not found — a 24-byte ftyp stub, not a playable clip',
    }
  }
}

async function putBytes(url: string, bytes: Uint8Array<ArrayBuffer>, mediaType: string) {
  const started = Date.now()
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': mediaType },
      body: new Blob([bytes]),
      signal: AbortSignal.timeout(90_000),
    })
    const text = await response.text()
    return {
      status: response.status,
      body: text ? text.slice(0, 400) : undefined,
      ms: Date.now() - started,
    }
  } catch (cause) {
    return { status: 0, body: String(cause), ms: Date.now() - started }
  }
}

interface UploadedAsset {
  assetId: string
  mediaType: string
}

/** presign → PUT (from Node) → the asset id; the row exists from presign time. */
async function uploadAsset(
  studio: (path: string) => string,
  uploaded: UploadedAsset[],
  label: string,
  mediaType: string,
  bytes: Uint8Array<ArrayBuffer>,
  desc: string,
): Promise<string | null> {
  const presign = await call(
    `asset ${label} · media/assets/presign — ${mediaType}`,
    'POST',
    studio('/media/assets/presign'),
    { body: { mediaType, desc }, file: `setup/presign-${label}` },
  )
  const ticket = presign.body as { assetId?: string; uploadUrl?: string; mediaType?: string }
  if (!ticket.assetId || !ticket.uploadUrl) {
    finding(
      `asset ${label}: presign answered ${presign.status} code=${errorCode(presign.body)} — no asset.`,
    )
    return null
  }
  const put = await putBytes(ticket.uploadUrl, bytes, ticket.mediaType ?? mediaType)
  captures.push({
    seq: (seq += 1),
    section: 'setup',
    title: `asset ${label} · PUT ${bytes.byteLength} bytes to the presigned url (from Node)`,
    method: 'PUT',
    path: '(presigned storage url — not our API)',
    status: put.status,
    ms: put.ms,
    response: put.body,
  })
  log(`PUT (storage, ${label}) → ${put.status} (${put.ms} ms)`)
  uploaded.push({ assetId: ticket.assetId, mediaType: ticket.mediaType ?? mediaType })
  finding(
    `asset ${label} (${mediaType}): presign ${presign.status} → ${ticket.assetId}; PUT ${put.status}.`,
  )
  return ticket.assetId
}

interface MotionAssets {
  /** A 1×1 still — under the document's 340 px floor. */
  tiny: string
  /** A 512 px still — inside it. */
  still: string
  /** A 3.0 s clip — at the document's 3 s floor. */
  short: string
  /** A 5 s clip — inside 3–30 s. */
  clip: string
}

/**
 * The motion ladder, zero cost: which of the document's constraints the door
 * checks BEFORE the wallet — the still's size, the clip's length and each
 * optional key — ONE variable per rung. Run 2 (org 1824) showed why: a rung
 * that also carried `lang: "ar"` said nothing else, because that key alone is
 * refused.
 */
function motionRungs(assets: MotionAssets): { name: string; body: unknown; note: string }[] {
  const motion = (image: string, video: string, extra: Record<string, unknown> = {}) => ({
    capability: 'motion.generate',
    plan: 'balanced',
    image,
    video,
    orientation: 'image',
    ...extra,
  })
  const prompt = 'she keeps her warm, natural delivery; soft office light'
  return [
    {
      name: 'ladder-required-keys-only',
      body: motion(assets.still, assets.clip),
      note: 'only capability, plan, image, video, orientation — the 512 px still and the 5 s clip; the control',
    },
    {
      name: 'ladder-1x1-still-5s-clip',
      body: motion(assets.tiny, assets.clip),
      note: 'required keys; the 1×1 still (under the 340 px floor) and the 5 s clip',
    },
    {
      name: 'ladder-512-still-3s-clip',
      body: motion(assets.still, assets.short),
      note: 'required keys; the 512 px still and the 3.0 s clip (at the 3 s floor)',
    },
    {
      name: 'ladder-1x1-still-3s-clip',
      body: motion(assets.tiny, assets.short),
      note: 'required keys; run 1’s pair (org 1823): the 1×1 still and the 3.0 s clip',
    },
    {
      name: 'ladder-orientation-video',
      body: { ...motion(assets.still, assets.clip), orientation: 'video' },
      note: 'required keys with orientation "video"',
    },
    {
      name: 'ladder-plus-keepSound-prompt',
      body: motion(assets.still, assets.clip, { keepSound: true, prompt }),
      note: 'required keys plus keepSound true and prompt',
    },
    {
      name: 'ladder-plus-keepSound-false',
      body: motion(assets.still, assets.clip, { keepSound: false }),
      note: 'required keys plus keepSound false',
    },
    {
      name: 'ladder-plus-lang-en',
      body: motion(assets.still, assets.clip, { lang: 'en' }),
      note: 'required keys plus lang "en" — is the key refused, or only "ar"?',
    },
    {
      name: 'ladder-plus-lang-ar',
      body: motion(assets.still, assets.clip, { lang: 'ar' }),
      note: 'required keys plus lang "ar" — the document’s own value (refused in run 2)',
    },
  ]
}

// ---------------------------------------------------------------------------
// Summary rows (the report table)
// ---------------------------------------------------------------------------

interface ModelRow {
  alias?: string
  kind?: string
  plan?: string | null
  /** Unit → decimal string, or a nested table (film's `video_seconds_by_resolution`). */
  cost?: Record<string, unknown>
  schemaKeys?: string[]
}
/** One `?plan=` read: which row(s) that grade resolves to, with the price. */
interface PlanSummary {
  status: number
  requestId?: string
  echoedPlan?: unknown
  models: ModelRow[]
}
interface CatalogSummary {
  status: number
  requestId?: string
  selectable?: boolean
  field?: string | null
  models?: ModelRow[]
  plans?: Record<string, PlanSummary>
  note?: string
}
interface BodySummary {
  name: string
  status: number
  code: string
  requestId?: string
  message?: string
  namesField?: 'details' | 'message' | 'no'
  note?: string
}
interface CapabilityRow {
  capability: Capability
  catalog: CatalogSummary
  valid: BodySummary[]
  traps: BodySummary[]
}

const rows: Record<Capability, CapabilityRow> = Object.fromEntries(
  CAPABILITIES.map((capability) => [
    capability,
    { capability, catalog: { status: 0 }, valid: [], traps: [] },
  ]),
) as unknown as Record<Capability, CapabilityRow>

function summariseCatalog(status: number, body: unknown, requestId?: string): CatalogSummary {
  if (status !== 200) return { status, requestId, note: errorCode(body) }
  const catalog = body as {
    selectable?: boolean
    field?: string | null
    models?: {
      alias?: string
      kind?: string
      plan?: string | null
      cost?: Record<string, unknown>
      capabilitySchema?: { properties?: Record<string, unknown> }
    }[]
  }
  return {
    status,
    requestId,
    selectable: catalog.selectable,
    field: catalog.field,
    models: (catalog.models ?? []).map((model) => ({
      alias: model.alias,
      kind: model.kind,
      plan: model.plan,
      cost: model.cost,
      schemaKeys: Object.keys(model.capabilitySchema?.properties ?? {}),
    })),
  }
}

function summariseBody(name: string, answer: Answer, field?: string): BodySummary {
  return {
    name,
    status: answer.status,
    code: errorCode(answer.body),
    requestId: answer.requestId,
    message: errorMessage(answer.body) || undefined,
    namesField: field ? namesField(answer.body, field) : undefined,
  }
}

// ---------------------------------------------------------------------------

async function main() {
  log(`\n=== probe-hsn-0910 · ${STAMP} ===`)
  log(`owner: ${OWNER_EMAIL}\n`)
  mkdirSync(RECORD_DIR, { recursive: true })

  // ==========================================================================
  // §3.8 (part 1) — the environment facts that need no session
  // ==========================================================================
  log('--- §3.8 · /health and /openapi (anonymous) ---')
  const health = await call(
    '§3.8 · GET /health — the liveness body and its headers',
    'GET',
    '/health',
    {
      anonymous: true,
      recordHeaders: true,
      section: 'environment',
      file: 'environment/health',
    },
  )
  finding(
    `§3.8 /health: ${health.status} ${JSON.stringify(health.body)}; header names [${Object.keys(health.headers).join(', ')}].`,
  )
  const openapi = await call(
    '§3.8 · GET /openapi — top-level keys, info, servers',
    'GET',
    '/openapi',
    {
      anonymous: true,
      section: 'environment',
      textOnly: 0,
    },
  )
  {
    const doc = openapi.text ? (safeJson(openapi.text) as Record<string, unknown>) : {}
    const info = doc.info
    const servers = doc.servers
    const envLike = Object.keys(doc).filter((key) => /env|stage|deploy/i.test(key))
    const summary = {
      status: openapi.status,
      requestId: openapi.requestId,
      keys: Object.keys(doc),
      info,
      servers,
      envLikeKeys: envLike,
    }
    writeRaw('environment/openapi', redact(summary))
    const last = captures[captures.length - 1]
    if (last) {
      last.response = redact(summary)
      last.file = 'environment/openapi.json'
    }
    finding(
      `§3.8 /openapi: ${openapi.status}; info=${JSON.stringify(info)}; servers=${JSON.stringify(redact(servers))}; environment-like top-level keys: ${envLike.length ? envLike.join(', ') : 'none'}.`,
    )
  }

  log('\n--- §3.8 · which deployment carries the API base inlined ---')
  for (const origin of DEPLOYMENTS) {
    const page = await call(`§3.8 · GET ${origin}/ — the entry html`, 'GET', `${origin}/`, {
      anonymous: true,
      absolute: true,
      section: 'environment',
      textOnly: 0,
      recordHeaders: true,
    })
    const htmlCapture = captures[captures.length - 1]
    const html = page.text ?? ''
    // Every Vite bundle the html names, and — when there is none — whose
    // scripts it loads instead (a site-builder page is not this project).
    const bundles = Array.from(
      new Set(Array.from(html.matchAll(/\/assets\/([A-Za-z0-9_.-]+\.js)/g)).map((m) => m[1])),
    )
    const scriptHosts = Array.from(
      new Set(
        Array.from(html.matchAll(/<script[^>]+src="(?:https?:)?\/\/([^/"]+)/g)).map((m) => m[1]),
      ),
    )
    let mode =
      page.status === 0
        ? 'UNREACHABLE from this host (transport error — not measured here)'
        : bundles.length
          ? 'unknown'
          : `NOT A VITE BUILD — no /assets/*.js; script hosts [${scriptHosts.join(', ') || 'none'}]`
    let carrier: string | null = null
    for (const bundle of bundles) {
      const script = await call(
        `§3.8 · GET ${origin}/assets/${bundle} — a bundle`,
        'GET',
        `${origin}/assets/${bundle}`,
        { anonymous: true, absolute: true, section: 'environment', textOnly: 0 },
      )
      if (script.text?.includes(API_HOST)) {
        carrier = bundle
        break
      }
    }
    if (bundles.length) {
      mode = carrier
        ? `LIVE (the API host is inlined in ${carrier})`
        : `STATIC (no API host in ${bundles.length} bundle(s))`
    }
    const record = {
      origin,
      htmlStatus: page.status,
      bundles,
      scriptHosts,
      mode,
      vercelId: page.headers['x-vercel-id'],
      cacheHeader: page.headers['x-vercel-cache'],
      transport: page.status === 0 ? page.body : undefined,
    }
    if (htmlCapture) htmlCapture.response = redact(record)
    writeRaw(
      `environment/deployment-${origin.replace(/^https:\/\//, '').replace(/\./g, '-')}`,
      redact(record),
    )
    finding(
      `§3.8 ${origin}: html ${page.status}; bundles [${bundles.join(', ') || 'none'}]; ${mode}.`,
    )
  }

  // ==========================================================================
  // The owner and the fresh QA org
  // ==========================================================================
  log('\n--- owner identity + org ---')
  await call('signup (owner)', 'POST', '/auth/signup', {
    body: { name: 'QA HSN-0910 Owner', email: OWNER_EMAIL, password: PASSWORD },
    quiet: true,
  })
  const verified = await call('verify-email (owner)', 'POST', '/auth/verify-email', {
    body: { email: OWNER_EMAIL, code: CODE },
    quiet: true,
  })
  token = (verified.body as { token?: string })?.token ?? null
  if (!token) {
    log(`probe-hsn-0910: no owner token (verify answered ${verified.status}) — cannot continue.`)
    writeRecords(null)
    process.exit(1)
  }
  const created = await call('create org', 'POST', '/orgs', {
    body: { name: ORG_NAME },
    note: 'the fresh QA org every probe below runs on',
    file: 'setup/create-org',
  })
  const orgId = (created.body as { org?: { id?: string } })?.org?.id
  if (!orgId) {
    log('probe-hsn-0910: no org id — cannot continue.')
    writeRecords(null)
    process.exit(1)
  }
  orgIdForDisplay = orgId
  const orgKeys = Object.keys(((created.body as { org?: object })?.org ?? {}) as object)
  finding(`Fresh QA org: id ${orgId} ("${ORG_NAME}"); org record keys [${orgKeys.join(', ')}].`)
  const org = (path: string) => `/orgs/${orgId}${path}`
  const studio = (path: string) => org(`/alphastudio${path}`)

  const root0 = await call(
    '§3.8 · GET /orgs/:id — the org root (an environment name anywhere?)',
    'GET',
    org(''),
    {
      section: 'environment',
      file: 'environment/org-root',
    },
  )
  {
    const record = (root0.body ?? {}) as Record<string, unknown>
    const orgRecord = (record.org ?? {}) as Record<string, unknown>
    finding(
      `§3.8 org root keys [${Object.keys(record).join(', ')}]; org keys [${Object.keys(orgRecord).join(', ')}] — ${Object.keys(orgRecord).some((key) => /env|stage/i.test(key)) ? 'an environment-like key IS present' : 'no environment-like key'}.`,
    )
  }

  const wallet0 = await call('wallet — the fresh org (the 402 shield)', 'GET', studio('/wallet'), {
    file: 'setup/wallet-before',
  })
  const available = (wallet0.body as { availableCents?: number })?.availableCents
  finding(`Wallet on the fresh org: ${wallet0.status} ${JSON.stringify(wallet0.body)}.`)

  // --- Five of our own assets: two 1×1 PNGs (urls), a 512 px PNG and two MP4s
  // (ids) — the motion still and clip at the document's own floors. ---------
  log(
    '\n--- assets: two 1×1 PNGs, a 512 px PNG, a 3 s and a 5 s MP4 — presign → PUT → read-presign ---',
  )
  const uploaded: UploadedAsset[] = []
  const upload = (label: string, mediaType: string, bytes: Uint8Array<ArrayBuffer>, desc: string) =>
    uploadAsset(studio, uploaded, label, mediaType, bytes, desc)
  async function readUrl(label: string, assetId: string) {
    const read = await call(
      `asset ${label} · media/assets/:id/presign — the read url`,
      'POST',
      studio(`/media/assets/${assetId}/presign`),
      {
        file: `setup/read-presign-${label}`,
      },
    )
    return (read.body as { url?: string })?.url ?? null
  }

  const png = onePixelPng()
  const assetA = await upload('A', 'image/png', png, 'HSN-0910 Phase 0 probe — reference image A')
  const assetB = await upload('B', 'image/png', png, 'HSN-0910 Phase 0 probe — reference image B')
  const mp4 = tinyMp4(3)
  finding(`3 s MP4 source: ${mp4.source}.`)
  const assetV = await upload(
    'V',
    'video/mp4',
    mp4.bytes,
    'HSN-0910 Phase 0 probe — a 3-second motion clip',
  )
  const bigPng = solidPng(512)
  finding(`512 px PNG source: ${bigPng.source}.`)
  const assetC = await upload(
    'C',
    'image/png',
    bigPng.bytes,
    'HSN-0910 Phase 0 probe — a 512×512 motion still (the document’s 340 px floor honoured)',
  )
  const mp4Long = tinyMp4(5)
  finding(`5 s MP4 source: ${mp4Long.source}.`)
  const assetW = await upload(
    'W',
    'video/mp4',
    mp4Long.bytes,
    'HSN-0910 Phase 0 probe — a 5-second motion clip (inside the document’s 3–30 s)',
  )
  const urlA = assetA ? await readUrl('A', assetA) : null
  const urlB = assetB ? await readUrl('B', assetB) : null
  finding(
    `Read urls: A ${urlA ? 'minted' : 'MISSING'}, B ${urlB ? 'minted' : 'MISSING'}; video assets V ${assetV ?? 'MISSING'}, W ${assetW ?? 'MISSING'}; still C ${assetC ?? 'MISSING'}.`,
  )

  // ==========================================================================
  // §3.1 — the catalog, all 13
  // ==========================================================================
  log('\n--- §3.1 · catalog ---')
  for (const capability of CAPABILITIES) {
    const answer = await call(
      `§3.1 · catalog — ${capability}`,
      'GET',
      studio(`/catalog/capabilities/${capability}`),
      {
        section: 'catalog',
        file: `catalog/${capability}`,
      },
    )
    const summary = summariseCatalog(answer.status, answer.body, answer.requestId)
    rows[capability].catalog = summary
    if (summary.status === 200) {
      finding(
        `§3.1 ${capability}: 200 · selectable=${String(summary.selectable)} · field=${JSON.stringify(summary.field)} · models: ${(
          summary.models ?? []
        )
          .map(
            (model) =>
              `${model.alias} [${model.plan}, ${model.kind}, cost ${JSON.stringify(model.cost ?? null)}]`,
          )
          .join(' · ')}.`,
      )
    } else {
      finding(
        `§3.1 ${capability}: ${summary.status} ${summary.note} — NOT GRANTED on this tenant (listed, not composed).`,
      )
    }
  }
  // Per-plan reads for every SELECTABLE capability: the plain read carries
  // `plan: null` on the own-model rows, so which alias (and price) a grade
  // resolves to is only visible through `?plan=`. For voice.speak the approved
  // voice list lives there too (Hasan: adding a voice is a catalog change).
  const voiceByPlan: Record<string, unknown> = {}
  for (const capability of CAPABILITIES) {
    if (rows[capability].catalog.status !== 200 || !rows[capability].catalog.selectable) continue
    const plans: Record<string, PlanSummary> = {}
    for (const plan of PLANS) {
      const answer = await call(
        `§3.1 · catalog — ${capability}?plan=${plan}`,
        'GET',
        studio(`/catalog/capabilities/${capability}?plan=${plan}`),
        { section: 'catalog', file: `catalog/${capability}.plan-${plan}` },
      )
      const models =
        (
          answer.body as {
            models?: {
              alias?: string
              kind?: string
              plan?: string | null
              cost?: Record<string, unknown>
              capabilitySchema?: { properties?: Record<string, unknown> }
              appMetadata?: unknown
            }[]
          }
        )?.models ?? []
      plans[plan] = {
        status: answer.status,
        requestId: answer.requestId,
        echoedPlan: (answer.body as { plan?: unknown })?.plan,
        models: models.map((model) => ({
          alias: model.alias,
          kind: model.kind,
          plan: model.plan,
          cost: model.cost,
        })),
      }
      if (capability === 'voice.speak') {
        const voice = models.map((model) => ({
          alias: model.alias,
          voice: model.capabilitySchema?.properties?.voice,
          lang: model.capabilitySchema?.properties?.lang,
          appMetadata: model.appMetadata,
        }))
        voiceByPlan[plan] = { status: answer.status, echoedPlan: plans[plan].echoedPlan, voice }
        finding(
          `§3.1 voice.speak?plan=${plan}: ${answer.status}; voice schema per model: ${JSON.stringify(voice)}.`,
        )
      }
    }
    rows[capability].catalog.plans = plans
    finding(
      `§3.1 ${capability} per plan: ${PLANS.map(
        (plan) =>
          `${plan} → ${
            (plans[plan]?.models ?? [])
              .map((model) => `${model.alias} ${JSON.stringify(model.cost ?? null)}`)
              .join(' | ') || `(${plans[plan]?.status})`
          }`,
      ).join(' · ')}.`,
    )
  }
  for (const capability of ['avatar.generate', 'film.generate', 'motion.generate'] as const) {
    const models = rows[capability].catalog.models ?? []
    const perPlan = rows[capability].catalog.plans ?? {}
    finding(
      `§3.1 ${capability} own models: ${models.length} row(s) on the plain read [${models.map((model) => `${model.alias}/${model.plan ?? 'plan null'}`).join(', ')}]; per plan ${PLANS.map((plan) => `${plan}=${(perPlan[plan]?.models ?? []).map((model) => model.alias).join('+') || '?'}`).join(', ')}.`,
    )
  }

  // ==========================================================================
  // §3.5 — the approve door on an asset we own
  // ==========================================================================
  log('\n--- §3.5 · approve ---')
  let approveVerdict = 'NOT RUN (no asset)'
  if (assetA) {
    const approve = await call(
      '§3.5 · POST media/assets/:id/approve — no body',
      'POST',
      studio(`/media/assets/${assetA}/approve`),
      {
        section: 'approve',
        file: 'approve/no-body',
      },
    )
    let final = approve
    if (approve.status === 400) {
      final = await call(
        '§3.5 · POST media/assets/:id/approve — {} body',
        'POST',
        studio(`/media/assets/${assetA}/approve`),
        {
          body: {},
          section: 'approve',
          file: 'approve/empty-object',
        },
      )
    }
    approveVerdict =
      final.status === 404
        ? `404 ${errorCode(final.body)} — NOT proxied by Ward`
        : final.status < 300
          ? `${final.status} — PROXIED, body ${JSON.stringify(redact(final.body))}`
          : `${final.status} ${errorCode(final.body)} — ${errorMessage(final.body)}`
  }
  finding(`§3.5 approve door: ${approveVerdict}.`)

  // ==========================================================================
  // §3.2 + §3.3 — the bodies, behind the zero-wallet shield
  // ==========================================================================
  log('\n--- §3.2 / §3.3 · job bodies ---')
  const walletShield = await call(
    'wallet — re-read immediately before any job body',
    'GET',
    studio('/wallet'),
    {
      file: 'setup/wallet-shield',
    },
  )
  const shield = (walletShield.body as { availableCents?: number })?.availableCents
  if (shield !== 0 || available !== 0) {
    finding(
      `§3.2/§3.3 NOT RUN: the fresh org's wallet reads availableCents=${String(shield)} — not zero, so the 402 shield does not hold and no generation body was sent.`,
    )
  } else if (!urlA || !urlB || !assetA || !assetV) {
    finding(
      '§3.2/§3.3 NOT RUN: the reference assets could not be minted, so the bodies could not be built as the document shows them.',
    )
  } else {
    const jobs = studio('/media/jobs')
    const send = async (
      capability: Capability,
      kind: 'valid' | 'trap',
      name: string,
      body: unknown,
      field?: string,
      note?: string,
    ) => {
      const answer = await call(
        `§${kind === 'valid' ? '3.2' : '3.3'} · media/jobs — ${capability} · ${name}`,
        'POST',
        jobs,
        {
          body,
          section: kind,
          note:
            note ??
            (kind === 'valid'
              ? 'the document’s example; 402 expected on the zero wallet'
              : 'the document’s refusal; 400 expected BEFORE the wallet'),
          file: `jobs/${kind}-${capability}--${name}`,
        },
      )
      const summary = summariseBody(name, answer, field)
      rows[capability][kind === 'valid' ? 'valid' : 'traps'].push(summary)
      finding(
        `§${kind === 'valid' ? '3.2' : '3.3'} ${capability} · ${name}: ${answer.status} code=${summary.code}${summary.message ? ` "${summary.message}"` : ''}${field ? ` · names the field? ${summary.namesField}` : ''}.`,
      )
      await sleep(300)
      return answer
    }

    // --- §3.2 valid bodies, exactly the document's examples -----------------
    const G = (role: string, text: string) => ({ role, text })
    const valid: Record<Capability, unknown> = {
      'media.generate': {
        capability: 'media.generate',
        plan: 'balanced',
        kind: 'image',
        prompt: 'a flat-vector report cover, deep navy, generous negative space',
        params: { aspectRatio: '1:1', outputFormat: 'png' },
        guidance: [
          G('headline', 'Poor data quality costs $12.9M a year'),
          G('palette', 'deep navy, slate grey, one teal accent'),
        ],
        collection: { use: true, hint: 'our mark and the product shot' },
      },
      'images.edit': {
        capability: 'images.edit',
        instruction: 'replace the background with a plain deep-navy studio backdrop',
        params: { referenceImages: [urlA], aspectRatio: '1:1', outputFormat: 'png' },
      },
      'photoshoot.generate': {
        capability: 'photoshoot.generate',
        params: { referenceImages: [urlA, urlB], aspectRatio: '1:1', outputFormat: 'png' },
        guidance: [
          G('scene', 'on a brushed-steel table in a glass-walled briefing room'),
          G('style', 'corporate editorial photography, soft key light'),
          G('palette', 'cool neutrals, deep navy, one teal accent'),
        ],
      },
      'brand-assets.generate': {
        capability: 'brand-assets.generate',
        params: { count: 2 },
        guidance: [
          G('subject', "a wordmark for 'Alpha Pro MENA' with a compact abstract mark above it"),
          G('style', 'flat, minimal, enterprise-grade — a working mark, not an illustration'),
          G('palette', 'deep navy on warm off-white, one teal accent'),
        ],
      },
      'logos.generate': {
        capability: 'logos.generate',
        plan: 'balanced',
        params: { count: 1, aspectRatio: '1:1', outputFormat: 'png' },
        guidance: [
          G('headline', 'Alpha Pro MENA'),
          G('subject', 'a data-lineage platform; three aligned nodes joined by one line'),
          G('style', 'flat, geometric — a working mark for a browser tab and a slide master'),
          G('palette', 'deep navy on warm off-white, one teal accent'),
        ],
      },
      'logos.redesign': {
        capability: 'logos.redesign',
        plan: 'balanced',
        params: { referenceImages: [urlA], count: 1, aspectRatio: '1:1', outputFormat: 'png' },
        guidance: [
          G('style', 'simpler geometry, more negative space, lighter type; keep it recognisable'),
        ],
      },
      'avatars.generate': {
        capability: 'avatars.generate',
        params: { referenceImages: [urlA], count: 1 },
        guidance: [G('style', 'corporate headshot, navy blazer, plain light backdrop')],
      },
      'avatars.imagine': {
        capability: 'avatars.imagine',
        instruction: 'an Arabian woman in her thirties wearing a hijab',
        params: { count: 1 },
      },
      'avatar.generate': {
        capability: 'avatar.generate',
        plan: 'balanced',
        instruction: 'a man in his forties with a short grey beard, in a dark blazer',
        params: { count: 2, referenceImages: [urlA], aspectRatio: '3:2' },
        guidance: [],
      },
      'video-ads.generate': {
        capability: 'video-ads.generate',
        plan: 'balanced',
        params: { imageUrl: urlA, durationS: 5 },
        guidance: [G('motion', 'slow push-in, the product turning once, ending centred')],
      },
      'voice.speak': {
        capability: 'voice.speak',
        plan: 'balanced',
        prompt: 'Welcome to Alpha Pro. Here is what changed this week.',
        params: { voice: 'Rachel', lang: 'en', stability: 0.5, similarity: 0.75, speed: 1 },
      },
      'film.generate': {
        capability: 'film.generate',
        plan: 'balanced',
        sec: 3,
        aspect: '9:16',
        audio: true,
        scenes: [
          {
            sec: 2,
            speak: 'none',
            camera: 'wide establishing shot of a sunlit café, morning light',
          },
          { sec: 1, camera: 'slow push toward a coffee cup, steam rising' },
        ],
      },
      // The document's example with a still and a clip that honour its own
      // floors (340 px per side, 3–30 s) — run 1 (org 1823) sent a 1×1 still and
      // a 3.0 s clip and was refused 400; the ladder below separates the causes.
      'motion.generate': {
        capability: 'motion.generate',
        plan: 'balanced',
        image: assetC ?? assetA,
        video: assetW ?? assetV,
        orientation: 'image',
        keepSound: true,
        prompt: 'she keeps her warm, natural delivery; soft office light',
        lang: 'ar',
      },
    }
    for (const capability of CAPABILITIES) {
      if (rows[capability].catalog.status !== 200) {
        finding(`§3.2 ${capability}: NOT SENT — the catalog does not grant it on this tenant.`)
        continue
      }
      await send(capability, 'valid', 'document-example', valid[capability])
    }
    // Two shared-key variants, zero cost: `origin` (bookkeeping, echoed back)
    // and a film that references our own asset ids (scene references + character).
    await send(
      'media.generate',
      'valid',
      'with-origin',
      {
        ...(valid['media.generate'] as object),
        origin: { kind: 'standalone', ref: 'hsn-0910-phase0' },
      },
      undefined,
      'the shared `origin` keys of the document’s “Read this first”; 402 expected',
    )
    if (rows['film.generate'].catalog.status === 200) {
      await send(
        'film.generate',
        'valid',
        'with-references-and-character',
        {
          ...(valid['film.generate'] as object),
          character: { source: assetA, desc: 'a woman in her thirties, business-casual' },
          scenes: [
            {
              sec: 2,
              speak: 'none',
              references: [assetA],
              camera: 'wide establishing shot of a sunlit café, morning light',
            },
            { sec: 1, camera: 'slow push toward a coffee cup, steam rising' },
          ],
        },
        undefined,
        'our own uploaded asset id as a scene reference and as the character source (A3); 402 expected',
      )
    }
    // The upper bound of the reference list ("1 to 4 urls"): four → 402 expected.
    if (rows['photoshoot.generate'].catalog.status === 200) {
      await send(
        'photoshoot.generate',
        'valid',
        'four-referenceImages',
        {
          ...(valid['photoshoot.generate'] as object),
          params: {
            referenceImages: [urlA, urlB, urlA, urlB],
            aspectRatio: '1:1',
            outputFormat: 'png',
          },
        },
        undefined,
        'the document’s maximum of four reference urls; 402 expected',
      )
    }
    // The motion ladder — one variable per rung (`motionRungs`).
    if (rows['motion.generate'].catalog.status === 200 && assetC && assetW) {
      const rungs = motionRungs({ tiny: assetA, still: assetC, short: assetV, clip: assetW })
      for (const rung of rungs) {
        await send('motion.generate', 'valid', rung.name, rung.body, undefined, rung.note)
      }
    }

    // --- §3.3 traps, the document's own refusals ----------------------------
    const traps: { capability: Capability; name: string; field: string; body: unknown }[] = [
      {
        capability: 'images.edit',
        name: 'two-referenceImages',
        field: 'referenceImages',
        body: {
          ...(valid['images.edit'] as object),
          params: { referenceImages: [urlA, urlB], aspectRatio: '1:1', outputFormat: 'png' },
        },
      },
      {
        capability: 'photoshoot.generate',
        name: 'five-referenceImages',
        field: 'referenceImages',
        body: {
          ...(valid['photoshoot.generate'] as object),
          params: {
            referenceImages: [urlA, urlB, urlA, urlB, urlA],
            aspectRatio: '1:1',
            outputFormat: 'png',
          },
        },
      },
      {
        // Run 1 (org 1823) answered this with a 502 in 446 ms, not a 400 — sent
        // twice here so the record says whether that is the door's shape.
        capability: 'photoshoot.generate',
        name: 'five-referenceImages-again',
        field: 'referenceImages',
        body: {
          ...(valid['photoshoot.generate'] as object),
          params: {
            referenceImages: [urlA, urlB, urlA, urlB, urlA],
            aspectRatio: '1:1',
            outputFormat: 'png',
          },
        },
      },
      {
        capability: 'brand-assets.generate',
        name: 'count-1',
        field: 'count',
        body: { ...(valid['brand-assets.generate'] as object), params: { count: 1 } },
      },
      {
        capability: 'logos.generate',
        name: 'count-21',
        field: 'count',
        body: {
          ...(valid['logos.generate'] as object),
          params: { count: 21, aspectRatio: '1:1', outputFormat: 'png' },
        },
      },
      {
        capability: 'logos.redesign',
        name: 'no-referenceImages',
        field: 'referenceImages',
        body: {
          ...(valid['logos.redesign'] as object),
          params: { count: 1, aspectRatio: '1:1', outputFormat: 'png' },
        },
      },
      {
        capability: 'avatars.generate',
        name: 'count-9',
        field: 'count',
        body: {
          ...(valid['avatars.generate'] as object),
          params: { referenceImages: [urlA], count: 9 },
        },
      },
      {
        capability: 'avatars.imagine',
        name: 'instruction-601-chars',
        field: 'instruction',
        body: { ...(valid['avatars.imagine'] as object), instruction: 'x'.repeat(601) },
      },
      {
        capability: 'avatar.generate',
        name: 'count-9',
        field: 'count',
        body: {
          ...(valid['avatar.generate'] as object),
          params: { count: 9, referenceImages: [urlA], aspectRatio: '3:2' },
        },
      },
      {
        capability: 'video-ads.generate',
        name: 'aspectRatio',
        field: 'aspectRatio',
        body: {
          ...(valid['video-ads.generate'] as object),
          params: { imageUrl: urlA, durationS: 5, aspectRatio: '16:9' },
        },
      },
      {
        capability: 'video-ads.generate',
        name: 'generateAudio-true',
        field: 'generateAudio',
        body: {
          ...(valid['video-ads.generate'] as object),
          params: { imageUrl: urlA, durationS: 5, generateAudio: true },
        },
      },
      {
        capability: 'video-ads.generate',
        name: 'durationS-8',
        field: 'durationS',
        body: {
          ...(valid['video-ads.generate'] as object),
          params: { imageUrl: urlA, durationS: 8 },
        },
      },
      {
        capability: 'voice.speak',
        name: 'unapproved-voice',
        field: 'voice',
        body: {
          ...(valid['voice.speak'] as object),
          params: {
            voice: 'NotAnApprovedVoice',
            lang: 'en',
            stability: 0.5,
            similarity: 0.75,
            speed: 1,
          },
        },
      },
      {
        capability: 'voice.speak',
        name: 'similarity-on-precise',
        field: 'similarity',
        body: {
          ...(valid['voice.speak'] as object),
          plan: 'precise',
          params: { voice: 'Rachel', lang: 'en', stability: 0.5, similarity: 0.75 },
        },
      },
      {
        capability: 'film.generate',
        name: 'resolution-on-balanced',
        field: 'resolution',
        body: { ...(valid['film.generate'] as object), resolution: '720p' },
      },
      {
        capability: 'film.generate',
        name: 'talking-on-balanced',
        field: 'speak',
        body: {
          ...(valid['film.generate'] as object),
          lang: 'en',
          voice: { id: 'Rachel' },
          scenes: [
            {
              sec: 2,
              speak: 'talking',
              script: 'Welcome to Alpha Pro. Here is what changed this week.',
              camera: 'a presenter at a desk, medium shot',
            },
            { sec: 1, camera: 'slow push toward a coffee cup, steam rising' },
          ],
        },
      },
      {
        capability: 'film.generate',
        name: 'scenes-do-not-sum',
        field: 'sec',
        body: {
          ...(valid['film.generate'] as object),
          sec: 3,
          scenes: [
            { sec: 2, camera: 'wide establishing shot' },
            { sec: 2, camera: 'slow push in' },
          ],
        },
      },
      {
        capability: 'motion.generate',
        name: 'no-orientation',
        field: 'orientation',
        body: {
          capability: 'motion.generate',
          plan: 'balanced',
          image: assetA,
          video: assetV,
          keepSound: true,
          prompt: 'she keeps her warm, natural delivery',
        },
      },
      {
        capability: 'media.generate',
        name: 'unknown-param-key',
        field: 'foo',
        body: {
          ...(valid['media.generate'] as object),
          params: { aspectRatio: '1:1', outputFormat: 'png', foo: 'bar' },
        },
      },
    ]
    for (const trap of traps) {
      if (rows[trap.capability].catalog.status !== 200) {
        finding(`§3.3 ${trap.capability} · ${trap.name}: NOT SENT — not granted.`)
        continue
      }
      await send(trap.capability, 'trap', trap.name, trap.body, trap.field)
    }

    // --- Nothing moved. -----------------------------------------------------
    const walletAfter = await call('wallet — after every refused body', 'GET', studio('/wallet'), {
      section: 'after',
      file: 'after/wallet',
    })
    const jobsAfter = await call(
      'media/jobs — list after (no job may exist)',
      'GET',
      studio('/media/jobs'),
      { section: 'after', file: 'after/jobs' },
    )
    const jobCount = (jobsAfter.body as { jobs?: unknown[] })?.jobs?.length
    finding(
      `After the bodies: wallet ${JSON.stringify(walletAfter.body)}; jobs listed: ${String(jobCount)}.`,
    )
  }

  // ==========================================================================
  // §3.7 — State under Country
  // ==========================================================================
  log('\n--- §3.7 · State under Country ---')
  const countries = await call(
    '§3.7a · GET event-sources/countries — does a row carry states?',
    'GET',
    org('/event-sources/countries'),
    {
      section: 'state',
      file: 'state/countries',
    },
  )
  {
    const list = (countries.body as { items?: Record<string, unknown>[]; total?: number }) ?? {}
    const items = list.items ?? []
    const keyUnion = Array.from(new Set(items.flatMap((row) => Object.keys(row))))
    const us = items.find((row) => row.code === 'US')
    finding(
      `§3.7a countries: ${countries.status}; total=${String(list.total)}; row keys across the list [${keyUnion.join(', ')}]; US row ${us ? JSON.stringify(us) : 'ABSENT'}; ${keyUnion.some((key) => /state|subdivision|region|province/i.test(key)) ? 'a state-like key IS present' : 'NO state-like key on any row'}.`,
    )
  }

  const putState = await call(
    '§3.7b · PUT /orgs/:id/country — {country:"US", state:"CA"}',
    'PUT',
    org('/country'),
    {
      body: { country: 'US', state: 'CA' },
      section: 'state',
      note: 'accepted, dropped, or 400? (~10 s: it loads a calendar)',
      file: 'state/put-country-us-ca',
    },
  )
  let putVerdict: string
  if (putState.status === 400) {
    const control = await call(
      '§3.7b · PUT /orgs/:id/country — {country:"US"} (the control: is US itself active?)',
      'PUT',
      org('/country'),
      {
        body: { country: 'US' },
        section: 'state',
        file: 'state/put-country-us-control',
      },
    )
    putVerdict = `400 ${errorCode(putState.body)} "${errorMessage(putState.body)}" details=${JSON.stringify(errorDetails(putState.body))}; the control without state → ${control.status}${control.status === 200 ? ` (holidaysCount ${JSON.stringify((control.body as { holidaysCount?: unknown })?.holidaysCount)})` : ` ${errorCode(control.body)}`} — ${control.status === 200 ? 'the 400 is the `state` key (strict schema)' : 'US itself is refused'}`
  } else if (putState.status === 200) {
    const receipt = putState.body as {
      org?: Record<string, unknown>
      holidaysCount?: number
      reloaded?: boolean
    }
    putVerdict = `200; holidaysCount=${String(receipt.holidaysCount)} reloaded=${String(receipt.reloaded)}; org keys [${Object.keys(receipt.org ?? {}).join(', ')}]; state ${receipt.org && 'state' in receipt.org ? `ECHOED as ${JSON.stringify(receipt.org.state)}` : 'DROPPED (not on the org record)'}`
  } else {
    putVerdict = `${putState.status} ${errorCode(putState.body)} "${errorMessage(putState.body)}"`
  }
  finding(`§3.7b PUT country with state: ${putVerdict}.`)
  const orgAfter = await call(
    '§3.7b · GET /orgs/:id — read back (does the org carry a state?)',
    'GET',
    org(''),
    { section: 'state', file: 'state/org-after-put' },
  )
  {
    const record = ((orgAfter.body as { org?: Record<string, unknown> })?.org ?? {}) as Record<
      string,
      unknown
    >
    finding(
      `§3.7b org after: country=${JSON.stringify(record.country)}; keys [${Object.keys(record).join(', ')}]; ${'state' in record ? `state=${JSON.stringify(record.state)}` : 'no `state` key'}.`,
    )
  }
  const holidays = await call(
    '§3.7d · GET /orgs/:id/holidays?limit=100 — the rows’ shape',
    'GET',
    org('/holidays?limit=100'),
    { section: 'state', file: 'state/holidays' },
  )
  {
    const list = (holidays.body as { items?: Record<string, unknown>[]; total?: number }) ?? {}
    const items = list.items ?? []
    const keyUnion = Array.from(new Set(items.flatMap((row) => Object.keys(row))))
    finding(
      `§3.7d holidays: ${holidays.status}; total=${String(list.total)}; row keys [${keyUnion.join(', ')}]; first ${JSON.stringify(items[0] ?? null)}.`,
    )
  }

  const source = await call(
    '§3.7c · POST event-sources — {kind:"holidays", country:"US", state:"CA"}',
    'POST',
    org('/event-sources'),
    {
      body: { kind: 'holidays', country: 'US', state: 'CA' },
      section: 'state',
      file: 'state/post-event-source-us-ca',
    },
  )
  let sourceVerdict: string
  const cleanupSource = async (id: string, label: string) => {
    await call(
      `§3.7c · DELETE event-sources/:id — cleanup (${label})`,
      'DELETE',
      org(`/event-sources/${id}`),
      { section: 'state', file: `state/delete-event-source-${label}` },
    )
  }
  if (source.status === 201 || source.status === 200) {
    const row = (source.body ?? {}) as Record<string, unknown>
    sourceVerdict = `${source.status}; row keys [${Object.keys(row).join(', ')}]; state ${'state' in row ? `ECHOED as ${JSON.stringify(row.state)}` : 'DROPPED'}`
    if (typeof row.id === 'string') await cleanupSource(row.id, 'with-state')
  } else if (source.status === 400) {
    const control = await call(
      '§3.7c · POST event-sources — {kind:"holidays", country:"US"} (the control)',
      'POST',
      org('/event-sources'),
      {
        body: { kind: 'holidays', country: 'US' },
        section: 'state',
        file: 'state/post-event-source-us-control',
      },
    )
    sourceVerdict = `400 ${errorCode(source.body)} "${errorMessage(source.body)}" details=${JSON.stringify(errorDetails(source.body))}; the control without state → ${control.status} — ${control.status < 300 ? 'the 400 is the `state` key (strict schema)' : `${errorCode(control.body)} "${errorMessage(control.body)}"`}`
    const controlRow = (control.body ?? {}) as Record<string, unknown>
    if (control.status < 300 && typeof controlRow.id === 'string')
      await cleanupSource(controlRow.id, 'control')
  } else {
    sourceVerdict = `${source.status} ${errorCode(source.body)} "${errorMessage(source.body)}"`
  }
  finding(`§3.7c event-source with state: ${sourceVerdict}.`)

  log('\n--- §3.7 · read-first sweep for a state list (404 expected) ---')
  const sweep: string[] = []
  for (const path of [
    org('/event-sources/countries/US'),
    org('/event-sources/countries/US/states'),
    org('/event-sources/states?country=US'),
    org('/event-sources/subdivisions?country=US'),
    org('/countries/US/states'),
    org('/states?country=US'),
  ]) {
    const answer = await call(`§3.7 · GET ${displayPath(path)}`, 'GET', path, { section: 'state' })
    sweep.push(`${displayPath(path)} → ${answer.status}`)
  }
  finding(`§3.7 state-list sweep (read-only): ${sweep.join(' · ')}.`)

  // ==========================================================================
  // §3.4 — a multi-asset job envelope, READ ONLY on the funded QA org
  // ==========================================================================
  log('\n--- §3.4 · multi-asset job envelope (read-only, the funded QA org) ---')
  const fundedEmail = userScopeEnv(FUNDED_EMAIL_VAR)
  const fundedPassword = userScopeEnv(FUNDED_PASSWORD_VAR)
  if (!fundedEmail || !fundedPassword) {
    finding(
      '§3.4 NOT MEASURED: no funded QA org credentials in the QA-creds store on this machine.',
    )
  } else {
    const login = await call('login (funded owner)', 'POST', '/auth/login', {
      body: { email: fundedEmail, password: fundedPassword },
      quiet: true,
      anonymous: true,
    })
    const fundedToken = (login.body as { token?: string })?.token ?? null
    if (!fundedToken) {
      finding(
        `§3.4 NOT MEASURED: the funded owner's login answered ${login.status} ${errorCode(login.body)}.`,
      )
    } else {
      const orgs = await call('§3.4 · GET /me/orgs — the funded owner’s orgs', 'GET', '/me/orgs', {
        tokenOverride: fundedToken,
        section: 'multi-asset',
        file: 'multi-asset/me-orgs',
      })
      const items = (orgs.body as { items?: { id: string; name?: string }[] })?.items ?? []
      const fundedOrg = items.find((row) => /funded/i.test(row.name ?? '')) ?? items[0]
      if (!fundedOrg) {
        finding('§3.4 NOT MEASURED: the funded owner has no org.')
      } else {
        const jobList = await call(
          `§3.4 · GET /orgs/${fundedOrg.id}/alphastudio/media/jobs — READ ONLY`,
          'GET',
          `/orgs/${fundedOrg.id}/alphastudio/media/jobs`,
          {
            tokenOverride: fundedToken,
            section: 'multi-asset',
            note: 'a list read on the funded org; never a POST there',
            file: 'multi-asset/jobs-list',
          },
        )
        const jobs =
          (
            jobList.body as {
              jobs?: {
                jobId: string
                status?: string
                capability?: string
                assets?: { kind?: string }[]
              }[]
            }
          )?.jobs ?? []
        const kindsOf = (job: { assets?: { kind?: string }[] }) =>
          Array.from(new Set((job.assets ?? []).map((asset) => asset.kind ?? '?')))
        const multi = jobs.filter((job) => {
          const kinds = kindsOf(job)
          return kinds.length > 1 || kinds.some((kind) => kind !== 'image' && kind !== 'video')
        })
        finding(
          `§3.4 funded org ${fundedOrg.id}: ${jobs.length} job(s) listed [${jobs.map((job) => `${job.capability ?? '?'}/${job.status ?? '?'}/${kindsOf(job).join('+') || 'no assets'}`).join(', ')}]; multi-kind or audio/document jobs: ${multi.length}.`,
        )
        for (const job of multi.slice(0, 3)) {
          await call(
            `§3.4 · GET media/jobs/${job.jobId} — the multi-asset envelope`,
            'GET',
            `/orgs/${fundedOrg.id}/alphastudio/media/jobs/${job.jobId}`,
            {
              tokenOverride: fundedToken,
              section: 'multi-asset',
              file: `multi-asset/job-${job.jobId}`,
            },
          )
        }
        if (multi.length === 0)
          finding(
            '§3.4 UNMEASURED: no multi-asset job exists on the funded org — the gallery renders `audio`/`document` kinds defensively (row + Open, no player claims).',
          )
      }
      await call('logout (funded owner)', 'POST', '/auth/logout', {
        tokenOverride: fundedToken,
        quiet: true,
      })
    }
  }

  // ==========================================================================
  // Cleanup — every minted asset deleted, the list re-read
  // ==========================================================================
  log('\n--- cleanup ---')
  for (const asset of uploaded) {
    const del = await call(
      `cleanup · DELETE media/assets/${asset.assetId}`,
      'DELETE',
      studio(`/media/assets/${asset.assetId}`),
      { section: 'cleanup' },
    )
    finding(`cleanup ${asset.assetId} (${asset.mediaType}): ${del.status}.`)
  }
  const assetsAfter = await call(
    'cleanup · media/assets — list re-read',
    'GET',
    studio('/media/assets'),
    { section: 'cleanup', file: 'after/assets' },
  )
  finding(`cleanup list re-read: ${assetsAfter.status} ${JSON.stringify(assetsAfter.body)}.`)

  writeRecords(orgId, voiceByPlan)
  log(`\nrecord: ${RECORD_DIR}\nappended to ${SHAPES_PATH}`)
}

// ---------------------------------------------------------------------------
// Records: the raw folder (captures.json, summary.json, findings.md) and the
// dated section appended to alphastudio-shapes.md.
// ---------------------------------------------------------------------------

function fmtCost(models: ModelRow[] | undefined): string {
  return (models ?? [])
    .map(
      (model) =>
        `${model.alias ?? '?'} (${model.plan ?? 'plan null'}: ${
          model.cost
            ? Object.entries(model.cost)
                .map(
                  ([unit, price]) =>
                    `${unit} ${typeof price === 'string' ? price : JSON.stringify(price)}`,
                )
                .join(', ')
            : 'no cost row'
        })`,
    )
    .join('; ')
}

function fmtPlans(plans: Record<string, PlanSummary> | undefined): string {
  if (!plans) return ''
  return PLANS.map(
    (plan) => `${plan} = ${fmtCost(plans[plan]?.models) || `(${plans[plan]?.status ?? '?'})`}`,
  ).join('; ')
}

function bodyCell(entries: BodySummary[]): string {
  if (entries.length === 0) return '—'
  return entries
    .map(
      (entry) =>
        `${entry.name}: **${entry.status}** ${entry.code}${entry.namesField ? ` (names field: ${entry.namesField})` : ''}`,
    )
    .join('<br>')
}

function tableLines(): string[] {
  const lines: string[] = []
  lines.push('| Capability | Catalog | Valid body (§3.2) | Traps (§3.3) |')
  lines.push('| --- | --- | --- | --- |')
  for (const capability of CAPABILITIES) {
    const row = rows[capability]
    const catalog =
      row.catalog.status === 200
        ? `200 · selectable ${String(row.catalog.selectable)} · field ${JSON.stringify(row.catalog.field)} · rows: ${fmtCost(row.catalog.models)}${row.catalog.plans ? ` · per plan: ${fmtPlans(row.catalog.plans)}` : ''}`
        : `**${row.catalog.status}** ${row.catalog.note ?? ''} — not granted`
    lines.push(
      `| \`${capability}\` | ${catalog} | ${bodyCell(row.valid)} | ${bodyCell(row.traps)} |`,
    )
  }
  return lines
}

/** One exchange as the shapes doc shows it: the line, the note, the bodies. */
function renderCapture(capture: Capture): string[] {
  const lines: string[] = []
  lines.push(`#### ${capture.seq}. ${capture.title}`)
  lines.push('')
  lines.push(
    `\`${capture.method} ${capture.path}\` → **${capture.status}** · request-id \`${capture.requestId ?? 'none'}\` · ${capture.ms} ms${capture.file ? ` · raw \`${capture.file}\`` : ''}`,
  )
  if (capture.note) lines.push(`> ${capture.note}`)
  lines.push('')
  if (capture.headers) {
    lines.push('```json')
    lines.push(JSON.stringify(capture.headers, null, 2))
    lines.push('```')
    lines.push('')
  }
  if (capture.request !== undefined) {
    lines.push('```json')
    lines.push(JSON.stringify({ request: capture.request }, null, 2))
    lines.push('```')
    lines.push('')
  }
  if (capture.section === 'catalog' && capture.status === 200) {
    // The catalog's own rows (a `?plan=` read shows the rows THAT plan resolves
    // to); the full schemas are in the raw file.
    const response = capture.response as {
      selectable?: unknown
      field?: unknown
      plan?: unknown
      models?: {
        alias?: string
        kind?: string
        plan?: string | null
        cost?: Record<string, unknown>
        capabilitySchema?: { properties?: Record<string, unknown> }
      }[]
    }
    lines.push('```json')
    lines.push(
      JSON.stringify(
        {
          summarised: true,
          selectable: response?.selectable,
          field: response?.field,
          plan: response?.plan,
          models: (response?.models ?? []).map((model) => ({
            alias: model.alias,
            kind: model.kind,
            plan: model.plan,
            cost: model.cost,
            schemaKeys: Object.keys(model.capabilitySchema?.properties ?? {}),
          })),
        },
        null,
        2,
      ),
    )
    lines.push('```')
    lines.push('')
  } else if (capture.file === 'state/countries.json' && capture.response !== undefined) {
    // 249 rows of `{code, name}` are the raw file's; the shape is what matters here.
    const list = capture.response as { items?: Record<string, unknown>[]; total?: unknown }
    const items = list.items ?? []
    lines.push('```json')
    lines.push(
      JSON.stringify(
        {
          summarised: true,
          total: list.total,
          rowKeys: Array.from(new Set(items.flatMap((row) => Object.keys(row)))),
          first: items.slice(0, 5),
          note: `${items.length} rows verbatim in the raw file`,
        },
        null,
        2,
      ),
    )
    lines.push('```')
    lines.push('')
  } else if (capture.response !== undefined) {
    lines.push('```json')
    lines.push(JSON.stringify(capture.response, null, 2))
    lines.push('```')
    lines.push('')
  }
  return lines
}

function writeRecords(orgId: string | null, voiceByPlan: Record<string, unknown> = {}) {
  mkdirSync(recordDir, { recursive: true })
  writeFileSync(
    join(recordDir, 'captures.json'),
    JSON.stringify({ run: recordStamp, orgId, owner: recordOwner, captures }, null, 2) + '\n',
    'utf8',
  )
  writeFileSync(
    join(recordDir, 'summary.json'),
    JSON.stringify(
      { run: recordStamp, orgId, owner: recordOwner, capabilities: rows, voiceByPlan, findings },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const findingsMd: string[] = []
  findingsMd.push(`# HSN-0910 Phase 0 — findings (${recordStamp.slice(0, 10)})`, '')
  findingsMd.push(
    `Run stamp \`${recordStamp}\` · fresh QA org **${orgId ?? '(none)'}** (\`${recordOwner}\`) · zero spend. Generated by \`pnpm probe:hsn-0910\`; the raw exchanges are the JSON files beside this one (\`captures.json\` has all of them in order).`,
    '',
  )
  findingsMd.push('## Capability × catalog × 402 × 400 trap', '', ...tableLines(), '')
  findingsMd.push('## What this run established', '')
  for (const line of findings) findingsMd.push(`- ${line}`)
  findingsMd.push('')
  writeFileSync(join(recordDir, 'findings.md'), findingsMd.join('\n'), 'utf8')

  const lines: string[] = []
  lines.push('')
  lines.push(
    `## HSN-0910 Phase 0 — the 13 capabilities, the approve door, State under Country, the environment (${recordStamp.slice(0, 10)})`,
  )
  lines.push('')
  lines.push(
    'Captured by `pnpm probe:hsn-0910` against the deployed SANDBOX API on one fresh QA org —',
    `**${orgId ?? '(none)'}** (\`${recordOwner}\`) — org 619 untouched; the funded QA org read ONLY`,
    '(a job list, never a POST). Zero spend: catalog reads, five presigns with five free Node',
    'PUTs, read-presigns, and every generation body sent ONLY behind the zero-wallet shield (a',
    'valid body answers 402 at the wallet check, an invalid one 400 before it; the wallet and the',
    'job list are re-read after). Bodies verbatim; presigned urls, the API base and every token',
    "redacted. Request-ids are the server's `x-request-id` (or the envelope's `requestId`).",
    `The durable raw copy is \`Docs/qa/hsn-0910/phase0/\` (this file is overwritten wholesale by`,
    `\`pnpm smoke:alphastudio\`). The catalog bodies are summarised here and verbatim there`,
    '(`catalog/<capability>.json`, `catalog/<capability>.plan-<plan>.json`). Run stamp: `' +
      recordStamp +
      '`.',
  )
  lines.push('')
  lines.push('### Capability × catalog × 402 × 400 trap')
  lines.push('')
  lines.push(...tableLines())
  lines.push('')
  lines.push('### What this run established')
  lines.push('')
  for (const line of findings) lines.push(`- ${line}`)
  lines.push('')
  lines.push(
    '### Captured exchanges, in order (catalog bodies summarised — raw in `Docs/qa/hsn-0910/phase0/catalog/`)',
  )
  lines.push('')
  for (const capture of captures) lines.push(...renderCapture(capture))
  appendFileSync(SHAPES_PATH, lines.join('\n') + '\n', 'utf8')
}

// ---------------------------------------------------------------------------
// `--motion-supplement --owner <email>`: the motion ladder alone, on an
// EXISTING zero-wallet QA org of that owner — no new org.
// ---------------------------------------------------------------------------

function writeSupplementRecords(orgId: string | null) {
  mkdirSync(recordDir, { recursive: true })
  writeFileSync(
    join(recordDir, 'captures.json'),
    JSON.stringify({ run: recordStamp, orgId, owner: recordOwner, captures, findings }, null, 2) +
      '\n',
    'utf8',
  )
  const md: string[] = []
  md.push(`# HSN-0910 Phase 0 — motion.generate supplement (${recordStamp.slice(0, 10)})`, '')
  md.push(
    `Run stamp \`${recordStamp}\` · EXISTING QA org **${orgId ?? '(none)'}** (\`${recordOwner}\`) · zero spend. Generated by \`pnpm probe:hsn-0910 -- --motion-supplement --owner …\`; the raw exchanges are the JSON files beside this one.`,
    '',
  )
  md.push('## What the supplement established', '')
  for (const line of findings) md.push(`- ${line}`)
  md.push('')
  writeFileSync(join(recordDir, 'findings.md'), md.join('\n'), 'utf8')

  const lines: string[] = []
  lines.push('')
  lines.push(
    `### Motion supplement — the ladder one variable at a time, on org ${orgId ?? '(none)'} (${recordStamp.slice(0, 10)})`,
  )
  lines.push('')
  lines.push(
    `Captured by \`pnpm probe:hsn-0910 -- --motion-supplement --owner …\` on an EXISTING zero-wallet`,
    `QA org (\`${recordOwner}\`) — no new org. Zero spend: four presigns with four free Node PUTs,`,
    'the rungs behind the zero-wallet shield (the wallet read 0 first), the wallet and the job',
    'list re-read after, every asset deleted. Raw copy:',
    '`Docs/qa/hsn-0910/phase0/supplement-motion/`. Run stamp: `' + recordStamp + '`.',
  )
  lines.push('')
  lines.push('#### What the supplement established')
  lines.push('')
  for (const line of findings) lines.push(`- ${line}`)
  lines.push('')
  lines.push('#### Captured exchanges, in order')
  lines.push('')
  for (const capture of captures) lines.push(...renderCapture(capture))
  appendFileSync(SHAPES_PATH, lines.join('\n') + '\n', 'utf8')
}

async function motionSupplement(ownerEmail: string) {
  recordDir = join(RECORD_DIR, 'supplement-motion')
  recordOwner = ownerEmail
  mkdirSync(recordDir, { recursive: true })
  log(`\n=== probe-hsn-0910 · motion supplement · ${STAMP} ===`)
  log(`owner: ${ownerEmail}\n`)

  const login = await call('login (the run’s owner)', 'POST', '/auth/login', {
    body: { email: ownerEmail, password: PASSWORD },
    quiet: true,
    anonymous: true,
  })
  token = (login.body as { token?: string })?.token ?? null
  if (!token) {
    log(`probe-hsn-0910: no token (login answered ${login.status}) — cannot continue.`)
    process.exit(1)
  }
  const orgs = await call('supplement · GET /me/orgs — the owner’s org', 'GET', '/me/orgs', {
    file: 'setup/me-orgs',
  })
  const orgId = (orgs.body as { items?: { id: string }[] })?.items?.[0]?.id ?? null
  if (!orgId) {
    log('probe-hsn-0910: the owner has no org — cannot continue.')
    process.exit(1)
  }
  orgIdForDisplay = orgId
  const studio = (path: string) => `/orgs/${orgId}/alphastudio${path}`
  finding(`Supplement on the EXISTING QA org ${orgId} (${ownerEmail}) — no new org.`)

  const wallet = await call('supplement · wallet — the 402 shield', 'GET', studio('/wallet'), {
    file: 'setup/wallet-shield',
  })
  const available = (wallet.body as { availableCents?: number })?.availableCents
  finding(`Wallet: ${wallet.status} ${JSON.stringify(wallet.body)}.`)
  if (available !== 0) {
    finding(`NOT RUN: availableCents=${String(available)} — the shield does not hold.`)
    writeSupplementRecords(orgId)
    return
  }

  const uploaded: UploadedAsset[] = []
  const upload = (label: string, mediaType: string, bytes: Uint8Array<ArrayBuffer>, desc: string) =>
    uploadAsset(studio, uploaded, label, mediaType, bytes, desc)
  const tiny = await upload(
    'A',
    'image/png',
    onePixelPng(),
    'HSN-0910 motion supplement — a 1×1 still',
  )
  const big = solidPng(512)
  finding(`512 px PNG source: ${big.source}.`)
  const still = await upload(
    'C',
    'image/png',
    big.bytes,
    'HSN-0910 motion supplement — a 512×512 still',
  )
  const three = tinyMp4(3)
  finding(`3 s MP4 source: ${three.source}.`)
  const short = await upload(
    'V',
    'video/mp4',
    three.bytes,
    'HSN-0910 motion supplement — a 3-second clip',
  )
  const five = tinyMp4(5)
  finding(`5 s MP4 source: ${five.source}.`)
  const clip = await upload(
    'W',
    'video/mp4',
    five.bytes,
    'HSN-0910 motion supplement — a 5-second clip',
  )

  if (tiny && still && short && clip) {
    for (const rung of motionRungs({ tiny, still, short, clip })) {
      const answer = await call(
        `supplement · media/jobs — motion.generate · ${rung.name}`,
        'POST',
        studio('/media/jobs'),
        { body: rung.body, section: 'valid', note: rung.note, file: `jobs/${rung.name}` },
      )
      finding(
        `motion.generate · ${rung.name}: ${answer.status} code=${errorCode(answer.body)}${errorMessage(answer.body) ? ` "${errorMessage(answer.body)}"` : ''}.`,
      )
      await sleep(300)
    }
    const walletAfter = await call(
      'supplement · wallet — after the rungs',
      'GET',
      studio('/wallet'),
      {
        section: 'after',
        file: 'after/wallet',
      },
    )
    const jobsAfter = await call(
      'supplement · media/jobs — list after (no job may exist)',
      'GET',
      studio('/media/jobs'),
      { section: 'after', file: 'after/jobs' },
    )
    finding(
      `After the rungs: wallet ${JSON.stringify(walletAfter.body)}; jobs listed: ${String((jobsAfter.body as { jobs?: unknown[] })?.jobs?.length)}.`,
    )
  } else {
    finding('NOT RUN: an asset could not be minted, so the rungs could not be built.')
  }

  for (const asset of uploaded) {
    const del = await call(
      `supplement · cleanup · DELETE media/assets/${asset.assetId}`,
      'DELETE',
      studio(`/media/assets/${asset.assetId}`),
      { section: 'cleanup' },
    )
    finding(`cleanup ${asset.assetId} (${asset.mediaType}): ${del.status}.`)
  }
  const assetsAfter = await call(
    'supplement · cleanup · media/assets — list re-read',
    'GET',
    studio('/media/assets'),
    { section: 'cleanup', file: 'after/assets' },
  )
  finding(`cleanup list re-read: ${assetsAfter.status} ${JSON.stringify(assetsAfter.body)}.`)
  await call('logout (the run’s owner)', 'POST', '/auth/logout', { quiet: true })
  writeSupplementRecords(orgId)
  log(`\nrecord: ${recordDir}\nappended to ${SHAPES_PATH}`)
}

// ---------------------------------------------------------------------------
// `--funded-proofs [--image <png>]`: §3.6 on the FUNDED QA org, on the
// founder's word (2026-09-10) and ONLY under LIVE_MEDIA=1 — three PAID renders
// at Hasan's upstream cost: logos.generate balanced ×1, voice.speak balanced
// one unit, images.edit with OUR read-presigned url (the A3 proof). Records
// the wallet before and after, every receipt and terminal envelope, and what
// each presigned output url answers when fetched from Node. Nothing is
// deleted afterwards: the inputs and outputs stay on the org as the record.
// ---------------------------------------------------------------------------

const FUNDED_DIR_NAME = 'funded'
/** How long to follow one job; balanced settles in seconds, the cap is generous. */
const POLL_CAP_MS = 10 * 60 * 1000
const POLL_EVERY_MS = 3_000

function writeFundedRecords(orgId: string | null) {
  mkdirSync(recordDir, { recursive: true })
  writeFileSync(
    join(recordDir, 'captures.json'),
    JSON.stringify({ run: recordStamp, orgId, owner: recordOwner, captures, findings }, null, 2) +
      '\n',
    'utf8',
  )
  const md: string[] = []
  md.push(
    `# HSN-0910 Phase 0 — the funded proofs on the funded QA org (${recordStamp.slice(0, 10)})`,
    '',
  )
  md.push(
    `Run stamp \`${recordStamp}\` · org **${orgId ?? '(none)'}** (\`${recordOwner}\`) · LIVE_MEDIA=1 · three PAID renders on the founder's word (upstream compute is Hasan's cost). Generated by \`pnpm probe:hsn-0910 -- --funded-proofs\`; the raw exchanges are the JSON files beside this one; the rendered outputs are the downscaled \`.webp\` copies and the voice timestamps document.`,
    '',
  )
  md.push('## What the funded proofs established', '')
  for (const line of findings) md.push(`- ${line}`)
  md.push('')
  writeFileSync(join(recordDir, 'findings.md'), md.join('\n'), 'utf8')

  const lines: string[] = []
  lines.push('')
  lines.push(
    `### Funded proofs — three paid renders on the funded QA org ${orgId ?? '(none)'} (${recordStamp.slice(0, 10)}, LIVE_MEDIA=1)`,
  )
  lines.push('')
  lines.push(
    `Captured by \`pnpm probe:hsn-0910 -- --funded-proofs\` as the funded owner (\`${recordOwner}\`) on the`,
    "founder's word (§3.6): `logos.generate` balanced ×1, `voice.speak` balanced one unit, `images.edit`",
    'with OUR read-presigned url — the A3 proof. The wallet before and after, every 202 receipt, every',
    'terminal envelope (urls redacted), and what each presigned output url answered from Node. Nothing',
    'deleted: the input and the outputs stay on the org as the record. Raw copy:',
    '`Docs/qa/hsn-0910/phase0/funded/`. Run stamp: `' + recordStamp + '`.',
  )
  lines.push('')
  lines.push('#### What the funded proofs established')
  lines.push('')
  for (const line of findings) lines.push(`- ${line}`)
  lines.push('')
  lines.push('#### Captured exchanges, in order')
  lines.push('')
  for (const capture of captures) lines.push(...renderCapture(capture))
  appendFileSync(SHAPES_PATH, lines.join('\n') + '\n', 'utf8')
}

/** GET a presigned output url from Node: what it answers, and the bytes when it is ok. */
async function fetchAsset(
  url: string,
): Promise<{ status: number; type?: string; bytes: Uint8Array<ArrayBuffer> | null; ms: number }> {
  const started = Date.now()
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
    const buffer = new Uint8Array(await response.arrayBuffer())
    return {
      status: response.status,
      type: response.headers.get('content-type') ?? undefined,
      bytes: response.ok ? toBytes(buffer) : null,
      ms: Date.now() - started,
    }
  } catch (cause) {
    return { status: 0, type: String(cause).slice(0, 120), bytes: null, ms: Date.now() - started }
  }
}

/** A downscaled WebP copy of an image for the record (ffmpeg; skipped without it). */
function webpCopy(bytes: Uint8Array<ArrayBuffer>, name: string, maxWidth: number): string | null {
  const source = join(tmpdir(), `hsn-0910-${name}-${RUN}.bin`)
  const target = join(recordDir, `${name}.webp`)
  try {
    writeFileSync(source, bytes)
    execFileSync(
      'ffmpeg',
      [
        '-loglevel',
        'error',
        '-y',
        '-i',
        source,
        '-vf',
        `scale='min(${maxWidth},iw)':-2`,
        '-c:v',
        'libwebp',
        '-quality',
        '80',
        target,
      ],
      { stdio: 'ignore' },
    )
    return `${name}.webp`
  } catch {
    return null
  }
}

async function fundedProofs(imagePath: string | undefined) {
  if (process.env.LIVE_MEDIA !== '1') {
    log(
      'probe-hsn-0910: --funded-proofs spends real upstream compute; set LIVE_MEDIA=1 to run it (the founder’s word, 2026-09-10).',
    )
    process.exit(1)
  }
  const fundedEmail = userScopeEnv(FUNDED_EMAIL_VAR)
  const fundedPassword = userScopeEnv(FUNDED_PASSWORD_VAR)
  if (!fundedEmail || !fundedPassword) {
    log('probe-hsn-0910: no funded QA org credentials in the QA-creds store on this machine.')
    process.exit(1)
  }
  recordDir = join(RECORD_DIR, FUNDED_DIR_NAME)
  recordOwner = fundedEmail
  mkdirSync(recordDir, { recursive: true })
  log(`\n=== probe-hsn-0910 · funded proofs · ${STAMP} ===`)
  log(`owner: ${fundedEmail}\n`)

  const login = await call('login (funded owner)', 'POST', '/auth/login', {
    body: { email: fundedEmail, password: fundedPassword },
    quiet: true,
    anonymous: true,
  })
  token = (login.body as { token?: string })?.token ?? null
  if (!token) {
    log(`probe-hsn-0910: no token (login answered ${login.status}) — cannot continue.`)
    process.exit(1)
  }
  const orgs = await call('funded · GET /me/orgs — the funded owner’s orgs', 'GET', '/me/orgs', {
    section: 'funded',
    file: 'setup/me-orgs',
  })
  const items = (orgs.body as { items?: { id: string; name?: string }[] })?.items ?? []
  const fundedOrg = items.find((row) => /funded/i.test(row.name ?? '')) ?? items[0]
  if (!fundedOrg) {
    log('probe-hsn-0910: the funded owner has no org — cannot continue.')
    process.exit(1)
  }
  const orgId = fundedOrg.id
  orgIdForDisplay = orgId
  const studio = (path: string) => `/orgs/${orgId}/alphastudio${path}`
  finding(
    `Funded proofs on org ${orgId} ("${fundedOrg.name ?? ''}"), LIVE_MEDIA=1, on the founder's word.`,
  )

  const walletBefore = await call('funded · wallet — before', 'GET', studio('/wallet'), {
    section: 'funded',
    file: 'setup/wallet-before',
  })
  const before = (walletBefore.body as { availableCents?: number })?.availableCents
  finding(`Wallet before: ${JSON.stringify(walletBefore.body)}.`)
  if (typeof before !== 'number' || before <= 0) {
    finding('NOT RUN: the funded org has no available cents — pay it again (M-BIL-1 step 8).')
    writeFundedRecords(orgId)
    return
  }

  // The images.edit input: a real image when one is given, else the 512 px square.
  let inputBytes: Uint8Array<ArrayBuffer>
  let inputSource: string
  if (imagePath && existsSync(imagePath)) {
    inputBytes = toBytes(readFileSync(imagePath))
    inputSource = `the file given with --image (${inputBytes.byteLength} bytes)`
  } else {
    const square = solidPng(512)
    inputBytes = square.bytes
    inputSource = square.source
  }
  const uploaded: UploadedAsset[] = []
  const inputId = await uploadAsset(
    studio,
    uploaded,
    'input',
    'image/png',
    inputBytes,
    'HSN-0910 funded proof — the images.edit input',
  )
  if (!inputId) {
    finding('NOT RUN: the input could not be uploaded.')
    writeFundedRecords(orgId)
    return
  }
  const inputCopy = webpCopy(inputBytes, 'input-images-edit', 640)
  finding(
    `images.edit input: ${inputSource}; asset ${inputId}${inputCopy ? `; a downscaled copy kept as ${inputCopy}` : ''}.`,
  )
  const read = await call(
    'funded · media/assets/:id/presign — the input’s read url',
    'POST',
    studio(`/media/assets/${inputId}/presign`),
    { section: 'funded', file: 'setup/read-presign-input' },
  )
  const inputUrl = (read.body as { url?: string })?.url ?? null
  if (!inputUrl) {
    finding('NOT RUN: no read url for the input.')
    writeFundedRecords(orgId)
    return
  }

  const G = (role: string, text: string) => ({ role, text })
  const proofs: { name: string; body: unknown; note: string }[] = [
    {
      name: 'logos-generate-balanced',
      note: 'the cheapest render on the catalog: image-balanced $0.03 per image',
      body: {
        capability: 'logos.generate',
        plan: 'balanced',
        params: { count: 1, aspectRatio: '1:1', outputFormat: 'png' },
        guidance: [
          G('headline', 'Alpha Pro MENA'),
          G('subject', 'a data-lineage platform; three aligned nodes joined by one line'),
          G('style', 'flat, geometric — a working mark for a browser tab and a slide master'),
          G('palette', 'deep navy on warm off-white, one teal accent'),
        ],
        origin: { kind: 'standalone', ref: 'hsn-0910-funded-logos' },
      },
    },
    {
      name: 'voice-speak-balanced',
      note: 'one unit (52 characters, under 1000): voice-turbo $0.05; the §3.4 multi-asset envelope',
      body: {
        capability: 'voice.speak',
        plan: 'balanced',
        prompt: 'Welcome to Alpha Pro. Here is what changed this week.',
        params: { voice: 'Rachel', lang: 'en', stability: 0.5, similarity: 0.75, speed: 1 },
        origin: { kind: 'standalone', ref: 'hsn-0910-funded-voice' },
      },
    },
    {
      name: 'images-edit',
      note: 'OUR read-presigned url as the one reference: image-reference $0.06; the A3 proof',
      body: {
        capability: 'images.edit',
        instruction: 'replace the background with a plain deep-navy studio backdrop',
        params: { referenceImages: [inputUrl], aspectRatio: '16:9', outputFormat: 'png' },
        origin: { kind: 'standalone', ref: 'hsn-0910-funded-images-edit' },
      },
    },
  ]
  const receipts: { name: string; jobId: string | null }[] = []
  for (const proof of proofs) {
    const answer = await call(
      `funded · media/jobs — ${proof.name}`,
      'POST',
      studio('/media/jobs'),
      {
        body: proof.body,
        section: 'funded',
        note: proof.note,
        file: `jobs/${proof.name}-receipt`,
      },
    )
    const jobId = (answer.body as { jobId?: string })?.jobId ?? null
    receipts.push({ name: proof.name, jobId })
    finding(
      `${proof.name}: ${answer.status}${jobId ? ` job ${jobId}, status ${String((answer.body as { status?: unknown })?.status)}` : ` code=${errorCode(answer.body)} "${errorMessage(answer.body)}"`}.`,
    )
  }

  for (const receipt of receipts) {
    if (!receipt.jobId) continue
    const started = Date.now()
    let polls = 0
    let job: Record<string, unknown> | null = null
    let last: Answer | null = null
    while (Date.now() - started < POLL_CAP_MS) {
      polls += 1
      const answer = await call(
        `funded · media/jobs/${receipt.jobId} — poll ${polls}`,
        'GET',
        studio(`/media/jobs/${receipt.jobId}`),
        { quiet: true },
      )
      last = answer
      const status = String((answer.body as { status?: unknown })?.status ?? '')
      if (answer.status === 200 && /^(succeeded|failed|cancell?ed)$/i.test(status)) {
        job = answer.body as Record<string, unknown>
        break
      }
      await sleep(POLL_EVERY_MS)
    }
    const seconds = ((Date.now() - started) / 1000).toFixed(1)
    // The terminal read is the one capture; the polls before it were quiet.
    captures.push({
      seq: (seq += 1),
      section: 'funded',
      title: `funded · media/jobs/${receipt.jobId} — terminal read after ${polls} poll(s), ${seconds} s (${receipt.name})`,
      method: 'GET',
      path: displayPath(studio(`/media/jobs/${receipt.jobId}`)),
      status: last?.status ?? 0,
      ms: last?.ms ?? 0,
      requestId: last?.requestId,
      response: redact(last?.body),
      file: `jobs/${receipt.name}-terminal.json`,
    })
    writeRaw(`jobs/${receipt.name}-terminal`, {
      title: receipt.name,
      status: last?.status,
      requestId: last?.requestId,
      polls,
      seconds: Number(seconds),
      response: redact(last?.body),
    })
    if (!job) {
      finding(
        `${receipt.name}: NOT terminal after ${polls} poll(s) — last status ${String((last?.body as { status?: unknown })?.status)}.`,
      )
      continue
    }
    const assets = (job.assets ?? []) as {
      assetId?: string
      kind?: string
      url?: string
      meta?: Record<string, unknown>
    }[]
    finding(
      `${receipt.name}: ${String(job.status)} after ${polls} poll(s) (${seconds} s); modelAlias ${JSON.stringify(job.modelAlias)}; plan ${JSON.stringify(job.plan)}; ${assets.length} asset(s): ${assets.map((asset) => `${asset.assetId} ${asset.kind} meta ${JSON.stringify(asset.meta ?? null)}`).join(' · ') || 'none'}${job.error ? `; error ${JSON.stringify(job.error)}` : ''}.`,
    )
    // The fetched-url result: what each presigned output answers from Node.
    for (const asset of assets) {
      if (!asset.url) {
        finding(`${receipt.name} · ${asset.assetId}: no url on the terminal read.`)
        continue
      }
      const got = await fetchAsset(asset.url)
      let kept: string | null = null
      if (got.bytes && asset.kind === 'image')
        kept = webpCopy(got.bytes, `output-${receipt.name}`, 640)
      if (got.bytes && asset.kind === 'document') {
        kept = `${receipt.name}-${asset.kind}.json`
        writeFileSync(join(recordDir, kept), Buffer.from(got.bytes))
      }
      captures.push({
        seq: (seq += 1),
        section: 'funded',
        title: `funded · GET the presigned url of ${asset.assetId} (${asset.kind}) — from Node`,
        method: 'GET',
        path: '(presigned storage url — not our API)',
        status: got.status,
        ms: got.ms,
        response: { contentType: got.type, bytes: got.bytes?.byteLength ?? 0, kept },
      })
      finding(
        `${receipt.name} · ${asset.assetId} (${asset.kind}): the presigned url answers ${got.status} ${got.type ?? ''} ${got.bytes?.byteLength ?? 0} bytes${kept ? `; kept as ${kept}` : ''}.`,
      )
    }
  }

  const walletAfter = await call('funded · wallet — after', 'GET', studio('/wallet'), {
    section: 'funded',
    file: 'after/wallet',
  })
  const after = (walletAfter.body as { availableCents?: number })?.availableCents
  finding(
    `Wallet after: ${JSON.stringify(walletAfter.body)} — ${typeof after === 'number' ? `${before - after} cents spent` : 'delta unknown'}.`,
  )
  const day = STAMP.slice(0, 10)
  const usage = await call(
    'funded · usage — today, by capability',
    'GET',
    studio(`/usage?from=${day}&to=${day}&group_by=capability`),
    { section: 'funded', file: 'after/usage-by-capability' },
  )
  finding(
    `Usage today by capability: ${usage.status} ${JSON.stringify((usage.body as { groups?: unknown })?.groups ?? usage.body)}.`,
  )
  await call('logout (funded owner)', 'POST', '/auth/logout', { quiet: true })
  writeFundedRecords(orgId)
  log(`\nrecord: ${recordDir}\nappended to ${SHAPES_PATH}`)
}

// ---------------------------------------------------------------------------
// `--render`: re-render findings.md and the shapes-doc section (and the
// supplement's and the funded proofs', when they exist) from the raw record.
// No wire.
// ---------------------------------------------------------------------------

function renderFromRecord() {
  const main = JSON.parse(readFileSync(join(RECORD_DIR, 'captures.json'), 'utf8')) as {
    run: string
    orgId: string | null
    owner: string
    captures: Capture[]
  }
  const summary = JSON.parse(readFileSync(join(RECORD_DIR, 'summary.json'), 'utf8')) as {
    capabilities: Record<Capability, CapabilityRow>
    voiceByPlan: Record<string, unknown>
    findings: string[]
  }
  // Strip what this record wrote before (and any supplement under it), then
  // re-append both from the raw files.
  const shapes = readFileSync(SHAPES_PATH, 'utf8')
  const at = shapes.indexOf('\n## HSN-0910 Phase 0 —')
  if (at >= 0) writeFileSync(SHAPES_PATH, shapes.slice(0, at + 1), 'utf8')

  recordDir = RECORD_DIR
  recordStamp = main.run
  recordOwner = main.owner
  orgIdForDisplay = main.orgId
  captures.splice(0, captures.length, ...main.captures)
  findings.splice(0, findings.length, ...summary.findings)
  Object.assign(rows, summary.capabilities)
  writeRecords(main.orgId, summary.voiceByPlan)

  const supplementPath = join(RECORD_DIR, 'supplement-motion', 'captures.json')
  if (existsSync(supplementPath)) {
    const supplement = JSON.parse(readFileSync(supplementPath, 'utf8')) as {
      run: string
      orgId: string | null
      owner: string
      captures: Capture[]
      findings: string[]
    }
    recordDir = join(RECORD_DIR, 'supplement-motion')
    recordStamp = supplement.run
    recordOwner = supplement.owner
    captures.splice(0, captures.length, ...supplement.captures)
    findings.splice(0, findings.length, ...supplement.findings)
    writeSupplementRecords(supplement.orgId)
  }
  const fundedPath = join(RECORD_DIR, FUNDED_DIR_NAME, 'captures.json')
  if (existsSync(fundedPath)) {
    const funded = JSON.parse(readFileSync(fundedPath, 'utf8')) as {
      run: string
      orgId: string | null
      owner: string
      captures: Capture[]
      findings: string[]
    }
    recordDir = join(RECORD_DIR, FUNDED_DIR_NAME)
    recordStamp = funded.run
    recordOwner = funded.owner
    captures.splice(0, captures.length, ...funded.captures)
    findings.splice(0, findings.length, ...funded.findings)
    writeFundedRecords(funded.orgId)
  }
  log(`re-rendered ${SHAPES_PATH} and the findings from ${RECORD_DIR}`)
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const option = (name: string) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1] : undefined
}

const run = flag('--render')
  ? Promise.resolve(renderFromRecord())
  : flag('--funded-proofs')
    ? fundedProofs(option('--image'))
    : flag('--motion-supplement')
      ? option('--owner')
        ? motionSupplement(option('--owner') as string)
        : Promise.reject(new Error('--motion-supplement needs --owner <email>'))
      : main()

run.catch((error) => {
  console.error(error)
  if (flag('--funded-proofs')) writeFundedRecords(orgIdForDisplay)
  else if (flag('--motion-supplement')) writeSupplementRecords(orgIdForDisplay)
  else if (!flag('--render')) writeRecords(orgIdForDisplay)
  process.exit(1)
})
