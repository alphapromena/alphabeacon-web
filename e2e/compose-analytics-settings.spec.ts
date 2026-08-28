/**
 * W6's verify: on-demand generate (F1), analytics (G1/G2), settings (I1–I7),
 * and the system surfaces (N1, N4).
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links. `page.goto` reloads the SPA and rebuilds the DEFAULT
 * dataset, so a deep link would silently test the wrong tenant.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { openFromRail as open, rail } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** F1 is reached the way a user reaches it: from the queue. */
async function openGenerate(page: Page, dataset = 'Active org') {
  await open(page, 'Today', dataset)
  await page.getByRole('link', { name: 'Generate one now' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'What should we write about?', level: 1 }),
  ).toBeVisible()
}

async function generate(page: Page, prompt: string) {
  await page.getByLabel('Prompt').fill(prompt)
  await page.getByRole('button', { name: 'Generate' }).click()
}

// ---------------------------------------------------------------------------
// The brand-readiness gate (ORDER ONB-0827, D-ONB-D)
//
// The `fresh` world is a real workspace with its brand setup unfinished — no
// voice rules, no sources, no topics — which is exactly the state the gate
// exists for, and the reason these can be proven without spending a live run.
// ---------------------------------------------------------------------------

test('a workspace with unfinished setup cannot generate, and the screen says why', async ({
  page,
}) => {
  await open(page, 'Today', 'Fresh org')

  // The affordance tells the truth BEFORE it is pressed — it is a real link,
  // not a dead or disabled button.
  const cta = page.getByRole('link', { name: 'Finish setup to generate' }).first()
  await expect(cta).toBeVisible()
  await cta.click()

  // The route renders the checklist state, not a form that could only fail.
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate' })).toHaveCount(0)
  await expect(page.getByLabel('Prompt')).toHaveCount(0)

  // It names each missing item and offers the screen that completes it.
  const checklist = page.getByRole('region', { name: 'Brand setup' })
  for (const label of ['Brand voice', 'Sources', 'Topics']) {
    await expect(checklist.getByRole('link', { name: `Set up ${label}` })).toBeVisible()
  }
  // And the two the Phase-0 probe proved are NOT blockers are still listed,
  // marked for what they buy rather than as things standing in the way.
  await expect(checklist.getByText(/optional for generating/).first()).toBeVisible()
})

test('the checklist links reach the screens that complete each item', async ({ page }) => {
  await open(page, 'Today', 'Fresh org')
  await page.getByRole('link', { name: 'Finish setup to generate' }).first().click()

  await page
    .getByRole('region', { name: 'Brand setup' })
    .getByRole('link', { name: 'Set up Brand voice' })
    .click()

  // A real destination, not a dead row.
  await expect(page.getByRole('tab', { name: 'Brand voice', selected: true })).toBeVisible()
})

test('the Studio composer is gated too — no media job before setup', async ({ page }) => {
  await open(page, 'Studio', 'Fresh org')
  // Every model card offers the composer; the gate meets the user there.
  await page.getByRole('link', { name: 'Use this model' }).first().click()

  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible()
})

test('a finished workspace shows no checklist card and generates normally', async ({ page }) => {
  // The `active` world is fully set up, so the gate is invisible there — a
  // checklist that never goes away would be a nag rather than a step.
  await open(page, 'Dashboard', 'Active org')
  await expect(page.getByRole('region', { name: 'Brand setup' })).toHaveCount(0)

  await rail(page, 'Generate').click()
  await expect(
    page.getByRole('heading', { name: 'What should we write about?', level: 1 }),
  ).toBeVisible()
})

