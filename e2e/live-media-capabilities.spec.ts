/**
 * ORDER HSN-0910's 13 capabilities against the DEPLOYED API — the SHAPE
 * proofs, at zero spend, on a fresh QA org.
 *
 * The bodies are the ones the table builds (`src/data/media-capabilities.ts`
 * — the document's own examples, with our own uploaded assets where a url or
 * an id is required). On a ZERO wallet the door itself tells the two apart:
 * a valid body clears validation and stops at the wallet with 402; the
 * document's trap is refused with 400 BEFORE the wallet. Phase 0 measured
 * exactly this on orgs 1823/1824 (`Docs/qa/hsn-0910/phase0/`); this spec is
 * the standing proof that the shapes have not moved.
 *
 * THE SHIELD (the founder's 402 rule, HSN-0902): the wallet is read first and
 * the bodies are sent ONLY when it is zero — on a funded org this skips,
 * because a valid body there would mint a paid job. The funded proofs are
 * the founder's `LIVE_MEDIA=1` supplement, recorded in Phase 0.
 *
 * Two wire facts from Phase 0 stand as the assertions here, on purpose:
 * `motion.generate` clears WITHOUT `lang` (item 57), and five
 * `referenceImages` on `photoshoot.generate` answer 502, not 400 (item 58).
 */
import type { APIRequestContext, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { completeBrandSetup, readWallet, signUpAndEnter } from './live-setup'
import { runStamp } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = runStamp()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}mc@alphapromena.com`
const ORG_NAME = `QA Media Capabilities Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

const FUNDED_REASON =
  'the org is funded — a valid body would mint a PAID job; the shape proofs run on a zero wallet only (the founder’s 402 rule), and the funded proofs are Phase 0’s LIVE_MEDIA=1 supplement'

/** A valid 1×1 PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

/** presign → PUT → read url, the media door as the app walks it. */
async function uploadPng(
  request: APIRequestContext,
  auth: Record<string, string>,
  orgId: string,
  desc: string,
): Promise<{ assetId: string; url: string }> {
  const presign = await request.post(`${API_BASE}/orgs/${orgId}/alphastudio/media/assets/presign`, {
    headers: auth,
    data: { mediaType: 'image/png', desc },
  })
  expect(presign.status(), await presign.text()).toBe(201)
  const ticket = (await presign.json()) as { assetId: string; uploadUrl: string; mediaType: string }
  const put = await request.put(ticket.uploadUrl, {
    headers: { 'content-type': ticket.mediaType },
    data: PNG,
  })
  expect(put.status()).toBe(200)
  const read = await request.post(
    `${API_BASE}/orgs/${orgId}/alphastudio/media/assets/${ticket.assetId}/presign`,
    { headers: auth },
  )
  expect(read.status()).toBe(200)
  return { assetId: ticket.assetId, url: ((await read.json()) as { url: string }).url }
}

const G = (role: string, text: string) => ({ role, text })

