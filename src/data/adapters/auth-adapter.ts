/**
 * The auth adapter: AlphaStudio wire shapes → this app's model.
 *
 * The API is the source of truth; where the app's model is narrower the
 * adapter narrows HONESTLY and the gap is logged (open-items):
 *
 * - Org roles: the API has `owner | admin | member`; the app's `User.role` is
 *   `admin | member`. `owner` collapses to `admin` here — an owner can do
 *   everything the app's admin UI offers — until INT-2 teaches the team
 *   screen the three-tier model. Logged as a known collapse, not hidden.
 * - Workspace: the API has no onboarding state and, since ONB-0827, neither
 *   does this app. A user with at least one org has an org to work in; a user
 *   with none does not. `org.exists` records exactly that and nothing more —
 *   it replaced an inferred `onboarding.completed` whose name promised a
 *   journey the product no longer has (D-ONB-C).
 */
import type { ApiOrgSummary, ApiUser, AuthSession, OrgRole } from '@/api/types'
import type { Dataset, User } from '@/data/types'

export function collapseOrgRole(role: OrgRole): User['role'] {
  return role === 'member' ? 'member' : 'admin'
}

export function apiUserToUser(apiUser: ApiUser, orgRole: OrgRole | undefined): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: collapseOrgRole(orgRole ?? 'member'),
    joinedAt: apiUser.createdAt,
  }
}

/** The org this session works in: first org, matching the API's own ordering. */
export function primaryOrg(orgs: ApiOrgSummary[]): ApiOrgSummary | undefined {
  return orgs[0]
}

/**
 * Graft a live auth session onto the active world. Covered entities (session,
 * the signed-in user, the org's name) become real; everything else stays the
 * dataset's — that is the hybrid, by design.
 */
export function graftAuthSession(world: Dataset, auth: AuthSession): Dataset {
  const org = primaryOrg(auth.orgs)
  const user = apiUserToUser(auth.user, org?.role)

  const users = world.users.some((existing) => existing.id === user.id)
    ? world.users.map((existing) => (existing.id === user.id ? user : existing))
    : [user, ...world.users]

  return {
    ...world,
    users,
    session: {
      ...world.session,
      signedIn: true,
      userId: user.id,
      emailVerified: auth.user.emailVerifiedAt !== null,
      pendingEmail: undefined,
      failedSignIns: 0,
      lockedUntil: undefined,
    },
    org: {
      ...world.org,
      ...(org ? { id: org.id, name: org.name } : {}),
      // Trap 20: a wire answer of "no orgs" must NOT leave the demo world's
      // workspace standing. `false` is the honest answer, and it is what
      // routes the user to the org-creation retry surface.
      exists: Boolean(org),
    },
  }
}

/** Sign-out (or a dead session): back to a signed-out world. */
export function clearAuthSession(world: Dataset): Dataset {
  return {
    ...world,
    session: {
      ...world.session,
      signedIn: false,
      pendingEmail: undefined,
    },
  }
}