test('@axe the checklist card and the blocked generate state scan clean', async ({ page }) => {
  await open(page, 'Dashboard', 'Fresh org')
  await expect(page.getByRole('region', { name: 'Brand setup' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await rail(page, 'Generate').click()
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

// ---------------------------------------------------------------------------
// F1 — the five runs
// ---------------------------------------------------------------------------

test('@golden a finished run becomes an ordinary draft with the full action row', async ({
  page,
}) => {
  await openGenerate(page)
  await generate(page, 'The Kirinyaga lot that landed this week')

  // It ends as the queue's own card, not a special one-off result panel.
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible()
  // Media is ABSENT before approval — the gate holds here too.
  await expect(page.getByRole('button', { name: 'Create image or video' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByRole('button', { name: 'Create image or video' })).toBeVisible()

  // And it really is in the queue, reached in-app.
  await page.getByRole('link', { name: 'review it with the rest' }).click()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
})

test('a guardrail flags a claim mid-run without hiding a word of it', async ({ page }) => {
  await openGenerate(page)
  await generate(page, 'How we compare to a competitor on price')

  await expect(page.getByText('Flagged source')).toBeVisible({ timeout: 15_000 })
  // The flagged sentence is still on screen — flagging is not censoring.
  await expect(page.getByText(/cheaper per cup/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 15_000 })
})

test('a dropped stream keeps the partial text and offers to pick it up', async ({ page }) => {
  await openGenerate(page)
  await generate(page, 'A breaking story about coffee futures')

  const alert = page.getByRole('alert').filter({ hasText: 'The connection dropped' })
  await expect(alert).toBeVisible({ timeout: 15_000 })
  // What arrived is still there, and the prompt is still there.
  await expect(page.getByText(/Arabica futures moved again/)).toBeVisible()
  await expect(page.getByText('A breaking story about coffee futures')).toBeVisible()

  await page.getByRole('button', { name: 'Pick it up from here' }).click()
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 20_000 })
})

test('stopping keeps what arrived and can be resumed', async ({ page }) => {
  await openGenerate(page)
  await generate(page, 'Write a thread about roasting to order')

  // Let some of it arrive first — stopping before anything is written proves
  // nothing about preserving what did.
  const partial = page.getByText(/freshness is a schedule problem/)
  await expect(partial).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Stop generating' }).click()

  await expect(page.getByRole('button', { name: 'Continue writing' })).toBeVisible()
  await expect(partial).toBeVisible()

  await page.getByRole('button', { name: 'Continue writing' }).click()
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 30_000 })
})

test('the on-demand allowance runs out, and says so instead of failing quietly', async ({
  page,
}) => {
  await openGenerate(page)

  // The allowance is shown before it is spent — a limit you only meet by
  // hitting it is a trap.
  await expect(page.getByText('on-demand runs left today')).toBeVisible()

  for (let run = 0; run < 3; run += 1) {
    await generate(page, `Write a thread number ${run}`)
    await page.getByRole('button', { name: 'Stop generating' }).click()
    await page.getByRole('button', { name: 'Edit prompt' }).click()
  }

  await generate(page, 'One more please')
  await expect(page.getByText(/hit the generation limit/)).toBeVisible()
  // The prompt survives the refusal.
  await expect(page.getByText('One more please')).toBeVisible()
})

// ---------------------------------------------------------------------------
// G1 / G2 — analytics
// ---------------------------------------------------------------------------

test('the overview totals exclude a channel that has not reported, and say so', async ({
  page,
}) => {
  await open(page, 'Analytics')
  await expect(page.getByRole('heading', { name: 'Analytics', level: 1 })).toBeVisible()

  const summary = page.getByLabel('Summary')
  await expect(summary.getByText('Total reach')).toBeVisible()
  await expect(summary.getByText('Follower growth')).toBeVisible()

  // LinkedIn's token has lapsed: its card says pending and the totals admit it.
  await expect(page.getByText(/Sync pending/).first()).toBeVisible()
  await expect(page.getByText(/have not reported for this range/)).toBeVisible()
})

test('a channel detail charts what the platform reports, and explains what it does not', async ({
  page,
}) => {
  await open(page, 'Analytics')

  const facebook = page.locator('[data-slot="card"]').filter({ hasText: 'Facebook Page' })
  await facebook.getByRole('link', { name: 'View details →' }).click()
  await expect(page.getByRole('heading', { name: 'Facebook Page', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent posts' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Engagement' })).toBeVisible()

  // Sorting the table is a real control, not decoration.
  await page.getByRole('button', { name: 'Reach' }).last().click()

  await page.getByRole('link', { name: '← All channels' }).click()
  const linkedin = page.locator('[data-slot="card"]').filter({ hasText: 'LinkedIn' })
  await linkedin.getByRole('link', { name: 'View details →' }).click()
  // The honesty note, not a broken-looking empty chart.
  await expect(page.getByText(/only reports follower counts/)).toBeVisible()
})

test('with no channel left to report, analytics invites the fix', async ({ page }) => {
  // Reached the way an org actually reaches it — by disconnecting the
  // channels — rather than from a world that never had any. The `fresh` world
  // has none, but it also has not finished onboarding, so N3 owns it.
  await open(page, 'Connections')
  for (const channel of ['Facebook Page', 'Instagram', 'LinkedIn']) {
    const card = page.locator('[data-slot="card"]').filter({ hasText: channel })
    // A channel that needs re-auth offers Reconnect, not Manage — you cannot
    // manage permissions you no longer hold.
    const reconnect = card.getByRole('button', { name: 'Reconnect' })
    if ((await reconnect.count()) > 0) {
      await reconnect.click()
      // B3's success state is transient: it applies the connection and returns
      // to the hub on its own, where the live card is the confirmation.
      await expect(card.getByRole('button', { name: 'Manage' })).toBeVisible({ timeout: 10_000 })
    }
    await card.getByRole('button', { name: 'Manage' }).click()
    await page.getByRole('button', { name: 'Disconnect this account' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click()
    await page.keyboard.press('Escape')
  }

  await rail(page, 'Analytics').click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(page.getByText('No channels reporting yet')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to Connections' })).toBeVisible()
})

// ---------------------------------------------------------------------------
// I1–I7 — settings
// ---------------------------------------------------------------------------

test('settings opens on the org profile and guards unsaved edits', async ({ page }) => {
  await open(page, 'Settings')
  await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible()

  await page.getByLabel('Standard call to action').fill('Order the Tuesday roast')
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()

  // Leaving with unsaved work is refused out loud.
  await page.getByRole('tab', { name: 'Team' }).click()
  await expect(page.getByRole('heading', { name: 'Leave without saving?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep editing' }).click()

  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
})

test('@golden a custom tone written once shows up wherever tones are picked', async ({ page }) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Tones' }).click()
  await expect(page.getByRole('heading', { name: 'Tones', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Create custom tone' }).first().click()
  await page.getByLabel('Tone name').fill('Roastery floor')
  await page.getByLabel('What this tone sounds like').fill('Plain, first person, no polish.')
  await page.getByLabel('Do', { exact: true }).fill('Say what we changed')

  // Preview shows the INTERACTION: brand voice and tone, both in force.
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByText('Shaped by:')).toBeVisible()
  await expect(page.getByText('Brand voice').first()).toBeVisible()

  await page.getByRole('button', { name: 'Create tone' }).click()
  // Scoped to its card: "roastery floor" also appears inside a brand-voice
  // rule, and Playwright's text matching is case-insensitive.
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: 'Roastery floor' }),
  ).toBeVisible()

  // Same record, other screens: the schedule (C1) and the composer (F1).
  await rail(page, 'Calendar').click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Schedule settings' }).click()
  await expect(page.getByText('Roastery floor', { exact: true }).first()).toBeVisible()

  await rail(page, 'Today').click()
  await page.getByRole('link', { name: 'Generate one now' }).first().click()
  await expect(page.getByLabel('Tone')).toContainText('Roastery floor')
})

test('deleting a custom tone names what it costs before it happens', async ({ page }) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Tones' }).click()

  await page.getByRole('button', { name: 'Delete' }).first().click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Drafts already using it keep their existing copy')
  await confirm.getByRole('button', { name: 'Delete tone' }).click()

  await expect(page.getByText('No custom tones yet', { exact: true })).toBeVisible()
})

test('a source is named from its address, and prose is refused', async ({ page }) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Sources & topics' }).click()

  await page.getByLabel('Add a source').fill('coffee news please')
  await page.getByRole('button', { name: 'Add source' }).click()
  await expect(page.getByRole('alert')).toContainText('does not look like a web address')

  await page.getByLabel('Add a source').fill('daily-coffee-news.com/feed')
  await expect(page.getByText('Daily Coffee News')).toBeVisible()
  await page.getByRole('button', { name: 'Add source' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Daily Coffee News' })).toBeVisible()
})

test('knowledge plays the whole ingestion lifecycle, per file', async ({ page }) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Knowledge' }).click()

  // The seeded batch shows the mixed states the design is actually about.
  await expect(page.getByText('Ready').first()).toBeVisible()
  await expect(page.getByText('Processing').first()).toBeVisible()
  await expect(page.getByText('Failed').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()

  await page.getByLabel('Choose documents to upload').setInputFiles({
    name: 'price-list.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Filter 12.00\nEspresso 14.00'),
  })
  const uploaded = page.getByRole('listitem').filter({ hasText: 'price-list.txt' })
  await expect(uploaded.getByText('Ready')).toBeVisible({ timeout: 15_000 })

  // A file with no text in it fails honestly, and offers no retry it cannot win.
  await page.getByLabel('Choose documents to upload').setInputFiles({
    name: 'roastery.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })
  const image = page.getByRole('listitem').filter({ hasText: 'roastery.png' })
  await expect(image.getByText('Failed')).toBeVisible({ timeout: 15_000 })
  await expect(image.getByText(/could not read that file/i)).toBeVisible()
  await expect(image.getByRole('button', { name: 'Retry' })).toHaveCount(0)
})

test('the team screen invites, refuses a duplicate, and never offers to remove you', async ({
  page,
}) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Team' }).click()

  const me = page.getByRole('row').filter({ hasText: 'Maya Haddad' })
  await expect(me.getByRole('button', { name: 'Remove' })).toHaveCount(0)
  const other = page.getByRole('row').filter({ hasText: 'Omar Nasser' })
  await expect(other.getByRole('button', { name: 'Remove' })).toBeVisible()

  await page.getByRole('button', { name: 'Invite member' }).click()
  await page.getByLabel('Work email').fill('omar@atlasroasters.example')
  await page.getByRole('button', { name: 'Send invite' }).click()
  await expect(page.getByRole('alert')).toContainText('already on the team')

  await page.getByLabel('Work email').fill('sam@atlasroasters.example')
  await page.getByRole('button', { name: 'Send invite' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'sam@atlasroasters.example' })).toBeVisible()
})

test('a role can be changed in place, and the last admin cannot be demoted', async ({ page }) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Team' }).click()
  await expect(page.getByRole('heading', { name: 'Team', level: 1 })).toBeVisible()

  // The only admin: demotion is ABSENT, not disabled, and the row says why.
  const mine = page.getByLabel('Role for Maya Haddad')
  await expect(mine.getByRole('option')).toHaveCount(1)
  await expect(page.getByText('The only admin. Promote someone else before changing this.')).toBeVisible()

  // Promotion is immediate — it grants access and is reversible.
  await page.getByLabel('Role for Omar Nasser').selectOption('admin')
  await expect(page.getByLabel('Role for Omar Nasser')).toHaveValue('admin')

  // With a second admin, demotion becomes possible, and is confirmed because
  // it takes access away from someone who has it.
  await expect(mine.getByRole('option')).toHaveCount(2)
  await mine.selectOption('member')
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('they lose what the higher role could reach')
  await confirm.getByRole('button', { name: 'Change to member' }).click()

  // Demoting YOURSELF is allowed — a departing admin handing over — and it
  // takes your own admin controls with it, which is the honest consequence.
  await expect(page.getByLabel('Role for Maya Haddad')).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Maya Haddad' })).toContainText('member')
  await expect(page.getByRole('button', { name: 'Invite member' })).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// N1, N4 — system surfaces
// ---------------------------------------------------------------------------

test('the bell counts what is unread and clears it', async ({ page }) => {
  await open(page, 'Today')
  const bell = page.getByRole('button', { name: /Notifications, \d+ unread/ })
  await expect(bell).toBeVisible()
  await bell.click()
  await page.getByRole('button', { name: 'Mark all as read' }).click()
  // Close it first: an open Radix menu is modal, so everything behind it is
  // aria-hidden and the bell is not in the accessibility tree at all.
  await page.keyboard.press('Escape')

  // The count is in the accessible name, so clearing it is observable there.
  await expect(page.getByRole('button', { name: /unread/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
})

test('the offline banner is global and non-blocking', async ({ page }) => {
  // `/dev/states` is the LAST reload in this test on purpose: the override
  // lives in the same in-memory state a reload rebuilds, so switching datasets
  // afterwards would wipe it. The default world is the one we want anyway.
  await page.goto('/dev/states')
  await page.getByRole('radio', { name: /Offline/ }).click()
  await page.getByRole('link', { name: '← App' }).click()

  const banner = page.getByRole('status').filter({ hasText: "You're offline" })
  await expect(banner).toBeVisible()
  // Non-blocking: the app underneath still works.
  await rail(page, 'Today').click()
  await expect(banner).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
})

test('@axe generate, analytics and settings scan clean', async ({ page }) => {
  await openGenerate(page)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await rail(page, 'Analytics').click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await rail(page, 'Settings').click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('tab', { name: 'Knowledge' }).click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})
