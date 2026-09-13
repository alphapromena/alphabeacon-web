/**
 * `pnpm gate` — the whole gate as one command with one record
 * (ORDER GATE-0910 §3.5; the law it does not change is §0).
 *
 *   keep-awake on → verify:all (the suites once, as reports) → the seven
 *   w-checks over those reports → one production build with the round's
 *   API base, served by ONE preview server the runner owns by pid →
 *   round 1 (lane A in parallel, lane B serial) → round 2, the gate, with
 *   no gap → every red classified (network-lost files re-run solo, 3/3,
 *   never waived; anything else UNCLASSIFIED until a human names it) →
 *   the record under Docs/qa/<series>/gate/<run>/ → one table.
 *
 * What stays in front of every live step: `assertNotProduction` and
 * `E2E_API_ENV=dev` (HSN-0910/D). What never happens by default: a paid
 * render (`--media`) or the nine dormant tests on the funded org
 * (`--funded`) — both are the founder's word, per run.
 *
 * Traps enforced by the runner, not by memory: 22 (no adopting a stray
 * server — the port is refused if busy, the preview is owned by pid),
 * 23 (the host is held awake for the run), 24 (nothing of the record lives
 * under test-results/; every Playwright process gets its own --output),
 * 25 (Playwright runs *.spec.ts only — playwright.config.ts).
 *
 * Usage:
 *   pnpm gate [--series <name>] [--workers 1] [--rounds 2] [--lanes A,B]
 *             [--only live-auth,live-team] [--skip-static] [--skip-live]
 *             [--funded] [--media] [--pool] [--port 5199] [--legacy-verify]
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, relative } from 'node:path'
import { createInterface } from 'node:readline'
import { assertNotProduction } from '../../e2e/global-setup'
import {
  loadVerifyReport,
  root,
  summarizePlaywright,
  treeHash,
  type E2eSummary,
} from '../verify-lib'
import { classifyResult, isRerunnable, redact, skipLabel, type Classification } from './classify'
import { LANES, filesInLane, laneOf, type Lane } from './lanes'

// ----------------------------------------------------------------- options

interface Options {
  series: string
  workers: number
  rounds: number
  lanes: Lane[]
  only: string[] | null
  skipStatic: boolean
  skipLive: boolean
  funded: boolean
  media: boolean
  pool: boolean
  port: number
  legacyVerify: boolean
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    if (i === -1) return undefined
    const eq = argv.find((a) => a.startsWith(`${flag}=`))
    return eq ? eq.slice(flag.length + 1) : argv[i + 1]
  }
  const has = (flag: string) => argv.includes(flag) || argv.some((a) => a.startsWith(`${flag}=`))
  const branch =
    spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout?.trim() ?? ''
  const defaultSeries = branch.replace(/^feat\//, '').replace(/[^a-z0-9-]/gi, '-') || 'gate'
  const lanes = (get('--lanes') ?? 'A,B')
    .split(',')
    .map((l) => l.trim().toUpperCase())
    .filter((l): l is Lane => l === 'A' || l === 'B')
  return {
    series: get('--series') ?? defaultSeries,
    // ONE in flight by default: 3 and 2 were measured red on the dev function's
    // concurrency cap (429 ConcurrentInvocationLimitExceeded, 2026-09-10, item 61).
    // Re-measure with --workers once Ward raises it; the runner does not change.
    workers: Number(get('--workers') ?? 1),
    rounds: Number(get('--rounds') ?? 2),
    lanes,
    only:
      get('--only')
        ?.split(',')
        .map((s) =>
          s
            .trim()
            .replace(/^e2e\//, '')
            .replace(/\.spec\.ts$/, ''),
        ) ?? null,
    skipStatic: has('--skip-static'),
    skipLive: has('--skip-live'),
    funded: has('--funded'),
    media: has('--media'),
    pool: has('--pool'),
    port: Number(get('--port') ?? 5199),
    legacyVerify: has('--legacy-verify'),
  }
}

// ----------------------------------------------------------------- helpers

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const now = () => new Date().toISOString()
const stamp = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
const seconds = (from: number) => (Date.now() - from) / 1000

function readEnvLocal(key: string): string | undefined {
  const path = join(root, '.env.local')
  if (!existsSync(path)) return undefined
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').replace(/\/+$/, '')
  }
  return undefined
}

/** The QA-creds store on this host: User-scope environment variables (stack.md). */
function userEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key]
  if (process.platform !== 'win32') return undefined
  const out = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-Command', `[Environment]::GetEnvironmentVariable('${key}','User')`],
    { encoding: 'utf8' },
  )
  const value = out.stdout?.trim()
  return value || undefined
}

