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
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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
  // The wizard was the third caller until ONB-0827 deleted it; the fields it
  // shared with C1 now live beside C1 (`schedule-fields.tsx`).
  const callers = [
    'src/features/calendar/schedule-config-screen.tsx',
    'src/features/calendar/schedule-fields.tsx',
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
 * The readiness gate is ONE selector, read by every generation entry point
 * (ORDER ONB-0827, D-ONB-D).
 *
 * Behavioural tests cannot tell "this screen asks the shared selector" from
 * "this screen happens to agree with it today" — and a fifth surface added
 * later with its own idea of `tones.length > 0` would pass every e2e in the
 * suite while quietly disagreeing with the checklist the user was just shown.
 * Per state.md rule 11 these match STRUCTURE (an import, a call), never prose.
 *
 * The tone PREVIEW is deliberately NOT in this list and must never join it:
 * previewing is part of CREATING the first tone, so gating it would lock the
 * user out of the very item the gate is asking them to complete.
 */
function readinessGateIsOneSelector(): boolean {
  console.log('\n=== every generation entry reads the one readiness selector ===')

  const surfaces: [string, string][] = [
    ['F1 /generate', 'src/features/generate/generate-screen.tsx'],
    ['E2 Studio composer', 'src/features/studio/studio-screens.tsx'],
    ['D4 media panel', 'src/features/today/media-panel.tsx'],
  ]
  let ok = true
  for (const [label, path] of surfaces) {
    const source = read(path)
    const readsSelector = /useReadiness\(\)/.test(source)
    const rendersShared = /<GenerationBlocked/.test(source)
    if (!readsSelector || !rendersShared) ok = false
    console.log(
      `  ${label}: useReadiness ${readsSelector ? 'yes' : 'NO'}, GenerationBlocked ${
        rendersShared ? 'yes' : 'NO'
      }`,
    )
  }

  // The selector itself is the only place the rule is written down.
  const selector = read('src/data/readiness.ts')
  const declaresRule = /blocking: true/.test(selector) && /blocking: false/.test(selector)
  if (!declaresRule) ok = false
  console.log(`  the ruling lives in readiness.ts: ${declaresRule ? 'yes' : 'NO'}`)

  // Tone preview stays open: creating the first tone must not need a tone.
  const editor = read('src/features/settings/tone-editor.tsx')
  const previewUngated = !/useReadiness/.test(editor)
  if (!previewUngated) ok = false
  console.log(`  tone preview is NOT gated: ${previewUngated ? 'yes' : 'NO'}`)

  return record(
    'readiness gate is one selector',
    ok,
    'gate: F1, the Studio composer and D4 all read useReadiness and render GenerationBlocked',
    'readiness gate check failed -- see the per-surface list above',
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
  // C1 picks tones rather than badging them; it must still read the same
  // records, which the shared field component guarantees.
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

/**
 * The focus rules the manual keyboard pass had to find by hand.
 *
 * axe is green on all of these screens and always was — it inspects markup, it
 * does not tab through anything. These checks encode the shape of each fix so
 * the next person cannot undo one without the phase failing.
 */
function focusRulesHold(): boolean {
  console.log('\n=== the keyboard-focus rules from the W6 manual pass ===')
  const layout = read('src', 'features', 'settings', 'settings-layout.tsx')
  const routes = read('src', 'routes.tsx')
  const saveBar = read('src', 'components', 'ab', 'save-bar.tsx')
  const globals = read('src', 'styles', 'globals.css')
  const editors = read('src', 'features', 'settings', 'field-editors.tsx')

  // Settings must stay a ROUTE layout. The moment a screen wraps itself in the
  // layout again, the nav unmounts per section and focus goes to the body.
  //
  // Matched on STRUCTURE, not on the literal element markup: the 2026-08-11
  // code-split pass (90fb8b2) moved every route element behind a lazy loader,
  // the old `element: (<Authed><SettingsLayout` pattern stopped matching, and
  // this check failed silently for six days because the rb/02 work ran
  // verify:w02 rather than w06 (state.md trap 11, again). What actually matters
  // is that the /settings route mounts ONE layout element and hangs the
  // sections off it as children, whatever wrapper or loader is in between.
  const settingsRoute = routes.slice(routes.indexOf("path: '/settings',"))
  const settingsRouteHead = settingsRoute.slice(0, 600)
  const layoutIsRouted =
    /<Outlet\s*\/>/.test(layout) &&
    routes.includes("path: '/settings',") &&
    /settingsLayout\(\)/.test(settingsRouteHead) &&
    /children:\s*\[/.test(settingsRouteHead)
  const screensDoNotWrap = [
    'organization-screen',
    'brand-voice-screen',
    'tones-screen',
    'sources-screen',
    'knowledge-screen',
    'team-screen',
  ].every((name) => !/<SettingsLayout/.test(read('src', 'features', 'settings', `${name}.tsx`)))

  // A real tablist: roving tabindex plus arrow keys.
  const isTablist =
    /role="tablist"/.test(layout) && /role="tab"/.test(layout) && /ArrowRight/.test(layout)
  const rovingTabindex = /tabIndex=\{index === focusIndex \? 0 : -1\}/.test(layout)

  // The trigger-less guard dialog has to hand focus back itself.
  const guardRestoresFocus = /onCloseAutoFocus/.test(saveBar) && /returnFocusTo/.test(saveBar)

  // WCAG 2.2 focus-not-obscured, held centrally rather than per screen.
  const scrollMargin = /scroll-margin-bottom/.test(globals)

  // A visually hidden file input may never hold a tab stop. Sliced rather than
  // regexed: a length-capped pattern breaks the moment someone adds a comment
  // inside the tag, and a check that fails for formatting reasons gets deleted.
  // HSN-04 moved the Knowledge input into the shared upload form; the law
  // (a hidden file input never holds a tab stop) is checked where it lives.
  const uploads = ['organization-screen', 'knowledge-upload-form'].every((name) => {
    const source = read('src', 'features', 'settings', `${name}.tsx`)
    const tags = source
      .split('<input')
      .slice(1)
      .map((chunk) => chunk.slice(0, chunk.indexOf('/>')))
      .filter((tag) => tag.includes('type="file"'))
    return tags.length > 0 && tags.every((tag) => tag.includes('tabIndex={-1}'))
  })

  // Adding a row moves the cursor into it.
  const addFocusesRow =
    /setFocusRow/.test(editors) && /inputs\.current\[focusRow\]\?\.focus\(\)/.test(editors)

  const ok =
    layoutIsRouted &&
    screensDoNotWrap &&
    isTablist &&
    rovingTabindex &&
    guardRestoresFocus &&
    scrollMargin &&
    uploads &&
    addFocusesRow
  return record(
    'keyboard-focus rules hold',
    ok,
    'focus: settings is a route layout with a real tablist, the guard restores focus, no hidden tab stops',
    `focus check failed -- routed:${layoutIsRouted} noWrap:${screensDoNotWrap} tablist:${isTablist} roving:${rovingTabindex} guard:${guardRestoresFocus} scrollMargin:${scrollMargin} uploads:${uploads} addRow:${addFocusesRow}`,
  )
}

/**
 * Times say which zone they are in, and never claim to be the audience's.
 *
 * The manual pass found C4 telling the user a slot time was "the time your
 * audience sees". That is not imprecise, it is false: a connected page has
 * followers in every zone and this product holds no data about where they are.
 * The claim is easy to reintroduce with one well-meaning line of copy, so it is
 * guarded here rather than left to review.
 */
function timesAreHonestAboutZones(): boolean {
  console.log('\n=== posting times name their zone, and claim nothing more ===')
  const featureFiles = walkFeatures()

  // Nothing anywhere may promise an audience-local time. Comments are stripped
  // first: the guard is on what the user READS, and the code that removed the
  // claim is allowed to quote it in explaining why. (Safe to strip `//` here —
  // the static law already bans `://` anywhere under src/.)
  const withoutComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const claimants = featureFiles.filter((path) =>
    /audience sees|audience'?s time/i.test(withoutComments(readFileSync(path, 'utf8'))),
  )
  const noAudienceClaim = claimants.length === 0
  if (!noAudienceClaim) for (const path of claimants) console.log(`  claims audience time: ${path}`)

  // Every screen that renders a slot or scheduled time goes through the one
  // component that knows the rules.
  const usesPostingTime = [
    'src/features/today/today-screen.tsx',
    'src/features/today/draft-card.tsx',
    'src/features/today/draft-detail-screen.tsx',
    'src/features/calendar/slot-sheet.tsx',
  ].every((path) => /<PostingTime/.test(read(path)))

  const component = read('src', 'components', 'ab', 'posting-time.tsx')
  // GMT offset, not an ambiguous abbreviation, and the local time only on a
  // real mismatch.
  const offsetLabel = /zoneAbbreviation\(zone, instant\)/.test(component)
  const localOnlyWhenDifferent = /const differs =/.test(component) && /\{differs &&/.test(component)

  // Dates outside the current year keep the year.
  const dated =
    /sameYear \? \{\} : \{ year: 'numeric' \}/.test(read('src', 'lib', 'format.ts')) &&
    /sameYear \? \{\} : \{ year: 'numeric' \}/.test(read('src', 'lib', 'timezone.ts'))

  return record(
    'times are honest about zones',
    noAudienceClaim && usesPostingTime && offsetLabel && localOnlyWhenDifferent && dated,
    'time: posting times carry a GMT offset, local time shows only on a mismatch, no audience claim',
    `time check failed -- noAudienceClaim:${noAudienceClaim} usesPostingTime:${usesPostingTime} offset:${offsetLabel} localOnMismatch:${localOnlyWhenDifferent} year:${dated}`,
  )
}

/** Every `.ts`/`.tsx` under src/features, for repo-wide copy checks. */
function walkFeatures(dir = join(root, 'src', 'features'), found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkFeatures(full, found)
    else if (/\.tsx?$/.test(entry.name)) found.push(full)
  }
  return found
}

/** No screen may still be a stub once its phase has shipped. */
function noStubsRemain(): boolean {
  console.log('\n=== every W6 route is a real screen ===')
  const routes = read('src', 'routes.tsx')
  const noPlaceholder = !/PlaceholderScreen/.test(routes)
  const gone = !existsSync(join(root, 'src/features/system/placeholder-screen.tsx'))
  // Settings paths are relative: they hang off the nested `/settings` layout
  // rather than each being declared absolute.
  const wired = ['/generate', '/analytics/:connectionId', 'tones/:toneId', 'team']
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
    'entry-flow.spec.ts',
    'today-queue.spec.ts',
    'calendar-connections.spec.ts',
    'studio-billing.spec.ts',
    'compose-analytics-settings.spec.ts',
    'settings-a11y.spec.ts',
    'hsn-series.spec.ts',
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
    'e2e/settings-a11y.spec.ts',
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
  'readiness gate is one selector',
  'one tone editor, three entry points',
  'custom tone renders identically everywhere',
  'analytics never invents a number',
  'F1 reuses the queue card and actions',
  'compose is script-driven',
  'settings share one save bar',
  'times are honest about zones',
  'keyboard-focus rules hold',
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
    if (!readinessGateIsOneSelector()) failed = true
    if (!toneEditorIsShared()) failed = true
    if (!customToneRendersTheSameEverywhere()) failed = true
    if (!analyticsNeverInventsANumber()) failed = true
    if (!generateReusesTheQueuesCard()) failed = true
    if (!composeIsScriptDriven()) failed = true
    if (!settingsShareOneSaveBar()) failed = true
    if (!timesAreHonestAboutZones()) failed = true
    if (!focusRulesHold()) failed = true
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
  // ("as the audience sees it" was this list's original wording; that claim
  // was deleted from the product on 2026-07-29 and this echo follows it.)
  console.log('   - W4 month grid at phone width, posting times read in the schedule zone')
  console.log('   - W5 D4 and E2 back to back, credits ledger read as a charge query')

  process.exit(failed ? 1 : 0)
}

main()
