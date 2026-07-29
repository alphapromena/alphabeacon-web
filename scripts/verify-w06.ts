// W6 verify orchestrator -- compose, analytics, settings, system.
// Usage: pnpm verify:w06 [--skip-e2e]
//
// W6 Verify coverage, and where each item is proven:
//   "all five compose scripts render (happy, flagged, failed->recovery,
//    stopped, rate-limited)" -> src/lib/compose-player.test.ts proves they are
//        reachable and internally sound; e2e/compose-analytics-settings.spec.ts
//        renders every one of them
//   "knowledge status lifecycle (Uploading->Processing->Ready/Failed+retry)
//    plays through" -> the reducer test + its e2e, which uploads a real file
//   "custom tone appears identically across D2/C1/F1/onboarding (one data
//    record, four screens asserted)" -> the structural check below +
//        src/data/settings-system.test.ts + src/components/ab/tone-badge.test.tsx
//   "honesty note shows for limited platforms" -> the structural check below
//        + the G2 e2e
//   "axe" -> the Playwright @axe specs

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

type Outcome = 'PASS' | 'FAIL' | 'SKIP'
const results: { name: string; outcome: Outcome }[] = []
const skipE2e = process.argv.includes('--skip-e2e')

function run(cmd: string): number {
  console.log(`\n> ${cmd}`)
  return spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: root }).status ?? 1
}