async function portAnswers(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) })
    await res.text()
    return true
  } catch {
    return false
  }
}

function killTree(child: ChildProcess): void {
  if (!child.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' })
  } else {
    try {
      child.kill('SIGTERM')
    } catch {
      // already gone
    }
  }
}

function sh(
  cmd: string,
  env: NodeJS.ProcessEnv,
  logPath?: string,
): { ok: boolean; seconds: number; output: string } {
  const started = Date.now()
  const child = spawnSync(cmd, {
    shell: true,
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
  })
  const output = `${child.stdout ?? ''}${child.stderr ?? ''}`
  if (logPath) writeFileSync(logPath, output)
  return { ok: child.status === 0, seconds: seconds(started), output }
}

/** Spawn, stream every byte to a log file, resolve with the exit code. */
function spawnLogged(cmd: string, env: NodeJS.ProcessEnv, logPath: string): Promise<number> {
  return new Promise((resolve) => {
    const chunks: string[] = []
    const child = spawn(cmd, { shell: true, cwd: root, env })
    child.stdout?.on('data', (d: Buffer) => chunks.push(d.toString()))
    child.stderr?.on('data', (d: Buffer) => chunks.push(d.toString()))
    child.on('close', (code) => {
      writeFileSync(logPath, chunks.join(''))
      resolve(code ?? 1)
    })
  })
}

// ----------------------------------------------------------------- the runner

interface FileResult {
  file: string
  lane: Lane
  round: number
  attempt: number
  exit: number
  seconds: number
  summary: E2eSummary | null
  log: string
  startedAt: string
  classification: Classification
  reruns?: FileResult[]
  human?: string
}

class Gate {
  readonly opts: Options
  readonly base: string | undefined
  readonly host: string | undefined
  /** Where the run WORKS: under the ignored .gate/, so nothing written mid-run moves the tree hash the verifies check. */
  readonly runDir: string
  /** Where the run is PUBLISHED at the end: the record under Docs/qa/<series>/gate/<run>/. */
  readonly recordDir: string
  readonly artifactsDir: string
  /** The tree as it was before this run wrote anything. */
  readonly treeAtStart: string
  readonly startedAt = Date.now()
  readonly log: string[] = []
  private awake: ChildProcess | null = null
  private preview: ChildProcess | null = null
  private heartbeat: NodeJS.Timeout | null = null
  readonly liveEnv: NodeJS.ProcessEnv

  constructor(opts: Options) {
    this.opts = opts
    this.base =
      process.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || readEnvLocal('VITE_API_BASE_URL')
    this.host = this.base?.replace(/^https?:\/\//, '')
    const runStamp = stamp()
    this.treeAtStart = treeHash()
    this.runDir = join(root, '.gate', 'runs', runStamp)
    this.recordDir = join(root, 'Docs', 'qa', opts.series, 'gate', runStamp)
    this.artifactsDir = join(root, '.gate', 'artifacts', runStamp)
    mkdirSync(this.runDir, { recursive: true })
    mkdirSync(this.artifactsDir, { recursive: true })

    const env: NodeJS.ProcessEnv = { ...process.env }
    delete env.LIVE_MEDIA
    delete env.E2E_FUNDED_RUNS
    delete env.E2E_ORG_POOL
    if (this.base) env.VITE_API_BASE_URL = this.base
    env.E2E_API_ENV = 'dev'
    env.QA_FUNDED_EMAIL = userEnv('QA_FUNDED_EMAIL')
    env.QA_FUNDED_PASSWORD = userEnv('QA_FUNDED_PASSWORD')
    if (opts.media) env.LIVE_MEDIA = '1'
    if (opts.funded) env.E2E_FUNDED_RUNS = '1'
    this.liveEnv = env
  }

  say(line: string): void {
    const text = `${now().slice(11, 19)}Z ${line}`
    this.log.push(text)
    console.log(text)
  }

  // ----- keep-awake (trap 23)
  holdAwake(): void {
    if (process.platform !== 'win32') return
    const script = join(root, 'scripts', 'gate', 'keep-awake.ps1')
    this.awake = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
      { stdio: 'ignore' },
    )
    this.say(`keep-awake held (pid ${this.awake.pid})`)
  }

