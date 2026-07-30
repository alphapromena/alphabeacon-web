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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { useInvites, useSession, useUsers } from '@/data/provider'
import { ROLE_RANK, useTeamActions, useTeamPermissions, type TeamActionResult } from '@/data/team'
import type { User } from '@/data/types'
import { relativeTime, shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { toastError } from '@/components/ab/toast'

/** One place team failures become copy — switched on code, never message. */
function reportFailure(result: TeamActionResult) {
  if (result.ok) return
  if (result.code === 'conflict') toastError(MESSAGES.errors.lastOwner)
  else if (result.code === 'rate_limited') toastError(MESSAGES.errors.rateLimited + ' a moment.')
  else toastError(MESSAGES.errors.teamActionFailed)
}

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
  const team = useTeamActions()

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<User['role']>('member')
  const [error, setError] = useState<string | null>(null)

  /**
   * Review item (2026-07-30): every viewer-side gate derives from the
   * viewer's OWN membership role — the workspace root's answer in live mode,
   * the session user's in the demo — via useTeamPermissions. The members
   * list only ever describes TARGETS (whose row is the protected tier's
   * last), never the viewer's power.
   */
  const perms = useTeamPermissions()
  const admin = perms.canManageMembers
  const holdersOfProtected = users.filter((user) => user.role === perms.protectedTier)

  const invite = async () => {
    const value = email.trim().toLowerCase()
    if (!value) return setError(MESSAGES.errors.emailRequired)
    if (!EMAIL.test(value)) return setError(MESSAGES.errors.emailInvalid)
    const taken =
      users.some((user) => user.email.toLowerCase() === value) ||
      invites.some((entry) => entry.email.toLowerCase() === value)
    if (taken) return setError(MESSAGES.errors.inviteEmailTaken)

    const result = await team.invite({
      id: `inv_${value}`,
      email: value,
      role,
      invitedAt: new Date().toISOString(),
    })
    if (!result.ok) {
      // The server sees invites this client cannot (another admin's), so its
      // 409 is the same designed state as the local check above.
      setError(
        result.code === 'conflict' ? MESSAGES.errors.inviteEmailTaken : result.message,
      )
      return
    }
    // Two truths, two toasts: an existing user is IN already; a new user got
    // a coded email and appears under Invited until they redeem it.
    if (result.invitedNewUser === false) {
      toastSuccess('Added to the workspace', {
        description: `${value} was already registered, so they're in — no invite to accept.`,
      })
    } else {
      toastSuccess('Invite sent', { description: `${value} can join as a ${role}.` })
    }
    setEmail('')
    setRole('member')
    setError(null)
    setOpen(false)
  }

  return (
    <>
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
                  {/* The badge stays a label — screens4.md I7 specifies a role
                      badge, and a focusable pill would promise an interaction
                      it does not have. The control that CHANGES a role belongs
                      to the HIGHEST tier present (the API makes role changes
                      owner-only where owners exist). */}
                  {perms.canSetRoles ? (
                    <RoleSelect
                      user={user}
                      canGrantOwner={perms.canGrantOwner}
                      protectedTier={perms.protectedTier}
                      lastOfProtected={
                        holdersOfProtected.length <= 1 && user.role === perms.protectedTier
                      }
                      onChange={async (role) => {
                        const result = await team.setRole(user.id, role)
                        if (!result.ok) {
                          reportFailure(result)
                          return
                        }
                        toastSuccess(
                          `${user.name} is now ${role === 'admin' || role === 'owner' ? 'an' : 'a'} ${role}`,
                        )
                      }}
                    />
                  ) : (
                    <Badge variant="outline" className="font-normal capitalize">
                      {user.role}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <MonoNumber value={shortDate(user.joinedAt)} />
                </td>
                <td className="px-4 py-3 text-right">
                  {/* Removal follows the API's precedence: owners remove
                      anyone, admins remove members only — an equal or higher
                      role gets no button rather than a 403. */}
                  {admin && user.id !== session.userId && perms.canRemove(user) && (
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
                        onConfirm={async () => {
                          const result = await team.removeMember(user.id)
                          if (!result.ok) {
                            reportFailure(result)
                            return
                          }
                          toastSuccess('Member removed', {
                            description: `${user.name} no longer has access.`,
                          })
                        }}
                      />
                    )}
                  {/* Your own row offers Leave, never Remove (the API's 400
                      says the same). The last owner has no legal leave — the
                      affordance is absent, and the row says why. */}
                  {user.id === session.userId &&
                    (holdersOfProtected.length <= 1 && user.role === perms.protectedTier ? (
                      perms.protectedTier === 'owner' && (
                        <p className="text-xs text-muted-foreground">
                          {MESSAGES.errors.lastOwner}
                        </p>
                      )
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Trash2 aria-hidden />
                            Leave
                          </Button>
                        }
                        title="Leave this workspace?"
                        consequence="You lose access immediately. Your approvals and history stay; someone else has to invite you back."
                        confirmLabel="Leave workspace"
                        onConfirm={async () => {
                          const result = await team.leaveOrg()
                          if (!result.ok) reportFailure(result)
                        }}
                      />
                    ))}
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
                        onClick={async () => {
                          const result = await team.resendInvite(entry.id)
                          if (!result.ok) {
                            reportFailure(result)
                            return
                          }
                          toastSuccess('Invite resent', {
                            description: `A fresh link is on its way to ${entry.email}.`,
                          })
                        }}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const result = await team.cancelInvite(entry.id)
                          if (!result.ok) reportFailure(result)
                        }}
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
    </>
  )
}