function step(name: string, cmd: string): boolean {
  console.log(`\n=== ${name} ===`)
  const ok = run(cmd) === 0
  results.push({ name, outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')

function record(name: string, ok: boolean, pass: string, fail: string): boolean {
  console.log(ok ? pass : fail)
  results.push({ name, outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/**
 * screens4.md I4: one tone editor, three entry points. The failure mode is a
 * second form appearing next to it -- so no feature may build tone fields of
 * its own, and the sheet and the routed page must both render the SHARED form.
 */
function toneEditorIsShared(): boolean {
  console.log('\n=== one tone editor, three entry points ===')
  const editor = read('src', 'features', 'settings', 'tone-editor.tsx')
  const page = read('src', 'features', 'settings', 'tones-screen.tsx')

  const sheetUsesForm = /ToneEditorSheet[\s\S]*<ToneEditorForm/.test(editor)
  const pageUsesForm = /<ToneEditorForm/.test(page)
  // A second "Tone name" field anywhere outside the editor means it forked.
  const callers = [
    'src/features/calendar/schedule-config-screen.tsx',
    'src/features/onboarding/pipeline-fields.tsx',
  ]
  const noForkedFields = callers.every((path) => !/label="Tone name"/.test(read(path)))

  return record(
    'one tone editor, three entry points',
    sheetUsesForm && pageUsesForm && noForkedFields,
    'tones: the sheet and the routed page both render the shared ToneEditorForm',
    `tone editor check failed -- sheet:${sheetUsesForm} page:${pageUsesForm} noForkedFields:${noForkedFields}`,
  )
}

/**
 * The tone-badge law reaches the four screens that show a tone: each must read
 * the record through the provider and render `ToneBadge`, never print
 * `tone.name` itself with its own styling.
 */
function customToneRendersTheSameEverywhere(): boolean {
  console.log('\n=== a custom tone renders identically on every screen ===')
  const screens: [string, string][] = [
    ['D2 draft card', 'src/features/today/draft-card.tsx'],
    ['D3 draft detail', 'src/features/today/draft-detail-screen.tsx'],
    ['F1 generate', 'src/features/generate/generate-screen.tsx'],
    ['G2 channel detail', 'src/features/analytics/analytics-screens.tsx'],
  ]
  let ok = true
  for (const [label, path] of screens) {
    const source = read(path)
    const usesBadge = /<ToneBadge/.test(source)
    if (!usesBadge) ok = false
    console.log(`  ${label}: ToneBadge ${usesBadge ? 'yes' : 'NO'}`)
  }
  // C1 and onboarding pick tones rather than badge them; they must still read
  // the same records, which the shared field component guarantees.
  const c1 = read('src/features/calendar/schedule-config-screen.tsx')
  const sharedPicker = /TonesField/.test(c1) && /useTones\(\)/.test(c1)
  if (!sharedPicker) ok = false

  return record(
    'custom tone renders identically everywhere',
    ok,
    'tones: every screen badges a tone through ToneBadge and reads it from the provider',
    'tone rendering check failed -- see the per-screen list above',
  )
}

/**
 * The "Syncing..." rule from W4, carried into analytics: an unreported metric
 * is `undefined`, and a delta with no prior period is absent. A `?? 0` in the
 * summary arithmetic is exactly how a zero sneaks back in.
 */
function analyticsNeverInventsANumber(): boolean {
  console.log('\n=== analytics never draws a number it was not given ===')
  const range = read('src', 'features', 'analytics', 'range.ts')
  const screens = read('src', 'features', 'analytics', 'analytics-screens.tsx')

  // deltaPercent must be able to say "no answer".
  const deltaCanBeAbsent = /number \| undefined/.test(range) && /return undefined/.test(range)
  // The overview totals must exclude unsynced channels rather than add zeros,
  // and must then SAY the coverage is partial. Matched structurally, not by
  // copy: the sentence wraps, and a check that breaks on a line break teaches
  // people to weaken the check.
  const excludesUnsynced =
    /filter\([\s\S]{0,80}synced\)/.test(screens) && /pending > 0 &&/.test(screens)
  // Both honesty notes come from the catalogue, not from inline copy.
  const notesFromCatalogue =
    /MESSAGES\.notices\.syncPending/.test(screens) &&
    /MESSAGES\.notices\.limitedAnalytics/.test(screens)

  return record(
    'analytics never invents a number',
    deltaCanBeAbsent && excludesUnsynced && notesFromCatalogue,
    'analytics: absent deltas stay absent, unsynced channels are excluded and declared',
    `analytics check failed -- delta:${deltaCanBeAbsent} excludes:${excludesUnsynced} notes:${notesFromCatalogue}`,
  )
}

/**
 * screens4.md F1: the finished run "becomes a normal draft card (same component
 * as D2's) with the full action row". A local result card that merely looks
 * like one would pass every screenshot and drift the first time D2 changes.
 */
function generateReusesTheQueuesCard(): boolean {
  console.log('\n=== F1 hands off to the queue rather than copying it ===')
  const f1 = read('src', 'features', 'generate', 'generate-screen.tsx')
  const today = read('src', 'features', 'today', 'today-screen.tsx')

  const sharesCard = /<DraftCard/.test(f1)
  const sharesActions = /useDraftActions\(\)/.test(f1) && /useDraftActions\(\)/.test(today)
  const sharesDialogs = /<DraftDialogs/.test(f1) && /<DraftDialogs/.test(today)
  // The draft it creates enters the machine at the ordinary door.
  const entersAtReview = /status: 'pending_review'/.test(f1)

  return record(
    'F1 reuses the queue card and actions',
    sharesCard && sharesActions && sharesDialogs && entersAtReview,
    "compose: F1 renders D2's card, D2's actions and D2's dialogs, entering at pending_review",
    `F1 check failed -- card:${sharesCard} actions:${sharesActions} dialogs:${sharesDialogs} review:${entersAtReview}`,
  )
}

/** The five runs must exist as data, not as branches inside the component. */
function composeIsScriptDriven(): boolean {
  console.log('\n=== the stream is script-driven, not hardcoded in the screen ===')
  const screen = read('src', 'features', 'generate', 'generate-screen.tsx')
  const player = read('src', 'lib', 'compose-player.ts')
  const scripts = read('src', 'data', 'compose-scripts.ts')

  const usesPlayer = /useComposePlayer\(\)/.test(screen)
  // No script id, trigger word, or copy may appear in the screen.
  const noScriptIds = !/cs_(launch|competitor|breaking|thread|limit)/.test(screen)
  const playerOwnsSelection = /export function pickScript/.test(player)
  const fiveScripts = (scripts.match(/^ {4}id: 'cs_/gm) ?? []).length === 5

  return record(
    'compose is script-driven',
    usesPlayer && noScriptIds && playerOwnsSelection && fiveScripts,
    'compose: five scripts in data, selection in the player, no script named in the screen',
    `compose check failed -- player:${usesPlayer} noIds:${noScriptIds} selection:${playerOwnsSelection} five:${fiveScripts}`,
  )
}

/** Settings screens share one save bar and one dirty guard, or they drift. */
function settingsShareOneSaveBar(): boolean {
  console.log('\n=== settings screens share one save bar and one guard ===')
  const withBars = [
    'src/features/settings/organization-screen.tsx',
    'src/features/settings/brand-voice-screen.tsx',
    'src/features/calendar/schedule-config-screen.tsx',
  ]
  let ok = true
  for (const path of withBars) {
    const source = read(path)
    const shared = /<SaveBar/.test(source)
    // A local useBlocker means a second guard with its own wording.
    const noLocalGuard = !/useBlocker\(/.test(source)
    if (!shared || !noLocalGuard) ok = false
    console.log(
      `  ${path}: SaveBar ${shared ? 'yes' : 'NO'} · own guard ${noLocalGuard ? 'no' : 'YES'}`,
    )
  }
  return record(
    'settings share one save bar',
    ok,
    'settings: every dirty-state screen commits through the shared SaveBar',
    'save bar check failed -- see the per-screen list above',
  )
}

/** No screen may still be a stub once its phase has shipped. */
function noStubsRemain(): boolean {
  console.log('\n=== every W6 route is a real screen ===')
  const routes = read('src', 'routes.tsx')
  const noPlaceholder = !/PlaceholderScreen/.test(routes)
  const gone = !existsSync(join(root, 'src/features/system/placeholder-screen.tsx'))
  const wired = [
    '/generate',
    '/analytics/:connectionId',
    '/settings/tones/:toneId',
    '/settings/team',
  ]
  const allWired = wired.every((path) => routes.includes(`'${path}'`))

  return record(
    'no stub routes remain',
    noPlaceholder && gone && allWired,
    'routes: every W6 path resolves to its real screen; the placeholder is gone',
    `routes check failed -- noPlaceholder:${noPlaceholder} removed:${gone} wired:${allWired}`,
  )
}

function e2eNavigationRuleHolds(): boolean {
  console.log('\n=== e2e specs navigate in-app after switching datasets ===')
  // The dev switchers are the only legal `goto` targets: they are not product
  // screens, and reaching one is itself the act of changing the world.
  const switchers = ['/dev/datasets', '/dev/states']
  const specs = [
    'onboarding.spec.ts',
    'today-queue.spec.ts',
    'calendar-connections.spec.ts',
    'studio-billing.spec.ts',
    'compose-analytics-settings.spec.ts',
  ]
  let ok = true
  for (const name of specs) {
    const source = read('e2e', name)
    const gotos = [...source.matchAll(/page\.goto\('([^']+)'\)/g)].map((m) => m[1])
    const offenders = gotos.filter((path) => !switchers.includes(path))
    const usesSharedHelper = /from '\.\/datasets'/.test(source)
    if (offenders.length > 0 || !usesSharedHelper) {
      ok = false
      console.log(
        `  ${name}: helper:${usesSharedHelper} stray gotos: ${offenders.join(', ') || 'none'}`,
      )
    } else {
      console.log(`  ${name}: switches via the shared helper, then walks in-app`)
    }
  }
  results.push({ name: 'e2e navigation rule holds', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function deliverablesExist(): boolean {
  console.log('\n=== W6 deliverables exist ===')
  const required = [
    'src/lib/compose-player.ts', // F1's stream
    'src/lib/compose-player.test.ts',
    'src/data/compose-scripts.ts',
    'src/features/generate/generate-screen.tsx', // F1
    'src/features/analytics/analytics-screens.tsx', // G1, G2
    'src/features/analytics/range.ts',
    'src/features/analytics/range.test.ts',
    'src/features/settings/settings-layout.tsx',
    'src/features/settings/organization-screen.tsx', // I1
    'src/features/settings/brand-voice-screen.tsx', // I2
    'src/features/settings/tones-screen.tsx', // I3 + I4's page
    'src/features/settings/tone-editor.tsx', // I4
    'src/features/settings/sources-screen.tsx', // I5
    'src/features/settings/knowledge-screen.tsx', // I6
    'src/features/settings/team-screen.tsx', // I7
    'src/components/ab/notification-bell.tsx', // N1
    'src/components/ab/offline-banner.tsx', // N4
    'src/components/ab/save-bar.tsx',
    'src/data/settings-system.test.ts',
    'e2e/compose-analytics-settings.spec.ts',
  ]
  const missing = required.filter((path) => !existsSync(join(root, path)))
  if (missing.length) {
    console.log('missing:')
    for (const path of missing) console.log(`  - ${path}`)
  } else {
    console.log(`all ${required.length} W6 deliverables present`)
  }
  const ok = missing.length === 0
  results.push({ name: 'W6 deliverables exist', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

const STRUCTURAL = [
  'one tone editor, three entry points',
  'custom tone renders identically everywhere',
  'analytics never invents a number',
  'F1 reuses the queue card and actions',
  'compose is script-driven',
  'settings share one save bar',
  'no stub routes remain',
  'e2e navigation rule holds',
  'W6 deliverables exist',
]

function main(): void {
  let failed = false

  for (const [name, cmd] of [
    ['lint', 'pnpm lint'],
    ['typecheck', 'pnpm typecheck'],
    ['unit tests', 'pnpm test'],
    ['guard-static', 'pnpm guard:static'],
    ['build', 'pnpm build'],
  ] as const) {
    if (!step(name, cmd)) {
      failed = true
      console.log(`step failed: ${name} -- remaining steps skipped`)
      break
    }
  }

  if (!failed) {
    if (!toneEditorIsShared()) failed = true
    if (!customToneRendersTheSameEverywhere()) failed = true
    if (!analyticsNeverInventsANumber()) failed = true
    if (!generateReusesTheQueuesCard()) failed = true
    if (!composeIsScriptDriven()) failed = true
    if (!settingsShareOneSaveBar()) failed = true
    if (!noStubsRemain()) failed = true
    if (!e2eNavigationRuleHolds()) failed = true
    if (!deliverablesExist()) failed = true

    if (skipE2e) {
      results.push({ name: 'e2e (compose, analytics, settings, axe)', outcome: 'SKIP' })
      console.log('\ne2e skipped (--skip-e2e)')
    } else {
      run('pnpm exec playwright install chromium')
      if (!step('e2e (compose, analytics, settings, axe)', 'pnpm e2e')) failed = true
    }
  } else {
    for (const name of [...STRUCTURAL, 'e2e (compose, analytics, settings, axe)']) {
      results.push({ name, outcome: 'SKIP' })
    }
  }

  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW6 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')

  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W6 Verify):')
  console.log('  1. Watch a compose run at full length. Does the token pace read')
  console.log('     as writing, or as a progress bar wearing words?')
  console.log('  2. Read G1 as someone who did not publish this week: do the')
  console.log('     deltas and the "not reported" line tell the same story?')
  console.log('  3. Walk Settings with the keyboard only, tab by tab.')
  console.log('\n  Carried forward, still open (see .agent/open-items.md):')
  console.log('   - W1 screen-reader walk of the app shell (NVDA / VoiceOver)')
  console.log('   - W2 marketing copy read, wizard at phone width, marketing in a dark OS')
  console.log('   - W3 queue as one continuous tool, queue on a phone')
  console.log('   - W4 month grid at phone width, timezone as the audience sees it')
  console.log('   - W5 D4 and E2 back to back, credits ledger read as a charge query')

  process.exit(failed ? 1 : 0)
}

main()
