/**
 * Org/team adapter (INT-2): AlphaStudio members and invites → the app's
 * `User` / `TeamInvite`, plus the membership-id map mutations need.
 *
 * Two ids per person, kept deliberately separate: the app's `User.id` is the
 * API `userId` (so "is this row me" keeps working against the session), while
 * member-management endpoints take the MEMBERSHIP id — `memberIdByUserId`
 * carries the translation, held in provider state rather than widening the
 * app's `User` type.
 */
import type { ApiInvite, ApiMember } from '@/api/types'
import type { TeamInvite, User } from '@/data/types'

export interface TeamGraft {
  users: User[]
  invites: TeamInvite[]
  memberIdByUserId: Record<string, string>
}

export function adaptTeam(members: ApiMember[], invites: ApiInvite[]): TeamGraft {
  const active = members.filter((member) => member.isActive)
  return {
    users: active.map((member) => ({
      id: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
      joinedAt: member.joinedAt,
    })),
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role === 'owner' ? 'admin' : invite.role,
      invitedAt: invite.invitedAt,
    })),
    memberIdByUserId: Object.fromEntries(
      members.map((member) => [member.userId, member.id]),
    ),
  }
}
