// deploy: pnpm build, then CDK deploy from ./infra for the given stage.
// Usage: pnpm deploy --stage <dev|staging|prod>

import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const STAGES = ['dev', 'staging', 'prod'] as const
type Stage = (typeof STAGES)[number]

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value)
}

function usage(): void {
  console.error('Usage: pnpm deploy --stage <dev|staging|prod>')
}

function run(command: string, cwd: string): void {
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true })
  if (result.error) {
    console.error(`deploy: failed to run "${command}": ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function main(): void {
  const argv = process.argv.slice(2)
  const stageIndex = argv.indexOf('--stage')
  const stageArg = stageIndex !== -1 ? argv[stageIndex + 1] : undefined
  if (stageArg === undefined || !isStage(stageArg)) {
    usage()
    process.exit(1)
  }
  const stage: Stage = stageArg

  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  run('pnpm build', repoRoot)
  run(`npx cdk deploy --require-approval never -c stage=${stage}`, join(repoRoot, 'infra'))
}

main()
