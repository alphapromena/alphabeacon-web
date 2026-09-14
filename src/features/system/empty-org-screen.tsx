/**
 * N3 — the workspace-creation RETRY surface.
 *
 * WHAT THIS SCREEN IS NOW (ORDER ONB-0827, D-ONB-C). It used to be "you left
 * the wizard at step 3, resume there". The wizard is deleted and the org is
 * created automatically the moment the email is verified, so reaching this
 * screen means one narrow thing: **the account is real and the workspace is
 * not.** Three ways that happens, and all three end here —
 *
 *   1. the create failed (the API was down, the session dropped mid-call);
 *   2. the tab was closed between verifying and the create landing;
 *   3. an account from BEFORE this change that never finished the old wizard,
 *      and so never had an org created for it at all.
 *
 * Cases 1 and 2 still know the name the user typed at signup, so the screen is
 * one button. Case 3 usually does not — that name lived in a wizard that no
 * longer exists — so it asks for that ONE field. A single recovery input is
 * not a wizard, and it is the honest minimum: an org cannot be created without
 * a name, and inventing one for somebody's company would be worse than asking.
 *
 * `createWorkspace` is idempotent, so pressing again after a half-failure
 * repairs rather than minting a second workspace (E2E-0820 F12).
 */
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { toastError } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccountActions } from '@/data/account'
import { useSession } from '@/data/provider'
import { errorReference } from '@/lib/error-reference'
import { MESSAGES } from '@/lib/messages'

export function EmptyOrgScreen() {
  const session = useSession()
  const account = useAccountActions()

  // The name from THIS browser's signup when it survived (held on the
  // session, GATE-0910 item 59 — never the world's org, whose name on a dev
  // server is the demo's); empty when it did not, and then the field below
  // is the only thing this screen asks for.
  const recovered = (session.pendingOrgName ?? '').trim()
  const [name, setName] = useState(recovered)
  const [creating, setCreating] = useState(false)

  const create = async () => {
    const workspaceName = name.trim()
    if (!workspaceName) return
    setCreating(true)
    const result = await account.createWorkspace(workspaceName)
    setCreating(false)
    if (!result.ok) {
      toastError(MESSAGES.errors.workspaceCreateFailed, {
        description: errorReference(result),
        retry: { label: 'Try again', onClick: () => void create() },
      })
    }
    // On success the provider resyncs and `org.exists` flips, which is what
    // routes the user into the product. Nothing to navigate by hand.
  }

  return (
    /*
     * THE WARMEST SCREEN IN THE PRODUCT (ORDER THEME-0913 §5.2).
     *
     * It used to be a bare gold square, one abstract sentence and a field. A
     * person who has just signed up and hit the one failure path this screen
     * exists for deserves to be told what they are joining, not only what is
     * broken. So: the wordmark instead of a coloured square, then the three
     * things Malaky will actually do — in Today's own vocabulary, so the first
     * screen and the daily screen describe the same product — and then the one
     * field it needs.
     *
     * The warmth is concrete rather than cheerful. No exclamation marks, no
     * "Welcome aboard!", and the failure is still named honestly in the
     * heading; what changed is that the screen now answers "what is this?"
     * before it asks for anything.
     */
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <img src="/brand/malaky-logo-white.png" alt="Malaky" className="h-9 w-auto" />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
            {recovered ? MESSAGES.notices.workspaceMissing : MESSAGES.notices.workspaceNeedsName}
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            {MESSAGES.empty.firstRunReassurance}
          </p>
        </div>
      </div>

      {/* What you are joining, in three lines. The gold numerals are a brand
          moment, which is what gold is for — never an action (D-THEME-0913-C). */}
      <ol className="flex w-full max-w-md list-none flex-col gap-3 rounded-xl border border-border bg-card p-5">
        {[
          MESSAGES.empty.firstRunStep1,
          MESSAGES.empty.firstRunStep2,
          MESSAGES.empty.firstRunStep3,
        ].map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-medium text-brand"
            >
              {index + 1}
            </span>
            <span className="text-sm/relaxed text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>

      <div className="flex w-full max-w-md flex-col gap-3 text-start">
        {!recovered && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-name">Organization name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your company or team name"
            />
          </div>
        )}
        <Button
          size="lg"
          disabled={creating || name.trim().length === 0}
          onClick={() => void create()}
        >
          {creating ? 'Creating…' : 'Create my workspace'}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}
