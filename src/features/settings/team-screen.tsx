/**
 * I7 — Team members · `/settings/team`.
 *
 * Members and pending invites are one list, not two tabs: "who has access" is
 * the question, and an invite that has not been accepted is still an answer to
 * it. Invited rows are visually distinct and carry their own actions (resend,
 * revoke) rather than pretending to be members.
 *
 * You cannot remove yourself. The control is absent for your own row — not
 * disabled — and the reducer refuses it besides.
 */
import { MailPlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastSuccess } from '@/components/ab/toast'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { useDataDispatch, useInvites, useSession, useUsers } from '@/data/provider'
import type { User } from '@/data/types'
import { relativeTime, shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { SettingsLayout } from './settings-layout'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('') || '?'

export function TeamScreen() {
  const users = useUsers()
  const invites = useInvites()
  const session = useSession()
  const dispatch = useDataDispatch()

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<User['role']>('member')
  const [error, setError] = useState<string | null>(null)

  const admin = session.user?.role === 'admin'

  const invite = () => {
    const value = email.trim().toLowerCase()
    if (!value) return setError(MESSAGES.errors.emailRequired)
    if (!EMAIL.test(value)) return setError(MESSAGES.errors.emailInvalid)
    const taken =
      users.some((user) => user.email.toLowerCase() === value) ||
      invites.some((entry) => entry.email.toLowerCase() === value)
    if (taken) return setError(MESSAGES.errors.inviteEmailTaken)

    dispatch({
      type: 'team/invite',
      invite: { id: `inv_${value}`, email: value, role, invitedAt: new Date().toISOString() },
    })
    toastSuccess('Invite sent', { description: `${value} can join as a ${role}.` })
    setEmail('')
    setRole('member')
    setError(null)
    setOpen(false)
  }

  return (
    <SettingsLayout
      title="Team"
      context="Who can see and approve what this workspace publishes"
      wide
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">
          <MonoNumber value={users.length} /> members
          {invites.length > 0 && (
            <span className="font-normal text-muted-foreground">
              {' '}
              · <MonoNumber value={invites.length} /> invited
            </span>
          )}
        </h2>
        {admin && (
          <Button onClick={() => setOpen(true)}>
            <MailPlus aria-hidden />
            Invite member
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Member
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Joined
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initialsOf(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-normal capitalize">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <MonoNumber value={shortDate(user.joinedAt)} />
                </td>
                <td className="px-4 py-3 text-right">
                  {admin && user.id !== session.userId && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Trash2 aria-hidden />
                          Remove
                        </Button>
                      }
                      title={`Remove ${user.name}?`}
                      consequence="They lose access immediately. Drafts they approved stay approved, and anything scheduled still goes out."
                      confirmLabel="Remove member"
                      onConfirm={() => {
                        dispatch({ type: 'team/removeMember', userId: user.id })
                        toastSuccess('Member removed', {
                          description: `${user.name} no longer has access.`,
                        })
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}

            {invites.map((entry) => (
              <tr key={entry.id} className="border-b border-border bg-muted/40 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {entry.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{entry.email}</span>
                      <span className="text-xs text-muted-foreground">
                        Invited <MonoNumber value={relativeTime(entry.invitedAt)} />
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-normal capitalize">
                    {entry.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className="font-normal">Invited</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {admin && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toastSuccess('Invite resent', {
                            description: `A fresh link is on its way to ${entry.email}.`,
                          })
                        }
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: 'team/revokeInvite', inviteId: entry.id })}
                      >
                        Revoke
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length === 0 && users.length <= 1 && (
        <p className="text-sm text-muted-foreground">{MESSAGES.empty.noInvites}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They get an email with a link. Nothing happens to your workspace until they accept.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Work email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                aria-invalid={error ? true : undefined}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError(null)
                }}
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as User['role'])}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="member">Member — reviews and approves</option>
                <option value="admin">Admin — also manages billing and the team</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={invite}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  )
}
