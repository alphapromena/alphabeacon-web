# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-video-duration.spec.ts >> a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced
- Location: e2e\live-video-duration.spec.ts:86:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 402
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - img "Malaky" [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: Workspace
        - list [ref=e14]:
          - listitem [ref=e15]:
            - link "Dashboard" [ref=e16] [cursor=pointer]:
              - /url: /
          - listitem [ref=e23]:
            - link "Today" [ref=e24] [cursor=pointer]:
              - /url: /today
          - listitem [ref=e29]:
            - link "Generate" [ref=e30] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e34]:
            - link "Calendar" [ref=e35] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e39]:
            - link "Studio" [ref=e40] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e45]:
            - link "Analytics" [ref=e46] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e51]:
            - link "Connections" [ref=e52] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e56]:
            - link "Billing" [ref=e57] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e61]:
            - link "Settings" [ref=e62] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e68]:
        - generic [ref=e69]: Q
        - generic [ref=e71]: QA Video Duration Org 1789282619988023
      - button "Toggle Sidebar" [ref=e72]
    - generic [ref=e73]:
      - banner [ref=e74]:
        - button "Toggle Sidebar" [ref=e75]
        - generic [ref=e77]:
          - heading "Dashboard" [level=1] [ref=e78]
          - paragraph [ref=e79]: Good to see you, QA — nothing is waiting on you right now
        - generic [ref=e80]:
          - link "No balance yet — subscribe" [ref=e81] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=e83]
          - button "Switch to dark theme" [ref=e84]
          - button "Account menu" [ref=e85]:
            - generic [ref=e86]: QV
      - main [ref=e88]:
        - generic [ref=e89]:
          - region "Brand setup" [ref=e90]:
            - generic [ref=e91]:
              - heading "Finish setting up" [level=2] [ref=e92]
              - paragraph [ref=e93]: Finish these and this workspace can write. Each one has its own screen — do them in any order.
            - list [ref=e94]:
              - listitem [ref=e95]:
                - generic [ref=e96]:
                  - generic [ref=e99]: Brand voice
                  - generic [ref=e100]: The rules every draft follows, whatever tone it is written in.
                - link "Set up Brand voice" [ref=e101] [cursor=pointer]:
                  - /url: /settings/brand-voice
                  - text: Set up
                  - generic [ref=e102]: Brand voice
              - listitem [ref=e103]:
                - generic [ref=e104]:
                  - generic [ref=e107]: At least one tone
                  - generic [ref=e108]: How a draft should sound. Nothing generates without one.
                - link "Set up At least one tone" [ref=e109] [cursor=pointer]:
                  - /url: /settings/tones
                  - text: Set up
                  - generic [ref=e110]: At least one tone
              - listitem [ref=e111]:
                - generic [ref=e112]:
                  - generic [ref=e115]: Sources
                  - generic [ref=e116]: What drafts read before they write.
                - link "Set up Sources" [ref=e117] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e118]: Sources
              - listitem [ref=e119]:
                - generic [ref=e120]:
                  - generic [ref=e123]: Topics
                  - generic [ref=e124]: What this workspace talks about.
                - link "Set up Topics" [ref=e125] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e126]: Topics
              - listitem [ref=e127]:
                - generic [ref=e128]:
                  - generic [ref=e131]: Country
                  - generic [ref=e132]: Needed for holidays — drafts work around your calendar. (optional for generating)
                - link "Set up Country" [ref=e133] [cursor=pointer]:
                  - /url: /settings/organization
                  - text: Set up
                  - generic [ref=e134]: Country
              - listitem [ref=e135]:
                - generic [ref=e136]:
                  - generic [ref=e139]: Posting rhythm
                  - generic [ref=e140]: Needed for scheduled posting — which days, and how many. (optional for generating)
                - link "Set up Posting rhythm" [ref=e141] [cursor=pointer]:
                  - /url: /calendar/settings
                  - text: Set up
                  - generic [ref=e142]: Posting rhythm
          - region "Key stats" [ref=e143]:
            - link "Drafts awaiting review 0" [ref=e144] [cursor=pointer]:
              - /url: /today
              - generic [ref=e145]:
                - generic [ref=e146]: Drafts awaiting review
                - generic [ref=e152]: "0"
            - link "Scheduled this week 0" [ref=e154] [cursor=pointer]:
              - /url: /calendar
              - generic [ref=e155]:
                - generic [ref=e156]: Scheduled this week
                - generic [ref=e162]: "0"
            - link "Available balance $0.00 Needs attention" [ref=e164] [cursor=pointer]:
              - /url: /billing
              - generic [ref=e165]:
                - generic [ref=e166]: Available balance
                - generic [ref=e174]:
                  - generic [ref=e175]: $0.00
                  - generic [ref=e176]: Needs attention
            - link "Connections needing attention 0" [ref=e177] [cursor=pointer]:
              - /url: /connections
              - generic [ref=e178]:
                - generic [ref=e179]: Connections needing attention
                - generic [ref=e184]: "0"
          - generic [ref=e186]:
            - region "Go to" [ref=e187]:
              - heading "Go to" [level=2] [ref=e188]
              - generic [ref=e189]:
                - link "Today's queue Approve, edit, reject" [ref=e190] [cursor=pointer]:
                  - /url: /today
                  - generic [ref=e191]: Today's queue
                  - generic [ref=e195]: Approve, edit, reject
                - link "Generate A post, on demand" [ref=e196] [cursor=pointer]:
                  - /url: /generate
                  - generic [ref=e197]: Generate
                  - generic [ref=e200]: A post, on demand
                - link "Calendar What is scheduled, and how it did" [ref=e201] [cursor=pointer]:
                  - /url: /calendar
                  - generic [ref=e202]: Calendar
                  - generic [ref=e205]: What is scheduled, and how it did
                - link "Creative Studio Images and video" [ref=e206] [cursor=pointer]:
                  - /url: /studio
                  - generic [ref=e207]: Creative Studio
                  - generic [ref=e211]: Images and video
                - link "Analytics Reach and engagement" [ref=e212] [cursor=pointer]:
                  - /url: /analytics
                  - generic [ref=e213]: Analytics
                  - generic [ref=e216]: Reach and engagement
                - link "Connections Channels and permissions" [ref=e217] [cursor=pointer]:
                  - /url: /connections
                  - generic [ref=e218]: Connections
                  - generic [ref=e221]: Channels and permissions
                - link "Billing Plan and balance" [ref=e222] [cursor=pointer]:
                  - /url: /billing
                  - generic [ref=e223]: Billing
                  - generic [ref=e226]: Plan and balance
                - link "Settings Brand voice, tones, team" [ref=e227] [cursor=pointer]:
                  - /url: /settings
                  - generic [ref=e228]: Settings
                  - generic [ref=e232]: Brand voice, tones, team
            - region "Notifications and activity" [ref=e233]:
              - heading "Notifications & activity" [level=2] [ref=e235]
              - radiogroup "Filter the feed" [ref=e239]:
                - radio "All" [checked] [ref=e240]
                - radio "Notifications" [ref=e241]
                - radio "Activity" [ref=e242]
              - generic [ref=e244]:
                - generic [ref=e246]: Nothing here yet
                - generic [ref=e247]: You're all caught up.
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * ORDER HSN-0902's `params.durationS` against the DEPLOYED API — the SHAPE
  3   |  * probe, zero spend, self-skipping on 402.
  4   |  *
  5   |  * The body is the video body `buildPostVisualRequest` builds (pinned at the
  6   |  * seam by `src/data/studio.test.ts`), with `params` as a TOP-LEVEL key. It
  7   |  * is sent through Playwright's request context, not the popup, because on a
  8   |  * zero wallet no draft can exist to open the popup on — the run that would
  9   |  * make one is refused with 402 first.
  10  |  *
  11  |  * What it proves without spending a cent (Phase 0 measured the same on org
  12  |  * 1692): a bad `durationS` is refused with 400 BEFORE the wallet check — the
  13  |  * field is known and a maximum is enforced upstream — and the valid body
  14  |  * clears validation, reaching the wallet, which refuses it with 402 on an
  15  |  * unfunded org. On that 402 the spec SELF-SKIPS with the honest reason (the
  16  |  * gate's 402 rule): the positive proof — the job accepts, the clip length
  17  |  * matches — rides on the founder's `LIVE_MEDIA=1` render (M-HSN-1 step 4).
  18  |  *
  19  |  * THE SHIELD: both tests read the wallet first and run ONLY when it is zero.
  20  |  * A funded org would pay for the valid body, so on a funded org they skip —
  21  |  * never a body that can mint a paid job on a funded org.
  22  |  */
  23  | import type { Page } from '@playwright/test'
  24  | import { expect, test } from './fixtures'
  25  | import { readWallet, signUpAndEnter } from './live-setup'
  26  | import { runStamp } from './live-setup'
  27  | 
  28  | const API_BASE = process.env.VITE_API_BASE_URL
  29  | const RUN = runStamp()
  30  | const PASSWORD = 'Roasted2Order!'
  31  | const owner = `qa+${RUN}vd@alphapromena.com`
  32  | const ORG_NAME = `QA Video Duration Org ${RUN}`
  33  | 
  34  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  35  | test.describe.configure({ mode: 'serial' })
  36  | 
  37  | async function login(page: Page) {
  38  |   await page.goto('/login')
  39  |   await page.getByLabel('Work email').fill(owner)
  40  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  41  |   await page.getByRole('button', { name: 'Sign in' }).click()
  42  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  43  |     timeout: 20_000,
  44  |   })
  45  | }
  46  | 
  47  | /** The video body as the app builds it — one post, inline tone, `params` top-level. */
  48  | function videoBody(durationS: unknown) {
  49  |   return {
  50  |     capability: 'social-posts.media',
  51  |     plan: 'balanced',
  52  |     kind: 'video',
  53  |     posts: [
  54  |       {
  55  |         ref: 'hsn-0902-shape-probe',
  56  |         content:
  57  |           'This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.',
  58  |         tone: {
  59  |           id: 'hsn-0902-probe-tone',
  60  |           name: 'Roastery floor',
  61  |           description: 'Warm, specific, smells of coffee.',
  62  |           rules: [{ kind: 'do', text: 'Name the roast date' }],
  63  |         },
  64  |       },
  65  |     ],
  66  |     style: { imgStyle: 'Cinematic', text: true, logo: true },
  67  |     guidance: [],
  68  |     params: { durationS },
  69  |     collection: { use: true },
  70  |   }
  71  | }
  72  | 
  73  | const FUNDED_REASON =
  74  |   'the org is funded — a valid video body would mint a PAID job; the shape probe runs on a zero wallet only, and the positive proof is the founder’s LIVE_MEDIA=1 render (M-HSN-1)'
  75  | 
  76  | test('a fresh owner + org, made through the product', async ({ page }) => {
  77  |   test.setTimeout(150_000)
  78  |   await signUpAndEnter(page, {
  79  |     name: 'QA Video Duration Owner',
  80  |     email: owner,
  81  |     password: PASSWORD,
  82  |     orgName: ORG_NAME,
  83  |   })
  84  | })
  85  | 
  86  | test('a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced', async ({
  87  |   page,
  88  |   request,
  89  | }) => {
  90  |   test.setTimeout(120_000)
  91  |   await login(page)
  92  |   const wallet = await readWallet(page, request)
  93  |   test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  94  |   const auth = { authorization: `Bearer ${wallet.token}` }
  95  |   const jobs = `${API_BASE}/orgs/${wallet.orgId}/alphastudio/media/jobs`
  96  | 
  97  |   const notANumber = await request.post(jobs, { headers: auth, data: videoBody('abc') })
  98  |   expect(notANumber.status()).toBe(400)
  99  |   const overMax = await request.post(jobs, { headers: auth, data: videoBody(999) })
> 100 |   expect(overMax.status()).toBe(400)
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  101 | 
  102 |   // Nothing moved: the wallet is still zero and no job exists.
  103 |   const after = await readWallet(page, request)
  104 |   expect(after.availableCents).toBe(0)
  105 |   const listed = (await (await request.get(jobs, { headers: auth })).json()) as { jobs: unknown[] }
  106 |   expect(listed.jobs).toEqual([])
  107 | })
  108 | 
  109 | test('the valid video body clears validation — and self-skips on 402, the positive proof riding on LIVE_MEDIA=1', async ({
  110 |   page,
  111 |   request,
  112 | }) => {
  113 |   test.setTimeout(120_000)
  114 |   await login(page)
  115 |   const wallet = await readWallet(page, request)
  116 |   test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  117 |   const auth = { authorization: `Bearer ${wallet.token}` }
  118 |   const jobs = `${API_BASE}/orgs/${wallet.orgId}/alphastudio/media/jobs`
  119 | 
  120 |   const valid = await request.post(jobs, { headers: auth, data: videoBody(8) })
  121 |   // A 400 here would mean the SHAPE regressed — `params.durationS` no longer
  122 |   // clears the schema — which is the one red this spec exists to catch.
  123 |   expect(valid.status()).not.toBe(400)
  124 |   test.skip(
  125 |     valid.status() === 402,
  126 |     '402 wallet_insufficient: params.durationS cleared validation but the org cannot pay — the render proof is the founder’s LIVE_MEDIA=1 run (M-HSN-1 step 4)',
  127 |   )
  128 |   // Anything else on a ZERO wallet is unexpected and may have minted a job.
  129 |   throw new Error(
  130 |     `unexpected ${valid.status()} for the valid video body on a zero wallet — check /studio/jobs on org ${wallet.orgId}`,
  131 |   )
  132 | })
  133 | 
```