/** The document's example per capability, with our assets; and its trap. */
function bodies(urlA: string, urlB: string, assetA: string, assetV: string) {
  const valid: Record<string, unknown> = {
    'media.generate': {
      capability: 'media.generate',
      plan: 'balanced',
      kind: 'image',
      prompt: 'a flat-vector report cover, deep navy, generous negative space',
      params: { aspectRatio: '1:1', outputFormat: 'png' },
      origin: { kind: 'standalone', ref: 'live-media-capabilities' },
    },
    'images.edit': {
      capability: 'images.edit',
      instruction: 'replace the background with a plain deep-navy studio backdrop',
      params: { referenceImages: [urlA], aspectRatio: '1:1', outputFormat: 'png' },
    },
    'photoshoot.generate': {
      capability: 'photoshoot.generate',
      params: { referenceImages: [urlA, urlB], aspectRatio: '1:1', outputFormat: 'png' },
      guidance: [G('scene', 'on a brushed-steel table'), G('style', 'soft key light')],
    },
    'brand-assets.generate': {
      capability: 'brand-assets.generate',
      params: { count: 2 },
      guidance: [G('subject', "a wordmark for 'Alpha Pro MENA'"), G('style', 'flat, minimal')],
    },
    'logos.generate': {
      capability: 'logos.generate',
      plan: 'balanced',
      params: { count: 1, aspectRatio: '1:1', outputFormat: 'png' },
      guidance: [G('headline', 'Alpha Pro MENA'), G('style', 'flat, geometric')],
    },
    'logos.redesign': {
      capability: 'logos.redesign',
      plan: 'balanced',
      params: { referenceImages: [urlA], count: 1, aspectRatio: '1:1', outputFormat: 'png' },
    },
    'avatars.generate': {
      capability: 'avatars.generate',
      params: { referenceImages: [urlA], count: 1 },
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
    },
    'video-ads.generate': {
      capability: 'video-ads.generate',
      plan: 'balanced',
      params: { imageUrl: urlA, durationS: 5 },
      guidance: [G('motion', 'slow push-in, the product turning once')],
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
        { sec: 2, speak: 'none', camera: 'wide establishing shot of a sunlit café' },
        { sec: 1, camera: 'slow push toward a coffee cup' },
      ],
    },
    // No `lang`: the document's `lang: "ar"` is refused on its own (item 57).
    'motion.generate': {
      capability: 'motion.generate',
      plan: 'balanced',
      image: assetA,
      video: assetV,
      orientation: 'image',
      keepSound: true,
    },
  }
  const traps: { capability: string; name: string; expect: number; body: unknown }[] = [
    {
      capability: 'images.edit',
      name: 'two referenceImages',
      expect: 400,
      body: {
        ...(valid['images.edit'] as object),
        params: { referenceImages: [urlA, urlB], aspectRatio: '1:1', outputFormat: 'png' },
      },
    },
    {
      // Above four the upstream FAILS instead of validating (item 58) — the
      // measured shape, asserted as such until Hasan changes it.
      capability: 'photoshoot.generate',
      name: 'five referenceImages',
      expect: 502,
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
      name: 'count 1',
      expect: 400,
      body: { ...(valid['brand-assets.generate'] as object), params: { count: 1 } },
    },
    {
      capability: 'logos.generate',
      name: 'count 21',
      expect: 400,
      body: {
        ...(valid['logos.generate'] as object),
        params: { count: 21, aspectRatio: '1:1', outputFormat: 'png' },
      },
    },
    {
      capability: 'logos.redesign',
      name: 'no referenceImages',
      expect: 400,
      body: {
        ...(valid['logos.redesign'] as object),
        params: { count: 1, aspectRatio: '1:1', outputFormat: 'png' },
      },
    },
    {
      capability: 'avatars.generate',
      name: 'count 9',
      expect: 400,
      body: {
        ...(valid['avatars.generate'] as object),
        params: { referenceImages: [urlA], count: 9 },
      },
    },
    {
      capability: 'avatars.imagine',
      name: '601-char instruction',
      expect: 400,
      body: { ...(valid['avatars.imagine'] as object), instruction: 'x'.repeat(601) },
    },
    {
      capability: 'avatar.generate',
      name: 'count 9',
      expect: 400,
      body: {
        ...(valid['avatar.generate'] as object),
        params: { count: 9, referenceImages: [urlA], aspectRatio: '3:2' },
      },
    },
    {
      capability: 'video-ads.generate',
      name: 'durationS 8',
      expect: 400,
      body: {
        ...(valid['video-ads.generate'] as object),
        params: { imageUrl: urlA, durationS: 8 },
      },
    },
    {
      capability: 'video-ads.generate',
      name: 'aspectRatio',
      expect: 400,
      body: {
        ...(valid['video-ads.generate'] as object),
        params: { imageUrl: urlA, durationS: 5, aspectRatio: '16:9' },
      },
    },
    {
      capability: 'voice.speak',
      name: 'an unapproved voice',
      expect: 400,
      body: {
        ...(valid['voice.speak'] as object),
        params: { voice: 'NotAnApprovedVoice', lang: 'en', stability: 0.5 },
      },
    },
    {
      capability: 'voice.speak',
      name: 'similarity on precise',
      expect: 400,
      body: {
        ...(valid['voice.speak'] as object),
        plan: 'precise',
        params: { voice: 'Rachel', lang: 'en', stability: 0.5, similarity: 0.75 },
      },
    },
    {
      capability: 'film.generate',
      name: 'resolution on balanced',
      expect: 400,
      body: { ...(valid['film.generate'] as object), resolution: '720p' },
    },
    {
      capability: 'film.generate',
      name: 'scenes that do not sum',
      expect: 400,
      body: {
        ...(valid['film.generate'] as object),
        scenes: [
          { sec: 2, camera: 'wide' },
          { sec: 2, camera: 'push' },
        ],
      },
    },
    {
      capability: 'motion.generate',
      name: 'no orientation',
      expect: 400,
      body: {
        capability: 'motion.generate',
        plan: 'balanced',
        image: assetA,
        video: assetV,
        keepSound: true,
      },
    },
    {
      capability: 'motion.generate',
      name: 'lang ar (item 57)',
      expect: 400,
      body: { ...(valid['motion.generate'] as object), lang: 'ar' },
    },
    {
      capability: 'media.generate',
      name: 'an unknown params key',
      expect: 400,
      body: {
        ...(valid['media.generate'] as object),
        params: { aspectRatio: '1:1', outputFormat: 'png', foo: 'bar' },
      },
    },
  ]
  return { valid, traps }
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Media Capabilities Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend', async ({
  page,
  request,
}) => {
  test.setTimeout(300_000)
  await login(page)
  const wallet = await readWallet(page, request)
  test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  const auth = { authorization: `Bearer ${wallet.token}` }
  const base = `${API_BASE}/orgs/${wallet.orgId}/alphastudio`

  // Two references and a clip of our own — the presign door, exactly as the app walks it.
  const a = await uploadPng(request, auth, wallet.orgId, 'live-media-capabilities — reference A')
  const b = await uploadPng(request, auth, wallet.orgId, 'live-media-capabilities — reference B')
  const clip = await request.post(`${base}/media/assets/presign`, {
    headers: auth,
    data: { mediaType: 'video/mp4', desc: 'live-media-capabilities — a clip' },
  })
  expect(clip.status(), await clip.text()).toBe(201)
  const clipTicket = (await clip.json()) as {
    assetId: string
    uploadUrl: string
    mediaType: string
  }
  // A 24-byte ftyp stub: the zero-wallet probe validates the BODY, not the bytes (Phase 0).
  const put = await request.put(clipTicket.uploadUrl, {
    headers: { 'content-type': clipTicket.mediaType },
    data: Buffer.from([
      0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 2, 0, 105, 115, 111, 109, 105, 115,
      111, 50,
    ]),
  })
  expect(put.status()).toBe(200)

  const { valid, traps } = bodies(a.url, b.url, a.assetId, clipTicket.assetId)
  const granted: string[] = []
  for (const capability of Object.keys(valid)) {
    const catalog = await request.get(`${base}/catalog/capabilities/${capability}`, {
      headers: auth,
    })
    // A 404 is unknown OR not granted, identically: listed nowhere, sent nothing.
    if (catalog.status() === 200) granted.push(capability)
  }
  expect(granted.length).toBeGreaterThan(0)

  for (const capability of granted) {
    const answer = await request.post(`${base}/media/jobs`, {
      headers: auth,
      data: valid[capability],
    })
    expect(answer.status(), `${capability} valid body: ${await answer.text()}`).toBe(402)
  }
  for (const trap of traps) {
    if (!granted.includes(trap.capability)) continue
    const answer = await request.post(`${base}/media/jobs`, { headers: auth, data: trap.body })
    expect(answer.status(), `${trap.capability} · ${trap.name}: ${await answer.text()}`).toBe(
      trap.expect,
    )
  }

  // Nothing moved: the wallet is still zero and no job exists.
  const after = await readWallet(page, request)
  expect(after.availableCents).toBe(0)
  const listed = (await (await request.get(`${base}/media/jobs`, { headers: auth })).json()) as {
    jobs: unknown[]
  }
  expect(listed.jobs).toEqual([])

  // Leave nothing behind.
  for (const assetId of [a.assetId, b.assetId, clipTicket.assetId]) {
    const del = await request.delete(`${base}/media/assets/${assetId}`, { headers: auth })
    expect(del.status()).toBe(204)
  }
})