  release(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = null
    }
    if (this.preview) {
      killTree(this.preview)
      this.preview = null
      this.say('preview server stopped')
    }
    if (this.awake) {
      killTree(this.awake)
      this.awake = null
      this.say('keep-awake released')
    }
  }

  // ----- the static half (§3.1)
  staticHalf(): { ok: boolean; rows: { name: string; outcome: string; seconds: number }[] } {
    const rows: { name: string; outcome: string; seconds: number }[] = []
    const staticEnv: NodeJS.ProcessEnv = { ...process.env }
    delete staticEnv.LIVE_MEDIA
    delete staticEnv.VITE_API_BASE_URL
    const dir = join(this.runDir, 'static')
    mkdirSync(dir, { recursive: true })

    this.say('verify:all — the suites once')
    const all = sh('pnpm verify:all', staticEnv, join(dir, 'verify-all.log'))
    rows.push({ name: 'verify:all', outcome: all.ok ? 'PASS' : 'FAIL', seconds: all.seconds })
    this.say(`verify:all ${all.ok ? 'PASS' : 'FAIL'} in ${all.seconds.toFixed(0)} s`)
    if (existsSync(join(root, '.gate', 'reports', 'verify.json'))) {
      copyFileSync(join(root, '.gate', 'reports', 'verify.json'), join(dir, 'verify.json'))
    }
    let ok = all.ok
    for (const n of ['00', '01', '02', '03', '04', '05', '06']) {
      const cmd = `pnpm verify:w${n}${this.opts.legacyVerify ? ' --rerun' : ''}`
      const r = sh(cmd, staticEnv, join(dir, `verify-w${n}.log`))
      rows.push({ name: `verify:w${n}`, outcome: r.ok ? 'PASS' : 'FAIL', seconds: r.seconds })
      this.say(`verify:w${n} ${r.ok ? 'PASS' : 'FAIL'} in ${r.seconds.toFixed(0)} s`)
      if (!r.ok) ok = false
    }
    return { ok, rows }
  }

  // ----- one server per round (§3.3)
  async serve(): Promise<void> {
    if (!this.base)
      throw new Error(
        'no VITE_API_BASE_URL (env or .env.local): a live round needs the dev API base',
      )
    assertNotProduction(this.liveEnv)
    if (await portAnswers(this.opts.port)) {
      throw new Error(
        `port ${this.opts.port} is already answering — refusing to adopt a stray server (trap 22). Stop it and run again.`,
      )
    }
    this.say(`build with the round's API base inlined`)
    const build = sh('pnpm build', { ...this.liveEnv }, join(this.runDir, 'build.log'))
    if (!build.ok)
      throw new Error(
        `the live build failed — see ${relative(root, join(this.runDir, 'build.log'))}`,
      )
    this.say(`built in ${build.seconds.toFixed(0)} s`)
    this.preview = spawn(`pnpm exec vite preview --port ${this.opts.port} --strictPort`, {
      shell: true,
      cwd: root,
      env: this.liveEnv,
      stdio: 'ignore',
    })
    const started = Date.now()
    while (!(await portAnswers(this.opts.port))) {
      if (seconds(started) > 30) throw new Error('the preview server did not answer within 30 s')
      await sleep(500)
    }
    // The runner's own tripwire for a built server: the served entry chunk
    // must inline the base this round is for.
    const index = await (await fetch(`http://localhost:${this.opts.port}/`)).text()
    const entry = /assets\/index-[A-Za-z0-9_-]+\.js/.exec(index)?.[0]
    const chunk = entry
      ? await (await fetch(`http://localhost:${this.opts.port}/${entry}`)).text()
      : ''
    const inlined = this.host ? chunk.split(this.host).length - 1 : 0
    if (inlined === 0)
      throw new Error(
        `the served build does not inline the API host (entry ${entry ?? 'not found'}) — wrong build on the port`,
      )
    this.say(
      `preview served on ${this.opts.port} (pid ${this.preview.pid}), entry ${entry}, the API host inlined ${inlined} time(s)`,
    )
  }

  /**
   * The round's warm-up, ONCE, by the runner (§3.2): wake the service, then
   * provision the fleet with 12-way bursts until every probe answers within a
   * second — a 429 is an answer — then keep one heartbeat for the round. The
   * Playwright processes are told to stand down from their own bursts
   * (E2E_WARMED_BY_RUNNER=1): three of them bursting at once is what tripped
   * the API's limiter on 2026-09-10.
   */
  async warm(): Promise<void> {
    const url = `${this.base}/health`
    const probe = async (): Promise<{ ms: number; status: number | 'error' }> => {
      const t = Date.now()
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
        await res.text()
        return { ms: Date.now() - t, status: res.status }
      } catch {
        return { ms: Date.now() - t, status: 'error' }
      }
    }
    const started = Date.now()
    let fast = 0
    while (fast < 2) {
      const p = await probe()
      if ((p.status === 200 || p.status === 429) && p.ms < 1000) fast += 1
      else fast = 0
      if (seconds(started) > 90) throw new Error('the API did not wake within 90 s')
      if (fast < 2) await sleep(250)
    }
    let bursts = 0
    for (;;) {
      bursts += 1
      const results = await Promise.all(Array.from({ length: 12 }, () => probe()))
      const slowest = results.reduce((w, r) => (r.ms > w.ms ? r : w))
      const answered = results.filter(
        (r) => (r.status === 200 || r.status === 429) && r.ms < 1000,
      ).length
      if (answered === results.length) {
        this.say(
          `warm-up: 12-way fleet warm after ${bursts} burst(s) in ${seconds(started).toFixed(1)} s — slowest ${slowest.ms} ms (a 429 is an answer)`,
        )
        break
      }
      if (seconds(started) > 90)
        throw new Error(
          `the API fleet never warmed: ${bursts} bursts, ${answered}/12 answered fast in the last`,
        )
      await sleep(250)
    }
    this.heartbeat = setInterval(() => {
      // ONE probe: under the dev function's concurrency limit (429
      // ConcurrentInvocationLimitExceeded, measured 2026-09-10) a wide heartbeat
      // competes with the files it is meant to serve; one keeps the service warm.
      void probe().catch(() => {})
    }, 5000)
    this.heartbeat.unref?.()
    this.liveEnv.E2E_WARMED_BY_RUNNER = '1'
    this.say(
      'heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups',
    )
  }

  // ----- the org pool (§3.4, behind --pool, off by default)
  async mintPool(): Promise<void> {
    if (!this.opts.pool) return
    const run = `${Date.now()}p`
    const email = `qa+${run}@alphapromena.com`
    const password = 'Roasted2Order!'
    const post = async (path: string, body: unknown, token?: string) => {
      const res = await fetch(`${this.base}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) throw new Error(`pool org: POST ${path} answered ${res.status}`)
      return json
    }
    await post('/auth/signup', { name: 'QA Pool Owner', email, password })
    const session = (await post('/auth/verify-email', { email, code: '000000' })) as {
      token?: string
      session?: { token?: string }
    }
    const token = session.token ?? session.session?.token
    if (!token) throw new Error('pool org: verify-email returned no token')
    await post('/orgs', { name: 'QA Pool Org' }, token)
    this.liveEnv.E2E_ORG_POOL = '1'
    this.liveEnv.E2E_POOL_EMAIL = email
    this.liveEnv.E2E_POOL_PASSWORD = password
    this.say(
      `org pool minted for this round (${email}); files that opt in share it, the rest mint their own`,
    )
  }

  // ----- one file, one Playwright process
  async runFile(file: string, lane: Lane, round: number, attempt: number): Promise<FileResult> {
    const name = basename(file, '.spec.ts')
    const roundDir = join(this.runDir, `round-${round}`)
    mkdirSync(roundDir, { recursive: true })
    const suffix = attempt > 1 ? `-rerun${attempt - 1}` : ''
    const logPath = join(roundDir, `${name}${suffix}.log`)
    const jsonPath = join(this.artifactsDir, `round-${round}`, `${name}${suffix}.json`)
    const outDir = join(this.artifactsDir, `round-${round}`, `${name}${suffix}`)
    mkdirSync(outDir, { recursive: true })
    const started = Date.now()
    const startedAt = now()
    const env: NodeJS.ProcessEnv = { ...this.liveEnv, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath }
    const cmd = `pnpm exec playwright test ${file} --workers=1 --reporter=list,json --output "${outDir}"`
    const exit = await spawnLogged(cmd, env, logPath)
    const raw = readFileSync(logPath, 'utf8')
    writeFileSync(logPath, redact(raw, this.host))
    let summary: E2eSummary | null = null
    if (existsSync(jsonPath)) {
      try {
        summary = summarizePlaywright(JSON.parse(readFileSync(jsonPath, 'utf8')))
      } catch {
        summary = null
      }
    }
    // Keep the DOM at any failure out of the wiped folder (trap 24) — and READ
    // it: the app's own failure copy is what tells an error-page red (the
    // service failed the screen) from a product one, and the first is re-run
    // like a lost socket rather than left UNCLASSIFIED.
    let errorContext = ''
    if (summary && summary.failed > 0 && existsSync(outDir)) {
      for (const d of readdirSync(outDir)) {
        const ctx = join(outDir, d, 'error-context.md')
        if (existsSync(ctx)) {
          const text = redact(readFileSync(ctx, 'utf8'), this.host)
          errorContext += `\n${text}`
          writeFileSync(join(roundDir, `${name}${suffix}-${d.slice(0, 40)}-error-context.md`), text)
        }
      }
    }
    const result: FileResult = {
      file: name,
      lane,
      round,
      attempt,
      exit,
      seconds: seconds(started),
      summary,
      log: relative(this.runDir, logPath).replace(/\\/g, '/'),
      startedAt,
      classification: 'green',
    }
    result.classification = this.classify(result, raw, errorContext)
    const s = summary
      ? `${summary.passed} passed / ${summary.skipped} skipped / ${summary.failed} failed`
      : `no report (exit ${exit})`
    this.say(
      `round ${round} lane ${lane} ${name}${suffix}: ${s} in ${result.seconds.toFixed(0)} s → ${result.classification}`,
    )
    return result
  }

  classify(r: FileResult, raw: string, errorContext = ''): Classification {
    return classifyResult(r.summary, r.exit, raw, errorContext)
  }

  async pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
    const queue = [...items]
    const workers = Array.from({ length: Math.max(1, n) }, async (_, i) => {
      // Staggered starts: no two files sign up and load a dashboard in the same second.
      await sleep(i * 4000)
      while (queue.length) {
        const item = queue.shift()!
        await fn(item)
      }
    })
    await Promise.all(workers)
  }

  async round(round: number): Promise<FileResult[]> {
    const results: FileResult[] = []
    const pick = (lane: Lane) =>
      filesInLane(lane).filter(
        (f) => !this.opts.only || this.opts.only.includes(basename(f, '.spec.ts')),
      )
    const roundStart = Date.now()
    if (this.opts.lanes.includes('A')) {
      const files = pick('A')
      const t = Date.now()
      this.say(`round ${round} lane A: ${files.length} files, ${this.opts.workers} in flight`)
      await this.pool(files, this.opts.workers, async (file) => {
        results.push(await this.runFile(file, 'A', round, 1))
      })
      this.say(`round ${round} lane A done in ${seconds(t).toFixed(0)} s`)
    }
    if (this.opts.lanes.includes('B')) {
      const files = pick('B')
      const t = Date.now()
      this.say(`round ${round} lane B: ${files.length} files, serial`)
      for (const file of files) results.push(await this.runFile(file, 'B', round, 1))
      this.say(`round ${round} lane B done in ${seconds(t).toFixed(0)} s`)
    }
    // The re-run rule: a file the runner can name as the service's fault — a
    // lost socket, or the app's own error page behind the timeout — is re-run
    // solo and must come back green 3/3. Never waived, never widened further:
    // anything the runner cannot name stays UNCLASSIFIED for a human.
    for (const r of results.filter((x) => isRerunnable(x.classification))) {
      r.reruns = []
      for (let attempt = 2; attempt <= 4; attempt += 1) {
        const again = await this.runFile(`e2e/${r.file}.spec.ts`, r.lane, round, attempt)
        r.reruns.push(again)
        if (again.classification !== 'green' && again.classification !== 'skipped-all') break
      }
      const green = r.reruns.filter(
        (x) => x.classification === 'green' || x.classification === 'skipped-all',
      ).length
      if (green < 3) r.classification = 'unclassified'
    }
    this.say(`round ${round} done in ${seconds(roundStart).toFixed(0)} s`)
    results.sort((a, b) => a.file.localeCompare(b.file))
    return results
  }

  async askForClassifications(rounds: FileResult[][]): Promise<void> {
    const reds = rounds.flat().filter((r) => r.classification === 'unclassified')
    if (reds.length === 0 || !process.stdin.isTTY) return
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve))
    for (const r of reds) {
      const answer = await ask(
        `\n${r.file} (round ${r.round}) is red and not network-lost. Classify — (s)pec defect / (c)ode regression / (e)nvironmental / (u)nclassified: `,
      )
      const names: Record<string, string> = {
        s: 'spec defect',
        c: 'code regression',
        e: 'environmental',
        u: 'unclassified',
      }
      r.human = names[answer.trim().toLowerCase()[0] ?? 'u'] ?? 'unclassified'
    }
    rl.close()
  }

  // ----- the record (§3.5)
  writeRecord(
    staticHalf: { ok: boolean; rows: { name: string; outcome: string; seconds: number }[] } | null,
    rounds: FileResult[][],
    error?: string,
  ): boolean {
    const verify = loadVerifyReport(join(this.runDir, 'static', 'verify.json'))
    const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout.trim()
    const dirty =
      spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.trim()
        .length > 0
    const total = seconds(this.startedAt)
    const lines: string[] = []
    const flags = [
      `workers ${this.opts.workers}`,
      `rounds ${this.opts.rounds}`,
      `lanes ${this.opts.lanes.join(',')}`,
      this.opts.funded
        ? "--funded (the nine on the funded org, on the founder's word for this run)"
        : 'unfunded (the nine skip with their reasons)',
      this.opts.media ? '--media (paid renders)' : 'no paid render',
      this.opts.pool ? '--pool' : 'no org pool',
      this.opts.legacyVerify ? '--legacy-verify' : 'verify-once',
    ]
    lines.push(`# ${this.opts.series} — \`pnpm gate\` ${basename(this.runDir)}`, '')
    lines.push(
      `Tree \`${commit}\`${dirty ? ' + uncommitted changes' : ''} (hash \`${this.treeAtStart.slice(0, 12)}\`) · started ${new Date(this.startedAt).toISOString()} · **${(total / 60).toFixed(1)} min end to end** · ${flags.join(' · ')} · \`E2E_API_ENV=dev\` and \`assertNotProduction\` in front of every live step · the API host redacted to \`<api-host>\`.`,
      '',
    )
    if (error) lines.push(`**STOPPED:** ${error}`, '')

    lines.push('## The static half — the suites once, the seven checks over the report', '')
    if (staticHalf) {
      lines.push('| Step | Result | Seconds |', '| --- | --- | ---: |')
      for (const r of staticHalf.rows)
        lines.push(`| ${r.name} | ${r.outcome} | ${r.seconds.toFixed(0)} |`)
      if (verify?.unit)
        lines.push(
          '',
          `unit: **${verify.unit.passed} passed / ${verify.unit.failed} failed / ${verify.unit.files} files**`,
        )
      if (verify?.e2e)
        lines.push(
          `static e2e: **${verify.e2e.passed} passed / ${verify.e2e.skipped} skipped / ${verify.e2e.failed} failed**`,
        )
      lines.push('')
    } else {
      lines.push('_skipped (--skip-static)_', '')
    }

    for (const [i, results] of rounds.entries()) {
      const round = i + 1
      const wall = results.length
        ? Math.max(...results.map((r) => new Date(r.startedAt).getTime() + r.seconds * 1000)) -
          Math.min(...results.map((r) => new Date(r.startedAt).getTime()))
        : 0
      lines.push(
        `## Round ${round}${round === this.opts.rounds ? ' — the gate' : ''} (${(wall / 60000).toFixed(1)} min wall)`,
        '',
      )
      lines.push(
        '| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |',
      )
      for (const r of results) {
        const s = r.summary
        const failedHere = (s?.failed ?? 0) > 0
        const skipped = (s?.tests ?? []).filter((t) => t.status === 'skipped')
        // A skip with its own reason is a decision and keeps it; one without, in
        // a file that failed, is Playwright's serial cascade — counted apart, so
        // the table never undercounts what a red cost.
        const notRun = failedHere ? skipped.filter((t) => !t.skipReason?.trim()).length : 0
        const skips = skipped
          .map((t) => `${t.title.slice(0, 60)} — _${skipLabel(t, failedHere).slice(0, 120)}_`)
          .join('<br>')
        const cls = isRerunnable(r.classification)
          ? `${r.classification}, re-run ${r.reruns?.filter((x) => x.classification === 'green' || x.classification === 'skipped-all').length ?? 0}/3`
          : r.classification === 'unclassified'
            ? `**UNCLASSIFIED**${r.human ? ` → ${r.human}` : ' — classify before any fix'}`
            : r.classification
        lines.push(
          `| ${r.file} | ${r.lane} | ${s?.passed ?? '?'} | ${s ? s.skipped - notRun : '?'} | ${notRun} | ${s?.failed ?? '?'} | ${r.seconds.toFixed(0)} | ${cls} | ${skips} |`,
        )
      }
      const reds = results.filter((r) => (r.summary?.failed ?? 1) > 0)
      if (reds.length) {
        lines.push('', `### Round ${round} reds`, '')
        for (const r of reds) {
          for (const t of (r.summary?.tests ?? []).filter((x) => x.status === 'failed')) {
            lines.push(
              `- **${r.file}** › ${t.title}: \`${redact((t.error ?? 'no message').split('\n')[0].slice(0, 200), this.host)}\` — ${r.classification}${r.human ? ` (${r.human})` : ''}; log \`${r.log}\``,
            )
          }
          if (!r.summary)
            lines.push(
              `- **${r.file}**: no report, exit ${r.exit} — ${r.classification}; log \`${r.log}\``,
            )
          for (const again of r.reruns ?? [])
            lines.push(
              `  - re-run ${again.attempt - 1}: ${again.summary ? `${again.summary.passed} passed / ${again.summary.failed} failed` : `exit ${again.exit}`} in ${again.seconds.toFixed(0)} s (\`${again.log}\`)`,
            )
        }
      }
      lines.push('')
    }

    const last = rounds[rounds.length - 1] ?? []
    const gateGreen =
      last.length > 0 &&
      last.every(
        (r) =>
          r.classification === 'green' ||
          r.classification === 'skipped-all' ||
          r.classification === 'network-lost',
      )
    const verdict = error
      ? 'STOPPED'
      : (staticHalf ? staticHalf.ok : true) && (this.opts.skipLive || gateGreen)
        ? 'GREEN'
        : 'RED'
    lines.push(
      '## Verdict',
      '',
      `**${verdict}** — ${(total / 60).toFixed(1)} min end to end. ${verdict === 'GREEN' ? 'Every red in the gate round was classified network-lost and re-run green, or there was none.' : 'See the rounds above; an UNCLASSIFIED red is classified before any fix.'}`,
      '',
    )
    lines.push(
      '## The runner log',
      '',
      '```',
      ...this.log.map((l) => redact(l, this.host)),
      '```',
      '',
    )
    writeFileSync(join(this.runDir, 'README.md'), lines.join('\n'))
    writeFileSync(
      join(this.runDir, 'summary.json'),
      JSON.stringify(
        {
          series: this.opts.series,
          run: basename(this.runDir),
          commit,
          dirty,
          startedAt: new Date(this.startedAt).toISOString(),
          totalSeconds: total,
          options: { ...this.opts },
          static: staticHalf,
          unit: verify?.unit,
          staticE2e: verify?.e2e
            ? { passed: verify.e2e.passed, skipped: verify.e2e.skipped, failed: verify.e2e.failed }
            : undefined,
          rounds: rounds.map((rs) =>
            rs.map((r) => ({
              ...r,
              summary: r.summary
                ? {
                    ...r.summary,
                    tests: r.summary.tests.map((t) => ({
                      ...t,
                      error: t.error ? redact(t.error, this.host) : undefined,
                    })),
                  }
                : null,
            })),
          ),
          verdict,
          error,
        },
        null,
        2,
      ),
    )
    // Publish: the whole work folder becomes the record, in one copy at the end.
    mkdirSync(this.recordDir, { recursive: true })
    cpSync(this.runDir, this.recordDir, { recursive: true })
    // The series index: one line per run.
    const index = join(root, 'Docs', 'qa', this.opts.series, 'gate', 'README.md')
    const line = `- \`${basename(this.runDir)}\` — ${verdict}, ${(total / 60).toFixed(1)} min, tree \`${commit}\`${dirty ? '+' : ''}, ${flags.slice(0, 3).join(', ')}${this.opts.funded ? ', --funded' : ''}${this.opts.media ? ', --media' : ''}${this.opts.only ? ` · only ${this.opts.only.join('+')}` : ''} → [README](${basename(this.runDir)}/README.md)\n`
    if (!existsSync(index))
      writeFileSync(
        index,
        `# ${this.opts.series} — gate runs (\`pnpm gate\`)\n\nOne line per run; each run's own README carries the table.\n\n`,
      )
    writeFileSync(index, readFileSync(index, 'utf8') + line)
    this.say(`record written: ${relative(root, this.recordDir)} — ${verdict}`)
    return verdict === 'GREEN'
  }
}

// ----------------------------------------------------------------- main

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  if (!Number.isFinite(opts.workers) || opts.workers < 1)
    throw new Error('--workers must be a positive number')
  for (const l of LANES)
    if (!existsSync(join(root, 'e2e', `${l.file}.spec.ts`)))
      throw new Error(`laned file missing on disk: ${l.file}`)
  const unlaned = readdirSync(join(root, 'e2e')).filter(
    (f) => /^live-.*\.spec\.ts$/.test(f) && !laneOf(f),
  )
  if (unlaned.length)
    throw new Error(
      `live specs without a lane: ${unlaned.join(', ')} — add them to scripts/gate/lanes.ts`,
    )

  const gate = new Gate(opts)
  gate.say(`pnpm gate · series ${opts.series} · record ${relative(root, gate.recordDir)}`)
  if (opts.funded)
    gate.say(
      "--funded: the nine dormant tests run on the funded QA org — the founder's word for THIS run",
    )
  if (opts.media) gate.say("--media: paid renders allowed — the founder's word for THIS run")
  let staticHalf: ReturnType<Gate['staticHalf']> | null = null
  const rounds: FileResult[][] = []
  let error: string | undefined
  let green = false
  const bye = () => gate.release()
  process.on('SIGINT', () => {
    bye()
    process.exit(130)
  })
  try {
    gate.holdAwake()
    if (!opts.skipStatic) staticHalf = gate.staticHalf()
    if (!opts.skipLive) {
      await gate.serve()
      await gate.warm()
      await gate.mintPool()
      for (let r = 1; r <= opts.rounds; r += 1) rounds.push(await gate.round(r))
      await gate.askForClassifications(rounds)
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
    gate.say(`STOPPED: ${error}`)
  } finally {
    bye()
    green = gate.writeRecord(staticHalf, rounds, error)
  }
  process.exit(green ? 0 : 1)
}

void main()
