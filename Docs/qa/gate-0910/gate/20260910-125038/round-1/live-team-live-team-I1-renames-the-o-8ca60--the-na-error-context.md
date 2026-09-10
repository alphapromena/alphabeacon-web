# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-team.spec.ts >> I1 renames the org through PATCH, and the name survives a reload
- Location: e2e\live-team.spec.ts:87:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Organization saved')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText('Organization saved')

```

```yaml
- img "Malaky"
- text: Workspace
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Today":
      - /url: /today
  - listitem:
    - link "Generate":
      - /url: /generate
  - listitem:
    - link "Calendar":
      - /url: /calendar
  - listitem:
    - link "Studio":
      - /url: /studio
  - listitem:
    - link "Analytics":
      - /url: /analytics
  - listitem:
    - link "Connections":
      - /url: /connections
  - listitem:
    - link "Billing":
      - /url: /billing
  - listitem:
    - link "Settings":
      - /url: /settings
- text: Q QA Live Org 1789044911209088
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Organization" [level=1]
  - paragraph: Who you are, and how drafts should sign off
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Switch to dark theme"
  - button "Account menu": QO
- main:
  - navigation "Settings sections":
    - tablist:
      - tab "Organization" [selected]
      - tab "Brand voice"
      - tab "Tones"
      - tab "Sources & topics"
      - tab "Knowledge"
      - tab "Team"
  - tabpanel "Organization":
    - region "Brand setup":
      - heading "Brand setup" [level=2]
      - paragraph: Finish these and this workspace can write. Each one has its own screen — do them in any order.
      - list:
        - listitem:
          - text: Brand voice The rules every draft follows, whatever tone it is written in.
          - link "Set up Brand voice":
            - /url: /settings/brand-voice
        - listitem:
          - text: At least one tone How a draft should sound. Nothing generates without one.
          - link "Set up At least one tone":
            - /url: /settings/tones
        - listitem:
          - text: Sources What drafts read before they write.
          - link "Set up Sources":
            - /url: /settings/sources
        - listitem:
          - text: Topics What this workspace talks about.
          - link "Set up Topics":
            - /url: /settings/sources
        - listitem:
          - text: Country Needed for holidays — drafts work around your calendar. (optional for generating)
          - link "Set up Country":
            - /url: /settings/organization
        - listitem:
          - text: Posting rhythm Needed for scheduled posting — which days, and how many. (optional for generating)
          - link "Set up Posting rhythm":
            - /url: /calendar/settings
    - text: Organization ID 1979
    - button "Copy the organization ID": Copy
    - text: Q
    - paragraph: Logo
    - button "Upload"
    - paragraph: Square works best. It is kept with your brand files.
    - button "Choose a logo image"
    - text: Organization name
    - textbox "Organization name": QA Live Org 1789044911209088 v2
    - text: What you offer, in one line
    - paragraph: Every draft starts from this sentence.
    - textbox "What you offer, in one line" [invalid]
    - alert: Describe what you offer in one line — drafts start from this.
    - text: What sets you apart
    - paragraph: Drafts reach for these when they need a reason to believe.
    - textbox "What sets you apart":
      - /placeholder: Roasted to order
    - button "Add"
    - text: Standard call to action
    - paragraph: The closing ask a draft falls back to when the post has no better one.
    - textbox "Standard call to action":
      - /placeholder: Order this week’s roast
    - text: Timezone
    - paragraph: The same setting as your schedule — changing it here changes it there.
    - combobox "Timezone":
      - option "Asia/Amman (GMT+3)" [selected]
      - option "Asia/Dubai (GMT+4)"
      - option "Asia/Riyadh (GMT+3)"
      - option "Asia/Beirut (GMT+3)"
      - option "Africa/Cairo (GMT+3)"
      - option "Europe/London (GMT+1)"
      - option "Europe/Paris (GMT+2)"
      - option "Europe/Berlin (GMT+2)"
      - option "Europe/Istanbul (GMT+3)"
      - option "America/New York (GMT-4)"
      - option "America/Chicago (GMT-5)"
      - option "America/Los Angeles (GMT-7)"
      - option "Asia/Karachi (GMT+5)"
      - option "Asia/Kolkata (GMT+5:30)"
      - option "Asia/Singapore (GMT+8)"
      - option "Australia/Sydney (GMT+10)"
      - option "UTC (GMT+0)"
    - heading "Where you operate" [level=2]
    - paragraph: Your country decides which public holidays Malaky plans around.
    - text: Country
    - paragraph: Setting this loads that country's public holidays into your calendar, and drafts start working around them.
    - combobox "Country":
      - option "Choose a country…" [selected]
      - option "Afghanistan"
      - option "Åland Islands"
      - option "Albania"
      - option "Algeria"
      - option "American Samoa"
      - option "Andorra"
      - option "Angola"
      - option "Anguilla"
      - option "Antarctica"
      - option "Antigua and Barbuda"
      - option "Argentina"
      - option "Armenia"
      - option "Aruba"
      - option "Australia"
      - option "Austria"
      - option "Azerbaijan"
      - option "Bahamas"
      - option "Bahrain"
      - option "Bangladesh"
      - option "Barbados"
      - option "Belarus"
      - option "Belgium"
      - option "Belize"
      - option "Benin"
      - option "Bermuda"
      - option "Bhutan"
      - option "Bolivia"
      - option "Bosnia and Herzegovina"
      - option "Botswana"
      - option "Bouvet Island"
      - option "Brazil"
      - option "British Indian Ocean Territory"
      - option "British Virgin Islands"
      - option "Brunei"
      - option "Bulgaria"
      - option "Burkina Faso"
      - option "Burundi"
      - option "Cambodia"
      - option "Cameroon"
      - option "Canada"
      - option "Cape Verde"
      - option "Caribbean Netherlands"
      - option "Cayman Islands"
      - option "Central African Republic"
      - option "Chad"
      - option "Chile"
      - option "China"
      - option "Christmas Island"
      - option "Cocos (Keeling) Islands"
      - option "Colombia"
      - option "Comoros"
      - option "Congo - Brazzaville"
      - option "Congo - Kinshasa"
      - option "Cook Islands"
      - option "Costa Rica"
      - option "Côte d’Ivoire"
      - option "Croatia"
      - option "Cuba"
      - option "Curaçao"
      - option "Cyprus"
      - option "Czechia"
      - option "Denmark"
      - option "Djibouti"
      - option "Dominica"
      - option "Dominican Republic"
      - option "Ecuador"
      - option "Egypt"
      - option "El Salvador"
      - option "Equatorial Guinea"
      - option "Eritrea"
      - option "Estonia"
      - option "Eswatini"
      - option "Ethiopia"
      - option "Falkland Islands"
      - option "Faroe Islands"
      - option "Fiji"
      - option "Finland"
      - option "France"
      - option "French Guiana"
      - option "French Polynesia"
      - option "French Southern Territories"
      - option "Gabon"
      - option "Gambia"
      - option "Georgia"
      - option "Germany"
      - option "Ghana"
      - option "Gibraltar"
      - option "Greece"
      - option "Greenland"
      - option "Grenada"
      - option "Guadeloupe"
      - option "Guam"
      - option "Guatemala"
      - option "Guernsey"
      - option "Guinea"
      - option "Guinea-Bissau"
      - option "Guyana"
      - option "Haiti"
      - option "Heard and McDonald Islands"
      - option "Honduras"
      - option "Hong Kong SAR China"
      - option "Hungary"
      - option "Iceland"
      - option "India"
      - option "Indonesia"
      - option "Iran"
      - option "Iraq"
      - option "Ireland"
      - option "Isle of Man"
      - option "Israel"
      - option "Italy"
      - option "Jamaica"
      - option "Japan"
      - option "Jersey"
      - option "Jordan"
      - option "Kazakhstan"
      - option "Kenya"
      - option "Kiribati"
      - option "Kuwait"
      - option "Kyrgyzstan"
      - option "Laos"
      - option "Latvia"
      - option "Lebanon"
      - option "Lesotho"
      - option "Liberia"
      - option "Libya"
      - option "Liechtenstein"
      - option "Lithuania"
      - option "Luxembourg"
      - option "Macao SAR China"
      - option "Madagascar"
      - option "Malawi"
      - option "Malaysia"
      - option "Maldives"
      - option "Mali"
      - option "Malta"
      - option "Marshall Islands"
      - option "Martinique"
      - option "Mauritania"
      - option "Mauritius"
      - option "Mayotte"
      - option "Mexico"
      - option "Micronesia"
      - option "Moldova"
      - option "Monaco"
      - option "Mongolia"
      - option "Montenegro"
      - option "Montserrat"
      - option "Morocco"
      - option "Mozambique"
      - option "Myanmar (Burma)"
      - option "Namibia"
      - option "Nauru"
      - option "Nepal"
      - option "Netherlands"
      - option "New Caledonia"
      - option "New Zealand"
      - option "Nicaragua"
      - option "Niger"
      - option "Nigeria"
      - option "Niue"
      - option "Norfolk Island"
      - option "North Korea"
      - option "North Macedonia"
      - option "Northern Mariana Islands"
      - option "Norway"
      - option "Oman"
      - option "Pakistan"
      - option "Palau"
      - option "Palestinian Territories"
      - option "Panama"
      - option "Papua New Guinea"
      - option "Paraguay"
      - option "Peru"
      - option "Philippines"
      - option "Pitcairn Islands"
      - option "Poland"
      - option "Portugal"
      - option "Puerto Rico"
      - option "Qatar"
      - option "Réunion"
      - option "Romania"
      - option "Russia"
      - option "Rwanda"
      - option "Samoa"
      - option "San Marino"
      - option "São Tomé and Príncipe"
      - option "Saudi Arabia"
      - option "Senegal"
      - option "Serbia"
      - option "Seychelles"
      - option "Sierra Leone"
      - option "Singapore"
      - option "Sint Maarten"
      - option "Slovakia"
      - option "Slovenia"
      - option "Solomon Islands"
      - option "Somalia"
      - option "South Africa"
      - option "South Georgia and South Sandwich Islands"
      - option "South Korea"
      - option "South Sudan"
      - option "Spain"
      - option "Sri Lanka"
      - option "St. Barthélemy"
      - option "St. Helena"
      - option "St. Kitts and Nevis"
      - option "St. Lucia"
      - option "St. Martin"
      - option "St. Pierre and Miquelon"
      - option "St. Vincent and Grenadines"
      - option "Sudan"
      - option "Suriname"
      - option "Svalbard and Jan Mayen"
      - option "Sweden"
      - option "Switzerland"
      - option "Syria"
      - option "Taiwan"
      - option "Tajikistan"
      - option "Tanzania"
      - option "Thailand"
      - option "Timor-Leste"
      - option "Togo"
      - option "Tokelau"
      - option "Tonga"
      - option "Trinidad and Tobago"
      - option "Tunisia"
      - option "Türkiye"
      - option "Turkmenistan"
      - option "Turks and Caicos Islands"
      - option "Tuvalu"
      - option "U.S. Outlying Islands"
      - option "U.S. Virgin Islands"
      - option "Uganda"
      - option "Ukraine"
      - option "United Arab Emirates"
      - option "United Kingdom"
      - option "United States"
      - option "Uruguay"
      - option "Uzbekistan"
      - option "Vanuatu"
      - option "Vatican City"
      - option "Venezuela"
      - option "Vietnam"
      - option "Wallis and Futuna"
      - option "Western Sahara"
      - option "Yemen"
      - option "Zambia"
      - option "Zimbabwe"
    - button "Save country" [disabled]
    - heading "Your account" [level=2]
    - paragraph: Yours, not the organization's — the name approvals carry, and your password.
    - text: Your name
    - textbox "Your name": QA Owner
    - button "Save name" [disabled]
    - button "Change password"
    - paragraph: You have unsaved changes.
    - button "Cancel"
    - button "Save changes"
