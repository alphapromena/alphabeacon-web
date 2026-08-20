/**
 * The team seam (INT-2): I7's mutations, one signature, two implementations.
 * Screens call these; `src/api/` stays unimportable from features.
 *
 * Live rules, straight from the contract:
 * - invite: existing user → membership added immediately (`invitedNewUser:
 *   false`); new user → a coded email redeemed at /accept-invite. Role is
 *   admin|member — owners are never invitable.
 * - setRole is OWNER-only server-side and can grant `owner` (that is how
 *   transfer works); demoting the last owner is a 409.
 * - remove is soft; yourself → 400 (use leave); the last owner → 409.
 * - Every successful mutation resyncs the team, so the world re-reads truth
 *   rather than trusting an optimistic patch.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type { InviteReceipt } from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import {
  useDataDispatch,
  useLiveMemberIds,
  useLiveViewerRole,
  useLiveWorkingOrgId,
  useSession,
} from '@/data/provider'
import type { TeamInvite, User } from '@/data/types'

/** Org-role precedence — the one rank table (owner arrived with INT-2). */
export const ROLE_RANK: Record<User['role'], number> = { owner: 3, admin: 2, member: 1 }

export interface TeamPermissions {
  /** The viewer's OWN role: the workspace root's membership.role in live
   *  mode, the session user's role in the static demo. Never inferred from
   *  the members list (review item, 2026-07-30). */
  viewerRole: User['role']
  /** Invite, resend/cancel invites, remove lower tiers. */
  canManageMembers: boolean
  /** Role changes: OWNER-only on the wire; the static demo's admins keep
   *  their demo power. A rule constant per mode — not an inference. */
  canSetRoles: boolean
  /** Whether the owner tier is grantable (live only — the demo has none). */
  canGrantOwner: boolean
  /** The tier that must never empty: owner live, admin in the demo. */
  protectedTier: User['role']
  /** The API's removal precedence: owners remove anyone; others only lower. */
  canRemove(target: User): boolean
}

export function useTeamPermissions(): TeamPermissions {
  const live = isLiveMode()
  const liveRole = useLiveViewerRole()
  const session = useSession()
  const viewerRole: User['role'] = live
    ? (liveRole ?? 'member')
    : (session.user?.role ?? 'member')

  const canSetRoles = live
    ? viewerRole === 'owner'
    : ROLE_RANK[viewerRole] >= ROLE_RANK.admin

  return {
    viewerRole,
    canManageMembers: ROLE_RANK[viewerRole] >= ROLE_RANK.admin,
    canSetRoles,
    canGrantOwner: live && canSetRoles,
    protectedTier: live ? 'owner' : 'admin',
    canRemove: (target) =>
      viewerRole === 'owner' || ROLE_RANK[viewerRole] > ROLE_RANK[target.role],
  }
}

export type TeamActionResult =
  | (AuthActionResult & { ok: false })
  | { ok: true; invitedNewUser?: boolean }

const ok = (extra?: { invitedNewUser?: boolean }): TeamActionResult => ({ ok: true, ...extra })

function failure(error: unknown): TeamActionResult {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      reason: error.reason,
      retryAfterSeconds: error.retryAfterSeconds,
      requestId: error.requestId,
    }
  }
  throw error
}

export function useTeamActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const memberIds = useLiveMemberIds()
  const live = isLiveMode()

  const resync = () => dispatch({ type: 'live/resync' })
  const membershipOf = (userId: string) => memberIds?.[userId]

  return {
    async invite(invite: TeamInvite): Promise<TeamActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'team/invite', invite })
        return ok({ invitedNewUser: true })
      }
      try {
        const receipt = await api<InviteReceipt>('POST', `/orgs/${orgId}/members/invite`, {
          body: { email: invite.email, role: invite.role === 'admin' ? 'admin' : 'member' },
        })
        resync()
        return ok({ invitedNewUser: receipt.invitedNewUser })
      } catch (error) {
        return failure(error)
      }
    },

    async resendInvite(inviteId: string): Promise<TeamActionResult> {
      if (!live || !orgId) return ok()
      try {
        await api('POST', `/orgs/${orgId}/invites/${inviteId}/resend`)
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async cancelInvite(inviteId: string): Promise<TeamActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'team/revokeInvite', inviteId })
        return ok()
      }
      try {
        await api<void>('DELETE', `/orgs/${orgId}/invites/${inviteId}`)
        resync()
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async setRole(userId: string, role: User['role']): Promise<TeamActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'team/setRole', userId, role })
        return ok()
      }
      const memberId = membershipOf(userId)
      if (!memberId) return ok()
      try {
        await api('PATCH', `/orgs/${orgId}/members/${memberId}`, { body: { role } })
        resync()
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async removeMember(userId: string): Promise<TeamActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'team/removeMember', userId })
        return ok()
      }
      const memberId = membershipOf(userId)
      if (!memberId) return ok()
      try {
        await api<void>('DELETE', `/orgs/${orgId}/members/${memberId}`)
        resync()
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    /** Leaving is self-service; the last owner's 409 comes back as failure. */
    async leaveOrg(): Promise<TeamActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'session/signOut' })
        return ok()
      }
      try {
        await api<void>('POST', `/orgs/${orgId}/leave`)
        // No org to stand in any more: resync re-reads /me/orgs and the world
        // follows (no orgs → back to onboarding).
        resync()
        return ok()
      } catch (error) {
        return failure(error)
      }
    },
  }
}