/**
 * Changing someone's role, with the one irreversible case made impossible.
 *
 * Demoting the LAST holder of the highest tier leaves a workspace nobody can
 * administer — no billing change, no re-auth, and no way to promote anyone
 * back (the API's last-owner 409 says the same). So for that person every
 * lower option is absent rather than disabled, the same law the queue's media
 * buttons follow, and the row says why.
 *
 * Promotion is immediate: it grants access, is reversible, and nothing is
 * lost — granting `owner` is how co-owners and ownership transfer work.
 * Demotion is confirmed, because it takes access away from someone who has it.
 */
function RoleSelect({
  user,
  canGrantOwner,
  protectedTier,
  lastOfProtected,
  onChange,
}: {
  user: User
  /** Whether the owner tier is grantable (live workspaces only). */
  canGrantOwner: boolean
  /** The tier that must never empty: owner live, admin in the demo. */
  protectedTier: User['role']
  /** True when this member is the only holder of the protected tier. */
  lastOfProtected: boolean
  onChange: (role: User['role']) => void | Promise<void>
}) {
  const [pending, setPending] = useState<User['role'] | null>(null)

  const options: User['role'][] = lastOfProtected
    ? [protectedTier]
    : canGrantOwner
      ? ['owner', 'admin', 'member']
      : ['admin', 'member']

  return (
    <>
      <label className="sr-only" htmlFor={`role-${user.id}`}>
        Role for {user.name}
      </label>
      <select
        id={`role-${user.id}`}
        value={user.role}
        onChange={(event) => {
          const next = event.target.value as User['role']
          if (next === user.role) return
          // A rank increase grants access (reversible, immediate); a decrease
          // takes it away and is confirmed first.
          if (ROLE_RANK[next] > ROLE_RANK[user.role]) void onChange(next)
          else setPending(next)
        }}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
      >
        {/* Absent, not disabled: there is no legal demotion of the last
            holder of the highest tier. */}
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
      {lastOfProtected && (
        <p className="mt-1 max-w-40 text-xs text-muted-foreground">
          The only {protectedTier}. Promote someone else before changing this.
        </p>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Make {user.name} {pending === 'admin' ? 'an admin' : `a ${pending ?? 'member'}`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They keep their account and everything they have already approved, but they lose
              what the higher role could reach — billing, the team list, or the ability to
              connect and reconnect channels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep as {user.role}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pending) void onChange(pending)
                setPending(null)
              }}
            >
              Change to {pending ?? 'member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