- region "Notifications alt+T"
```

# Test source

```ts
  2   |  * INT-2's verify: me + orgs + members + invites against the DEPLOYED API,
  3   |  * driven through the real UI â€” the wizard creates the org, I1 renames it,
  4   |  * the account section changes the password, and the team screen exercises
  5   |  * invite (new AND existing user), resend's rate limit, cancel, the
  6   |  * three-tier role ladder, the last-owner laws, leave, and remove.
  7   |  *
  8   |  * Live-mode runs only; fresh qa+<timestamp> addresses; each purpose sends at
  9   |  * most one code per address (the one deliberate immediate resend exists to
  10  |  * prove the 429 toast).
  11  |  */
  12  | import type { Page } from '@playwright/test'
  13  | import { expect, test } from './fixtures'
  14  | import { signUpAndEnter } from './live-setup'
  15  | import { ONE_CALL, SCREEN_SYNC } from './live-clocks'
  16  | import { runStamp } from './live-setup'
  17  | 
  18  | const API_BASE = process.env.VITE_API_BASE_URL
  19  | const RUN = runStamp()
  20  | const PASSWORD = 'Roasted2Order!'
  21  | const NEW_PASSWORD = 'FreshlyGround3!'
  22  | 
  23  | const owner = `qa+${RUN}o@alphapromena.com`
  24  | const invitee = `qa+${RUN}m@alphapromena.com`
  25  | /** An admin who arrives through the INVITE, not through signup — so this
  26  |  *  account owns no workspace of its own. See the test below for why that
  27  |  *  distinction became load-bearing under ONB-0827. */
  28  | const adminInvitee = `qa+${RUN}a@alphapromena.com`
  29  | const ORG_NAME = `QA Live Org ${RUN}`
  30  | const ORG_RENAMED = `QA Live Org ${RUN} v2`
  31  | 
  32  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  33  | test.describe.configure({ mode: 'serial' })
  34  | 
  35  | /**
  36  |  * This file had no cap, so every test in it ran under the suite's 30 s default
  37  |  * — and the signup -> wizard -> Finish walk alone measures 27-29 s door to door
  38  |  * against today's API (Docs/api/live-red-2026-08-23.md). It could not pass at
  39  |  * any wait value. Aligned with the 150 s `live-country` set when Finish became
  40  |  * idempotent (E2E-0820 B7); no wait value and no assertion here changed.
  41  |  */
  42  | test.beforeEach(() => {
  43  |   test.setTimeout(150_000)
  44  | })
  45  | 
  46  | async function login(page: Page, email: string, password: string) {
  47  |   await page.goto('/login')
  48  |   await page.getByLabel('Work email').fill(email)
  49  |   await page.getByLabel('Password', { exact: true }).fill(password)
  50  |   await page.getByRole('button', { name: 'Sign in' }).click()
  51  | }
  52  | 
  53  | async function signOut(page: Page) {
  54  |   await page.getByRole('button', { name: 'Account menu' }).click()
  55  |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  56  |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  57  |   // is the hero headline, which spans three lines.
  58  |   // One POST round-trip — live-red-2026-08-23.
  59  |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  60  |     timeout: ONE_CALL,
  61  |   })
  62  | }
  63  | 
  64  | async function openTeam(page: Page) {
  65  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  66  |   await page.getByRole('tab', { name: 'Team' }).click()
  67  |   // "1 member" or "3 members" — the noun agrees with the count now, so this
  68  |   // can no longer assume the plural (E2E-0820 F11).
  69  |   // The tab's whole sync — live-red-2026-08-23.
  70  |   await expect(
  71  |     page.getByRole('heading', { level: 2 }).filter({ hasText: /\d+ member/ }),
  72  |   ).toBeVisible({ timeout: SCREEN_SYNC })
  73  | }
  74  | 
  75  | test('verifying creates the org LIVE; the dashboard follows immediately', async ({ page }) => {
  76  |   // ORDER ONB-0827, D-ONB-C: there is no wizard between verifying and the
  77  |   // product. The org is created from the name typed at signup, the resync
  78  |   // flips the world onto it, and the dashboard is the next thing on screen.
  79  |   await signUpAndEnter(page, {
  80  |     name: 'QA Owner',
  81  |     email: owner,
  82  |     password: PASSWORD,
  83  |     orgName: ORG_NAME,
  84  |   })
  85  | })
  86  | 
  87  | test('I1 renames the org through PATCH, and the name survives a reload', async ({ page }) => {
  88  |   await login(page, owner, PASSWORD)
  89  |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  90  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  91  |     timeout: SCREEN_SYNC,
  92  |   })
  93  | 
  94  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  95  |   // The screen's whole sync — live-red-2026-08-23.
  96  |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_NAME, {
  97  |     timeout: SCREEN_SYNC,
  98  |   })
  99  |   await page.getByLabel('Organization name').fill(ORG_RENAMED)
  100 |   await page.getByRole('button', { name: 'Save changes' }).click()
  101 |   // One PATCH round-trip — live-red-2026-08-23.
