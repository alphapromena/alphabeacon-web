/**
 * Your account, on I1 (INT-2): profile name (`PATCH /me`) and change-password
 * (`POST /me/change-password` — revokes every OTHER session; this one stays).
 *
 * Live mode only, deliberately: the static demo has no account to edit, and a
 * control that silently forgets its change on refresh would be a lie. The
 * spec home for this section is logged in open-items — screens4.md I-series
 * has no account screen yet; this is the integration affordance until it does.
 */
import { useEffect, useRef, useState } from 'react'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccountActions } from '@/data/account'
import { useLiveMode, useSession } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { passwordScore } from '@/features/auth/password-rules'
import { PasswordStrength } from '@/features/auth/password-strength'

export function AccountSection() {
  const live = useLiveMode()
  const session = useSession()
  const account = useAccountActions()

  const [name, setName] = useState(session.user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  // Adopt the synced name while the field is pristine (state.md rule 4).
  const sessionName = session.user?.name ?? ''
  const previousName = useRef(sessionName)
  useEffect(() => {
    setName((current) => (current === previousName.current ? sessionName : current))
    previousName.current = sessionName
  }, [sessionName])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [changing, setChanging] = useState(false)

  if (!live) return null

  const nameDirty = name.trim() !== (session.user?.name ?? '') && name.trim().length > 0

  const saveName = async () => {
    setSavingName(true)
    const result = await account.updateProfileName(name.trim())
    setSavingName(false)
    if (!result.ok) {
      toastError(MESSAGES.errors.generic)
      return
    }
    toastSuccess('Name updated', { description: 'Approvals attribute you by it.' })
  }

  const changePassword = async () => {
    if (newPassword.length < 8) return setPasswordError(MESSAGES.errors.passwordTooShort)
    if (passwordScore(newPassword) < 2) return setPasswordError(MESSAGES.errors.passwordTooWeak)
    setChanging(true)
    setPasswordError(null)
    const result = await account.changePassword({ currentPassword, newPassword })
    setChanging(false)
    if (!result.ok) {
      // 400 here means exactly one thing in the contract: wrong current password.
      setPasswordError(
        result.code === 'bad_request' ? MESSAGES.errors.signInIncorrect : MESSAGES.errors.generic,
      )
      return
    }
    setDialogOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    toastSuccess('Password changed', {
      description: 'Every other session was signed out; this one stays.',
    })
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Your account</h2>
        <p className="text-sm text-muted-foreground">
          Yours, not the organization&apos;s — the name approvals carry, and your password.
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="account-name">Your name</Label>
        <div className="flex gap-2">
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button variant="outline" disabled={!nameDirty || savingName} onClick={() => void saveName()}>
            {savingName ? 'Saving…' : 'Save name'}
          </Button>
        </div>
      </div>

      <div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          Change password
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              Every other session gets signed out. The one you are using stays.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {passwordError && (
              <p role="alert" className="text-sm text-destructive">
                {passwordError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <PasswordStrength value={newPassword} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={changing || !currentPassword} onClick={() => void changePassword()}>
              {changing ? 'Changing…' : 'Change password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
