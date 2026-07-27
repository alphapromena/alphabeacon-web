import { App } from 'aws-cdk-lib'
import { STAGES, WebStack } from '../lib/web-stack.ts'
import type { Stage } from '../lib/web-stack.ts'

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value)
}

const app = new App()

const stage = (app.node.tryGetContext('stage') as string | undefined) ?? 'dev'

if (!isStage(stage)) {
  throw new Error(
    `Unknown stage "${stage}" — expected one of: ${STAGES.join(', ')}. ` +
      'Pass it as: cdk <command> -c stage=<stage>',
  )
}

new WebStack(app, `ABW-${stage}-Web`, { stage })