> 102 |   await expect(page.getByText('Organization saved')).toBeVisible({ timeout: ONE_CALL })
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  103 | 
  104 |   // A reload re-syncs from the server â€” the rename was real, not local.
  105 |   await page.goto('/settings/organization')
  106 |   // First wait after a reload — the whole org sync — live-red-2026-08-23.
  107 |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_RENAMED, {
  108 |     timeout: SCREEN_SYNC,
  109 |   })
  110 | })
  111 | 
  112 | test('change-password keeps this session and only the new password works after', async ({
  113 |   page,
  114 | }) => {
  115 |   await login(page, owner, PASSWORD)
  116 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  117 | 
  118 |   await page.getByRole('button', { name: 'Change password' }).click()
  119 |   await page.getByLabel('Current password').fill(PASSWORD)
  120 |   await page.getByLabel('New password').fill(NEW_PASSWORD)
  121 |   await page.getByRole('button', { name: 'Change password' }).last().click()
  122 |   // One POST round-trip — live-red-2026-08-23.
  123 |   await expect(page.getByText('Password changed')).toBeVisible({ timeout: ONE_CALL })
  124 | 
  125 |   await signOut(page)
  126 |   await login(page, owner, PASSWORD)
  127 |   // One POST round-trip — live-red-2026-08-23.
  128 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  129 |     timeout: ONE_CALL,
  130 |   })
  131 |   await login(page, owner, NEW_PASSWORD)
  132 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  133 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  134 |     timeout: SCREEN_SYNC,
  135 |   })
  136 | })
  137 | 
  138 | test('inviting a NEW user: coded email, resend rate-limits honestly, cancel removes', async ({
  139 |   page,
  140 | }) => {
  141 |   await login(page, owner, NEW_PASSWORD)
  142 |   await openTeam(page)
  143 | 
  144 |   await page.getByRole('button', { name: 'Invite member' }).click()
  145 |   await page.getByLabel('Work email').fill(invitee)
  146 |   await page.getByRole('button', { name: 'Send invite' }).click()
  147 |   // One POST round-trip — live-red-2026-08-23.
  148 |   await expect(page.getByText('Invite sent')).toBeVisible({ timeout: ONE_CALL })
  149 |   await expect(page.getByText(invitee)).toBeVisible()
  150 | 
  151 |   // A second send inside 60 s is the documented rate limit â€” the toast says
  152 |   // the wait, never a silent refusal.
  153 |   await page.getByRole('button', { name: 'Resend' }).click()
  154 |   // One POST round-trip — live-red-2026-08-23.
  155 |   await expect(page.getByText(/Too many requests/)).toBeVisible({ timeout: ONE_CALL })
  156 | 
  157 |   await page.getByRole('button', { name: 'Revoke' }).click()
  158 |   // One DELETE round-trip — live-red-2026-08-23.
  159 |   await expect(page.getByText(invitee)).toHaveCount(0, { timeout: ONE_CALL })
  160 | })
  161 | 
  162 | test('inviting an EXISTING user adds them immediately, and the role ladder holds', async ({
  163 |   page,
  164 | }) => {
  165 |   // The invitee gets a real account first. Since ONB-0827 that account also
  166 |   // gets a workspace of its own — every signup does — which is exactly what
  167 |   // makes them an EXISTING user for the invite below rather than a new one.
  168 |   await signUpAndEnter(page, {
  169 |     name: 'QA Member',
  170 |     email: invitee,
  171 |     password: PASSWORD,
  172 |     orgName: `QA Member Org ${RUN}`,
  173 |   })
  174 |   // SIGN OUT, do not just navigate. Since ONB-0827 this account has a
  175 |   // workspace, so `SignedOutOnly` redirects a signed-in user away from /login
  176 |   // and the form never renders — a bare `goto('/login')` used to work only
  177 |   // because an invitee had no org to be redirected into (D-ONB-C).
  178 |   await signOut(page)
  179 | 
  180 |   await login(page, owner, NEW_PASSWORD)
  181 |   await openTeam(page)
  182 | 
  183 |   // Existing user â†’ membership added on the spot; no pending invite.
  184 |   await page.getByRole('button', { name: 'Invite member' }).click()
  185 |   await page.getByLabel('Work email').fill(invitee)
  186 |   await page.getByRole('button', { name: 'Send invite' }).click()
  187 |   // One POST round-trip — live-red-2026-08-23.
  188 |   await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
  189 | 
  190 |   const memberRow = page.locator('tr').filter({ hasText: invitee })
  191 |   await expect(memberRow).toHaveCount(1)
  192 | 
  193 |   // Sole owner: own row explains why leaving is impossible, offers no Leave.
  194 |   const ownerRow = page.locator('tr').filter({ hasText: owner })
  195 |   await expect(ownerRow.getByText(/You are the only owner/)).toBeVisible()
  196 |   await expect(ownerRow.getByRole('button', { name: 'Leave' })).toHaveCount(0)
  197 | 
  198 |   // Up the ladder: member â†’ admin (immediate) â†’ owner (ownership transfer).
  199 |   await memberRow.getByLabel(/Role for/).selectOption('admin')
  200 |   // One PATCH round-trip — live-red-2026-08-23.
  201 |   await expect(page.getByText(/is now an admin/)).toBeVisible({ timeout: ONE_CALL })
  202 |   await memberRow.getByLabel(/Role for/).selectOption('owner')
```