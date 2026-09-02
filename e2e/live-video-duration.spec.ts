/**
 * ORDER HSN-0902's `params.durationS` against the DEPLOYED API — the SHAPE
 * probe, zero spend, self-skipping on 402.
 *
 * The body is the video body `buildPostVisualRequest` builds (pinned at the
 * seam by `src/data/studio.test.ts`), with `params` as a TOP-LEVEL key. It
 * is sent through Playwright's request context, not the popup, because on a
 * zero wallet no draft can exist to open the popup on — the run that would
 * make one is refused with 402 first.
 *
 * What it proves without spending a cent (Phase 0 measured the same on org
 * 1692): a bad `durationS` is refused with 400 BEFORE the wallet check — the
 * field is known and a maximum is enforced upstream — and the valid body
 * clears validation, reaching the wallet, which refuses it with 402 on an
 * unfunded org. On that 402 the spec SELF-SKIPS with the honest reason (the
 * gate's 402 rule): the positive proof — the job accepts, the clip length
 * matches — rides on the founder's `LIVE_MEDIA=1` render (M-HSN-1 step 4).
 *
 * THE SHIELD: both tests read the wallet first and run ONLY when it is zero.
 * A funded org would pay for the valid body, so on a funded org they skip —
 * never a body that can mint a paid job on a funded org.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { readWallet, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}vd@alphapromena.com`
const ORG_NAME = `QA Video Duration Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

/** The video body as the app builds it — one post, inline tone, `params` top-level. */
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

const FUNDED_REASON =
  'the org is funded — a valid video body would mint a PAID job; the shape probe runs on a zero wallet only, and the positive proof is the founder’s LIVE_MEDIA=1 render (M-HSN-1)'

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Video Duration Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await login(page)
  const wallet = await readWallet(page, request)
  test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  const auth = { authorization: `Bearer ${wallet.token}` }
  const jobs = `${API_BASE}/orgs/${wallet.orgId}/alphastudio/media/jobs`

  const notANumber = await request.post(jobs, { headers: auth, data: videoBody('abc') })
  expect(notANumber.status()).toBe(400)
  const overMax = await request.post(jobs, { headers: auth, data: videoBody(999) })
  expect(overMax.status()).toBe(400)

  // Nothing moved: the wallet is still zero and no job exists.
  const after = await readWallet(page, request)
  expect(after.availableCents).toBe(0)
  const listed = (await (await request.get(jobs, { headers: auth })).json()) as { jobs: unknown[] }
  expect(listed.jobs).toEqual([])
})

test('the valid video body clears validation — and self-skips on 402, the positive proof riding on LIVE_MEDIA=1', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await login(page)
  const wallet = await readWallet(page, request)
  test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  const auth = { authorization: `Bearer ${wallet.token}` }
  const jobs = `${API_BASE}/orgs/${wallet.orgId}/alphastudio/media/jobs`

  const valid = await request.post(jobs, { headers: auth, data: videoBody(8) })
  // A 400 here would mean the SHAPE regressed — `params.durationS` no longer
  // clears the schema — which is the one red this spec exists to catch.
  expect(valid.status()).not.toBe(400)
  test.skip(
    valid.status() === 402,
    '402 wallet_insufficient: params.durationS cleared validation but the org cannot pay — the render proof is the founder’s LIVE_MEDIA=1 run (M-HSN-1 step 4)',
  )
  // Anything else on a ZERO wallet is unexpected and may have minted a job.
  throw new Error(
    `unexpected ${valid.status()} for the valid video body on a zero wallet — check /studio/jobs on org ${wallet.orgId}`,
  )
})
