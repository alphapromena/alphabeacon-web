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
        - list [ref=e16]:
          - listitem [ref=e17]:
            - link "Dashboard" [ref=e18] [cursor=pointer]:
              - /url: /
          - listitem [ref=e25]:
            - link "Today" [ref=e26] [cursor=pointer]:
              - /url: /today
          - listitem [ref=e31]:
            - link "Generate" [ref=e32] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e36]:
            - link "Calendar" [ref=e37] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e41]:
            - link "Studio" [ref=e42] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e47]:
            - link "Analytics" [ref=e48] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e53]:
            - link "Connections" [ref=e54] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e58]:
            - link "Billing" [ref=e59] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e63]:
            - link "Settings" [ref=e64] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e70]:
        - generic [ref=e71]: Q
        - generic [ref=e73]: QA Video Duration Org 1789501360361744
      - button "Toggle Sidebar" [ref=e74]
    - generic [ref=e75]:
      - banner [ref=e76]:
        - button "Toggle Sidebar" [ref=e77]
        - generic [ref=e79]:
          - heading "Dashboard" [level=1] [ref=e80]
          - paragraph [ref=e81]: Good to see you, QA — nothing is waiting on you right now
        - generic [ref=e82]:
          - link "No balance yet — subscribe" [ref=e83] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=e85]
          - button "Account menu" [ref=e86]:
            - generic [ref=e87]: QV
      - main [ref=e89]:
        - generic [ref=e90]:
          - region "Brand setup" [ref=e91]:
            - generic [ref=e92]:
              - heading "Finish setting up" [level=2] [ref=e93]
              - paragraph [ref=e94]: Finish these and this workspace can write. Each one has its own screen — do them in any order.
            - list [ref=e95]:
              - listitem [ref=e96]:
                - generic [ref=e97]:
                  - generic [ref=e100]: Brand voice
                  - generic [ref=e101]: The rules every draft follows, whatever tone it is written in.
                - link "Set up Brand voice" [ref=e102] [cursor=pointer]:
                  - /url: /settings/brand-voice
                  - text: Set up
                  - generic [ref=e103]: Brand voice
              - listitem [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e108]: At least one tone
                  - generic [ref=e109]: How a draft should sound. Nothing generates without one.
                - link "Set up At least one tone" [ref=e110] [cursor=pointer]:
                  - /url: /settings/tones
                  - text: Set up
                  - generic [ref=e111]: At least one tone
              - listitem [ref=e112]:
                - generic [ref=e113]:
                  - generic [ref=e116]: Sources
                  - generic [ref=e117]: What drafts read before they write.
                - link "Set up Sources" [ref=e118] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e119]: Sources
              - listitem [ref=e120]:
                - generic [ref=e121]:
                  - generic [ref=e124]: Topics
                  - generic [ref=e125]: What this workspace talks about.
                - link "Set up Topics" [ref=e126] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e127]: Topics
              - listitem [ref=e128]:
                - generic [ref=e129]:
                  - generic [ref=e132]: Country
                  - generic [ref=e133]: Needed for holidays — drafts work around your calendar. (optional for generating)
                - link "Set up Country" [ref=e134] [cursor=pointer]:
                  - /url: /settings/organization
                  - text: Set up
                  - generic [ref=e135]: Country
              - listitem [ref=e136]:
                - generic [ref=e137]:
                  - generic [ref=e140]: Posting rhythm
                  - generic [ref=e141]: Needed for scheduled posting — which days, and how many. (optional for generating)
                - link "Set up Posting rhythm" [ref=e142] [cursor=pointer]:
                  - /url: /calendar/settings
                  - text: Set up
                  - generic [ref=e143]: Posting rhythm
          - region "Key stats" [ref=e144]:
            - link "Drafts awaiting review 0" [ref=e145] [cursor=pointer]:
              - /url: /today
              - generic [ref=e146]:
                - generic [ref=e147]: Drafts awaiting review
                - generic [ref=e153]: "0"
            - link "Scheduled this week 0" [ref=e155] [cursor=pointer]:
              - /url: /calendar
              - generic [ref=e156]:
                - generic [ref=e157]: Scheduled this week
                - generic [ref=e163]: "0"
            - link "Available balance $0.00 Needs attention" [ref=e165] [cursor=pointer]:
              - /url: /billing
              - generic [ref=e166]:
                - generic [ref=e167]: Available balance
                - generic [ref=e175]:
                  - generic [ref=e176]: $0.00
                  - generic [ref=e177]: Needs attention
            - link "Connections needing attention 0" [ref=e178] [cursor=pointer]:
              - /url: /connections
              - generic [ref=e179]:
                - generic [ref=e180]: Connections needing attention
                - generic [ref=e185]: "0"
          - generic [ref=e187]:
            - region "Go to" [ref=e188]:
              - heading "Go to" [level=2] [ref=e189]
              - generic [ref=e190]:
                - link "Today's queue Approve, edit, reject" [ref=e191] [cursor=pointer]:
                  - /url: /today
                  - generic [ref=e192]: Today's queue
                  - generic [ref=e196]: Approve, edit, reject
                - link "Generate A post, on demand" [ref=e197] [cursor=pointer]:
                  - /url: /generate
                  - generic [ref=e198]: Generate
                  - generic [ref=e201]: A post, on demand
                - link "Calendar What is scheduled, and how it did" [ref=e202] [cursor=pointer]:
                  - /url: /calendar
                  - generic [ref=e203]: Calendar
                  - generic [ref=e206]: What is scheduled, and how it did
                - link "Creative Studio Images and video" [ref=e207] [cursor=pointer]:
                  - /url: /studio
                  - generic [ref=e208]: Creative Studio
                  - generic [ref=e212]: Images and video
                - link "Analytics Reach and engagement" [ref=e213] [cursor=pointer]:
                  - /url: /analytics
                  - generic [ref=e214]: Analytics
                  - generic [ref=e217]: Reach and engagement
                - link "Connections Channels and permissions" [ref=e218] [cursor=pointer]:
                  - /url: /connections
                  - generic [ref=e219]: Connections
                  - generic [ref=e222]: Channels and permissions
                - link "Billing Plan and balance" [ref=e223] [cursor=pointer]:
                  - /url: /billing
                  - generic [ref=e224]: Billing
                  - generic [ref=e227]: Plan and balance
                - link "Settings Brand voice, tones, team" [ref=e228] [cursor=pointer]:
                  - /url: /settings
                  - generic [ref=e229]: Settings
                  - generic [ref=e233]: Brand voice, tones, team
            - region "Notifications and activity" [ref=e234]:
              - heading "Notifications & activity" [level=2] [ref=e236]
              - radiogroup "Filter the feed" [ref=e240]:
                - radio "All" [checked] [ref=e241]
                - radio "Notifications" [ref=e242]
                - radio "Activity" [ref=e243]
              - generic [ref=e245]:
                - generic [ref=e247]: Approvals and alerts land here
                - generic [ref=e248]: You're all caught up.
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