test('the Studio grid lists what the catalog grants, by name, with the catalog’s price', async ({
  page,
}) => {
  test.setTimeout(300_000)
  await login(page)
  // The readiness gate reaches the capability composers too (D-ONB-D): a
  // fresh org opens a card onto "finish your brand setup first", so the
  // composer is only reachable once the four brand entities exist.
  await completeBrandSetup(page, {
    toneName: 'Roastery floor',
    toneDescription: 'Warm, specific, smells of coffee.',
    doRule: 'Name the roast date',
  })
  // A fresh load after the setup (live-create-visual starts a new test for
  // the same reason): the readiness gate reads the synced brand state, which
  // a reload settles. Not `login()` — a signed-in `/login` redirects home
  // before the form exists, and the fill waits for the whole test budget.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await page.getByRole('link', { name: 'Studio', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Studio', level: 1 })).toBeVisible()
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Generate', exact: true }),
  ).toBeVisible({
    timeout: 40_000,
  })
  await expect(page.getByRole('link', { name: 'Voiceover', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Motion transfer', exact: true })).toBeVisible()
  // A real decimal-string price, rendered as money, from the wire.
  await expect(page.getByText(/from \$0\.03 per image/).first()).toBeVisible()
  // No vendor name may ever appear — the catalog speaks only in app aliases.
  const body = (await page.getByRole('main').textContent()) ?? ''
  for (const vendor of ['openai', 'gpt', 'bedrock', 'replicate', 'fal', 'runware', 'nano banana']) {
    expect(body.toLowerCase()).not.toContain(vendor)
  }
  // The composer reads the catalog: the approved voices are in the select,
  // and the row the plan resolved to is named — both from the wire.
  await page.getByRole('main').getByRole('link', { name: 'Voiceover', exact: true }).click()
  // The composer, not the gate: its own heading first, so a blocked org fails
  // with the reason rather than on a control that was never rendered.
  await expect(page.getByRole('heading', { name: 'Voiceover', level: 2 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  // The select's accessible name carries the required marker ("Voice
  // (required)"), so it is found by role and a prefix, never by an exact label.
  const voice = page.getByRole('combobox', { name: /^Voice/ })
  await expect(voice).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(voice.locator('option', { hasText: 'Rachel' })).toHaveCount(1, {
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByText(/Rendering on Voice \(fast\)/)).toBeVisible({ timeout: SCREEN_SYNC })
})
