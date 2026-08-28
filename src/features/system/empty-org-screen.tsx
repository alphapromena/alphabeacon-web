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
import { useOrg } from '@/data/provider'
import { errorReference } from '@/lib/error-reference'
import { MESSAGES } from '@/lib/messages'

export function EmptyOrgScreen() {
  const org = useOrg()
  const account = useAccountActions()

  // The name from signup when it survived; empty when it did not, and then
  // the field below is the only thing this screen asks for.
  const recovered = org.name.trim()
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span aria-hidden className="size-10 rounded-xl bg-brand" />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {recovered ? MESSAGES.notices.workspaceMissing : MESSAGES.notices.workspaceNeedsName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Everything else — your brand voice, tones, sources and posting rhythm — is set up inside
          the app, whenever you are ready.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 text-left">
        {!recovered && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-name">Organization name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Atlas Roasters"
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
