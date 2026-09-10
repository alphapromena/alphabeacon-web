# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-notifications.spec.ts >> the inbox endpoints hold their contract, and the bell tells the truth
- Location: e2e\live-notifications.spec.ts:33:1

# Error details

```
Error: GET /me/orgs → 429 {"Reason":"ConcurrentInvocationLimitExceeded","Type":"User","message":"Rate Exceeded."}

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 429
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
        - generic [ref=e71]: QA Inbox Org 1789044809842189
      - button "Toggle Sidebar" [ref=e72]
    - generic [ref=e73]:
      - banner [ref=e74]:
        - button "Toggle Sidebar" [ref=e75]
        - generic [ref=e77]:
          - heading "Dashboard" [level=1] [ref=e78]
          - paragraph [ref=e79]: Good to see you, QA — nothing is waiting on you right now
        - generic [ref=e80]:
          - link "Loading balance…" [ref=e81] [cursor=pointer]:
            - /url: /billing/balance
          - button "Notifications" [ref=e83]
          - button "Switch to dark theme" [ref=e84]
          - button "Account menu" [ref=e85]:
            - generic [ref=e86]: QI
      - main [ref=e88]:
        - generic [ref=e89]:
          - status "Loading dashboard" [ref=e90]
          - status "Loading list" [ref=e105]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * INT-5's verify: the notification inbox against the DEPLOYED API — list
  3   |  * (default 50), unread-count for the badge, read-all (idempotent), unknown
  4   |  * kinds rendering generically, and action links resolving defensively.
  5   |  *
  6   |  * Nothing client-side can WRITE a notification (they are raised by the
  7   |  * producing features), so the wire assertions run against whatever the inbox
  8   |  * holds — including the empty inbox, which is itself a designed state.
  9   |  */
  10  | import type { Page } from '@playwright/test'
  11  | import { expect, test } from './fixtures'
  12  | import { signUpAndEnter } from './live-setup'
  13  | import { runStamp } from './live-setup'
  14  | 
  15  | const API_BASE = process.env.VITE_API_BASE_URL
  16  | const RUN = runStamp()
  17  | const PASSWORD = 'Roasted2Order!'
  18  | const owner = `qa+${RUN}n@alphapromena.com`
  19  | const ORG_NAME = `QA Inbox Org ${RUN}`
  20  | 
  21  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  22  | test.describe.configure({ mode: 'serial' })
  23  | 
  24  | async function sessionToken(page: Page): Promise<string> {
  25  |   const raw = await page.evaluate(
  26  |     () =>
  27  |       window.sessionStorage.getItem('ab-live-session') ??
  28  |       window.localStorage.getItem('ab-live-session'),
  29  |   )
  30  |   return (JSON.parse(raw!) as { token: string }).token
  31  | }
  32  | 
  33  | test('the inbox endpoints hold their contract, and the bell tells the truth', async ({
  34  |   page,
  35  |   request,
  36  | }) => {
  37  |   // Signup + verify + the whole wizard + Finish + three wire reads does not
  38  |   // fit the suite's 30 s default. Finish also got three round-trips longer
  39  |   // when it became idempotent (E2E-0820 B7): it reads /me/orgs, the org's
  40  |   // tones and its schedules before writing anything.
  41  |   test.setTimeout(150_000)
  42  |   // A fresh owner with a workspace, made the way the product makes one.
  43  |   // GATE-0910 §3.4: this file reads an inbox and marks it read, which holds
  44  |   // on a used org too — so it opts into the org pool when a run turns it on.
  45  |   await signUpAndEnter(
  46  |     page,
  47  |     { name: 'QA Inbox Owner', email: owner, password: PASSWORD, orgName: ORG_NAME },
  48  |     { pool: true },
  49  |   )
  50  | 
  51  |   const token = await sessionToken(page)
  52  |   const auth = { authorization: `Bearer ${token}` }
  53  |   const orgsRes = await request.get(`${API_BASE}/me/orgs`, { headers: auth })
  54  |   // The status before the shape: a limiter's 429 or a cold 5xx then reads as
  55  |   // itself, not as a TypeError on `items` — which is how the first parallel
  56  |   // smoke of `pnpm gate` lost this file (GATE-0910 §3.2).
  57  |   expect(
  58  |     orgsRes.status(),
  59  |     `GET /me/orgs → ${orgsRes.status()} ${(await orgsRes.text()).slice(0, 200)}`,
> 60  |   ).toBe(200)
      |     ^ Error: GET /me/orgs → 429 {"Reason":"ConcurrentInvocationLimitExceeded","Type":"User","message":"Rate Exceeded."}
  61  |   const orgs = (await orgsRes.json()) as { items: { id: string }[] }
  62  |   const orgId = orgs.items[0].id
  63  | 
  64  |   // The three endpoints, verbatim from the contract.
  65  |   const list = (await (
  66  |     await request.get(`${API_BASE}/orgs/${orgId}/notifications`, { headers: auth })
  67  |   ).json()) as { items: unknown[]; total: number }
  68  |   expect(Array.isArray(list.items)).toBe(true)
  69  | 
  70  |   const count = (await (
  71  |     await request.get(`${API_BASE}/orgs/${orgId}/notifications/unread-count`, { headers: auth })
  72  |   ).json()) as { unread: number }
  73  |   expect(typeof count.unread).toBe('number')
  74  | 
  75  |   const first = (await (
  76  |     await request.post(`${API_BASE}/orgs/${orgId}/notifications/read-all`, { headers: auth })
  77  |   ).json()) as { updated: number }
  78  |   expect(first.updated).toBe(count.unread)
  79  |   // Idempotent: the second call has nothing left to flip.
  80  |   const second = (await (
  81  |     await request.post(`${API_BASE}/orgs/${orgId}/notifications/read-all`, { headers: auth })
  82  |   ).json()) as { updated: number }
  83  |   expect(second.updated).toBe(0)
  84  | 
  85  |   // The bell agrees with the endpoint: everything read → no count in the
  86  |   // accessible name, and the panel shows either rows or the designed empty.
  87  |   await page.goto('/')
  88  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  89  |     timeout: 15_000,
  90  |   })
  91  |   const bell = page.getByRole('button', { name: 'Notifications', exact: true })
  92  |   await expect(bell).toBeVisible()
  93  |   await bell.click()
  94  |   if (list.total === 0) {
  95  |     await expect(page.getByText("You're all caught up.")).toBeVisible()
  96  |   } else {
  97  |     await expect(page.getByRole('menuitem').first()).toBeVisible()
  98  |   }
  99  | })
  100 | 
```